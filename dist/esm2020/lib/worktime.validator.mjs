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
     * @return :string - Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sTUFBTSxDQUFDO0FBK0YxQzs7O0dBR0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLFdBQW9CO0lBRTlDLE9BQU8sT0FBTyxXQUFXLEtBQUssUUFBUSxJQUFJLFdBQVcsS0FBSyxJQUFJLElBQUksVUFBVSxJQUFJLFdBQVcsSUFBSSxVQUFVLElBQUksV0FBVyxDQUFDO0FBRTNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHVCQUF1QixDQUFDLFdBQThCO0lBRTdELE9BQU8sMEJBQTBCLElBQUksV0FBVyxJQUFJLDBCQUEwQixJQUFJLFdBQVcsSUFBSSxVQUFVLElBQUksV0FBVyxJQUFJLFVBQVUsSUFBSSxXQUFXLENBQUM7QUFFMUosQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQUM1Qjs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUE4QixFQUFFLFdBQWlCO1FBQ3RFLElBQUksV0FBVyxJQUFJLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUU5RSxPQUFPLFVBQVUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsV0FBVyxDQUFDLHdCQUF3QixHQUFHLEtBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FFN0c7YUFBTTtZQUVMLE1BQU0sSUFBSSxLQUFLLENBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLG1DQUFtQyxDQUFDLENBQUM7Z0JBQ3JDLENBQUMsV0FB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LENBQUM7SUFFRjs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FpQkc7SUFDSCxvQkFBb0IsQ0FBQyxJQUFZO1FBQy9CLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLElBQUksV0FBVyxFQUFFO1lBQ2YsT0FBTyxXQUFXLENBQUM7U0FDcEI7YUFBTTtZQUNMLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6RCxPQUFPLE1BQU0sQ0FBQztTQUNmO0lBQ0gsQ0FBQztDQUVGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZm9ybWF0RGF0ZSwgaXNEYXRlIH0gZnJvbSAnLi9mb3JtYXREYXRlJztcclxuaW1wb3J0IHsgVGltZVpvbmVJZGVudGlmaWVyIH0gZnJvbSAnLi90eic7XHJcblxyXG4vKipcclxuICog0JHQsNC30L7QstGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyAtINGB0LvRg9C20LXQsdC90YvQuSDQuNC90YLQtdGA0YTQtdC50YEuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtUaW1lQmFzZSB7XHJcbiAgLyoqINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cclxuICBzdGFydDogc3RyaW5nO1xyXG5cclxuICAvKiog0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8qL1xyXG4gIHN0b3A6IHN0cmluZztcclxuXHJcbiAgLyoqINC/0LXRgNC10YDRi9CyINC90LAg0L7QsdC10LQqL1xyXG4gIGJyZWFrPzogc3RyaW5nO1xyXG59XHJcblxyXG4vKipcclxuICog0JjQvdGE0L7RgNC80LDRhtC40Y8g0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gLSDRgdC70YPQttC10LHQvdGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBXb3JrVGltZSBleHRlbmRzIFdvcmtUaW1lQmFzZSB7XHJcbiAgLyoqINC00LXQvdGMINC90LXQtNC10LvQuCwg0Log0LrQvtGC0L7RgNC+0LzRgyDQv9GA0LjQvNC10L3Rj9C10YLRgdGPINGN0YLQviDQstGA0LXQvNGPINC00L7RgdGC0LDQstC60LggICAqL1xyXG4gIGRheU9mV2Vlazogc3RyaW5nIHwgc3RyaW5nW107XHJcblxyXG4gIC8qKiDQvtCz0YDQsNC90LjRh9C10L3QuNGPINC/0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC00LvRjyDRgdCw0LzQvtCy0YvQstC+0LfQsCAqL1xyXG4gIHNlbGZTZXJ2aWNlPzogV29ya1RpbWVCYXNlO1xyXG59XHJcblxyXG4vKipcclxuICog0JjQvdGC0LXRgNGE0LXQudGBINC+0LHRitC10LrRgtCwLCDQv9C+0LvRg9GH0LDQtdC80L7Qs9C+INC+0YIgQVBJIEB3ZWJyZXN0by9jb3JlINC4INGB0L7QtNC10YDQttCw0YnQtdCz0L4g0YLQtdC60YPRidC40LUg0LTQsNC90L3Ri9C1INC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y9cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVzdHJpY3Rpb25zIHtcclxuICAvKiog0LLRgNC10LzQtdC90L3QsNGPINC30L7QvdCwINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cclxuICB0aW1lem9uZT86IHN0cmluZztcclxuXHJcbiAgLyoqICDQvNCw0YHRgdC40LIg0L7Qs9GA0LDQvdC40YfQtdC90LjQuSDQv9C+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC00LvRjyDRgNCw0LfQvdGL0YUg0LTQvdC10Lkg0L3QtdC00LXQu9C4LiAqL1xyXG4gIHdvcmt0aW1lOiBXb3JrVGltZVtdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEh0bWxGb3JtRmllbGQge1xyXG4gIGlkOiBzdHJpbmdcclxuICB0eXBlOiBzdHJpbmdcclxuICBsYWJlbDogc3RyaW5nXHJcbiAgZGVzY3JpcHRpb246IHN0cmluZ1xyXG4gIHJlcXVpcmVkOiBCb29sZWFuXHJcbiAgcmVnZXg6IHN0cmluZ1xyXG59XHJcblxyXG4vKiog0JTQsNC90L3Ri9C1INC+INC80L7QtNC10LvQuCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC90LAg0YHQsNC50YLQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgVXNlclJlc3RyaWN0aW9ucyB7XHJcbiAgLyoqINCf0L7QutCw0LfRi9Cy0LDQtdGCLCDQutCw0LrQvtC5INCy0LjQtCDQtNCw0L3QvdGL0YUg0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC8INC00LvRjyDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4ICovXHJcbiAgbG9naW5GaWVsZDogc3RyaW5nXHJcblxyXG4gIGN1c3RvbUZpZWxkcz86IEh0bWxGb3JtRmllbGRbXSB8IG51bGxcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZXN0cmljdGlvbnNPcmRlciBleHRlbmRzIFJlc3RyaWN0aW9ucyB7XHJcbiAgLyoqINC80LjQvdC40LzQsNC70YzQvdC+0LUg0LLRgNC10LzRjyDQtNC+0YHRgtCw0LLQutC4Ki9cclxuICBtaW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXM6IHN0cmluZztcclxuXHJcbiAgLyoqINC+0LPRgNCw0L3QuNGH0LXQvdC40LUg0LzQsNC60YHQuNC80LDQu9GM0L3QvtC5INC00LDRgtGLINC30LDQutCw0LfQsCDQsiDQsdGD0LTRg9GJ0LXQvCAo0LIg0LzQuNC90YPRgtCw0YUpKi9cclxuICBwb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXM6IG51bWJlcjtcclxuXHJcbiAgLyoqICDRg9GB0YLQsNC90L7QstC70LXQvdC+INC70Lgg0L3QsCDRgtC10LrRg9GJ0LjQuSDQvNC+0LzQtdC90YIg0L7Qs9GA0LDQvdC40YfQtdC90LjQtSDQtNC+0YHRgtCw0LLQutC4INC90LAg0L7Qv9GA0LXQtNC10LvQtdC90L3QvtC1INCy0YDQtdC80Y8gKi9cclxuICBkZWxpdmVyeVRvVGltZUVuYWJsZWQ/OiBib29sZWFuO1xyXG5cclxuICAvKiog0JTQvtC/0L7Qu9C90LjRgtC10LvRjNC90YvQuSDQutC+0LzQvNC10L3RgtCw0YDQuNC5INC/0L4g0LTQvtGB0YLQsNCy0LrQtSAqL1xyXG4gIGRlbGl2ZXJ5RGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcblxyXG4gIC8qKiDQoNCw0LfQvdC+0LLQuNC00L3QvtGB0YLRjCDQstCy0L7QtNC40LzQvtC5INC60LDQv9GH0LggKi9cclxuICBjYXB0Y2hhVHlwZT86IHN0cmluZyB8IG51bGxcclxuXHJcbiAgLyoqINCU0LDQvdC90YvQtSDQviDQvNC+0LTQtdC70Lgg0LDQstGC0L7RgNC40LfQsNGG0LjQuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70LXQuSDQvdCwINGB0LDQudGC0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyAqL1xyXG4gIHVzZXI/OiBVc2VyUmVzdHJpY3Rpb25zIHwgbnVsbFxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFZhbGlkYXRvclJlc3VsdCB7XHJcbiAgd29ya05vdzogYm9vbGVhbixcclxuICBpc05ld0RheT86IGJvb2xlYW4sXHJcbiAgY3VycmVudFRpbWU/OiBudW1iZXIsXHJcbiAgY3VyZW50RGF5U3RhcnRUaW1lPzogbnVtYmVyLFxyXG4gIGN1cmVudERheVN0b3BUaW1lPzogbnVtYmVyXHJcbn1cclxuXHJcbi8qKiDQotC40L8sINC+0L/QuNGB0YvQstCw0Y7RidC40Lkg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YHQtdGFINGG0LjRhNGAICovXHJcbnR5cGUgRGlnaXRzID0gJzAnIHwgJzEnIHwgJzInIHwgJzMnIHwgJzQnIHwgJzUnIHwgJzYnIHwgJzcnIHwgJzgnIHwgJzknO1xyXG5cclxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUgMjQg0YfQsNGB0L7QsiDQvtC00L3QuNGFINGB0YPRgtC+0LogKi9cclxuZXhwb3J0IHR5cGUgSG91cnNEaWdpdHMgPSAnMDAnIHwgJzAxJyB8ICcwMicgfCAnMDMnIHwgJzA0JyB8ICcwNScgfCAnMDYnIHwgJzA3JyB8ICcwOCcgfCAnMDknIHwgJzEwJyB8ICcxMScgfCAnMTInIHwgJzEzJyB8ICcxNCcgfCAnMTUnIHwgJzE2JyB8ICcxNycgfCAnMTgnIHwgJzE5JyB8ICcyMCcgfCAnMjEnIHwgJzIyJyB8ICcyMyc7XHJcblxyXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSA2MCDQvNC40L3Rg9GCINC+0LTQvdC+0LPQviDRh9Cw0YHQsCovXHJcbmV4cG9ydCB0eXBlIE1pbnV0ZURpZ2l0cyA9IGAkeycwJyB8ICcxJyB8ICcyJyB8ICczJyB8ICc0JyB8ICc1J30ke0RpZ2l0c31gO1xyXG5cclxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLWAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYCAqL1xyXG5leHBvcnQgdHlwZSBUaW1lU3RyaW5nID0gYCR7SG91cnNEaWdpdHN9OiR7TWludXRlRGlnaXRzfWA7XHJcblxyXG4vKipcclxuICog0KTRg9C90LrRhtC40Y8g0LLQsNC70LjQtNCw0YbQuNC4INC/0LXRgNC10LTQsNC90L3QvtCz0L4g0L7QsdGK0LXQutGC0LAgcmVzdHJpY3Rpb24g0L3QsCDRgdC+0L7RgtCy0LXRgtGB0YLQstC40LUg0LjQvdGC0LXRgNGE0LXQudGB0YMgUmVzdHJpY3Rpb25zXHJcbiAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC/0YDQvtCy0LXRgNGP0LXQvNGL0Lkg0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQuCDQstGA0LXQvNC10L3QvdC+0Lkg0LfQvtC90LUuXHJcbiAqL1xyXG5mdW5jdGlvbiBpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb246IHVua25vd24pOiByZXN0cmljdGlvbiBpcyBSZXN0cmljdGlvbnMge1xyXG5cclxuICByZXR1cm4gdHlwZW9mIHJlc3RyaWN0aW9uID09PSAnb2JqZWN0JyAmJiByZXN0cmljdGlvbiAhPT0gbnVsbCAmJiAndGltZXpvbmUnIGluIHJlc3RyaWN0aW9uICYmICd3b3JrdGltZScgaW4gcmVzdHJpY3Rpb247XHJcblxyXG59XHJcblxyXG4vKipcclxuICog0KTRg9C90LrRhtC40Y8g0LLQsNC70LjQtNCw0YbQuNC4INC/0LXRgNC10LTQsNC90L3QvtCz0L4g0L7QsdGK0LXQutGC0LAgcmVzdHJpY3Rpb24g0L3QsCDRgdC+0L7RgtCy0LXRgtGB0YLQstC40LUg0LzQuNC90LjQvNCw0LvRjNC90YvQvCDQtNCw0L3QvdGL0Lwg0LTQu9GPINC30LDQutCw0LfQsFxyXG4gKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAqL1xyXG5mdW5jdGlvbiBpc1ZhbGlkUmVzdHJpY3Rpb25PcmRlcihyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIpOiByZXN0cmljdGlvbiBpcyBSZXN0cmljdGlvbnNPcmRlciB7XHJcblxyXG4gIHJldHVybiAnbWluRGVsaXZlcnlUaW1lSW5NaW51dGVzJyBpbiByZXN0cmljdGlvbiAmJiAncG9zc2libGVUb09yZGVySW5NaW51dGVzJyBpbiByZXN0cmljdGlvbiAmJiAndGltZXpvbmUnIGluIHJlc3RyaWN0aW9uICYmICd3b3JrdGltZScgaW4gcmVzdHJpY3Rpb247XHJcblxyXG59XHJcblxyXG4vKipcclxuICog0JrQu9Cw0YHRgSwg0YHQvtC00LXRgNC20LDRidC40Lkg0YHRgtCw0YLQuNGH0LXRgdC60LjQtSDQvNC10YLQvtC00YssINC90LXQvtCx0YXQvtC00LjQvNGL0LUg0LTQu9GPINGA0LDQsdC+0YLRiyDRgSDQvtCz0YDQsNC90LjRh9C10L3QuNGP0LzQuCDRgNCw0LHQvtGH0LXQs9C+INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAqINCh0L7Qt9C00LDQstCw0YLRjCDQvdC+0LLRi9C5INGN0LrQt9C10LzQv9C70Y/RgCDRjdGC0L7Qs9C+INC60LvQsNGB0YHQsCDQtNC70Y8g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8g0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7QsiDQvdC1INGC0YDQtdCx0YPQtdGC0YHRjy5cclxuICogXHJcbiAqINCf0YDQuCDRjdGC0L7QvCDQv9GA0Lgg0YHQvtC30LTQsNC90LjQuCDRjdC60LfQtdC80L/Qu9GP0YDQsCDQutC70LDRgdGB0LAg0YMg0L7QsdGK0LXQutGC0LAg0YLQsNC60LbQtSDQsdGD0LTRg9GCINC00L7RgdGC0YPQv9C90Ysg0YHQvtCx0YHRgtCy0LXQvdC90YvQtSDRgNC10LDQu9C40LfQsNGG0LjQuCBcclxuICog0LLRgdC10YUg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7Qsi5cclxuICog0K3RgtC4INGA0LXQsNC70LjQt9Cw0YbQuNC4INC+0YLQu9C40YfQsNGO0YLRgdGPINC+0YIg0LLRi9C30L7QstC+0LIg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7QsiDRgtC+0LvRjNC60L4g0LzQtdC80L7QuNC30LDRhtC40LXQuSDQstGL0L/QvtC70L3QtdC90L3Ri9GFINGA0LDRgdGH0LXRgtC+0LIuXHJcbiAqIFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFdvcmtUaW1lVmFsaWRhdG9yIHtcclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMsINC90LAg0LrQvtGC0L7RgNGD0Y4g0LzQvtC20L3QviDQt9Cw0LrQsNC30LDRgtGMINC00L7RgdGC0LDQstC60YMuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEByZXR1cm4gOnN0cmluZyAtINCh0YLRgNC+0LrQsCwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LDRjyDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LTQvtGB0YLRg9C/0L3Rg9GOINC00LDRgtGDINC00L7RgdGC0LDQstC60Lgg0LIg0YTQvtGA0LzQsNGC0LUgeXl5eS1NTS1kZC5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0TWF4T3JkZXJEYXRlKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgaWYgKHJlc3RyaWN0aW9uICYmIGlzVmFsaWRSZXN0cmljdGlvbk9yZGVyKHJlc3RyaWN0aW9uKSAmJiBpc0RhdGUoY3VycmVudGRhdGUpKSB7XHJcblxyXG4gICAgICByZXR1cm4gZm9ybWF0RGF0ZShjdXJyZW50ZGF0ZS5nZXRUaW1lKCkgKyByZXN0cmljdGlvbi5wb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXMgKiA2MDAwMCwgJ3l5eXktTU0tZGQnLCAnZW4nKTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgIGlzRGF0ZShjdXJyZW50ZGF0ZSkgP1xyXG4gICAgICAgICAgJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LrQvtGA0YDQtdC60YLQvdGL0Lkg0L7QsdGK0LXQutGCINC00LDRgtGLJyA6XHJcbiAgICAgICAgICAhcmVzdHJpY3Rpb24gPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJyA6XHJcbiAgICAgICAgICAgICfQn9C10YDQtdC00LDQvSDQvdC10LLQsNC70LjQtNC90YvQuSDQvtCx0YzQtdC60YIgcmVzdHJpY3Rpb25zJ1xyXG4gICAgICApO1xyXG5cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0YHRgtGA0L7QutCwINCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC1gKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAgLSDQstGA0LXQvNGPLlxyXG4gICAqIEByZXR1cm4g0LrQvtC7LdCy0L4g0LzQuNC90YPRgi5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0VGltZUZyb21TdHJpbmcodGltZTogVGltZVN0cmluZyk6IG51bWJlciB7XHJcbiAgICBpZiAoIXRpbWUpIHtcclxuXHJcbiAgICAgIHRocm93ICfQndC1INC/0LXRgNC10LTQsNC90LAg0YHRgtGA0L7QutCwINGBINC/0YDQtdC+0LHRgNCw0LfRg9C10LzRi9C8INCy0YDQtdC80LXQvdC10Lwg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0nO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICBjb25zdCByZWdFeHAgPSBuZXcgUmVnRXhwKC9eKDAwfDAxfDAyfDAzfDA0fDA1fDA2fDA3fDA4fDA5fDEwfDExfDEyfDEzfDE0fDE1fDE2fDE3fDE4fDE5fDIwfDIxfDIyfDIzKSs6KFswLTVdXFxkKSsvKTtcclxuXHJcbiAgICAgIGlmIChyZWdFeHAudGVzdCh0aW1lKSkge1xyXG5cclxuICAgICAgICBsZXQgY2hlY2tlZFRpbWUgPSB0aW1lLnRyaW0oKTtcclxuICAgICAgICBpZiAoY2hlY2tlZFRpbWUuaW5jbHVkZXMoJyAnKSB8fCBjaGVja2VkVGltZS5pbmNsdWRlcygnVCcpKSB7XHJcblxyXG4gICAgICAgICAgY2hlY2tlZFRpbWUgPSBjaGVja2VkVGltZS5zcGxpdChjaGVja2VkVGltZS5pbmNsdWRlcygnICcpID8gJyAnIDogJ1QnKVsxXTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gKCtjaGVja2VkVGltZS5zcGxpdCgnOicpWzBdKSAqIDYwICsgKCtjaGVja2VkVGltZS5zcGxpdCgnOicpWzFdKTtcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIHRocm93ICfQn9C10YDQtdC00LDQvdC90LDRjyDRgdGC0YDQvtC60LAg0L3QtSDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0LXRgiDRhNC+0YDQvNCw0YLRgyBISDptbSAtYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgJ1xyXG5cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQutC+0L3QstC10YDRgtC40YDRg9C10YIg0L/QtdGA0LXQtNCw0L3QvdC+0LUg0LrQvtC7LdCy0L4g0LzQuNC90YPRgiDQsiDRgdGC0YDQvtC60L7QstC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YDQtdC80LXQvdC4INCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0gYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgLlxyXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XHJcbiAgICogXHJcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDUwKSAvLyBhID0gJzAwOjUwJ1xyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxMjAwKSAvLyBiID0gJzIwOjAwJ1xyXG4gICAqIFxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0KfQuNGB0LvQviDQsiDQtNC40LDQv9Cw0LfQvtC90LUg0L7RgiAwINC00L4gMTQ0MCAo0YLQsNC6INC60LDQuiDQvNCw0LrRgdC40LzRg9C8INCyIDEg0YHRg9GC0LrQsNGFID0gMTQ0MCDQvNC40L3Rg9GCKS5cclxuICAgKiDQn9GA0Lgg0L/QtdGA0LXQtNCw0YfQtSDQsiB0aW1lINC+0YLRgNC40YbQsNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjywg0LfQvdCw0Log0LHRg9C00LXRgiBcItC+0YLQvtCx0YDRiNC10L1cIiwg0LAg0LTQu9GPINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiwg0YDQsNGB0YHRh9C40YLQsNC90L3Ri9C5INC00LvRjyDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INC/0L7Qu9C+0LbQuNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjy5cclxuICAgKiDQldGB0LvQuCDQsiB0aW1lINCx0YPQtNC10YIg0L/QtdGA0LXQtNCw0L3QviDQt9C90LDRh9C10L3QuNC1INCx0L7Qu9GM0YjQtSAxNDQwIC0g0LzQtdGC0L7QtCDQstC10YDQvdC10YIg0YDQtdC30YPQu9GM0YLQsNGCINC00LvRjyDQt9C90LDRh9C10L3QuNGPINCx0LXQtyDRg9GH0LXRgtCwIFwi0L/RgNC10LLRi9GI0LDRjtGJ0LjRhSDRgdGD0YLQvtC6XCIgKNGCLtC1LiDRgSDQutGA0LDRgtC90YvQvCDQstGL0YfQtdGC0L7QvCAxNDQwINC80LjQvdGD0YIpXHJcbiAgICogXHJcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcclxuICAgKiBcclxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNjApIC8vIGEgPSAnMDE6MDAnIFxyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxNTAwKSAvLyBiID0gJzAxOjAwJyAoMTQ0MCDQvNC40L3Rg9GCIFwi0YbQtdC70YvRhVwiINGB0YPRgtC+0Log0LHRi9C70LggXCLQvtGC0LHRgNC+0YjQtdC90YtcIilcclxuICAgKiBcclxuICAgKiBAcmV0dXJucyBcclxuICAgKi9cclxuICBzdGF0aWMgY29udmVydE1pbnV0ZXNUb1RpbWUodGltZTogbnVtYmVyKTogVGltZVN0cmluZyB7XHJcblxyXG4gICAgaWYgKHRpbWUgPCAxNDQxKSB7XHJcblxyXG4gICAgICBjb25zdCBob3VyID0gTWF0aC5mbG9vcih0aW1lIC8gNjApO1xyXG4gICAgICBjb25zdCBob3VyU3RyOiBIb3Vyc0RpZ2l0cyA9IDxIb3Vyc0RpZ2l0cz4oaG91ciA8PSA5ID8gYDAke1N0cmluZyhob3VyKX1gIDogU3RyaW5nKGhvdXIpKTtcclxuICAgICAgY29uc3QgbWludXRlc1N0cjogTWludXRlRGlnaXRzID0gPE1pbnV0ZURpZ2l0cz5TdHJpbmcodGltZSAtIChob3VyICogNjApKTtcclxuICAgICAgcmV0dXJuIGAke2hvdXJTdHJ9OiR7bWludXRlc1N0cn1gO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICByZXR1cm4gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUodGltZSAtIDE0NDApO1xyXG5cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0L/RgNC+0LLQtdGA0Y/QtdGCLCDQtNC+0YHRgtGD0L/QvdCwINC70Lgg0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4INC90LAg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y8uXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjywg0LTQu9GPINC60L7RgtC+0YDRi9GFINC4INC/0YDQvtCy0LXRgNGP0LXRgtGB0Y8g0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4XHJcbiAgICogQHJldHVybiDQntCx0YzQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOOlxyXG4gICAqIHtcclxuICAgICAgICBpc1dvcmtOb3c6Ym9vbGVhbiAtINCS0L7Qt9C80L7QttC90LAg0LvQuCDQtNC+0YHRgtCw0LLQutCwINCyINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPXHJcbiAgICAgICAgaXNOZXdEYXk6Ym9vbGVhbiAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQuNC30L3QsNC6LCDRh9GC0L4g0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINGH0LDRgdC+0LLRi9GFINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0LTQsNGC0YsgXCLQv9C10YDQtdC/0YDRi9Cz0L3Rg9C7XCIg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLlxyXG4gICAgICAgIGN1cnJlbnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQvtCy0LXRgNGP0LXQvNC+0LUg0LzQtdGC0L7QtNC+0Lwg0LLRgNC10LzRjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgICAgY3VyZW50RGF5U3RvcFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgIH1cclxuICAgKi9cclxuICBzdGF0aWMgaXNXb3JrTm93KHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMgfCBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUgPSBuZXcgRGF0ZSgpKTogVmFsaWRhdG9yUmVzdWx0IHtcclxuXHJcbiAgICBpZiAoIXJlc3RyaWN0aW9uLndvcmt0aW1lIHx8ICFPYmplY3Qua2V5cyhyZXN0cmljdGlvbi53b3JrdGltZSkubGVuZ3RoKSB7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHdvcmtOb3c6IHRydWVcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyDQldGB0LvQuCDQuNGB0L/QvtC70YzQvdGP0LXRgtGB0Y8g0LIgTm9kZUpTXHJcbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICFyZXN0cmljdGlvbi50aW1lem9uZSkge1xyXG5cclxuICAgICAgcmVzdHJpY3Rpb24udGltZXpvbmUgPSBwcm9jZXNzLmVudi5UWiA/IHByb2Nlc3MuZW52LlRaIDogSW50bC5EYXRlVGltZUZvcm1hdCgpLnJlc29sdmVkT3B0aW9ucygpLnRpbWVab25lXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoIXJlc3RyaWN0aW9uIHx8ICFpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pKSB7XHJcblxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgIWlzRGF0ZShjdXJyZW50ZGF0ZSkgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnIDpcclxuICAgICAgICAgICFyZXN0cmljdGlvbiA/ICfQndC1INC/0LXRgNC10LTQsNC9INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnXHJcbiAgICAgICAgICAgIDogJ9Cf0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMnKTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgY29uc3QgY29tcGFueUxvY2FsVGltZVpvbmUgPSBUaW1lWm9uZUlkZW50aWZpZXIuZ2V0VGltZVpvbmVHTVRPZmZzZXRmcm9tTmFtZVpvbmUocmVzdHJpY3Rpb24udGltZXpvbmUpLnNwbGl0KCc6Jyk7XHJcbiAgICAgIGNvbnN0IGNvbXBhbnlMb2NhbFRpbWVab25lRGVsdGEgPSArY29tcGFueUxvY2FsVGltZVpvbmVbMF0gKiA2MCArICgrKGNvbXBhbnlMb2NhbFRpbWVab25lWzFdKSk7XHJcbiAgICAgIGNvbnN0IGxva2FsVGltZURlbHRhID0gY29tcGFueUxvY2FsVGltZVpvbmVEZWx0YSArIGN1cnJlbnRkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCk7IC8vINGB0LzQtdGJ0LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPINC+0YLQvdC+0YHQuNGC0LXQu9GM0L3QviDQstGA0LXQvNC10L3QuCDRgtC+0YDQs9C+0LLQvtC5INGC0L7Rh9C60LhcclxuICAgICAgY29uc3QgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxyXG4gICAgICAgIDxUaW1lU3RyaW5nPmZvcm1hdERhdGUoY3VycmVudGRhdGUsICdISDptbScsICdlbicpXHJcbiAgICAgICkgKyBsb2thbFRpbWVEZWx0YTtcclxuICAgICAgLyoqXHJcbiAgICAgICAqINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0YEg0L3QsNGH0LDQu9CwINC00L3RjyAoNjAwID0gMTA6MDAuIDEyMDAgPSAyMDowMClcclxuICAgICAgICog0LXRgdC70Lgg0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0L/QtdGA0LXQv9GA0YvQs9C90YPQuyDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwsINGC0L4g0L/RgNC40LLQvtC00LjQvCDQstGA0LXQvNGPINC6INC/0YDQsNCy0LjQu9GM0L3QvtC80YMg0LfQvdCw0YfQtdC90LjRjiDQsiDQtNC40LDQv9Cw0LfQvtC90LUgMjQg0YfQsNGB0L7QslxyXG4gICAgICAgKiAqL1xyXG4gICAgICBjb25zdCBjdXJyZW50VGltZSA9IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwID8gY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSAtIDE0NDAgOiBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhO1xyXG5cclxuICAgICAgY29uc3QgY3VycmVudERheVdvcmtUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxyXG4gICAgICAgIHJlc3RyaWN0aW9uLFxyXG4gICAgICAgIGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwID8gbmV3IERhdGUoY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDApIDogY3VycmVudGRhdGVcclxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0YDQsNCx0L7Rh9C10LUg0LLRgNC10LzRj1xyXG4gICAgICBjb25zdCBjdXJlbnREYXlTdGFydFRpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyg8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RhcnQpOyAvLyDRgtC10LrRg9GJ0LXQtSDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhVxyXG4gICAgICBjb25zdCBjdXJlbnREYXlTdG9wVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdG9wKTsgLy8g0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YVcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB3b3JrTm93OiBjdXJyZW50VGltZSA8IGN1cmVudERheVN0b3BUaW1lICYmIGN1cnJlbnRUaW1lID4gY3VyZW50RGF5U3RhcnRUaW1lLFxyXG4gICAgICAgIGlzTmV3RGF5OiBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID4gMTQ0MCxcclxuICAgICAgICBjdXJyZW50VGltZSxcclxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWUsXHJcbiAgICAgICAgY3VyZW50RGF5U3RvcFRpbWVcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCU0L7RgdGC0LDQstC60LAg0LrRg9GA0YzQtdGA0L7QvFwiLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY2hlY2tUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuaXNXb3JrTm93KHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcblxyXG4gICAgaWYgKGNoZWNrVGltZS53b3JrTm93ICYmIGNoZWNrVGltZS5jdXJyZW50VGltZSkge1xyXG5cclxuICAgICAgY29uc29sZS5sb2coJ9Ch0LXQudGH0LDRgSDRgNCw0LHQvtGH0LXQtSDQstGA0LXQvNGPLiDQoNCw0YHRh9C10YIg0L3QtSDRgtGA0LXQsdGD0LXRgtGB0Y8uJyk7XHJcbiAgICAgIGNvbnN0IHBvc3NpYmxlVGltZSA9IGNoZWNrVGltZS5jdXJyZW50VGltZSArICgrcmVzdHJpY3Rpb24ubWluRGVsaXZlcnlUaW1lSW5NaW51dGVzIHx8IDApO1xyXG4gICAgICBjb25zdCBwb3NzaWJsZVRpbWVTdHIgPSBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZShwb3NzaWJsZVRpbWUpO1xyXG4gICAgICByZXR1cm4gZm9ybWF0RGF0ZShjdXJyZW50ZGF0ZSwgYHl5eXktTU0tZGQgJHtwb3NzaWJsZVRpbWVTdHJ9YCwgJ2VuJylcclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICBpZiAoY2hlY2tUaW1lLmN1cnJlbnRUaW1lICYmIGNoZWNrVGltZS5jdXJlbnREYXlTdG9wVGltZSkge1xyXG5cclxuICAgICAgICBjb25zdCBjdXJyZW50RGF5V29ya1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXHJcbiAgICAgICAgICByZXN0cmljdGlvbixcclxuICAgICAgICAgIGNoZWNrVGltZS5pc05ld0RheSA/IG5ldyBEYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKSA6IGN1cnJlbnRkYXRlXHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zdCB0aW1lID0gdGhpcy5nZXRUaW1lRnJvbVN0cmluZyg8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RhcnQpICsgKCtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXMpO1xyXG4gICAgICAgIGNvbnN0IHRpbWVTdHJpbmcgPSBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lKTtcclxuICAgICAgICByZXR1cm4gZm9ybWF0RGF0ZShcclxuICAgICAgICAgIGNoZWNrVGltZS5pc05ld0RheSB8fCBjaGVja1RpbWUuY3VycmVudFRpbWUgPiBjaGVja1RpbWUuY3VyZW50RGF5U3RvcFRpbWUgPyAoY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDApIDogY3VycmVudGRhdGUsXHJcbiAgICAgICAgICBgeXl5eS1NTS1kZCAke3RpbWVTdHJpbmd9YCxcclxuICAgICAgICAgICdlbicpO1xyXG5cclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgdGhyb3cgJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0YDQsNGB0YHRh9C40YLQsNGC0YwgY3VycmVudFRpbWUg0LggY3VyZW50RGF5U3RvcFRpbWUuJztcclxuXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQodCw0LzQvtCy0YvQstC+0LdcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgc3RhdGljIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgLyoqXHJcbiAgICAgKiDQlNC70Y8g0L7QsdC10YHQv9C10YfQtdC90LjRjyDQuNC80LzRg9GC0LDQsdC10LvRjNC90L7RgdGC0Lgg0LTQsNC90L3Ri9GFINGB0L7Qt9C00LDQtdGC0YHRjyDQvdC+0LLRi9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMsINC40LTQtdC90YLQuNGH0L3Ri9C5INC/0L7Qu9GD0YfQtdC90L3QvtC80YMg0LIg0L/QsNGA0LDQvNC10YLRgNCw0YUsINC90L4g0YEg0LjQt9C80LXQvdC10L3QvdGL0Lwg0LzQsNGB0YHQuNCy0L7QvCB3b3JrdGltZS5cclxuICAgICAqINCSINC80LDRgdGB0LjQstC1IHdvcmt0aW1lINC+0LHQvdC+0LLQu9GP0Y7RgtGB0Y8g0L7Qs9GA0LDQvdC40YfQtdC90LjRjyDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0YEg0L7QsdGL0YfQvdGL0YUg0L3QsCDQsNC60YLRg9Cw0LvRjNC90YvQtSDQtNC70Y8g0YHQsNC80L7QstGL0LLQvtC30LAuXHJcbiAgICAgKiAqL1xyXG4gICAgY29uc3QgbmV3UmVzdHJpY3Rpb24gPSB7XHJcbiAgICAgIC4uLnJlc3RyaWN0aW9uLCB3b3JrdGltZTogKDxXb3JrVGltZVtdPnJlc3RyaWN0aW9uLndvcmt0aW1lKS5tYXAod29ya3RpbWUgPT4gd29ya3RpbWUuc2VsZlNlcnZpY2UgPyAoeyAuLi53b3JrdGltZSwgLi4ud29ya3RpbWUuc2VsZlNlcnZpY2UgfSkgOiB3b3JrdGltZSlcclxuICAgIH07XHJcbiAgICByZXR1cm4gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKG5ld1Jlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQuNC3INC80LDRgdGB0LjQstCwINCy0YHQtdGFINCy0LDRgNC40LDQvdGC0L7QsiDQvtCx0YzQtdC60YLQsCByZXN0cmljdGlvbi5cclxuICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICovXHJcbiAgc3RhdGljIGdldEN1cnJlbnRXb3JrVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IFdvcmtUaW1lIHtcclxuICAgIGxldCBpID0gMDtcclxuICAgIGxldCByZXN1bHQgPSBudWxsO1xyXG4gICAgd2hpbGUgKGkgPCByZXN0cmljdGlvbi53b3JrdGltZS5sZW5ndGggJiYgIXJlc3VsdCkge1xyXG4gICAgICBpZiAocmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrID09PSAnYWxsJyB8fCAoXHJcbiAgICAgICAgdHlwZW9mIHJlc3RyaWN0aW9uLndvcmt0aW1lW2ldLmRheU9mV2VlayA9PT0gJ3N0cmluZycgP1xyXG4gICAgICAgICAgKDxzdHJpbmc+cmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrKS50b0xvd2VyQ2FzZSgpIDpcclxuICAgICAgICAgICg8c3RyaW5nW10+cmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrKS5tYXAoZGF5ID0+IGRheS50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICApLmluY2x1ZGVzKGZvcm1hdERhdGUoY3VycmVudGRhdGUsICdFRUVFJywgJ2VuJykudG9Mb3dlckNhc2UoKSkpIHtcclxuICAgICAgICByZXN1bHQgPSByZXN0cmljdGlvbi53b3JrdGltZVtpXTtcclxuICAgICAgfVxyXG4gICAgICBpICs9IDE7XHJcbiAgICB9XHJcbiAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ9Cd0LXRgiDQsNC60YLRg9Cw0LvRjNC90L7Qs9C+INGA0LDRgdC/0LjRgdCw0L3QuNGPINGA0LDQsdC+0YLRiyDQtNC70Y8g0YLQtdC60YPRidC10LPQviDQtNC90Y8nKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAqINCb0L7Qs9C40LrQsCDQvdC40LbQtSDQv9GA0LXQtNC90LDQt9C90LDRh9C10L3QsCDQtNC70Y8g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8g0Y3QutC30LXQvNC/0LvRj9GA0LAg0LrQu9Cw0YHRgdCwIFdvcmtUaW1lVmFsaWRhdG9yIFxyXG4gICovXHJcblxyXG4gIGNvbnN0cnVjdG9yKCkgeyB9XHJcblxyXG4gIHByaXZhdGUgX21lbW9yeToge1xyXG4gICAgZ2V0TWF4T3JkZXJEYXRlOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xyXG4gICAgZ2V0VGltZUZyb21TdHJpbmc6IE1hcDxzdHJpbmcsIG51bWJlcj47XHJcbiAgICBpc1dvcmtOb3c6IE1hcDxzdHJpbmcsIFZhbGlkYXRvclJlc3VsdD47XHJcbiAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IE1hcDxzdHJpbmcsIHN0cmluZz47XHJcbiAgICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZTogTWFwPHN0cmluZywgc3RyaW5nPjtcclxuICAgIGdldEN1cnJlbnRXb3JrVGltZTogTWFwPHN0cmluZywgV29ya1RpbWU+O1xyXG4gICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IE1hcDxzdHJpbmcsIFRpbWVTdHJpbmc+XHJcbiAgfSA9IHtcclxuICAgICAgZ2V0TWF4T3JkZXJEYXRlOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxyXG4gICAgICBnZXRUaW1lRnJvbVN0cmluZzogbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKSxcclxuICAgICAgaXNXb3JrTm93OiBuZXcgTWFwPHN0cmluZywgVmFsaWRhdG9yUmVzdWx0PigpLFxyXG4gICAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXHJcbiAgICAgIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxyXG4gICAgICBnZXRDdXJyZW50V29ya1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBXb3JrVGltZT4oKSxcclxuICAgICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBUaW1lU3RyaW5nPigpXHJcbiAgICB9O1xyXG5cclxuICAvKipcclxuICAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLCDQvdCwINC60L7RgtC+0YDRg9GOINC80L7QttC90L4g0LfQsNC60LDQt9Cw0YLRjCDQtNC+0YHRgtCw0LLQutGDLlxyXG4gICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICAqIEByZXR1cm4gOnN0cmluZyAtINCh0YLRgNC+0LrQsCwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LDRjyDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LTQvtGB0YLRg9C/0L3Rg9GOINC00LDRgtGDINC00L7RgdGC0LDQstC60Lgg0LIg0YTQvtGA0LzQsNGC0LUgeXl5eS1NTS1kZC5cclxuICAgICovXHJcbiAgZ2V0TWF4T3JkZXJEYXRlKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRNYXhPcmRlckRhdGUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0TWF4T3JkZXJEYXRlKHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRNYXhPcmRlckRhdGUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0YHRgtGA0L7QutCwINCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0g0LLRgNC10LzRjy5cclxuICAgKiBAcmV0dXJuIDpudW1iZXIgLSDQutC+0Lst0LLQviDQvNC40L3Rg9GCLlxyXG4gICAqL1xyXG4gIGdldFRpbWVGcm9tU3RyaW5nKHRpbWU6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHRpbWUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRUaW1lRnJvbVN0cmluZy5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyg8VGltZVN0cmluZz50aW1lKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldFRpbWVGcm9tU3RyaW5nLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INC/0YDQvtCy0LXRgNGP0LXRgiwg0LTQvtGB0YLRg9C/0L3QsCDQu9C4INCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8sINC00LvRjyDQutC+0YLQvtGA0YvRhSDQuCDQv9GA0L7QstC10YDRj9C10YLRgdGPINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuFxyXG4gICAqIEByZXR1cm4g0J7QsdGM0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjjpcclxuICAgKiB7XHJcbiAgICAgICAgaXNXb3JrTm93OmJvb2xlYW4gLSDQktC+0LfQvNC+0LbQvdCwINC70Lgg0LTQvtGB0YLQsNCy0LrQsCDQsiDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRj1xyXG4gICAgICAgIGlzTmV3RGF5OmJvb2xlYW4gLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0LjQt9C90LDQuiwg0YfRgtC+INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDRh9Cw0YHQvtCy0YvRhSDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC00LDRgtGLIFwi0L/QtdGA0LXQv9GA0YvQs9C90YPQu1wiINC90LAg0L3QvtCy0YvQuSDQtNC10L3RjC5cclxuICAgICAgICBjdXJyZW50VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0L7QstC10YDRj9C10LzQvtC1INC80LXRgtC+0LTQvtC8INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICB9XHJcbiAgICovXHJcbiAgaXNXb3JrTm93KHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMgfCBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU/OiBEYXRlKTogVmFsaWRhdG9yUmVzdWx0IHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuaXNXb3JrTm93LmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmlzV29ya05vdyhyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuaXNXb3JrTm93LnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQlNC+0YHRgtCw0LLQutCwINC60YPRgNGM0LXRgNC+0LxcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9O1xyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCh0LDQvNC+0LLRi9Cy0L7Qt1wiLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQuNC3INC80LDRgdGB0LjQstCwINCy0YHQtdGFINCy0LDRgNC40LDQvdGC0L7QsiDQvtCx0YzQtdC60YLQsCByZXN0cmljdGlvbi5cclxuICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICovXHJcbiAgZ2V0Q3VycmVudFdvcmtUaW1lKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMsIGN1cnJlbnRkYXRlOiBEYXRlKTogV29ya1RpbWUge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRDdXJyZW50V29ya1RpbWUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIDxXb3JrVGltZT5jaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldEN1cnJlbnRXb3JrVGltZShyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0Q3VycmVudFdvcmtUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQutC+0L3QstC10YDRgtC40YDRg9C10YIg0L/QtdGA0LXQtNCw0L3QvdC+0LUg0LrQvtC7LdCy0L4g0LzQuNC90YPRgiDQsiDRgdGC0YDQvtC60L7QstC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YDQtdC80LXQvdC4INCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0gYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgLlxyXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XHJcbiAgICogXHJcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDUwKSAvLyBhID0gJzAwOjUwJ1xyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxMjAwKSAvLyBiID0gJzIwOjAwJ1xyXG4gICAqIFxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0KfQuNGB0LvQviDQsiDQtNC40LDQv9Cw0LfQvtC90LUg0L7RgiAwINC00L4gMTQ0MCAo0YLQsNC6INC60LDQuiDQvNCw0LrRgdC40LzRg9C8INCyIDEg0YHRg9GC0LrQsNGFID0gMTQ0MCDQvNC40L3Rg9GCKS5cclxuICAgKiDQn9GA0Lgg0L/QtdGA0LXQtNCw0YfQtSDQsiB0aW1lINC+0YLRgNC40YbQsNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjywg0LfQvdCw0Log0LHRg9C00LXRgiBcItC+0YLQvtCx0YDRiNC10L1cIiwg0LAg0LTQu9GPINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiwg0YDQsNGB0YHRh9C40YLQsNC90L3Ri9C5INC00LvRjyDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INC/0L7Qu9C+0LbQuNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjy5cclxuICAgKiDQldGB0LvQuCDQsiB0aW1lINCx0YPQtNC10YIg0L/QtdGA0LXQtNCw0L3QviDQt9C90LDRh9C10L3QuNC1INCx0L7Qu9GM0YjQtSAxNDQwIC0g0LzQtdGC0L7QtCDQstC10YDQvdC10YIg0YDQtdC30YPQu9GM0YLQsNGCINC00LvRjyDQt9C90LDRh9C10L3QuNGPINCx0LXQtyDRg9GH0LXRgtCwIFwi0L/RgNC10LLRi9GI0LDRjtGJ0LjRhSDRgdGD0YLQvtC6XCIgKNGCLtC1LiDRgSDQutGA0LDRgtC90YvQvCDQstGL0YfQtdGC0L7QvCAxNDQwINC80LjQvdGD0YIpXHJcbiAgICogXHJcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcclxuICAgKiBcclxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNjApIC8vIGEgPSAnMDE6MDAnIFxyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxNTAwKSAvLyBiID0gJzAxOjAwJyAoMTQ0MCDQvNC40L3Rg9GCIFwi0YbQtdC70YvRhVwiINGB0YPRgtC+0Log0LHRi9C70LggXCLQvtGC0LHRgNC+0YjQtdC90YtcIilcclxuICAgKiBcclxuICAgKiBAcmV0dXJucyBcclxuICAgKi9cclxuICBjb252ZXJ0TWludXRlc1RvVGltZSh0aW1lOiBudW1iZXIpOiBUaW1lU3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgdGltZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmNvbnZlcnRNaW51dGVzVG9UaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuY29udmVydE1pbnV0ZXNUb1RpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcbiJdfQ==