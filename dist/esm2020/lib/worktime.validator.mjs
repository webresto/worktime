import { formatDate, isDate } from './formatDate';
import { TimeZoneIdentifier } from './tz';
/**
 * Функция валидации переданного объекта restriction на соответствие интерфейсу Restrictions
 * @param restriction - проверяемый объект, содержащий информацию о рабочем времени и временной зоне.
 */
function isValidRestriction(restriction) {
    return typeof restriction === 'object' && restriction !== null && 'timezone' in restriction && 'worktime' in restriction;
}
/**
 * Функция валидации переданного объекта restriction на соответствие минимальным данным для заказа
 * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
 */
function isValidRestrictionOrder(restriction) {
    return 'minDeliveryTimeInMinutes' in restriction && 'possibleToOrderInMinutes' in restriction && 'timezone' in restriction && 'worktime' in restriction;
}
/**
 * Класс, содержащий статические методы, необходимые для работы с ограничениями рабочего времени предприятия.
 * Создавать новый экземпляр этого класса для использования статических методов не требуется.
 *
 * При этом при создании экземпляра класса у объекта также будут доступны собственные реализации
 * всех статических методов.
 * Эти реализации отличаются от вызовов статических методов только мемоизацией выполненных расчетов.
 *
 */
export class WorkTimeValidator {
    /**
     * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @return Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
     */
    static getMaxOrderDate(restriction, currentdate) {
        if (restriction && isValidRestrictionOrder(restriction) && isDate(currentdate)) {
            return formatDate(currentdate.getTime() + restriction.possibleToOrderInMinutes * 60000, 'yyyy-MM-dd', 'en');
        }
        else {
            throw new Error(isDate(currentdate) ?
                'Не передан корректный объект даты' :
                !restriction ? 'Не передан объект restrictions' :
                    'Передан невалидный обьект restrictions');
        }
    }
    /**
     * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
     * @param time - строка в формате HH:mm -`(00-24 часа):(0-59 минут)` - время.
     * @return кол-во минут.
     */
    static getTimeFromString(time) {
        if (!time) {
            throw 'Не передана строка с преобразуемым временем в формате HH:mm';
        }
        else {
            const regExp = new RegExp(/^(00|01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23)+:([0-5]\d)+/);
            if (regExp.test(time)) {
                let checkedTime = time.trim();
                if (checkedTime.includes(' ') || checkedTime.includes('T')) {
                    checkedTime = checkedTime.split(checkedTime.includes(' ') ? ' ' : 'T')[1];
                }
                return (+checkedTime.split(':')[0]) * 60 + (+checkedTime.split(':')[1]);
            }
            else {
                throw 'Переданная строка не соответствует формату HH:mm -`(00-24 часа):(0-59 минут)`';
            }
        }
    }
    /**
     * Метод конвертирует переданное кол-во минут в строкове представление времени в формате HH:mm - `(00-24 часа):(0-59 минут)`.
     * Например:
     *
     * const a = convertMinutesToTime(50) // a = '00:50'
     * const b = convertMinutesToTime(1200) // b = '20:00'
     *
     * @param time - Число в диапазоне от 0 до 1440 (так как максимум в 1 сутках = 1440 минут).
     * При передаче в time отрицательного значения, знак будет "отобршен", а для метод вернет результат, рассчитанный для полученного положительного значения.
     * Если в time будет передано значение больше 1440 - метод вернет результат для значения без учета "превышающих суток" (т.е. с кратным вычетом 1440 минут)
     *
     * Например:
     *
     * const a = convertMinutesToTime(60) // a = '01:00'
     * const b = convertMinutesToTime(1500) // b = '01:00' (1440 минут "целых" суток были "отброшены")
     *
     * @returns
     */
    static convertMinutesToTime(time) {
        if (time < 1441) {
            const hour = Math.floor(time / 60);
            const hourStr = (hour <= 9 ? `0${String(hour)}` : String(hour));
            const minutesStr = String(time - (hour * 60));
            return `${hourStr}:${minutesStr}`;
        }
        else {
            return WorkTimeValidator.convertMinutesToTime(time - 1440);
        }
    }
    /**
     * Метод проверяет, доступна ли возможность доставки на ближайшее время.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий локальные дату и время пользователя, для которых и проверяется возможность доставки
     * @return Обьект, содержащий информацию:
     * {
          isWorkNow:boolean - Возможна ли доставка в ближайшее время
          isNewDay:boolean - Служебный параметр для внутреннего использования.
            Представляет признак, что из-за разницы часовых поясов расчет даты "перепрыгнул" на новый день.
          currentTime:number - Служебный параметр для внутреннего использования.
            Представляет проверяемое методом время в минутах от 00:00 в часовом поясе предприятия.
          curentDayStartTime:number - Служебный параметр для внутреннего использования.
            Представляет время начала рабочего дня в минутах от 00:00 в часовом поясе предприятия.
          curentDayStopTime:number - Служебный параметр для внутреннего использования.
            Представляет время окончания рабочего дня в минутах от 00:00 в часовом поясе предприятия.
        }
     */
    static isWorkNow(restriction, currentdate = new Date()) {
        if (!restriction.worktime || !Object.keys(restriction.worktime).length) {
            return {
                workNow: true
            };
        }
        ;
        // Если испольняется в NodeJS
        if (typeof process !== 'undefined' && !restriction.timezone) {
            restriction.timezone = process.env.TZ ? process.env.TZ : Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        ;
        if (!restriction || !isValidRestriction(restriction)) {
            throw new Error(!isDate(currentdate) ? 'Не передан корректный объект даты' :
                !restriction ? 'Не передан объект restrictions'
                    : 'Передан невалидный обьект restrictions');
        }
        else {
            const companyLocalTimeZone = TimeZoneIdentifier.getTimeZoneGMTOffsetfromNameZone(restriction.timezone).split(':');
            const companyLocalTimeZoneDelta = +companyLocalTimeZone[0] * 60 + (+(companyLocalTimeZone[1]));
            const lokalTimeDelta = companyLocalTimeZoneDelta + currentdate.getTimezoneOffset(); // смещение времени пользователя относительно времени торговой точки
            const currentTimeInMinutesWithLocalDelta = WorkTimeValidator.getTimeFromString(formatDate(currentdate, 'HH:mm', 'en')) + lokalTimeDelta;
            /**
             * текущее время в минутах с начала дня (600 = 10:00. 1200 = 20:00)
             * если из-за разницы поясов расчет перепрыгнул на новый день, то приводим время к правильному значению в диапазоне 24 часов
             * */
            const currentTime = currentTimeInMinutesWithLocalDelta > 1440 ? currentTimeInMinutesWithLocalDelta - 1440 : currentTimeInMinutesWithLocalDelta;
            const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, currentTimeInMinutesWithLocalDelta > 1440 ? new Date(currentdate.getTime() + 86400000) : currentdate); // текущее рабочее время
            const curentDayStartTime = WorkTimeValidator.getTimeFromString(currentDayWorkTime.start); // текущее время начала рабочего дня в минутах
            const curentDayStopTime = WorkTimeValidator.getTimeFromString(currentDayWorkTime.stop); // текущее время окончания рабочего дня в минутах
            return {
                workNow: currentTime < curentDayStopTime && currentTime > curentDayStartTime,
                isNewDay: currentTimeInMinutesWithLocalDelta > 1440,
                currentTime,
                curentDayStartTime,
                curentDayStopTime
            };
        }
    }
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Доставка курьером".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    static getPossibleDelieveryOrderDateTime(restriction, currentdate) {
        const checkTime = WorkTimeValidator.isWorkNow(restriction, currentdate);
        if (checkTime.workNow && checkTime.currentTime) {
            console.log('Сейчас рабочее время. Расчет не требуется.');
            const possibleTime = checkTime.currentTime + (+restriction.minDeliveryTimeInMinutes || 0);
            const possibleTimeStr = WorkTimeValidator.convertMinutesToTime(possibleTime);
            return formatDate(currentdate, `yyyy-MM-dd ${possibleTimeStr}`, 'en');
        }
        else {
            if (checkTime.currentTime && checkTime.curentDayStopTime) {
                const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, checkTime.isNewDay ? new Date(currentdate.getTime() + 86400000) : currentdate);
                const time = this.getTimeFromString(currentDayWorkTime.start) + (+restriction.minDeliveryTimeInMinutes);
                const timeString = WorkTimeValidator.convertMinutesToTime(time);
                return formatDate(checkTime.isNewDay || checkTime.currentTime > checkTime.curentDayStopTime ? (currentdate.getTime() + 86400000) : currentdate, `yyyy-MM-dd ${timeString}`, 'en');
            }
            else {
                throw 'Не удалось рассчитать currentTime и curentDayStopTime.';
            }
            ;
        }
    }
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    static getPossibleSelfServiceOrderDateTime(restriction, currentdate) {
        /**
         * Для обеспечения иммутабельности данных создается новый обьект restrictions, идентичный полученному в параметрах, но с измененным массивом worktime.
         * В массиве worktime обновляются ограничения времени работы с обычных на актуальные для самовывоза.
         * */
        const newRestriction = {
            ...restriction, worktime: restriction.worktime.map(worktime => worktime.selfService ? ({ ...worktime, ...worktime.selfService }) : worktime)
        };
        return WorkTimeValidator.getPossibleDelieveryOrderDateTime(newRestriction, currentdate);
    }
    /**
    * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
    * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
    * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
    */
    static getCurrentWorkTime(restriction, currentdate) {
        let i = 0;
        let result = null;
        while (i < restriction.worktime.length && !result) {
            if (restriction.worktime[i].dayOfWeek === 'all' || (typeof restriction.worktime[i].dayOfWeek === 'string' ?
                restriction.worktime[i].dayOfWeek.toLowerCase() :
                restriction.worktime[i].dayOfWeek.map(day => day.toLowerCase())).includes(formatDate(currentdate, 'EEEE', 'en').toLowerCase())) {
                result = restriction.worktime[i];
            }
            i += 1;
        }
        if (!result) {
            throw new Error('Нет актуального расписания работы для текущего дня');
        }
        else {
            return result;
        }
    }
    /**
    * Логика ниже предназначена для использования экземпляра класса WorkTimeValidator
    */
    constructor() {
        this._memory = {
            getMaxOrderDate: new Map(),
            getTimeFromString: new Map(),
            isWorkNow: new Map(),
            getPossibleDelieveryOrderDateTime: new Map(),
            getPossibleSelfServiceOrderDateTime: new Map(),
            getCurrentWorkTime: new Map(),
            convertMinutesToTime: new Map()
        };
    }
    /**
      * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
      * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
      * @return :string - Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
      */
    getMaxOrderDate(restriction, currentdate) {
        const memoryKey = JSON.stringify({ restriction, currentdate });
        const checkMemory = this._memory.getMaxOrderDate.get(memoryKey);
        if (checkMemory) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.getMaxOrderDate(restriction, currentdate);
            this._memory.getMaxOrderDate.set(memoryKey, result);
            return result;
        }
    }
    /**
     * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
     * @param time - строка в формате HH:mm - время.
     * @return :number - кол-во минут.
     */
    getTimeFromString(time) {
        const memoryKey = JSON.stringify({ time });
        const checkMemory = this._memory.getTimeFromString.get(memoryKey);
        if (checkMemory) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.getTimeFromString(time);
            this._memory.getTimeFromString.set(memoryKey, result);
            return result;
        }
    }
    ;
    /**
     * Метод проверяет, доступна ли возможность доставки на ближайшее время.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий локальные дату и время пользователя, для которых и проверяется возможность доставки
     * @return Обьект, содержащий информацию:
     * {
          isWorkNow:boolean - Возможна ли доставка в ближайшее время
          isNewDay:boolean - Служебный параметр для внутреннего использования.
            Представляет признак, что из-за разницы часовых поясов расчет даты "перепрыгнул" на новый день.
          currentTime:number - Служебный параметр для внутреннего использования.
            Представляет проверяемое методом время в минутах от 00:00 в часовом поясе предприятия.
          curentDayStartTime:number - Служебный параметр для внутреннего использования.
            Представляет время начала рабочего дня в минутах от 00:00 в часовом поясе предприятия.
          curentDayStopTime:number - Служебный параметр для внутреннего использования.
            Представляет время окончания рабочего дня в минутах от 00:00 в часовом поясе предприятия.
        }
     */
    isWorkNow(restriction, currentdate) {
        const memoryKey = JSON.stringify({ restriction, currentdate });
        const checkMemory = this._memory.isWorkNow.get(memoryKey);
        if (checkMemory) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.isWorkNow(restriction, currentdate);
            this._memory.isWorkNow.set(memoryKey, result);
            return result;
        }
    }
    ;
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Доставка курьером".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    getPossibleDelieveryOrderDateTime(restriction, currentdate) {
        const memoryKey = JSON.stringify({ restriction, currentdate });
        const checkMemory = this._memory.getPossibleDelieveryOrderDateTime.get(memoryKey);
        if (checkMemory) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.getPossibleDelieveryOrderDateTime(restriction, currentdate);
            this._memory.getPossibleDelieveryOrderDateTime.set(memoryKey, result);
            return result;
        }
    }
    ;
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    getPossibleSelfServiceOrderDateTime(restriction, currentdate) {
        const memoryKey = JSON.stringify({ restriction, currentdate });
        const checkMemory = this._memory.getPossibleSelfServiceOrderDateTime.get(memoryKey);
        if (checkMemory) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.getPossibleSelfServiceOrderDateTime(restriction, currentdate);
            this._memory.getPossibleSelfServiceOrderDateTime.set(memoryKey, result);
            return result;
        }
    }
    ;
    /**
    * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
    * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
    * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
    */
    getCurrentWorkTime(restriction, currentdate) {
        const memoryKey = JSON.stringify({ restriction, currentdate });
        const checkMemory = this._memory.getCurrentWorkTime.get(memoryKey);
        if (checkMemory) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.getCurrentWorkTime(restriction, currentdate);
            this._memory.getCurrentWorkTime.set(memoryKey, result);
            return result;
        }
    }
    ;
    /**
     * Метод конвертирует переданное кол-во минут в строкове представление времени в формате HH:mm - `(00-24 часа):(0-59 минут)`.
     * Например:
     *
     * const a = convertMinutesToTime(50) // a = '00:50'
     * const b = convertMinutesToTime(1200) // b = '20:00'
     *
     * @param time - Число в диапазоне от 0 до 1440 (так как максимум в 1 сутках = 1440 минут).
     * При передаче в time отрицательного значения, знак будет "отобршен", а для метод вернет результат, рассчитанный для полученного положительного значения.
     * Если в time будет передано значение больше 1440 - метод вернет результат для значения без учета "превышающих суток" (т.е. с кратным вычетом 1440 минут)
     *
     * Например:
     *
     * const a = convertMinutesToTime(60) // a = '01:00'
     * const b = convertMinutesToTime(1500) // b = '01:00' (1440 минут "целых" суток были "отброшены")
     *
     * @returns
     */
    convertMinutesToTime(time) {
        const memoryKey = JSON.stringify({ time });
        const checkMemory = this._memory.convertMinutesToTime.get(memoryKey);
        if (checkMemory) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.convertMinutesToTime(time);
            this._memory.convertMinutesToTime.set(memoryKey, result);
            return result;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sTUFBTSxDQUFDO0FBdUgxQzs7O0dBR0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLFdBQW9CO0lBRTlDLE9BQU8sT0FBTyxXQUFXLEtBQUssUUFBUSxJQUFJLFdBQVcsS0FBSyxJQUFJLElBQUksVUFBVSxJQUFJLFdBQVcsSUFBSSxVQUFVLElBQUksV0FBVyxDQUFDO0FBRTNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHVCQUF1QixDQUFDLFdBQThCO0lBRTdELE9BQU8sMEJBQTBCLElBQUksV0FBVyxJQUFJLDBCQUEwQixJQUFJLFdBQVcsSUFBSSxVQUFVLElBQUksV0FBVyxJQUFJLFVBQVUsSUFBSSxXQUFXLENBQUM7QUFFMUosQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQUM1Qjs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUE4QixFQUFFLFdBQWlCO1FBQ3RFLElBQUksV0FBVyxJQUFJLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUU5RSxPQUFPLFVBQVUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsV0FBVyxDQUFDLHdCQUF3QixHQUFHLEtBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FFN0c7YUFBTTtZQUVMLE1BQU0sSUFBSSxLQUFLLENBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLG1DQUFtQyxDQUFDLENBQUM7Z0JBQ3JDLENBQUMsV0FB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LENBQUM7SUFFRjs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FpQkc7SUFDSCxvQkFBb0IsQ0FBQyxJQUFZO1FBQy9CLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLElBQUksV0FBVyxFQUFFO1lBQ2YsT0FBTyxXQUFXLENBQUM7U0FDcEI7YUFBTTtZQUNMLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6RCxPQUFPLE1BQU0sQ0FBQztTQUNmO0lBQ0gsQ0FBQztDQUVGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZm9ybWF0RGF0ZSwgaXNEYXRlIH0gZnJvbSAnLi9mb3JtYXREYXRlJztcclxuaW1wb3J0IHsgVGltZVpvbmVJZGVudGlmaWVyIH0gZnJvbSAnLi90eic7XHJcblxyXG4vKipcclxuICog0JHQsNC30L7QstGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyAtINGB0LvRg9C20LXQsdC90YvQuSDQuNC90YLQtdGA0YTQtdC50YEuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtUaW1lQmFzZSB7XHJcbiAgLyoqINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cclxuICBzdGFydDogc3RyaW5nO1xyXG5cclxuICAvKiog0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8qL1xyXG4gIHN0b3A6IHN0cmluZztcclxuXHJcbiAgLyoqINC/0LXRgNC10YDRi9CyINC90LAg0L7QsdC10LQqL1xyXG4gIGJyZWFrPzogc3RyaW5nO1xyXG59XHJcblxyXG4vKipcclxuICog0JjQvdGE0L7RgNC80LDRhtC40Y8g0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gLSDRgdC70YPQttC10LHQvdGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBXb3JrVGltZSBleHRlbmRzIFdvcmtUaW1lQmFzZSB7XHJcbiAgLyoqINC00LXQvdGMINC90LXQtNC10LvQuCwg0Log0LrQvtGC0L7RgNC+0LzRgyDQv9GA0LjQvNC10L3Rj9C10YLRgdGPINGN0YLQviDQstGA0LXQvNGPINC00L7RgdGC0LDQstC60LggICAqL1xyXG4gIGRheU9mV2Vlazogc3RyaW5nIHwgc3RyaW5nW107XHJcblxyXG4gIC8qKiDQvtCz0YDQsNC90LjRh9C10L3QuNGPINC/0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC00LvRjyDRgdCw0LzQvtCy0YvQstC+0LfQsCAqL1xyXG4gIHNlbGZTZXJ2aWNlPzogV29ya1RpbWVCYXNlO1xyXG59XHJcblxyXG4vKipcclxuICog0JjQvdGC0LXRgNGE0LXQudGBINC+0LHRitC10LrRgtCwLCDQv9C+0LvRg9GH0LDQtdC80L7Qs9C+INC+0YIgQVBJIEB3ZWJyZXN0by9jb3JlINC4INGB0L7QtNC10YDQttCw0YnQtdCz0L4g0YLQtdC60YPRidC40LUg0LTQsNC90L3Ri9C1INC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y9cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVzdHJpY3Rpb25zIHtcclxuICAvKiog0LLRgNC10LzQtdC90L3QsNGPINC30L7QvdCwINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cclxuICB0aW1lem9uZT86IHN0cmluZztcclxuXHJcbiAgLyoqICDQvNCw0YHRgdC40LIg0L7Qs9GA0LDQvdC40YfQtdC90LjQuSDQv9C+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC00LvRjyDRgNCw0LfQvdGL0YUg0LTQvdC10Lkg0L3QtdC00LXQu9C4LiAqL1xyXG4gIHdvcmt0aW1lOiBXb3JrVGltZVtdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEh0bWxGb3JtRmllbGQge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgdHlwZTogc3RyaW5nO1xyXG4gIGxhYmVsOiBzdHJpbmc7XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZztcclxuICByZXF1aXJlZDogYm9vbGVhbjtcclxuICByZWdleDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvdW50cnkge1xyXG4gIHBob25lQ29kZTogc3RyaW5nO1xyXG4gIGlzbzogc3RyaW5nO1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBuYXRpdmVDb3VudHJ5TmFtZTogc3RyaW5nO1xyXG4gIGxhbmd1YWdlOiBzdHJpbmdbXTtcclxuICBjdXJyZW5jeTogc3RyaW5nO1xyXG4gIGN1cnJlbmN5U3ltYm9sOiBzdHJpbmc7XHJcbiAgY3VycmVuY3lJU086IHN0cmluZztcclxuICBjdXJyZW5jeVVuaXQ6IHN0cmluZztcclxuICBjdXJyZW5jeURlbm9taW5hdGlvbjogbnVtYmVyO1xyXG4gIHBob25lTWFzazogc3RyaW5nW107XHJcbiAgZmxhZzogc3RyaW5nO1xyXG4gIH1cclxuXHJcbi8qKiDQlNCw0L3QvdGL0LUg0L4g0LzQvtC00LXQu9C4INCw0LLRgtC+0YDQuNC30LDRhtC40Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9C10Lkg0L3QsCDRgdCw0LnRgtC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cclxuZXhwb3J0IGludGVyZmFjZSBVc2VyUmVzdHJpY3Rpb25zIHtcclxuICAvKiog0J/QvtC60LDQt9GL0LLQsNC10YIsINC60LDQutC+0Lkg0LLQuNC0INC00LDQvdC90YvRhSDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9C10Lwg0LTQu9GPINCw0LLRgtC+0YDQuNC30LDRhtC40LggKi9cclxuICBsb2dpbkZpZWxkOiBzdHJpbmc7XHJcblxyXG4gIGN1c3RvbUZpZWxkcz86IEh0bWxGb3JtRmllbGRbXSB8IG51bGw7XHJcblxyXG4gIGFjY291bnRzRGlzYWJsZTogYm9vbGVhbjtcclxuICBib251c1Byb2dyYW1EaXNhYmxlOiBib29sZWFuO1xyXG4gIHBhc3N3b3JkUmVxdWlyZWQ6IGJvb2xlYW47XHJcbiAgcmVnaXN0cmF0aW9uT1RQUmVxdWlyZWQ6IGJvb2xlYW47XHJcbiAgYWxsb3dSZXN0b3JlUGFzc3dvcmQ6IGJvb2xlYW47XHJcbiAgYWxsb3dlZFBob25lQ291bnRyaWVzOiBDb3VudHJ5W107XHJcbiAgbGlua1RvUHJvY2Vzc2luZ1BlcnNvbmFsRGF0YTogYm9vbGVhbjtcclxuICBsaW5rVG9Vc2VyQWdyZWVtZW50OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFJlc3RyaWN0aW9uc09yZGVyIGV4dGVuZHMgUmVzdHJpY3Rpb25zIHtcclxuICAvKiog0LzQuNC90LjQvNCw0LvRjNC90L7QtSDQstGA0LXQvNGPINC00L7RgdGC0LDQstC60LgqL1xyXG4gIG1pbkRlbGl2ZXJ5VGltZUluTWludXRlczogc3RyaW5nO1xyXG5cclxuICAvKiog0L7Qs9GA0LDQvdC40YfQtdC90LjQtSDQvNCw0LrRgdC40LzQsNC70YzQvdC+0Lkg0LTQsNGC0Ysg0LfQsNC60LDQt9CwINCyINCx0YPQtNGD0YnQtdC8ICjQsiDQvNC40L3Rg9GC0LDRhSkqL1xyXG4gIHBvc3NpYmxlVG9PcmRlckluTWludXRlczogbnVtYmVyO1xyXG5cclxuICAvKiogINGD0YHRgtCw0L3QvtCy0LvQtdC90L4g0LvQuCDQvdCwINGC0LXQutGD0YnQuNC5INC80L7QvNC10L3RgiDQvtCz0YDQsNC90LjRh9C10L3QuNC1INC00L7RgdGC0LDQstC60Lgg0L3QsCDQvtC/0YDQtdC00LXQu9C10L3QvdC+0LUg0LLRgNC10LzRjyAqL1xyXG4gIGRlbGl2ZXJ5VG9UaW1lRW5hYmxlZD86IGJvb2xlYW47XHJcblxyXG4gIC8qKiDQlNC+0L/QvtC70L3QuNGC0LXQu9GM0L3Ri9C5INC60L7QvNC80LXQvdGC0LDRgNC40Lkg0L/QviDQtNC+0YHRgtCw0LLQutC1ICovXHJcbiAgZGVsaXZlcnlEZXNjcmlwdGlvbj86IHN0cmluZztcclxuXHJcbiAgLyoqINCg0LDQt9C90L7QstC40LTQvdC+0YHRgtGMINCy0LLQvtC00LjQvNC+0Lkg0LrQsNC/0YfQuCAqL1xyXG4gIGNhcHRjaGFUeXBlPzogc3RyaW5nIHwgbnVsbFxyXG5cclxuICAvKiog0JTQsNC90L3Ri9C1INC+INC80L7QtNC10LvQuCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC90LAg0YHQsNC50YLQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXHJcbiAgdXNlcj86IFVzZXJSZXN0cmljdGlvbnMgfCBudWxsXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVmFsaWRhdG9yUmVzdWx0IHtcclxuICB3b3JrTm93OiBib29sZWFuLFxyXG4gIGlzTmV3RGF5PzogYm9vbGVhbixcclxuICBjdXJyZW50VGltZT86IG51bWJlcixcclxuICBjdXJlbnREYXlTdGFydFRpbWU/OiBudW1iZXIsXHJcbiAgY3VyZW50RGF5U3RvcFRpbWU/OiBudW1iZXJcclxufVxyXG5cclxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgdC10YUg0YbQuNGE0YAgKi9cclxudHlwZSBEaWdpdHMgPSAnMCcgfCAnMScgfCAnMicgfCAnMycgfCAnNCcgfCAnNScgfCAnNicgfCAnNycgfCAnOCcgfCAnOSc7XHJcblxyXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSAyNCDRh9Cw0YHQvtCyINC+0LTQvdC40YUg0YHRg9GC0L7QuiAqL1xyXG5leHBvcnQgdHlwZSBIb3Vyc0RpZ2l0cyA9ICcwMCcgfCAnMDEnIHwgJzAyJyB8ICcwMycgfCAnMDQnIHwgJzA1JyB8ICcwNicgfCAnMDcnIHwgJzA4JyB8ICcwOScgfCAnMTAnIHwgJzExJyB8ICcxMicgfCAnMTMnIHwgJzE0JyB8ICcxNScgfCAnMTYnIHwgJzE3JyB8ICcxOCcgfCAnMTknIHwgJzIwJyB8ICcyMScgfCAnMjInIHwgJzIzJztcclxuXHJcbi8qKiDQotC40L8sINC+0L/QuNGB0YvQstCw0Y7RidC40Lkg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1IDYwINC80LjQvdGD0YIg0L7QtNC90L7Qs9C+INGH0LDRgdCwKi9cclxuZXhwb3J0IHR5cGUgTWludXRlRGlnaXRzID0gYCR7JzAnIHwgJzEnIHwgJzInIHwgJzMnIHwgJzQnIHwgJzUnfSR7RGlnaXRzfWA7XHJcblxyXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgICovXHJcbmV4cG9ydCB0eXBlIFRpbWVTdHJpbmcgPSBgJHtIb3Vyc0RpZ2l0c306JHtNaW51dGVEaWdpdHN9YDtcclxuXHJcbi8qKlxyXG4gKiDQpNGD0L3QutGG0LjRjyDQstCw0LvQuNC00LDRhtC40Lgg0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQvtCx0YrQtdC60YLQsCByZXN0cmljdGlvbiDQvdCwINGB0L7QvtGC0LLQtdGC0YHRgtCy0LjQtSDQuNC90YLQtdGA0YTQtdC50YHRgyBSZXN0cmljdGlvbnNcclxuICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L/RgNC+0LLQtdGA0Y/QtdC80YvQuSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC4INCy0YDQtdC80LXQvdC90L7QuSDQt9C+0L3QtS5cclxuICovXHJcbmZ1bmN0aW9uIGlzVmFsaWRSZXN0cmljdGlvbihyZXN0cmljdGlvbjogdW5rbm93bik6IHJlc3RyaWN0aW9uIGlzIFJlc3RyaWN0aW9ucyB7XHJcblxyXG4gIHJldHVybiB0eXBlb2YgcmVzdHJpY3Rpb24gPT09ICdvYmplY3QnICYmIHJlc3RyaWN0aW9uICE9PSBudWxsICYmICd0aW1lem9uZScgaW4gcmVzdHJpY3Rpb24gJiYgJ3dvcmt0aW1lJyBpbiByZXN0cmljdGlvbjtcclxuXHJcbn1cclxuXHJcbi8qKlxyXG4gKiDQpNGD0L3QutGG0LjRjyDQstCw0LvQuNC00LDRhtC40Lgg0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQvtCx0YrQtdC60YLQsCByZXN0cmljdGlvbiDQvdCwINGB0L7QvtGC0LLQtdGC0YHRgtCy0LjQtSDQvNC40L3QuNC80LDQu9GM0L3Ri9C8INC00LDQvdC90YvQvCDQtNC70Y8g0LfQsNC60LDQt9CwXHJcbiAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICovXHJcbmZ1bmN0aW9uIGlzVmFsaWRSZXN0cmljdGlvbk9yZGVyKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcik6IHJlc3RyaWN0aW9uIGlzIFJlc3RyaWN0aW9uc09yZGVyIHtcclxuXHJcbiAgcmV0dXJuICdtaW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXMnIGluIHJlc3RyaWN0aW9uICYmICdwb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXMnIGluIHJlc3RyaWN0aW9uICYmICd0aW1lem9uZScgaW4gcmVzdHJpY3Rpb24gJiYgJ3dvcmt0aW1lJyBpbiByZXN0cmljdGlvbjtcclxuXHJcbn1cclxuXHJcbi8qKlxyXG4gKiDQmtC70LDRgdGBLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDRgdGC0LDRgtC40YfQtdGB0LrQuNC1INC80LXRgtC+0LTRiywg0L3QtdC+0LHRhdC+0LTQuNC80YvQtSDQtNC70Y8g0YDQsNCx0L7RgtGLINGBINC+0LPRgNCw0L3QuNGH0LXQvdC40Y/QvNC4INGA0LDQsdC+0YfQtdCz0L4g0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICog0KHQvtC30LTQsNCy0LDRgtGMINC90L7QstGL0Lkg0Y3QutC30LXQvNC/0LvRj9GAINGN0YLQvtCz0L4g0LrQu9Cw0YHRgdCwINC00LvRjyDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjyDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyINC90LUg0YLRgNC10LHRg9C10YLRgdGPLlxyXG4gKiBcclxuICog0J/RgNC4INGN0YLQvtC8INC/0YDQuCDRgdC+0LfQtNCw0L3QuNC4INGN0LrQt9C10LzQv9C70Y/RgNCwINC60LvQsNGB0YHQsCDRgyDQvtCx0YrQtdC60YLQsCDRgtCw0LrQttC1INCx0YPQtNGD0YIg0LTQvtGB0YLRg9C/0L3RiyDRgdC+0LHRgdGC0LLQtdC90L3Ri9C1INGA0LXQsNC70LjQt9Cw0YbQuNC4IFxyXG4gKiDQstGB0LXRhSDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyLlxyXG4gKiDQrdGC0Lgg0YDQtdCw0LvQuNC30LDRhtC40Lgg0L7RgtC70LjRh9Cw0Y7RgtGB0Y8g0L7RgiDQstGL0LfQvtCy0L7QsiDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyINGC0L7Qu9GM0LrQviDQvNC10LzQvtC40LfQsNGG0LjQtdC5INCy0YvQv9C+0LvQvdC10L3QvdGL0YUg0YDQsNGB0YfQtdGC0L7Qsi5cclxuICogXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgV29ya1RpbWVWYWxpZGF0b3Ige1xyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgywg0L3QsCDQutC+0YLQvtGA0YPRjiDQvNC+0LbQvdC+INC30LDQutCw0LfQsNGC0Ywg0LTQvtGB0YLQsNCy0LrRgy5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHJldHVybiDQodGC0YDQvtC60LAsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidCw0Y8g0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINC00L7RgdGC0YPQv9C90YPRjiDQtNCw0YLRgyDQtNC+0YHRgtCw0LLQutC4INCyINGE0L7RgNC80LDRgtC1IHl5eXktTU0tZGQuXHJcbiAgICovXHJcbiAgc3RhdGljIGdldE1heE9yZGVyRGF0ZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIGlmIChyZXN0cmljdGlvbiAmJiBpc1ZhbGlkUmVzdHJpY3Rpb25PcmRlcihyZXN0cmljdGlvbikgJiYgaXNEYXRlKGN1cnJlbnRkYXRlKSkge1xyXG5cclxuICAgICAgcmV0dXJuIGZvcm1hdERhdGUoY3VycmVudGRhdGUuZ2V0VGltZSgpICsgcmVzdHJpY3Rpb24ucG9zc2libGVUb09yZGVySW5NaW51dGVzICogNjAwMDAsICd5eXl5LU1NLWRkJywgJ2VuJyk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBpc0RhdGUoY3VycmVudGRhdGUpID9cclxuICAgICAgICAgICfQndC1INC/0LXRgNC10LTQsNC9INC60L7RgNGA0LXQutGC0L3Ri9C5INC+0LHRitC10LrRgiDQtNCw0YLRiycgOlxyXG4gICAgICAgICAgIXJlc3RyaWN0aW9uID8gJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0L7QsdGK0LXQutGCIHJlc3RyaWN0aW9ucycgOlxyXG4gICAgICAgICAgICAn0J/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucydcclxuICAgICAgKTtcclxuXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INGB0YfQuNGC0LDQtdGCLCDRgdC60L7Qu9GM0LrQviDQvNC40L3Rg9GCINC+0YIg0L3QsNGH0LDQu9CwINC00L3RjyAoMDA6MDApINC/0YDQvtGI0LvQviDQtNC70Y8g0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQstGA0LXQvNC10L3QuC5cclxuICAgKiBAcGFyYW0gdGltZSAtINGB0YLRgNC+0LrQsCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgIC0g0LLRgNC10LzRjy5cclxuICAgKiBAcmV0dXJuINC60L7Quy3QstC+INC80LjQvdGD0YIuXHJcbiAgICovXHJcbiAgc3RhdGljIGdldFRpbWVGcm9tU3RyaW5nKHRpbWU6IFRpbWVTdHJpbmcpOiBudW1iZXIge1xyXG4gICAgaWYgKCF0aW1lKSB7XHJcblxyXG4gICAgICB0aHJvdyAn0J3QtSDQv9C10YDQtdC00LDQvdCwINGB0YLRgNC+0LrQsCDRgSDQv9GA0LXQvtCx0YDQsNC30YPQtdC80YvQvCDQstGA0LXQvNC10L3QtdC8INCyINGE0L7RgNC80LDRgtC1IEhIOm1tJztcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgY29uc3QgcmVnRXhwID0gbmV3IFJlZ0V4cCgvXigwMHwwMXwwMnwwM3wwNHwwNXwwNnwwN3wwOHwwOXwxMHwxMXwxMnwxM3wxNHwxNXwxNnwxN3wxOHwxOXwyMHwyMXwyMnwyMykrOihbMC01XVxcZCkrLyk7XHJcblxyXG4gICAgICBpZiAocmVnRXhwLnRlc3QodGltZSkpIHtcclxuXHJcbiAgICAgICAgbGV0IGNoZWNrZWRUaW1lID0gdGltZS50cmltKCk7XHJcbiAgICAgICAgaWYgKGNoZWNrZWRUaW1lLmluY2x1ZGVzKCcgJykgfHwgY2hlY2tlZFRpbWUuaW5jbHVkZXMoJ1QnKSkge1xyXG5cclxuICAgICAgICAgIGNoZWNrZWRUaW1lID0gY2hlY2tlZFRpbWUuc3BsaXQoY2hlY2tlZFRpbWUuaW5jbHVkZXMoJyAnKSA/ICcgJyA6ICdUJylbMV07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICgrY2hlY2tlZFRpbWUuc3BsaXQoJzonKVswXSkgKiA2MCArICgrY2hlY2tlZFRpbWUuc3BsaXQoJzonKVsxXSk7XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICB0aHJvdyAn0J/QtdGA0LXQtNCw0L3QvdCw0Y8g0YHRgtGA0L7QutCwINC90LUg0YHQvtC+0YLQstC10YLRgdGC0LLRg9C10YIg0YTQvtGA0LzQsNGC0YMgSEg6bW0gLWAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYCdcclxuXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINC/0LXRgNC10LTQsNC90L3QvtC1INC60L7Quy3QstC+INC80LjQvdGD0YIg0LIg0YHRgtGA0L7QutC+0LLQtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtIGAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYC5cclxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxyXG4gICAqIFxyXG4gICAqIGNvbnN0IGEgPSBjb252ZXJ0TWludXRlc1RvVGltZSg1MCkgLy8gYSA9ICcwMDo1MCdcclxuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTIwMCkgLy8gYiA9ICcyMDowMCdcclxuICAgKiBcclxuICAgKiBAcGFyYW0gdGltZSAtINCn0LjRgdC70L4g0LIg0LTQuNCw0L/QsNC30L7QvdC1INC+0YIgMCDQtNC+IDE0NDAgKNGC0LDQuiDQutCw0Log0LzQsNC60YHQuNC80YPQvCDQsiAxINGB0YPRgtC60LDRhSA9IDE0NDAg0LzQuNC90YPRgikuXHJcbiAgICog0J/RgNC4INC/0LXRgNC10LTQsNGH0LUg0LIgdGltZSDQvtGC0YDQuNGG0LDRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8sINC30L3QsNC6INCx0YPQtNC10YIgXCLQvtGC0L7QsdGA0YjQtdC9XCIsINCwINC00LvRjyDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIsINGA0LDRgdGB0YfQuNGC0LDQvdC90YvQuSDQtNC70Y8g0L/QvtC70YPRh9C10L3QvdC+0LPQviDQv9C+0LvQvtC20LjRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8uXHJcbiAgICog0JXRgdC70Lgg0LIgdGltZSDQsdGD0LTQtdGCINC/0LXRgNC10LTQsNC90L4g0LfQvdCw0YfQtdC90LjQtSDQsdC+0LvRjNGI0LUgMTQ0MCAtINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiDQtNC70Y8g0LfQvdCw0YfQtdC90LjRjyDQsdC10Lcg0YPRh9C10YLQsCBcItC/0YDQtdCy0YvRiNCw0Y7RidC40YUg0YHRg9GC0L7QulwiICjRgi7QtS4g0YEg0LrRgNCw0YLQvdGL0Lwg0LLRi9GH0LXRgtC+0LwgMTQ0MCDQvNC40L3Rg9GCKVxyXG4gICAqIFxyXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XHJcbiAgICogXHJcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDYwKSAvLyBhID0gJzAxOjAwJyBcclxuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTUwMCkgLy8gYiA9ICcwMTowMCcgKDE0NDAg0LzQuNC90YPRgiBcItGG0LXQu9GL0YVcIiDRgdGD0YLQvtC6INCx0YvQu9C4IFwi0L7RgtCx0YDQvtGI0LXQvdGLXCIpXHJcbiAgICogXHJcbiAgICogQHJldHVybnMgXHJcbiAgICovXHJcbiAgc3RhdGljIGNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWU6IG51bWJlcik6IFRpbWVTdHJpbmcge1xyXG5cclxuICAgIGlmICh0aW1lIDwgMTQ0MSkge1xyXG5cclxuICAgICAgY29uc3QgaG91ciA9IE1hdGguZmxvb3IodGltZSAvIDYwKTtcclxuICAgICAgY29uc3QgaG91clN0cjogSG91cnNEaWdpdHMgPSA8SG91cnNEaWdpdHM+KGhvdXIgPD0gOSA/IGAwJHtTdHJpbmcoaG91cil9YCA6IFN0cmluZyhob3VyKSk7XHJcbiAgICAgIGNvbnN0IG1pbnV0ZXNTdHI6IE1pbnV0ZURpZ2l0cyA9IDxNaW51dGVEaWdpdHM+U3RyaW5nKHRpbWUgLSAoaG91ciAqIDYwKSk7XHJcbiAgICAgIHJldHVybiBgJHtob3VyU3RyfToke21pbnV0ZXNTdHJ9YDtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgcmV0dXJuIFdvcmtUaW1lVmFsaWRhdG9yLmNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWUgLSAxNDQwKTtcclxuXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INC/0YDQvtCy0LXRgNGP0LXRgiwg0LTQvtGB0YLRg9C/0L3QsCDQu9C4INCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8sINC00LvRjyDQutC+0YLQvtGA0YvRhSDQuCDQv9GA0L7QstC10YDRj9C10YLRgdGPINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuFxyXG4gICAqIEByZXR1cm4g0J7QsdGM0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjjpcclxuICAgKiB7XHJcbiAgICAgICAgaXNXb3JrTm93OmJvb2xlYW4gLSDQktC+0LfQvNC+0LbQvdCwINC70Lgg0LTQvtGB0YLQsNCy0LrQsCDQsiDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRj1xyXG4gICAgICAgIGlzTmV3RGF5OmJvb2xlYW4gLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0LjQt9C90LDQuiwg0YfRgtC+INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDRh9Cw0YHQvtCy0YvRhSDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC00LDRgtGLIFwi0L/QtdGA0LXQv9GA0YvQs9C90YPQu1wiINC90LAg0L3QvtCy0YvQuSDQtNC10L3RjC5cclxuICAgICAgICBjdXJyZW50VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0L7QstC10YDRj9C10LzQvtC1INC80LXRgtC+0LTQvtC8INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICB9XHJcbiAgICovXHJcbiAgc3RhdGljIGlzV29ya05vdyhyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zIHwgUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlID0gbmV3IERhdGUoKSk6IFZhbGlkYXRvclJlc3VsdCB7XHJcblxyXG4gICAgaWYgKCFyZXN0cmljdGlvbi53b3JrdGltZSB8fCAhT2JqZWN0LmtleXMocmVzdHJpY3Rpb24ud29ya3RpbWUpLmxlbmd0aCkge1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB3b3JrTm93OiB0cnVlXHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8g0JXRgdC70Lgg0LjRgdC/0L7Qu9GM0L3Rj9C10YLRgdGPINCyIE5vZGVKU1xyXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAhcmVzdHJpY3Rpb24udGltZXpvbmUpIHtcclxuXHJcbiAgICAgIHJlc3RyaWN0aW9uLnRpbWV6b25lID0gcHJvY2Vzcy5lbnYuVFogPyBwcm9jZXNzLmVudi5UWiA6IEludGwuRGF0ZVRpbWVGb3JtYXQoKS5yZXNvbHZlZE9wdGlvbnMoKS50aW1lWm9uZVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgaWYgKCFyZXN0cmljdGlvbiB8fCAhaXNWYWxpZFJlc3RyaWN0aW9uKHJlc3RyaWN0aW9uKSkge1xyXG5cclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICFpc0RhdGUoY3VycmVudGRhdGUpID8gJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LrQvtGA0YDQtdC60YLQvdGL0Lkg0L7QsdGK0LXQutGCINC00LDRgtGLJyA6XHJcbiAgICAgICAgICAhcmVzdHJpY3Rpb24gPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJ1xyXG4gICAgICAgICAgICA6ICfQn9C10YDQtdC00LDQvSDQvdC10LLQsNC70LjQtNC90YvQuSDQvtCx0YzQtdC60YIgcmVzdHJpY3Rpb25zJyk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIGNvbnN0IGNvbXBhbnlMb2NhbFRpbWVab25lID0gVGltZVpvbmVJZGVudGlmaWVyLmdldFRpbWVab25lR01UT2Zmc2V0ZnJvbU5hbWVab25lKHJlc3RyaWN0aW9uLnRpbWV6b25lKS5zcGxpdCgnOicpO1xyXG4gICAgICBjb25zdCBjb21wYW55TG9jYWxUaW1lWm9uZURlbHRhID0gK2NvbXBhbnlMb2NhbFRpbWVab25lWzBdICogNjAgKyAoKyhjb21wYW55TG9jYWxUaW1lWm9uZVsxXSkpO1xyXG4gICAgICBjb25zdCBsb2thbFRpbWVEZWx0YSA9IGNvbXBhbnlMb2NhbFRpbWVab25lRGVsdGEgKyBjdXJyZW50ZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpOyAvLyDRgdC80LXRidC10L3QuNC1INCy0YDQtdC80LXQvdC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjyDQvtGC0L3QvtGB0LjRgtC10LvRjNC90L4g0LLRgNC10LzQtdC90Lgg0YLQvtGA0LPQvtCy0L7QuSDRgtC+0YfQutC4XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyhcclxuICAgICAgICA8VGltZVN0cmluZz5mb3JtYXREYXRlKGN1cnJlbnRkYXRlLCAnSEg6bW0nLCAnZW4nKVxyXG4gICAgICApICsgbG9rYWxUaW1lRGVsdGE7XHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDRgtC10LrRg9GJ0LXQtSDQstGA0LXQvNGPINCyINC80LjQvdGD0YLQsNGFINGBINC90LDRh9Cw0LvQsCDQtNC90Y8gKDYwMCA9IDEwOjAwLiAxMjAwID0gMjA6MDApXHJcbiAgICAgICAqINC10YHQu9C4INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC/0LXRgNC10L/RgNGL0LPQvdGD0Lsg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLCDRgtC+INC/0YDQuNCy0L7QtNC40Lwg0LLRgNC10LzRjyDQuiDQv9GA0LDQstC40LvRjNC90L7QvNGDINC30L3QsNGH0LXQvdC40Y4g0LIg0LTQuNCw0L/QsNC30L7QvdC1IDI0INGH0LDRgdC+0LJcclxuICAgICAgICogKi9cclxuICAgICAgY29uc3QgY3VycmVudFRpbWUgPSBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID4gMTQ0MCA/IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgLSAxNDQwIDogY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YTtcclxuXHJcbiAgICAgIGNvbnN0IGN1cnJlbnREYXlXb3JrVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldEN1cnJlbnRXb3JrVGltZShcclxuICAgICAgICByZXN0cmljdGlvbixcclxuICAgICAgICBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID4gMTQ0MCA/IG5ldyBEYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKSA6IGN1cnJlbnRkYXRlXHJcbiAgICAgICk7IC8vINGC0LXQutGD0YnQtdC1INGA0LDQsdC+0YfQtdC1INCy0YDQtdC80Y9cclxuICAgICAgY29uc3QgY3VyZW50RGF5U3RhcnRUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoPFRpbWVTdHJpbmc+Y3VycmVudERheVdvcmtUaW1lLnN0YXJ0KTsgLy8g0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YVcclxuICAgICAgY29uc3QgY3VyZW50RGF5U3RvcFRpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyg8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RvcCk7IC8vINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgd29ya05vdzogY3VycmVudFRpbWUgPCBjdXJlbnREYXlTdG9wVGltZSAmJiBjdXJyZW50VGltZSA+IGN1cmVudERheVN0YXJ0VGltZSxcclxuICAgICAgICBpc05ld0RheTogY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDAsXHJcbiAgICAgICAgY3VycmVudFRpbWUsXHJcbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lLFxyXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQlNC+0YHRgtCw0LLQutCwINC60YPRgNGM0LXRgNC+0LxcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgc3RhdGljIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGNoZWNrVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmlzV29ya05vdyhyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG5cclxuICAgIGlmIChjaGVja1RpbWUud29ya05vdyAmJiBjaGVja1RpbWUuY3VycmVudFRpbWUpIHtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCfQodC10LnRh9Cw0YEg0YDQsNCx0L7Rh9C10LUg0LLRgNC10LzRjy4g0KDQsNGB0YfQtdGCINC90LUg0YLRgNC10LHRg9C10YLRgdGPLicpO1xyXG4gICAgICBjb25zdCBwb3NzaWJsZVRpbWUgPSBjaGVja1RpbWUuY3VycmVudFRpbWUgKyAoK3Jlc3RyaWN0aW9uLm1pbkRlbGl2ZXJ5VGltZUluTWludXRlcyB8fCAwKTtcclxuICAgICAgY29uc3QgcG9zc2libGVUaW1lU3RyID0gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUocG9zc2libGVUaW1lKTtcclxuICAgICAgcmV0dXJuIGZvcm1hdERhdGUoY3VycmVudGRhdGUsIGB5eXl5LU1NLWRkICR7cG9zc2libGVUaW1lU3RyfWAsICdlbicpXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgaWYgKGNoZWNrVGltZS5jdXJyZW50VGltZSAmJiBjaGVja1RpbWUuY3VyZW50RGF5U3RvcFRpbWUpIHtcclxuXHJcbiAgICAgICAgY29uc3QgY3VycmVudERheVdvcmtUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxyXG4gICAgICAgICAgcmVzdHJpY3Rpb24sXHJcbiAgICAgICAgICBjaGVja1RpbWUuaXNOZXdEYXkgPyBuZXcgRGF0ZShjdXJyZW50ZGF0ZS5nZXRUaW1lKCkgKyA4NjQwMDAwMCkgOiBjdXJyZW50ZGF0ZVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc3QgdGltZSA9IHRoaXMuZ2V0VGltZUZyb21TdHJpbmcoPFRpbWVTdHJpbmc+Y3VycmVudERheVdvcmtUaW1lLnN0YXJ0KSArICgrcmVzdHJpY3Rpb24ubWluRGVsaXZlcnlUaW1lSW5NaW51dGVzKTtcclxuICAgICAgICBjb25zdCB0aW1lU3RyaW5nID0gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUodGltZSk7XHJcbiAgICAgICAgcmV0dXJuIGZvcm1hdERhdGUoXHJcbiAgICAgICAgICBjaGVja1RpbWUuaXNOZXdEYXkgfHwgY2hlY2tUaW1lLmN1cnJlbnRUaW1lID4gY2hlY2tUaW1lLmN1cmVudERheVN0b3BUaW1lID8gKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKSA6IGN1cnJlbnRkYXRlLFxyXG4gICAgICAgICAgYHl5eXktTU0tZGQgJHt0aW1lU3RyaW5nfWAsXHJcbiAgICAgICAgICAnZW4nKTtcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIHRocm93ICfQndC1INGD0LTQsNC70L7RgdGMINGA0LDRgdGB0YfQuNGC0LDRgtGMIGN1cnJlbnRUaW1lINC4IGN1cmVudERheVN0b3BUaW1lLic7XHJcblxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0KHQsNC80L7QstGL0LLQvtC3XCIuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIC8qKlxyXG4gICAgICog0JTQu9GPINC+0LHQtdGB0L/QtdGH0LXQvdC40Y8g0LjQvNC80YPRgtCw0LHQtdC70YzQvdC+0YHRgtC4INC00LDQvdC90YvRhSDRgdC+0LfQtNCw0LXRgtGB0Y8g0L3QvtCy0YvQuSDQvtCx0YzQtdC60YIgcmVzdHJpY3Rpb25zLCDQuNC00LXQvdGC0LjRh9C90YvQuSDQv9C+0LvRg9GH0LXQvdC90L7QvNGDINCyINC/0LDRgNCw0LzQtdGC0YDQsNGFLCDQvdC+INGBINC40LfQvNC10L3QtdC90L3Ri9C8INC80LDRgdGB0LjQstC+0Lwgd29ya3RpbWUuXHJcbiAgICAgKiDQkiDQvNCw0YHRgdC40LLQtSB3b3JrdGltZSDQvtCx0L3QvtCy0LvRj9GO0YLRgdGPINC+0LPRgNCw0L3QuNGH0LXQvdC40Y8g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINGBINC+0LHRi9GH0L3Ri9GFINC90LAg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQu9GPINGB0LDQvNC+0LLRi9Cy0L7Qt9CwLlxyXG4gICAgICogKi9cclxuICAgIGNvbnN0IG5ld1Jlc3RyaWN0aW9uID0ge1xyXG4gICAgICAuLi5yZXN0cmljdGlvbiwgd29ya3RpbWU6ICg8V29ya1RpbWVbXT5yZXN0cmljdGlvbi53b3JrdGltZSkubWFwKHdvcmt0aW1lID0+IHdvcmt0aW1lLnNlbGZTZXJ2aWNlID8gKHsgLi4ud29ya3RpbWUsIC4uLndvcmt0aW1lLnNlbGZTZXJ2aWNlIH0pIDogd29ya3RpbWUpXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShuZXdSZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCw0LrRgtGD0LDQu9GM0L3Ri9C1INC00LDQvdC90YvQtSDQviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0LjQtyDQvNCw0YHRgdC40LLQsCDQstGB0LXRhSDQstCw0YDQuNCw0L3RgtC+0LIg0L7QsdGM0LXQutGC0LAgcmVzdHJpY3Rpb24uXHJcbiAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAqL1xyXG4gIHN0YXRpYyBnZXRDdXJyZW50V29ya1RpbWUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucywgY3VycmVudGRhdGU6IERhdGUpOiBXb3JrVGltZSB7XHJcbiAgICBsZXQgaSA9IDA7XHJcbiAgICBsZXQgcmVzdWx0ID0gbnVsbDtcclxuICAgIHdoaWxlIChpIDwgcmVzdHJpY3Rpb24ud29ya3RpbWUubGVuZ3RoICYmICFyZXN1bHQpIHtcclxuICAgICAgaWYgKHJlc3RyaWN0aW9uLndvcmt0aW1lW2ldLmRheU9mV2VlayA9PT0gJ2FsbCcgfHwgKFxyXG4gICAgICAgIHR5cGVvZiByZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWsgPT09ICdzdHJpbmcnID9cclxuICAgICAgICAgICg8c3RyaW5nPnJlc3RyaWN0aW9uLndvcmt0aW1lW2ldLmRheU9mV2VlaykudG9Mb3dlckNhc2UoKSA6XHJcbiAgICAgICAgICAoPHN0cmluZ1tdPnJlc3RyaWN0aW9uLndvcmt0aW1lW2ldLmRheU9mV2VlaykubWFwKGRheSA9PiBkYXkudG9Mb3dlckNhc2UoKSlcclxuICAgICAgKS5pbmNsdWRlcyhmb3JtYXREYXRlKGN1cnJlbnRkYXRlLCAnRUVFRScsICdlbicpLnRvTG93ZXJDYXNlKCkpKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gcmVzdHJpY3Rpb24ud29ya3RpbWVbaV07XHJcbiAgICAgIH1cclxuICAgICAgaSArPSAxO1xyXG4gICAgfVxyXG4gICAgaWYgKCFyZXN1bHQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCfQndC10YIg0LDQutGC0YPQsNC70YzQvdC+0LPQviDRgNCw0YHQv9C40YHQsNC90LjRjyDRgNCw0LHQvtGC0Ysg0LTQu9GPINGC0LXQutGD0YnQtdCz0L4g0LTQvdGPJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiDQm9C+0LPQuNC60LAg0L3QuNC20LUg0L/RgNC10LTQvdCw0LfQvdCw0YfQtdC90LAg0LTQu9GPINC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPINGN0LrQt9C10LzQv9C70Y/RgNCwINC60LvQsNGB0YHQsCBXb3JrVGltZVZhbGlkYXRvciBcclxuICAqL1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHsgfVxyXG5cclxuICBwcml2YXRlIF9tZW1vcnk6IHtcclxuICAgIGdldE1heE9yZGVyRGF0ZTogTWFwPHN0cmluZywgc3RyaW5nPjtcclxuICAgIGdldFRpbWVGcm9tU3RyaW5nOiBNYXA8c3RyaW5nLCBudW1iZXI+O1xyXG4gICAgaXNXb3JrTm93OiBNYXA8c3RyaW5nLCBWYWxpZGF0b3JSZXN1bHQ+O1xyXG4gICAgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xyXG4gICAgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWU6IE1hcDxzdHJpbmcsIHN0cmluZz47XHJcbiAgICBnZXRDdXJyZW50V29ya1RpbWU6IE1hcDxzdHJpbmcsIFdvcmtUaW1lPjtcclxuICAgIGNvbnZlcnRNaW51dGVzVG9UaW1lOiBNYXA8c3RyaW5nLCBUaW1lU3RyaW5nPlxyXG4gIH0gPSB7XHJcbiAgICAgIGdldE1heE9yZGVyRGF0ZTogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKSxcclxuICAgICAgZ2V0VGltZUZyb21TdHJpbmc6IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCksXHJcbiAgICAgIGlzV29ya05vdzogbmV3IE1hcDxzdHJpbmcsIFZhbGlkYXRvclJlc3VsdD4oKSxcclxuICAgICAgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxyXG4gICAgICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZTogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKSxcclxuICAgICAgZ2V0Q3VycmVudFdvcmtUaW1lOiBuZXcgTWFwPHN0cmluZywgV29ya1RpbWU+KCksXHJcbiAgICAgIGNvbnZlcnRNaW51dGVzVG9UaW1lOiBuZXcgTWFwPHN0cmluZywgVGltZVN0cmluZz4oKVxyXG4gICAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgywg0L3QsCDQutC+0YLQvtGA0YPRjiDQvNC+0LbQvdC+INC30LDQutCw0LfQsNGC0Ywg0LTQvtGB0YLQsNCy0LrRgy5cclxuICAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAgKiBAcmV0dXJuIDpzdHJpbmcgLSDQodGC0YDQvtC60LAsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidCw0Y8g0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINC00L7RgdGC0YPQv9C90YPRjiDQtNCw0YLRgyDQtNC+0YHRgtCw0LLQutC4INCyINGE0L7RgNC80LDRgtC1IHl5eXktTU0tZGQuXHJcbiAgICAqL1xyXG4gIGdldE1heE9yZGVyRGF0ZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0TWF4T3JkZXJEYXRlLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldE1heE9yZGVyRGF0ZShyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0TWF4T3JkZXJEYXRlLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INGB0YfQuNGC0LDQtdGCLCDRgdC60L7Qu9GM0LrQviDQvNC40L3Rg9GCINC+0YIg0L3QsNGH0LDQu9CwINC00L3RjyAoMDA6MDApINC/0YDQvtGI0LvQviDQtNC70Y8g0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQstGA0LXQvNC10L3QuC5cclxuICAgKiBAcGFyYW0gdGltZSAtINGB0YLRgNC+0LrQsCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtINCy0YDQtdC80Y8uXHJcbiAgICogQHJldHVybiA6bnVtYmVyIC0g0LrQvtC7LdCy0L4g0LzQuNC90YPRgi5cclxuICAgKi9cclxuICBnZXRUaW1lRnJvbVN0cmluZyh0aW1lOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyB0aW1lIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0VGltZUZyb21TdHJpbmcuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoPFRpbWVTdHJpbmc+dGltZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRUaW1lRnJvbVN0cmluZy5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQv9GA0L7QstC10YDRj9C10YIsINC00L7RgdGC0YPQv9C90LAg0LvQuCDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60Lgg0L3QsCDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRjy5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPLCDQtNC70Y8g0LrQvtGC0L7RgNGL0YUg0Lgg0L/RgNC+0LLQtdGA0Y/QtdGC0YHRjyDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60LhcclxuICAgKiBAcmV0dXJuINCe0LHRjNC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y46XHJcbiAgICoge1xyXG4gICAgICAgIGlzV29ya05vdzpib29sZWFuIC0g0JLQvtC30LzQvtC20L3QsCDQu9C4INC00L7RgdGC0LDQstC60LAg0LIg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y9cclxuICAgICAgICBpc05ld0RheTpib29sZWFuIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC40LfQvdCw0LosINGH0YLQviDQuNC3LdC30LAg0YDQsNC30L3QuNGG0Ysg0YfQsNGB0L7QstGL0YUg0L/QvtGP0YHQvtCyINGA0LDRgdGH0LXRgiDQtNCw0YLRiyBcItC/0LXRgNC10L/RgNGL0LPQvdGD0LtcIiDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwuXHJcbiAgICAgICAgY3VycmVudFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC+0LLQtdGA0Y/QtdC80L7QtSDQvNC10YLQvtC00L7QvCDQstGA0LXQvNGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICAgIGN1cmVudERheVN0YXJ0VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgfVxyXG4gICAqL1xyXG4gIGlzV29ya05vdyhyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zIHwgUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlPzogRGF0ZSk6IFZhbGlkYXRvclJlc3VsdCB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmlzV29ya05vdy5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5pc1dvcmtOb3cocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmlzV29ya05vdy5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0JTQvtGB0YLQsNCy0LrQsCDQutGD0YDRjNC10YDQvtC8XCIuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQodCw0LzQvtCy0YvQstC+0LdcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCw0LrRgtGD0LDQu9GM0L3Ri9C1INC00LDQvdC90YvQtSDQviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0LjQtyDQvNCw0YHRgdC40LLQsCDQstGB0LXRhSDQstCw0YDQuNCw0L3RgtC+0LIg0L7QsdGM0LXQutGC0LAgcmVzdHJpY3Rpb24uXHJcbiAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAqL1xyXG4gIGdldEN1cnJlbnRXb3JrVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IFdvcmtUaW1lIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0Q3VycmVudFdvcmtUaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiA8V29ya1RpbWU+Y2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldEN1cnJlbnRXb3JrVGltZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINC/0LXRgNC10LTQsNC90L3QvtC1INC60L7Quy3QstC+INC80LjQvdGD0YIg0LIg0YHRgtGA0L7QutC+0LLQtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtIGAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYC5cclxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxyXG4gICAqIFxyXG4gICAqIGNvbnN0IGEgPSBjb252ZXJ0TWludXRlc1RvVGltZSg1MCkgLy8gYSA9ICcwMDo1MCdcclxuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTIwMCkgLy8gYiA9ICcyMDowMCdcclxuICAgKiBcclxuICAgKiBAcGFyYW0gdGltZSAtINCn0LjRgdC70L4g0LIg0LTQuNCw0L/QsNC30L7QvdC1INC+0YIgMCDQtNC+IDE0NDAgKNGC0LDQuiDQutCw0Log0LzQsNC60YHQuNC80YPQvCDQsiAxINGB0YPRgtC60LDRhSA9IDE0NDAg0LzQuNC90YPRgikuXHJcbiAgICog0J/RgNC4INC/0LXRgNC10LTQsNGH0LUg0LIgdGltZSDQvtGC0YDQuNGG0LDRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8sINC30L3QsNC6INCx0YPQtNC10YIgXCLQvtGC0L7QsdGA0YjQtdC9XCIsINCwINC00LvRjyDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIsINGA0LDRgdGB0YfQuNGC0LDQvdC90YvQuSDQtNC70Y8g0L/QvtC70YPRh9C10L3QvdC+0LPQviDQv9C+0LvQvtC20LjRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8uXHJcbiAgICog0JXRgdC70Lgg0LIgdGltZSDQsdGD0LTQtdGCINC/0LXRgNC10LTQsNC90L4g0LfQvdCw0YfQtdC90LjQtSDQsdC+0LvRjNGI0LUgMTQ0MCAtINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiDQtNC70Y8g0LfQvdCw0YfQtdC90LjRjyDQsdC10Lcg0YPRh9C10YLQsCBcItC/0YDQtdCy0YvRiNCw0Y7RidC40YUg0YHRg9GC0L7QulwiICjRgi7QtS4g0YEg0LrRgNCw0YLQvdGL0Lwg0LLRi9GH0LXRgtC+0LwgMTQ0MCDQvNC40L3Rg9GCKVxyXG4gICAqIFxyXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XHJcbiAgICogXHJcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDYwKSAvLyBhID0gJzAxOjAwJyBcclxuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTUwMCkgLy8gYiA9ICcwMTowMCcgKDE0NDAg0LzQuNC90YPRgiBcItGG0LXQu9GL0YVcIiDRgdGD0YLQvtC6INCx0YvQu9C4IFwi0L7RgtCx0YDQvtGI0LXQvdGLXCIpXHJcbiAgICogXHJcbiAgICogQHJldHVybnMgXHJcbiAgICovXHJcbiAgY29udmVydE1pbnV0ZXNUb1RpbWUodGltZTogbnVtYmVyKTogVGltZVN0cmluZyB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHRpbWUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5jb252ZXJ0TWludXRlc1RvVGltZS5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmNvbnZlcnRNaW51dGVzVG9UaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufVxyXG4iXX0=