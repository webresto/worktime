import { formatDate, isDate } from './formatDate';
import { TimeZoneIdentifier } from './tz';
/**
 * Функция валидации переданного объекта restriction на соответствие интерфейсу Restrictions
 * @param restriction - проверяемый объект, содержащий информацию о рабочем времени и временной зоне.
 */
function isValidRestriction(restriction) {
    return (typeof restriction === 'object' &&
        restriction !== null &&
        'timezone' in restriction &&
        'worktime' in restriction);
}
/**
 * Функция валидации переданного объекта restriction на соответствие минимальным данным для заказа
 * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
 */
function isValidRestrictionOrder(restriction) {
    return ('minDeliveryTimeInMinutes' in restriction &&
        'possibleToOrderInMinutes' in restriction &&
        'timezone' in restriction &&
        'worktime' in restriction);
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
        if (restriction &&
            isValidRestrictionOrder(restriction) &&
            isDate(currentdate)) {
            return formatDate(currentdate.getTime() + restriction.possibleToOrderInMinutes * 60000, 'yyyy-MM-dd', 'en');
        }
        else {
            throw new Error(isDate(currentdate)
                ? 'Не передан корректный объект даты'
                : !restriction
                    ? 'Не передан объект restrictions'
                    : 'Передан невалидный обьект restrictions');
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
                return +checkedTime.split(':')[0] * 60 + +checkedTime.split(':')[1];
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
            const hourStr = ((hour <= 9 ? `0${String(hour)}` : String(hour)));
            const minutesStr = String(time - hour * 60);
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
                workNow: true,
            };
        }
        // Если испольняется в NodeJS
        if (typeof process !== 'undefined' && !restriction.timezone) {
            restriction.timezone = process.env.TZ
                ? process.env.TZ
                : Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        if (!restriction || !isValidRestriction(restriction)) {
            throw new Error(!isDate(currentdate)
                ? 'Не передан корректный объект даты'
                : !restriction
                    ? 'Не передан объект restrictions'
                    : 'Передан невалидный обьект restrictions');
        }
        else {
            const companyLocalTimeZone = TimeZoneIdentifier.getTimeZoneGMTOffsetfromNameZone(restriction.timezone).split(':');
            const companyLocalTimeZoneDelta = +companyLocalTimeZone[0] * 60 + +companyLocalTimeZone[1];
            const lokalTimeDelta = companyLocalTimeZoneDelta + currentdate.getTimezoneOffset(); // смещение времени пользователя относительно времени торговой точки
            const currentTimeInMinutesWithLocalDelta = WorkTimeValidator.getTimeFromString(formatDate(currentdate, 'HH:mm', 'en')) + lokalTimeDelta;
            /**
             * текущее время в минутах с начала дня (600 = 10:00. 1200 = 20:00)
             * если из-за разницы поясов расчет перепрыгнул на новый день, то приводим время к правильному значению в диапазоне 24 часов
             * */
            const currentTime = currentTimeInMinutesWithLocalDelta > 1440
                ? currentTimeInMinutesWithLocalDelta - 1440
                : currentTimeInMinutesWithLocalDelta;
            const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, currentTimeInMinutesWithLocalDelta > 1440
                ? new Date(currentdate.getTime() + 86400000)
                : currentdate); // текущее рабочее время
            const curentDayStartTime = WorkTimeValidator.getTimeFromString(currentDayWorkTime.start); // текущее время начала рабочего дня в минутах
            const curentDayStopTime = WorkTimeValidator.getTimeFromString(currentDayWorkTime.stop); // текущее время окончания рабочего дня в минутах
            return {
                workNow: currentTime < curentDayStopTime && currentTime > curentDayStartTime,
                isNewDay: currentTimeInMinutesWithLocalDelta > 1440,
                currentTime,
                curentDayStartTime,
                curentDayStopTime,
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
                const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, checkTime.isNewDay
                    ? new Date(currentdate.getTime() + 86400000)
                    : currentdate);
                const time = this.getTimeFromString(currentDayWorkTime.start) +
                    +restriction.minDeliveryTimeInMinutes;
                const timeString = WorkTimeValidator.convertMinutesToTime(time);
                return formatDate(checkTime.isNewDay ||
                    checkTime.currentTime > checkTime.curentDayStopTime
                    ? currentdate.getTime() + 86400000
                    : currentdate, `yyyy-MM-dd ${timeString}`, 'en');
            }
            else {
                throw 'Не удалось рассчитать currentTime и curentDayStopTime.';
            }
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
            ...restriction,
            worktime: restriction.worktime.map((worktime) => worktime.selfService
                ? { ...worktime, ...worktime.selfService }
                : worktime),
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
            if (restriction.worktime[i].dayOfWeek === 'all' ||
                (typeof restriction.worktime[i].dayOfWeek === 'string'
                    ? restriction.worktime[i].dayOfWeek.toLowerCase()
                    : restriction.worktime[i].dayOfWeek.map((day) => day.toLowerCase())).includes(formatDate(currentdate, 'EEEE', 'en').toLowerCase())) {
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
            convertMinutesToTime: new Map(),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sTUFBTSxDQUFDO0FBd0sxQzs7O0dBR0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLFdBQW9CO0lBQzlDLE9BQU8sQ0FDTCxPQUFPLFdBQVcsS0FBSyxRQUFRO1FBQy9CLFdBQVcsS0FBSyxJQUFJO1FBQ3BCLFVBQVUsSUFBSSxXQUFXO1FBQ3pCLFVBQVUsSUFBSSxXQUFXLENBQzFCLENBQUM7QUFDSixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FDOUIsV0FBOEI7SUFFOUIsT0FBTyxDQUNMLDBCQUEwQixJQUFJLFdBQVc7UUFDekMsMEJBQTBCLElBQUksV0FBVztRQUN6QyxVQUFVLElBQUksV0FBVztRQUN6QixVQUFVLElBQUksV0FBVyxDQUMxQixDQUFDO0FBQ0osQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQUM1Qjs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FDcEIsV0FBOEIsRUFDOUIsV0FBaUI7UUFFakIsSUFDRSxXQUFXO1lBQ1gsdUJBQXVCLENBQUMsV0FBVyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFDbkI7WUFDQSxPQUFPLFVBQVUsQ0FDZixXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsV0FBVyxDQUFDLHdCQUF3QixHQUFHLEtBQUssRUFDcEUsWUFBWSxFQUNaLElBQUksQ0FDTCxDQUFDO1NBQ0g7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQztnQkFDakIsQ0FBQyxDQUFDLG1D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QUFZO1FBQy9CLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLElBQUksV0FBVyxFQUFFO1lBQ2YsT0FBTyxXQUFXLENBQUM7U0FDcEI7YUFBTTtZQUNMLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6RCxPQUFPLE1BQU0sQ0FBQztTQUNmO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZm9ybWF0RGF0ZSwgaXNEYXRlIH0gZnJvbSAnLi9mb3JtYXREYXRlJztcclxuaW1wb3J0IHsgVGltZVpvbmVJZGVudGlmaWVyIH0gZnJvbSAnLi90eic7XHJcblxyXG4vKipcclxuICog0JHQsNC30L7QstGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyAtINGB0LvRg9C20LXQsdC90YvQuSDQuNC90YLQtdGA0YTQtdC50YEuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtUaW1lQmFzZSB7XHJcbiAgLyoqINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cclxuICBzdGFydDogc3RyaW5nO1xyXG5cclxuICAvKiog0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8qL1xyXG4gIHN0b3A6IHN0cmluZztcclxuXHJcbiAgLyoqINC/0LXRgNC10YDRi9CyINC90LAg0L7QsdC10LQqL1xyXG4gIGJyZWFrPzogc3RyaW5nO1xyXG59XHJcblxyXG4vKipcclxuICog0JjQvdGE0L7RgNC80LDRhtC40Y8g0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gLSDRgdC70YPQttC10LHQvdGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBXb3JrVGltZSBleHRlbmRzIFdvcmtUaW1lQmFzZSB7XHJcbiAgLyoqINC00LXQvdGMINC90LXQtNC10LvQuCwg0Log0LrQvtGC0L7RgNC+0LzRgyDQv9GA0LjQvNC10L3Rj9C10YLRgdGPINGN0YLQviDQstGA0LXQvNGPINC00L7RgdGC0LDQstC60LggICAqL1xyXG4gIGRheU9mV2Vlazogc3RyaW5nIHwgc3RyaW5nW107XHJcblxyXG4gIC8qKiDQvtCz0YDQsNC90LjRh9C10L3QuNGPINC/0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC00LvRjyDRgdCw0LzQvtCy0YvQstC+0LfQsCAqL1xyXG4gIHNlbGZTZXJ2aWNlPzogV29ya1RpbWVCYXNlO1xyXG59XHJcblxyXG4vKipcclxuICog0JjQvdGC0LXRgNGE0LXQudGBINC+0LHRitC10LrRgtCwLCDQv9C+0LvRg9GH0LDQtdC80L7Qs9C+INC+0YIgQVBJIEB3ZWJyZXN0by9jb3JlINC4INGB0L7QtNC10YDQttCw0YnQtdCz0L4g0YLQtdC60YPRidC40LUg0LTQsNC90L3Ri9C1INC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y9cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVzdHJpY3Rpb25zIHtcclxuICAvKiog0LLRgNC10LzQtdC90L3QsNGPINC30L7QvdCwINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cclxuICB0aW1lem9uZT86IHN0cmluZztcclxuXHJcbiAgLyoqICDQvNCw0YHRgdC40LIg0L7Qs9GA0LDQvdC40YfQtdC90LjQuSDQv9C+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC00LvRjyDRgNCw0LfQvdGL0YUg0LTQvdC10Lkg0L3QtdC00LXQu9C4LiAqL1xyXG4gIHdvcmt0aW1lOiBXb3JrVGltZVtdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEh0bWxGb3JtRmllbGQge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgdHlwZTogc3RyaW5nO1xyXG4gIGxhYmVsOiBzdHJpbmc7XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZztcclxuICByZXF1aXJlZDogYm9vbGVhbjtcclxuICByZWdleDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvdW50cnkge1xyXG4gIHBob25lQ29kZTogc3RyaW5nO1xyXG4gIGlzbzogc3RyaW5nO1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBuYXRpdmVDb3VudHJ5TmFtZTogc3RyaW5nO1xyXG4gIGxhbmd1YWdlOiBzdHJpbmdbXTtcclxuICBjdXJyZW5jeTogc3RyaW5nO1xyXG4gIGN1cnJlbmN5U3ltYm9sOiBzdHJpbmc7XHJcbiAgY3VycmVuY3lJU086IHN0cmluZztcclxuICBjdXJyZW5jeVVuaXQ6IHN0cmluZztcclxuICBjdXJyZW5jeURlbm9taW5hdGlvbjogbnVtYmVyO1xyXG4gIHBob25lTWFzazogc3RyaW5nW107XHJcbiAgZmxhZzogc3RyaW5nO1xyXG59XHJcblxyXG4vKiog0JTQsNC90L3Ri9C1INC+INC80L7QtNC10LvQuCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC90LAg0YHQsNC50YLQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgVXNlclJlc3RyaWN0aW9ucyB7XHJcbiAgLyoqINCf0L7QutCw0LfRi9Cy0LDQtdGCLCDQutCw0LrQvtC5INCy0LjQtCDQtNCw0L3QvdGL0YUg0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC8INC00LvRjyDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4ICovXHJcbiAgbG9naW5GaWVsZDogc3RyaW5nO1xyXG5cclxuICBjdXN0b21GaWVsZHM/OiBIdG1sRm9ybUZpZWxkW10gfCBudWxsO1xyXG5cclxuICAvKipcclxuICAgKiDQntGC0LrQu9GO0YfQtdC9INC70Lgg0JvQmlxyXG4gICAqL1xyXG4gIGFjY291bnRzRGlzYWJsZTogYm9vbGVhbjtcclxuICAvKipcclxuICAgKiDQntGC0LrQu9GO0YfQtdC90Ysg0LvQuCDQsdC+0L3Rg9GB0L3Ri9C1INC/0YDQvtCz0YDQsNC80LzRi1xyXG4gICAqL1xyXG4gIGJvbnVzUHJvZ3JhbURpc2FibGU6IGJvb2xlYW47XHJcbiAgLyoqXHJcbiAgICog0KLRgNC10LHRg9C10YLRgdGPINC70Lgg0LTQu9GPINCw0LLRgtC+0YDQuNC30LDRhtC40Lgv0YDQtdCz0LjRgdGC0YDQsNGG0LjQuCDQstCy0L7QtCDQv9Cw0YDQvtC70Y9cclxuICAgKi9cclxuICBwYXNzd29yZFJlcXVpcmVkOiBib29sZWFuO1xyXG4gIHJlZ2lzdHJhdGlvbk9UUFJlcXVpcmVkOiBib29sZWFuO1xyXG4gIC8qKlxyXG4gICAqINCU0L7RgdGC0YPQv9C90L4g0LvQuCDQstC+0YHRgdGC0LDQvdC+0LLQu9C10L3QuNC1INC/0LDRgNC+0LvRj1xyXG4gICAqL1xyXG4gIGFsbG93UmVzdG9yZVBhc3N3b3JkOiBib29sZWFuO1xyXG4gIC8qKlxyXG4gICAqINCh0L/QuNGB0L7QuiDRgdGC0YDQsNC9LCDRgtC10LvQtdGE0L7QvdC90YvQtSDQutC+0LTRiyDQutC+0YLQvtGA0YvRhSDQtNC+0YHRgtGD0L/QvdGLINC00LvRjyDRg9C60LDQt9Cw0L3QuNGPINCyINC90L7QvNC10YDQtSDRgtC10LvQtdGE0L7QvdCwINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIGFsbG93ZWRQaG9uZUNvdW50cmllczogQ291bnRyeVtdO1xyXG4gIC8qKlxyXG4gICAqINCh0YHRi9C70LrQsCDQvdCwINC/0L7Qu9C40YLQuNC60YMg0L7QsdGA0LDQsdC+0YLQutC4INC/0LXRgNGB0L7QvdCw0LvRjNC90YvRhSDQtNCw0L3QvdGL0YVcclxuICAgKi9cclxuICBsaW5rVG9Qcm9jZXNzaW5nUGVyc29uYWxEYXRhOiBib29sZWFuO1xyXG4gIC8qKlxyXG4gICAqINCh0YHRi9C70LrQsCDQvdCwINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjNGB0LrQvtC1INGB0L7Qs9C70LDRiNC10L3QuNC1XHJcbiAgICovXHJcbiAgbGlua1RvVXNlckFncmVlbWVudDogYm9vbGVhbjtcclxuICAvKipcclxuICAgKiDQlNC70LjQvdCwINC60L7QtNCwINC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNGPIE9UUFxyXG4gICAqL1xyXG4gIE9UUGxlbmd0aDogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFJlc3RyaWN0aW9uc09yZGVyIGV4dGVuZHMgUmVzdHJpY3Rpb25zIHtcclxuICAvKiog0LzQuNC90LjQvNCw0LvRjNC90L7QtSDQstGA0LXQvNGPINC00L7RgdGC0LDQstC60LgqL1xyXG4gIG1pbkRlbGl2ZXJ5VGltZUluTWludXRlczogc3RyaW5nO1xyXG5cclxuICAvKiog0L7Qs9GA0LDQvdC40YfQtdC90LjQtSDQvNCw0LrRgdC40LzQsNC70YzQvdC+0Lkg0LTQsNGC0Ysg0LfQsNC60LDQt9CwINCyINCx0YPQtNGD0YnQtdC8ICjQsiDQvNC40L3Rg9GC0LDRhSkqL1xyXG4gIHBvc3NpYmxlVG9PcmRlckluTWludXRlczogbnVtYmVyO1xyXG5cclxuICAvKiogINGD0YHRgtCw0L3QvtCy0LvQtdC90L4g0LvQuCDQvdCwINGC0LXQutGD0YnQuNC5INC80L7QvNC10L3RgiDQvtCz0YDQsNC90LjRh9C10L3QuNC1INC00L7RgdGC0LDQstC60Lgg0L3QsCDQvtC/0YDQtdC00LXQu9C10L3QvdC+0LUg0LLRgNC10LzRjyAqL1xyXG4gIGRlbGl2ZXJ5VG9UaW1lRW5hYmxlZD86IGJvb2xlYW47XHJcblxyXG4gIC8qKiDQlNC+0L/QvtC70L3QuNGC0LXQu9GM0L3Ri9C5INC60L7QvNC80LXQvdGC0LDRgNC40Lkg0L/QviDQtNC+0YHRgtCw0LLQutC1ICovXHJcbiAgZGVsaXZlcnlEZXNjcmlwdGlvbj86IHN0cmluZztcclxuXHJcbiAgLyoqINCg0LDQt9C90L7QstC40LTQvdC+0YHRgtGMINCy0LLQvtC00LjQvNC+0Lkg0LrQsNC/0YfQuCAqL1xyXG4gIGNhcHRjaGFUeXBlPzogc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgLyoqINCU0LDQvdC90YvQtSDQviDQvNC+0LTQtdC70Lgg0LDQstGC0L7RgNC40LfQsNGG0LjQuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70LXQuSDQvdCwINGB0LDQudGC0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyAqL1xyXG4gIHVzZXI/OiBVc2VyUmVzdHJpY3Rpb25zIHwgbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0b3JSZXN1bHQge1xyXG4gIHdvcmtOb3c6IGJvb2xlYW47XHJcbiAgaXNOZXdEYXk/OiBib29sZWFuO1xyXG4gIGN1cnJlbnRUaW1lPzogbnVtYmVyO1xyXG4gIGN1cmVudERheVN0YXJ0VGltZT86IG51bWJlcjtcclxuICBjdXJlbnREYXlTdG9wVGltZT86IG51bWJlcjtcclxufVxyXG5cclxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgdC10YUg0YbQuNGE0YAgKi9cclxudHlwZSBEaWdpdHMgPSAnMCcgfCAnMScgfCAnMicgfCAnMycgfCAnNCcgfCAnNScgfCAnNicgfCAnNycgfCAnOCcgfCAnOSc7XHJcblxyXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSAyNCDRh9Cw0YHQvtCyINC+0LTQvdC40YUg0YHRg9GC0L7QuiAqL1xyXG5leHBvcnQgdHlwZSBIb3Vyc0RpZ2l0cyA9XHJcbiAgfCAnMDAnXHJcbiAgfCAnMDEnXHJcbiAgfCAnMDInXHJcbiAgfCAnMDMnXHJcbiAgfCAnMDQnXHJcbiAgfCAnMDUnXHJcbiAgfCAnMDYnXHJcbiAgfCAnMDcnXHJcbiAgfCAnMDgnXHJcbiAgfCAnMDknXHJcbiAgfCAnMTAnXHJcbiAgfCAnMTEnXHJcbiAgfCAnMTInXHJcbiAgfCAnMTMnXHJcbiAgfCAnMTQnXHJcbiAgfCAnMTUnXHJcbiAgfCAnMTYnXHJcbiAgfCAnMTcnXHJcbiAgfCAnMTgnXHJcbiAgfCAnMTknXHJcbiAgfCAnMjAnXHJcbiAgfCAnMjEnXHJcbiAgfCAnMjInXHJcbiAgfCAnMjMnO1xyXG5cclxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUgNjAg0LzQuNC90YPRgiDQvtC00L3QvtCz0L4g0YfQsNGB0LAqL1xyXG5leHBvcnQgdHlwZSBNaW51dGVEaWdpdHMgPSBgJHsnMCcgfCAnMScgfCAnMicgfCAnMycgfCAnNCcgfCAnNSd9JHtEaWdpdHN9YDtcclxuXHJcbi8qKiDQotC40L8sINC+0L/QuNGB0YvQstCw0Y7RidC40Lkg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YDQtdC80LXQvdC4INCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC1gKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAgKi9cclxuZXhwb3J0IHR5cGUgVGltZVN0cmluZyA9IGAke0hvdXJzRGlnaXRzfToke01pbnV0ZURpZ2l0c31gO1xyXG5cclxuLyoqXHJcbiAqINCk0YPQvdC60YbQuNGPINCy0LDQu9C40LTQsNGG0LjQuCDQv9C10YDQtdC00LDQvdC90L7Qs9C+INC+0LHRitC10LrRgtCwIHJlc3RyaWN0aW9uINC90LAg0YHQvtC+0YLQstC10YLRgdGC0LLQuNC1INC40L3RgtC10YDRhNC10LnRgdGDIFJlc3RyaWN0aW9uc1xyXG4gKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQv9GA0L7QstC10YDRj9C10LzRi9C5INC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0Lgg0LLRgNC10LzQtdC90L3QvtC5INC30L7QvdC1LlxyXG4gKi9cclxuZnVuY3Rpb24gaXNWYWxpZFJlc3RyaWN0aW9uKHJlc3RyaWN0aW9uOiB1bmtub3duKTogcmVzdHJpY3Rpb24gaXMgUmVzdHJpY3Rpb25zIHtcclxuICByZXR1cm4gKFxyXG4gICAgdHlwZW9mIHJlc3RyaWN0aW9uID09PSAnb2JqZWN0JyAmJlxyXG4gICAgcmVzdHJpY3Rpb24gIT09IG51bGwgJiZcclxuICAgICd0aW1lem9uZScgaW4gcmVzdHJpY3Rpb24gJiZcclxuICAgICd3b3JrdGltZScgaW4gcmVzdHJpY3Rpb25cclxuICApO1xyXG59XHJcblxyXG4vKipcclxuICog0KTRg9C90LrRhtC40Y8g0LLQsNC70LjQtNCw0YbQuNC4INC/0LXRgNC10LTQsNC90L3QvtCz0L4g0L7QsdGK0LXQutGC0LAgcmVzdHJpY3Rpb24g0L3QsCDRgdC+0L7RgtCy0LXRgtGB0YLQstC40LUg0LzQuNC90LjQvNCw0LvRjNC90YvQvCDQtNCw0L3QvdGL0Lwg0LTQu9GPINC30LDQutCw0LfQsFxyXG4gKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAqL1xyXG5mdW5jdGlvbiBpc1ZhbGlkUmVzdHJpY3Rpb25PcmRlcihcclxuICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXJcclxuKTogcmVzdHJpY3Rpb24gaXMgUmVzdHJpY3Rpb25zT3JkZXIge1xyXG4gIHJldHVybiAoXHJcbiAgICAnbWluRGVsaXZlcnlUaW1lSW5NaW51dGVzJyBpbiByZXN0cmljdGlvbiAmJlxyXG4gICAgJ3Bvc3NpYmxlVG9PcmRlckluTWludXRlcycgaW4gcmVzdHJpY3Rpb24gJiZcclxuICAgICd0aW1lem9uZScgaW4gcmVzdHJpY3Rpb24gJiZcclxuICAgICd3b3JrdGltZScgaW4gcmVzdHJpY3Rpb25cclxuICApO1xyXG59XHJcblxyXG4vKipcclxuICog0JrQu9Cw0YHRgSwg0YHQvtC00LXRgNC20LDRidC40Lkg0YHRgtCw0YLQuNGH0LXRgdC60LjQtSDQvNC10YLQvtC00YssINC90LXQvtCx0YXQvtC00LjQvNGL0LUg0LTQu9GPINGA0LDQsdC+0YLRiyDRgSDQvtCz0YDQsNC90LjRh9C10L3QuNGP0LzQuCDRgNCw0LHQvtGH0LXQs9C+INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAqINCh0L7Qt9C00LDQstCw0YLRjCDQvdC+0LLRi9C5INGN0LrQt9C10LzQv9C70Y/RgCDRjdGC0L7Qs9C+INC60LvQsNGB0YHQsCDQtNC70Y8g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8g0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7QsiDQvdC1INGC0YDQtdCx0YPQtdGC0YHRjy5cclxuICpcclxuICog0J/RgNC4INGN0YLQvtC8INC/0YDQuCDRgdC+0LfQtNCw0L3QuNC4INGN0LrQt9C10LzQv9C70Y/RgNCwINC60LvQsNGB0YHQsCDRgyDQvtCx0YrQtdC60YLQsCDRgtCw0LrQttC1INCx0YPQtNGD0YIg0LTQvtGB0YLRg9C/0L3RiyDRgdC+0LHRgdGC0LLQtdC90L3Ri9C1INGA0LXQsNC70LjQt9Cw0YbQuNC4XHJcbiAqINCy0YHQtdGFINGB0YLQsNGC0LjRh9C10YHQutC40YUg0LzQtdGC0L7QtNC+0LIuXHJcbiAqINCt0YLQuCDRgNC10LDQu9C40LfQsNGG0LjQuCDQvtGC0LvQuNGH0LDRjtGC0YHRjyDQvtGCINCy0YvQt9C+0LLQvtCyINGB0YLQsNGC0LjRh9C10YHQutC40YUg0LzQtdGC0L7QtNC+0LIg0YLQvtC70YzQutC+INC80LXQvNC+0LjQt9Cw0YbQuNC10Lkg0LLRi9C/0L7Qu9C90LXQvdC90YvRhSDRgNCw0YHRh9C10YLQvtCyLlxyXG4gKlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFdvcmtUaW1lVmFsaWRhdG9yIHtcclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMsINC90LAg0LrQvtGC0L7RgNGD0Y4g0LzQvtC20L3QviDQt9Cw0LrQsNC30LDRgtGMINC00L7RgdGC0LDQstC60YMuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEByZXR1cm4g0KHRgtGA0L7QutCwLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQsNGPINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQtNC+0YHRgtGD0L/QvdGD0Y4g0LTQsNGC0YMg0LTQvtGB0YLQsNCy0LrQuCDQsiDRhNC+0YDQvNCw0YLQtSB5eXl5LU1NLWRkLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRNYXhPcmRlckRhdGUoXHJcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXHJcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxyXG4gICk6IHN0cmluZyB7XHJcbiAgICBpZiAoXHJcbiAgICAgIHJlc3RyaWN0aW9uICYmXHJcbiAgICAgIGlzVmFsaWRSZXN0cmljdGlvbk9yZGVyKHJlc3RyaWN0aW9uKSAmJlxyXG4gICAgICBpc0RhdGUoY3VycmVudGRhdGUpXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuIGZvcm1hdERhdGUoXHJcbiAgICAgICAgY3VycmVudGRhdGUuZ2V0VGltZSgpICsgcmVzdHJpY3Rpb24ucG9zc2libGVUb09yZGVySW5NaW51dGVzICogNjAwMDAsXHJcbiAgICAgICAgJ3l5eXktTU0tZGQnLFxyXG4gICAgICAgICdlbidcclxuICAgICAgKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBpc0RhdGUoY3VycmVudGRhdGUpXHJcbiAgICAgICAgICA/ICfQndC1INC/0LXRgNC10LTQsNC9INC60L7RgNGA0LXQutGC0L3Ri9C5INC+0LHRitC10LrRgiDQtNCw0YLRiydcclxuICAgICAgICAgIDogIXJlc3RyaWN0aW9uXHJcbiAgICAgICAgICA/ICfQndC1INC/0LXRgNC10LTQsNC9INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnXHJcbiAgICAgICAgICA6ICfQn9C10YDQtdC00LDQvSDQvdC10LLQsNC70LjQtNC90YvQuSDQvtCx0YzQtdC60YIgcmVzdHJpY3Rpb25zJ1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDRgdGH0LjRgtCw0LXRgiwg0YHQutC+0LvRjNC60L4g0LzQuNC90YPRgiDQvtGCINC90LDRh9Cw0LvQsCDQtNC90Y8gKDAwOjAwKSDQv9GA0L7RiNC70L4g0LTQu9GPINC/0LXRgNC10LTQsNC90L3QvtCz0L4g0LLRgNC10LzQtdC90LguXHJcbiAgICogQHBhcmFtIHRpbWUgLSDRgdGC0YDQvtC60LAg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLWAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYCAtINCy0YDQtdC80Y8uXHJcbiAgICogQHJldHVybiDQutC+0Lst0LLQviDQvNC40L3Rg9GCLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRUaW1lRnJvbVN0cmluZyh0aW1lOiBUaW1lU3RyaW5nKTogbnVtYmVyIHtcclxuICAgIGlmICghdGltZSkge1xyXG4gICAgICB0aHJvdyAn0J3QtSDQv9C10YDQtdC00LDQvdCwINGB0YLRgNC+0LrQsCDRgSDQv9GA0LXQvtCx0YDQsNC30YPQtdC80YvQvCDQstGA0LXQvNC10L3QtdC8INCyINGE0L7RgNC80LDRgtC1IEhIOm1tJztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlZ0V4cCA9IG5ldyBSZWdFeHAoXHJcbiAgICAgICAgL14oMDB8MDF8MDJ8MDN8MDR8MDV8MDZ8MDd8MDh8MDl8MTB8MTF8MTJ8MTN8MTR8MTV8MTZ8MTd8MTh8MTl8MjB8MjF8MjJ8MjMpKzooWzAtNV1cXGQpKy9cclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChyZWdFeHAudGVzdCh0aW1lKSkge1xyXG4gICAgICAgIGxldCBjaGVja2VkVGltZSA9IHRpbWUudHJpbSgpO1xyXG4gICAgICAgIGlmIChjaGVja2VkVGltZS5pbmNsdWRlcygnICcpIHx8IGNoZWNrZWRUaW1lLmluY2x1ZGVzKCdUJykpIHtcclxuICAgICAgICAgIGNoZWNrZWRUaW1lID0gY2hlY2tlZFRpbWUuc3BsaXQoXHJcbiAgICAgICAgICAgIGNoZWNrZWRUaW1lLmluY2x1ZGVzKCcgJykgPyAnICcgOiAnVCdcclxuICAgICAgICAgIClbMV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gK2NoZWNrZWRUaW1lLnNwbGl0KCc6JylbMF0gKiA2MCArICtjaGVja2VkVGltZS5zcGxpdCgnOicpWzFdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93ICfQn9C10YDQtdC00LDQvdC90LDRjyDRgdGC0YDQvtC60LAg0L3QtSDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0LXRgiDRhNC+0YDQvNCw0YLRgyBISDptbSAtYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgJztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQutC+0L3QstC10YDRgtC40YDRg9C10YIg0L/QtdGA0LXQtNCw0L3QvdC+0LUg0LrQvtC7LdCy0L4g0LzQuNC90YPRgiDQsiDRgdGC0YDQvtC60L7QstC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YDQtdC80LXQvdC4INCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0gYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgLlxyXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XHJcbiAgICpcclxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNTApIC8vIGEgPSAnMDA6NTAnXHJcbiAgICogY29uc3QgYiA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDEyMDApIC8vIGIgPSAnMjA6MDAnXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdGltZSAtINCn0LjRgdC70L4g0LIg0LTQuNCw0L/QsNC30L7QvdC1INC+0YIgMCDQtNC+IDE0NDAgKNGC0LDQuiDQutCw0Log0LzQsNC60YHQuNC80YPQvCDQsiAxINGB0YPRgtC60LDRhSA9IDE0NDAg0LzQuNC90YPRgikuXHJcbiAgICog0J/RgNC4INC/0LXRgNC10LTQsNGH0LUg0LIgdGltZSDQvtGC0YDQuNGG0LDRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8sINC30L3QsNC6INCx0YPQtNC10YIgXCLQvtGC0L7QsdGA0YjQtdC9XCIsINCwINC00LvRjyDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIsINGA0LDRgdGB0YfQuNGC0LDQvdC90YvQuSDQtNC70Y8g0L/QvtC70YPRh9C10L3QvdC+0LPQviDQv9C+0LvQvtC20LjRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8uXHJcbiAgICog0JXRgdC70Lgg0LIgdGltZSDQsdGD0LTQtdGCINC/0LXRgNC10LTQsNC90L4g0LfQvdCw0YfQtdC90LjQtSDQsdC+0LvRjNGI0LUgMTQ0MCAtINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiDQtNC70Y8g0LfQvdCw0YfQtdC90LjRjyDQsdC10Lcg0YPRh9C10YLQsCBcItC/0YDQtdCy0YvRiNCw0Y7RidC40YUg0YHRg9GC0L7QulwiICjRgi7QtS4g0YEg0LrRgNCw0YLQvdGL0Lwg0LLRi9GH0LXRgtC+0LwgMTQ0MCDQvNC40L3Rg9GCKVxyXG4gICAqXHJcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcclxuICAgKlxyXG4gICAqIGNvbnN0IGEgPSBjb252ZXJ0TWludXRlc1RvVGltZSg2MCkgLy8gYSA9ICcwMTowMCdcclxuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTUwMCkgLy8gYiA9ICcwMTowMCcgKDE0NDAg0LzQuNC90YPRgiBcItGG0LXQu9GL0YVcIiDRgdGD0YLQvtC6INCx0YvQu9C4IFwi0L7RgtCx0YDQvtGI0LXQvdGLXCIpXHJcbiAgICpcclxuICAgKiBAcmV0dXJuc1xyXG4gICAqL1xyXG4gIHN0YXRpYyBjb252ZXJ0TWludXRlc1RvVGltZSh0aW1lOiBudW1iZXIpOiBUaW1lU3RyaW5nIHtcclxuICAgIGlmICh0aW1lIDwgMTQ0MSkge1xyXG4gICAgICBjb25zdCBob3VyID0gTWF0aC5mbG9vcih0aW1lIC8gNjApO1xyXG4gICAgICBjb25zdCBob3VyU3RyOiBIb3Vyc0RpZ2l0cyA9IDxIb3Vyc0RpZ2l0cz4oXHJcbiAgICAgICAgKGhvdXIgPD0gOSA/IGAwJHtTdHJpbmcoaG91cil9YCA6IFN0cmluZyhob3VyKSlcclxuICAgICAgKTtcclxuICAgICAgY29uc3QgbWludXRlc1N0cjogTWludXRlRGlnaXRzID0gPE1pbnV0ZURpZ2l0cz5TdHJpbmcodGltZSAtIGhvdXIgKiA2MCk7XHJcbiAgICAgIHJldHVybiBgJHtob3VyU3RyfToke21pbnV0ZXNTdHJ9YDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lIC0gMTQ0MCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INC/0YDQvtCy0LXRgNGP0LXRgiwg0LTQvtGB0YLRg9C/0L3QsCDQu9C4INCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8sINC00LvRjyDQutC+0YLQvtGA0YvRhSDQuCDQv9GA0L7QstC10YDRj9C10YLRgdGPINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuFxyXG4gICAqIEByZXR1cm4g0J7QsdGM0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjjpcclxuICAgKiB7XHJcbiAgICAgICAgaXNXb3JrTm93OmJvb2xlYW4gLSDQktC+0LfQvNC+0LbQvdCwINC70Lgg0LTQvtGB0YLQsNCy0LrQsCDQsiDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRj1xyXG4gICAgICAgIGlzTmV3RGF5OmJvb2xlYW4gLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0LjQt9C90LDQuiwg0YfRgtC+INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDRh9Cw0YHQvtCy0YvRhSDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC00LDRgtGLIFwi0L/QtdGA0LXQv9GA0YvQs9C90YPQu1wiINC90LAg0L3QvtCy0YvQuSDQtNC10L3RjC5cclxuICAgICAgICBjdXJyZW50VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0L7QstC10YDRj9C10LzQvtC1INC80LXRgtC+0LTQvtC8INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICB9XHJcbiAgICovXHJcbiAgc3RhdGljIGlzV29ya05vdyhcclxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMgfCBSZXN0cmljdGlvbnNPcmRlcixcclxuICAgIGN1cnJlbnRkYXRlOiBEYXRlID0gbmV3IERhdGUoKVxyXG4gICk6IFZhbGlkYXRvclJlc3VsdCB7XHJcbiAgICBpZiAoIXJlc3RyaWN0aW9uLndvcmt0aW1lIHx8ICFPYmplY3Qua2V5cyhyZXN0cmljdGlvbi53b3JrdGltZSkubGVuZ3RoKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgd29ya05vdzogdHJ1ZSxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyDQldGB0LvQuCDQuNGB0L/QvtC70YzQvdGP0LXRgtGB0Y8g0LIgTm9kZUpTXHJcbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICFyZXN0cmljdGlvbi50aW1lem9uZSkge1xyXG4gICAgICByZXN0cmljdGlvbi50aW1lem9uZSA9IHByb2Nlc3MuZW52LlRaXHJcbiAgICAgICAgPyBwcm9jZXNzLmVudi5UWlxyXG4gICAgICAgIDogSW50bC5EYXRlVGltZUZvcm1hdCgpLnJlc29sdmVkT3B0aW9ucygpLnRpbWVab25lO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcmVzdHJpY3Rpb24gfHwgIWlzVmFsaWRSZXN0cmljdGlvbihyZXN0cmljdGlvbikpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICFpc0RhdGUoY3VycmVudGRhdGUpXHJcbiAgICAgICAgICA/ICfQndC1INC/0LXRgNC10LTQsNC9INC60L7RgNGA0LXQutGC0L3Ri9C5INC+0LHRitC10LrRgiDQtNCw0YLRiydcclxuICAgICAgICAgIDogIXJlc3RyaWN0aW9uXHJcbiAgICAgICAgICA/ICfQndC1INC/0LXRgNC10LTQsNC9INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnXHJcbiAgICAgICAgICA6ICfQn9C10YDQtdC00LDQvSDQvdC10LLQsNC70LjQtNC90YvQuSDQvtCx0YzQtdC60YIgcmVzdHJpY3Rpb25zJ1xyXG4gICAgICApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgY29tcGFueUxvY2FsVGltZVpvbmUgPVxyXG4gICAgICAgIFRpbWVab25lSWRlbnRpZmllci5nZXRUaW1lWm9uZUdNVE9mZnNldGZyb21OYW1lWm9uZShcclxuICAgICAgICAgIHJlc3RyaWN0aW9uLnRpbWV6b25lXHJcbiAgICAgICAgKS5zcGxpdCgnOicpO1xyXG4gICAgICBjb25zdCBjb21wYW55TG9jYWxUaW1lWm9uZURlbHRhID1cclxuICAgICAgICArY29tcGFueUxvY2FsVGltZVpvbmVbMF0gKiA2MCArICtjb21wYW55TG9jYWxUaW1lWm9uZVsxXTtcclxuICAgICAgY29uc3QgbG9rYWxUaW1lRGVsdGEgPVxyXG4gICAgICAgIGNvbXBhbnlMb2NhbFRpbWVab25lRGVsdGEgKyBjdXJyZW50ZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpOyAvLyDRgdC80LXRidC10L3QuNC1INCy0YDQtdC80LXQvdC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjyDQvtGC0L3QvtGB0LjRgtC10LvRjNC90L4g0LLRgNC10LzQtdC90Lgg0YLQvtGA0LPQvtCy0L7QuSDRgtC+0YfQutC4XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPVxyXG4gICAgICAgIFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxyXG4gICAgICAgICAgPFRpbWVTdHJpbmc+Zm9ybWF0RGF0ZShjdXJyZW50ZGF0ZSwgJ0hIOm1tJywgJ2VuJylcclxuICAgICAgICApICsgbG9rYWxUaW1lRGVsdGE7XHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiDRgtC10LrRg9GJ0LXQtSDQstGA0LXQvNGPINCyINC80LjQvdGD0YLQsNGFINGBINC90LDRh9Cw0LvQsCDQtNC90Y8gKDYwMCA9IDEwOjAwLiAxMjAwID0gMjA6MDApXHJcbiAgICAgICAqINC10YHQu9C4INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC/0LXRgNC10L/RgNGL0LPQvdGD0Lsg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLCDRgtC+INC/0YDQuNCy0L7QtNC40Lwg0LLRgNC10LzRjyDQuiDQv9GA0LDQstC40LvRjNC90L7QvNGDINC30L3QsNGH0LXQvdC40Y4g0LIg0LTQuNCw0L/QsNC30L7QvdC1IDI0INGH0LDRgdC+0LJcclxuICAgICAgICogKi9cclxuICAgICAgY29uc3QgY3VycmVudFRpbWUgPVxyXG4gICAgICAgIGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwXHJcbiAgICAgICAgICA/IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgLSAxNDQwXHJcbiAgICAgICAgICA6IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGE7XHJcblxyXG4gICAgICBjb25zdCBjdXJyZW50RGF5V29ya1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXHJcbiAgICAgICAgcmVzdHJpY3Rpb24sXHJcbiAgICAgICAgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDBcclxuICAgICAgICAgID8gbmV3IERhdGUoY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDApXHJcbiAgICAgICAgICA6IGN1cnJlbnRkYXRlXHJcbiAgICAgICk7IC8vINGC0LXQutGD0YnQtdC1INGA0LDQsdC+0YfQtdC1INCy0YDQtdC80Y9cclxuICAgICAgY29uc3QgY3VyZW50RGF5U3RhcnRUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoXHJcbiAgICAgICAgPFRpbWVTdHJpbmc+Y3VycmVudERheVdvcmtUaW1lLnN0YXJ0XHJcbiAgICAgICk7IC8vINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFXHJcbiAgICAgIGNvbnN0IGN1cmVudERheVN0b3BUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoXHJcbiAgICAgICAgPFRpbWVTdHJpbmc+Y3VycmVudERheVdvcmtUaW1lLnN0b3BcclxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YVcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB3b3JrTm93OlxyXG4gICAgICAgICAgY3VycmVudFRpbWUgPCBjdXJlbnREYXlTdG9wVGltZSAmJiBjdXJyZW50VGltZSA+IGN1cmVudERheVN0YXJ0VGltZSxcclxuICAgICAgICBpc05ld0RheTogY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDAsXHJcbiAgICAgICAgY3VycmVudFRpbWUsXHJcbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lLFxyXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0JTQvtGB0YLQsNCy0LrQsCDQutGD0YDRjNC10YDQvtC8XCIuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUoXHJcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXHJcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxyXG4gICk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBjaGVja1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5pc1dvcmtOb3cocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcclxuXHJcbiAgICBpZiAoY2hlY2tUaW1lLndvcmtOb3cgJiYgY2hlY2tUaW1lLmN1cnJlbnRUaW1lKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCfQodC10LnRh9Cw0YEg0YDQsNCx0L7Rh9C10LUg0LLRgNC10LzRjy4g0KDQsNGB0YfQtdGCINC90LUg0YLRgNC10LHRg9C10YLRgdGPLicpO1xyXG4gICAgICBjb25zdCBwb3NzaWJsZVRpbWUgPVxyXG4gICAgICAgIGNoZWNrVGltZS5jdXJyZW50VGltZSArICgrcmVzdHJpY3Rpb24ubWluRGVsaXZlcnlUaW1lSW5NaW51dGVzIHx8IDApO1xyXG4gICAgICBjb25zdCBwb3NzaWJsZVRpbWVTdHIgPVxyXG4gICAgICAgIFdvcmtUaW1lVmFsaWRhdG9yLmNvbnZlcnRNaW51dGVzVG9UaW1lKHBvc3NpYmxlVGltZSk7XHJcbiAgICAgIHJldHVybiBmb3JtYXREYXRlKGN1cnJlbnRkYXRlLCBgeXl5eS1NTS1kZCAke3Bvc3NpYmxlVGltZVN0cn1gLCAnZW4nKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChjaGVja1RpbWUuY3VycmVudFRpbWUgJiYgY2hlY2tUaW1lLmN1cmVudERheVN0b3BUaW1lKSB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudERheVdvcmtUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxyXG4gICAgICAgICAgcmVzdHJpY3Rpb24sXHJcbiAgICAgICAgICBjaGVja1RpbWUuaXNOZXdEYXlcclxuICAgICAgICAgICAgPyBuZXcgRGF0ZShjdXJyZW50ZGF0ZS5nZXRUaW1lKCkgKyA4NjQwMDAwMClcclxuICAgICAgICAgICAgOiBjdXJyZW50ZGF0ZVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc3QgdGltZSA9XHJcbiAgICAgICAgICB0aGlzLmdldFRpbWVGcm9tU3RyaW5nKDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdGFydCkgK1xyXG4gICAgICAgICAgK3Jlc3RyaWN0aW9uLm1pbkRlbGl2ZXJ5VGltZUluTWludXRlcztcclxuICAgICAgICBjb25zdCB0aW1lU3RyaW5nID0gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUodGltZSk7XHJcbiAgICAgICAgcmV0dXJuIGZvcm1hdERhdGUoXHJcbiAgICAgICAgICBjaGVja1RpbWUuaXNOZXdEYXkgfHxcclxuICAgICAgICAgICAgY2hlY2tUaW1lLmN1cnJlbnRUaW1lID4gY2hlY2tUaW1lLmN1cmVudERheVN0b3BUaW1lXHJcbiAgICAgICAgICAgID8gY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDBcclxuICAgICAgICAgICAgOiBjdXJyZW50ZGF0ZSxcclxuICAgICAgICAgIGB5eXl5LU1NLWRkICR7dGltZVN0cmluZ31gLFxyXG4gICAgICAgICAgJ2VuJ1xyXG4gICAgICAgICk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0YDQsNGB0YHRh9C40YLQsNGC0YwgY3VycmVudFRpbWUg0LggY3VyZW50RGF5U3RvcFRpbWUuJztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0KHQsNC80L7QstGL0LLQvtC3XCIuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZShcclxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcixcclxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXHJcbiAgKTogc3RyaW5nIHtcclxuICAgIC8qKlxyXG4gICAgICog0JTQu9GPINC+0LHQtdGB0L/QtdGH0LXQvdC40Y8g0LjQvNC80YPRgtCw0LHQtdC70YzQvdC+0YHRgtC4INC00LDQvdC90YvRhSDRgdC+0LfQtNCw0LXRgtGB0Y8g0L3QvtCy0YvQuSDQvtCx0YzQtdC60YIgcmVzdHJpY3Rpb25zLCDQuNC00LXQvdGC0LjRh9C90YvQuSDQv9C+0LvRg9GH0LXQvdC90L7QvNGDINCyINC/0LDRgNCw0LzQtdGC0YDQsNGFLCDQvdC+INGBINC40LfQvNC10L3QtdC90L3Ri9C8INC80LDRgdGB0LjQstC+0Lwgd29ya3RpbWUuXHJcbiAgICAgKiDQkiDQvNCw0YHRgdC40LLQtSB3b3JrdGltZSDQvtCx0L3QvtCy0LvRj9GO0YLRgdGPINC+0LPRgNCw0L3QuNGH0LXQvdC40Y8g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINGBINC+0LHRi9GH0L3Ri9GFINC90LAg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQu9GPINGB0LDQvNC+0LLRi9Cy0L7Qt9CwLlxyXG4gICAgICogKi9cclxuICAgIGNvbnN0IG5ld1Jlc3RyaWN0aW9uID0ge1xyXG4gICAgICAuLi5yZXN0cmljdGlvbixcclxuICAgICAgd29ya3RpbWU6ICg8V29ya1RpbWVbXT5yZXN0cmljdGlvbi53b3JrdGltZSkubWFwKCh3b3JrdGltZSkgPT5cclxuICAgICAgICB3b3JrdGltZS5zZWxmU2VydmljZVxyXG4gICAgICAgICAgPyB7IC4uLndvcmt0aW1lLCAuLi53b3JrdGltZS5zZWxmU2VydmljZSB9XHJcbiAgICAgICAgICA6IHdvcmt0aW1lXHJcbiAgICAgICksXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShcclxuICAgICAgbmV3UmVzdHJpY3Rpb24sXHJcbiAgICAgIGN1cnJlbnRkYXRlXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsNC60YLRg9Cw0LvRjNC90YvQtSDQtNCw0L3QvdGL0LUg0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC40Lcg0LzQsNGB0YHQuNCy0LAg0LLRgdC10YUg0LLQsNGA0LjQsNC90YLQvtCyINC+0LHRjNC10LrRgtCwIHJlc3RyaWN0aW9uLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0Q3VycmVudFdvcmtUaW1lKFxyXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucyxcclxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXHJcbiAgKTogV29ya1RpbWUge1xyXG4gICAgbGV0IGkgPSAwO1xyXG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XHJcbiAgICB3aGlsZSAoaSA8IHJlc3RyaWN0aW9uLndvcmt0aW1lLmxlbmd0aCAmJiAhcmVzdWx0KSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICByZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWsgPT09ICdhbGwnIHx8XHJcbiAgICAgICAgKHR5cGVvZiByZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWsgPT09ICdzdHJpbmcnXHJcbiAgICAgICAgICA/ICg8c3RyaW5nPnJlc3RyaWN0aW9uLndvcmt0aW1lW2ldLmRheU9mV2VlaykudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgICAgOiAoPHN0cmluZ1tdPnJlc3RyaWN0aW9uLndvcmt0aW1lW2ldLmRheU9mV2VlaykubWFwKChkYXkpID0+XHJcbiAgICAgICAgICAgICAgZGF5LnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICkuaW5jbHVkZXMoZm9ybWF0RGF0ZShjdXJyZW50ZGF0ZSwgJ0VFRUUnLCAnZW4nKS50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICApIHtcclxuICAgICAgICByZXN1bHQgPSByZXN0cmljdGlvbi53b3JrdGltZVtpXTtcclxuICAgICAgfVxyXG4gICAgICBpICs9IDE7XHJcbiAgICB9XHJcbiAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ9Cd0LXRgiDQsNC60YLRg9Cw0LvRjNC90L7Qs9C+INGA0LDRgdC/0LjRgdCw0L3QuNGPINGA0LDQsdC+0YLRiyDQtNC70Y8g0YLQtdC60YPRidC10LPQviDQtNC90Y8nKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQm9C+0LPQuNC60LAg0L3QuNC20LUg0L/RgNC10LTQvdCw0LfQvdCw0YfQtdC90LAg0LTQu9GPINC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPINGN0LrQt9C10LzQv9C70Y/RgNCwINC60LvQsNGB0YHQsCBXb3JrVGltZVZhbGlkYXRvclxyXG4gICAqL1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHt9XHJcblxyXG4gIHByaXZhdGUgX21lbW9yeToge1xyXG4gICAgZ2V0TWF4T3JkZXJEYXRlOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xyXG4gICAgZ2V0VGltZUZyb21TdHJpbmc6IE1hcDxzdHJpbmcsIG51bWJlcj47XHJcbiAgICBpc1dvcmtOb3c6IE1hcDxzdHJpbmcsIFZhbGlkYXRvclJlc3VsdD47XHJcbiAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IE1hcDxzdHJpbmcsIHN0cmluZz47XHJcbiAgICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZTogTWFwPHN0cmluZywgc3RyaW5nPjtcclxuICAgIGdldEN1cnJlbnRXb3JrVGltZTogTWFwPHN0cmluZywgV29ya1RpbWU+O1xyXG4gICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IE1hcDxzdHJpbmcsIFRpbWVTdHJpbmc+O1xyXG4gIH0gPSB7XHJcbiAgICBnZXRNYXhPcmRlckRhdGU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXHJcbiAgICBnZXRUaW1lRnJvbVN0cmluZzogbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKSxcclxuICAgIGlzV29ya05vdzogbmV3IE1hcDxzdHJpbmcsIFZhbGlkYXRvclJlc3VsdD4oKSxcclxuICAgIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZTogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKSxcclxuICAgIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxyXG4gICAgZ2V0Q3VycmVudFdvcmtUaW1lOiBuZXcgTWFwPHN0cmluZywgV29ya1RpbWU+KCksXHJcbiAgICBjb252ZXJ0TWludXRlc1RvVGltZTogbmV3IE1hcDxzdHJpbmcsIFRpbWVTdHJpbmc+KCksXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLCDQvdCwINC60L7RgtC+0YDRg9GOINC80L7QttC90L4g0LfQsNC60LDQt9Cw0YLRjCDQtNC+0YHRgtCw0LLQutGDLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcmV0dXJuIDpzdHJpbmcgLSDQodGC0YDQvtC60LAsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidCw0Y8g0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINC00L7RgdGC0YPQv9C90YPRjiDQtNCw0YLRgyDQtNC+0YHRgtCw0LLQutC4INCyINGE0L7RgNC80LDRgtC1IHl5eXktTU0tZGQuXHJcbiAgICovXHJcbiAgZ2V0TWF4T3JkZXJEYXRlKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRNYXhPcmRlckRhdGUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0TWF4T3JkZXJEYXRlKFxyXG4gICAgICAgIHJlc3RyaWN0aW9uLFxyXG4gICAgICAgIGN1cnJlbnRkYXRlXHJcbiAgICAgICk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRNYXhPcmRlckRhdGUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0YHRgtGA0L7QutCwINCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0g0LLRgNC10LzRjy5cclxuICAgKiBAcmV0dXJuIDpudW1iZXIgLSDQutC+0Lst0LLQviDQvNC40L3Rg9GCLlxyXG4gICAqL1xyXG4gIGdldFRpbWVGcm9tU3RyaW5nKHRpbWU6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHRpbWUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRUaW1lRnJvbVN0cmluZy5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyg8VGltZVN0cmluZz50aW1lKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldFRpbWVGcm9tU3RyaW5nLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0L/RgNC+0LLQtdGA0Y/QtdGCLCDQtNC+0YHRgtGD0L/QvdCwINC70Lgg0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4INC90LAg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y8uXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjywg0LTQu9GPINC60L7RgtC+0YDRi9GFINC4INC/0YDQvtCy0LXRgNGP0LXRgtGB0Y8g0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4XHJcbiAgICogQHJldHVybiDQntCx0YzQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOOlxyXG4gICAqIHtcclxuICAgICAgICBpc1dvcmtOb3c6Ym9vbGVhbiAtINCS0L7Qt9C80L7QttC90LAg0LvQuCDQtNC+0YHRgtCw0LLQutCwINCyINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPXHJcbiAgICAgICAgaXNOZXdEYXk6Ym9vbGVhbiAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQuNC30L3QsNC6LCDRh9GC0L4g0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINGH0LDRgdC+0LLRi9GFINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0LTQsNGC0YsgXCLQv9C10YDQtdC/0YDRi9Cz0L3Rg9C7XCIg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLlxyXG4gICAgICAgIGN1cnJlbnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQvtCy0LXRgNGP0LXQvNC+0LUg0LzQtdGC0L7QtNC+0Lwg0LLRgNC10LzRjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgICAgY3VyZW50RGF5U3RvcFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgIH1cclxuICAgKi9cclxuICBpc1dvcmtOb3coXHJcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zIHwgUmVzdHJpY3Rpb25zT3JkZXIsXHJcbiAgICBjdXJyZW50ZGF0ZT86IERhdGVcclxuICApOiBWYWxpZGF0b3JSZXN1bHQge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5pc1dvcmtOb3cuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuaXNXb3JrTm93KHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5pc1dvcmtOb3cuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0JTQvtGB0YLQsNCy0LrQsCDQutGD0YDRjNC10YDQvtC8XCIuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShcclxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcixcclxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXHJcbiAgKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPVxyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShcclxuICAgICAgICByZXN0cmljdGlvbixcclxuICAgICAgICBjdXJyZW50ZGF0ZVxyXG4gICAgICApO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCh0LDQvNC+0LLRi9Cy0L7Qt1wiLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZShcclxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcixcclxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXHJcbiAgKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPVxyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUoXHJcbiAgICAgICAgcmVzdHJpY3Rpb24sXHJcbiAgICAgICAgY3VycmVudGRhdGVcclxuICAgICAgKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQuNC3INC80LDRgdGB0LjQstCwINCy0YHQtdGFINCy0LDRgNC40LDQvdGC0L7QsiDQvtCx0YzQtdC60YLQsCByZXN0cmljdGlvbi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgZ2V0Q3VycmVudFdvcmtUaW1lKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMsIGN1cnJlbnRkYXRlOiBEYXRlKTogV29ya1RpbWUge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRDdXJyZW50V29ya1RpbWUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIDxXb3JrVGltZT5jaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldEN1cnJlbnRXb3JrVGltZShcclxuICAgICAgICByZXN0cmljdGlvbixcclxuICAgICAgICBjdXJyZW50ZGF0ZVxyXG4gICAgICApO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0Q3VycmVudFdvcmtUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INC60L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQv9C10YDQtdC00LDQvdC90L7QtSDQutC+0Lst0LLQviDQvNC40L3Rg9GCINCyINGB0YLRgNC+0LrQvtCy0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLSBgKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAuXHJcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcclxuICAgKlxyXG4gICAqIGNvbnN0IGEgPSBjb252ZXJ0TWludXRlc1RvVGltZSg1MCkgLy8gYSA9ICcwMDo1MCdcclxuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTIwMCkgLy8gYiA9ICcyMDowMCdcclxuICAgKlxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0KfQuNGB0LvQviDQsiDQtNC40LDQv9Cw0LfQvtC90LUg0L7RgiAwINC00L4gMTQ0MCAo0YLQsNC6INC60LDQuiDQvNCw0LrRgdC40LzRg9C8INCyIDEg0YHRg9GC0LrQsNGFID0gMTQ0MCDQvNC40L3Rg9GCKS5cclxuICAgKiDQn9GA0Lgg0L/QtdGA0LXQtNCw0YfQtSDQsiB0aW1lINC+0YLRgNC40YbQsNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjywg0LfQvdCw0Log0LHRg9C00LXRgiBcItC+0YLQvtCx0YDRiNC10L1cIiwg0LAg0LTQu9GPINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiwg0YDQsNGB0YHRh9C40YLQsNC90L3Ri9C5INC00LvRjyDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INC/0L7Qu9C+0LbQuNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjy5cclxuICAgKiDQldGB0LvQuCDQsiB0aW1lINCx0YPQtNC10YIg0L/QtdGA0LXQtNCw0L3QviDQt9C90LDRh9C10L3QuNC1INCx0L7Qu9GM0YjQtSAxNDQwIC0g0LzQtdGC0L7QtCDQstC10YDQvdC10YIg0YDQtdC30YPQu9GM0YLQsNGCINC00LvRjyDQt9C90LDRh9C10L3QuNGPINCx0LXQtyDRg9GH0LXRgtCwIFwi0L/RgNC10LLRi9GI0LDRjtGJ0LjRhSDRgdGD0YLQvtC6XCIgKNGCLtC1LiDRgSDQutGA0LDRgtC90YvQvCDQstGL0YfQtdGC0L7QvCAxNDQwINC80LjQvdGD0YIpXHJcbiAgICpcclxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxyXG4gICAqXHJcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDYwKSAvLyBhID0gJzAxOjAwJ1xyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxNTAwKSAvLyBiID0gJzAxOjAwJyAoMTQ0MCDQvNC40L3Rg9GCIFwi0YbQtdC70YvRhVwiINGB0YPRgtC+0Log0LHRi9C70LggXCLQvtGC0LHRgNC+0YjQtdC90YtcIilcclxuICAgKlxyXG4gICAqIEByZXR1cm5zXHJcbiAgICovXHJcbiAgY29udmVydE1pbnV0ZXNUb1RpbWUodGltZTogbnVtYmVyKTogVGltZVN0cmluZyB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHRpbWUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5jb252ZXJ0TWludXRlc1RvVGltZS5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmNvbnZlcnRNaW51dGVzVG9UaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==