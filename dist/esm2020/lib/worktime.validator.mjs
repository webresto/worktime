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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sTUFBTSxDQUFDO0FBd0sxQzs7O0dBR0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLFdBQW9CO0lBQzlDLE9BQU8sQ0FDTCxPQUFPLFdBQVcsS0FBSyxRQUFRO1FBQy9CLFdBQVcsS0FBSyxJQUFJO1FBQ3BCLFVBQVUsSUFBSSxXQUFXO1FBQ3pCLFVBQVUsSUFBSSxXQUFXLENBQzFCLENBQUM7QUFDSixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FDOUIsV0FBOEI7SUFFOUIsT0FBTyxDQUNMLDBCQUEwQixJQUFJLFdBQVc7UUFDekMsMEJBQTBCLElBQUksV0FBVztRQUN6QyxVQUFVLElBQUksV0FBVztRQUN6QixVQUFVLElBQUksV0FBVyxDQUMxQixDQUFDO0FBQ0osQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQUM1Qjs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FDcEIsV0FBOEIsRUFDOUIsV0FBaUI7UUFFakIsSUFDRSxXQUFXO1lBQ1gsdUJBQXVCLENBQUMsV0FBVyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFDbkI7WUFDQSxPQUFPLFVBQVUsQ0FDZixXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsV0FBVyxDQUFDLHdCQUF3QixHQUFHLEtBQUssRUFDcEUsWUFBWSxFQUNaLElBQUksQ0FDTCxDQUFDO1NBQ0g7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQztnQkFDakIsQ0FBQyxDQUFDLG1D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QUFZO1FBQy9CLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLElBQUksV0FBVyxFQUFFO1lBQ2YsT0FBTyxXQUFXLENBQUM7U0FDcEI7YUFBTTtZQUNMLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6RCxPQUFPLE1BQU0sQ0FBQztTQUNmO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZm9ybWF0RGF0ZSwgaXNEYXRlIH0gZnJvbSAnLi9mb3JtYXREYXRlJztcclxuaW1wb3J0IHsgVGltZVpvbmVJZGVudGlmaWVyIH0gZnJvbSAnLi90eic7XHJcblxyXG4vKipcclxuICog0JHQsNC30L7QstGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyAtINGB0LvRg9C20LXQsdC90YvQuSDQuNC90YLQtdGA0YTQtdC50YEuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtUaW1lQmFzZSB7XHJcbiAgLyoqINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cclxuICBzdGFydDogc3RyaW5nO1xyXG5cclxuICAvKiog0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8qL1xyXG4gIHN0b3A6IHN0cmluZztcclxuXHJcbiAgLyoqINC/0LXRgNC10YDRi9CyINC90LAg0L7QsdC10LQqL1xyXG4gIGJyZWFrPzogc3RyaW5nO1xyXG59XHJcblxyXG4vKipcclxuICog0JjQvdGE0L7RgNC80LDRhtC40Y8g0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gLSDRgdC70YPQttC10LHQvdGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBXb3JrVGltZSBleHRlbmRzIFdvcmtUaW1lQmFzZSB7XHJcbiAgLyoqINC00LXQvdGMINC90LXQtNC10LvQuCwg0Log0LrQvtGC0L7RgNC+0LzRgyDQv9GA0LjQvNC10L3Rj9C10YLRgdGPINGN0YLQviDQstGA0LXQvNGPINC00L7RgdGC0LDQstC60LggICAqL1xyXG4gIGRheU9mV2Vlazogc3RyaW5nIHwgc3RyaW5nW107XHJcblxyXG4gIC8qKiDQvtCz0YDQsNC90LjRh9C10L3QuNGPINC/0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC00LvRjyDRgdCw0LzQvtCy0YvQstC+0LfQsCAqL1xyXG4gIHNlbGZTZXJ2aWNlPzogV29ya1RpbWVCYXNlO1xyXG59XHJcblxyXG4vKipcclxuICog0JjQvdGC0LXRgNGE0LXQudGBINC+0LHRitC10LrRgtCwLCDQv9C+0LvRg9GH0LDQtdC80L7Qs9C+INC+0YIgQVBJIEB3ZWJyZXN0by9jb3JlINC4INGB0L7QtNC10YDQttCw0YnQtdCz0L4g0YLQtdC60YPRidC40LUg0LTQsNC90L3Ri9C1INC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y9cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVzdHJpY3Rpb25zIHtcclxuICAvKiog0LLRgNC10LzQtdC90L3QsNGPINC30L7QvdCwINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cclxuICB0aW1lem9uZT86IHN0cmluZztcclxuXHJcbiAgLyoqICDQvNCw0YHRgdC40LIg0L7Qs9GA0LDQvdC40YfQtdC90LjQuSDQv9C+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC00LvRjyDRgNCw0LfQvdGL0YUg0LTQvdC10Lkg0L3QtdC00LXQu9C4LiAqL1xyXG4gIHdvcmt0aW1lOiBXb3JrVGltZVtdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEh0bWxGb3JtRmllbGQge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgdHlwZTogc3RyaW5nO1xyXG4gIGxhYmVsOiBzdHJpbmc7XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZztcclxuICByZXF1aXJlZDogYm9vbGVhbjtcclxuICByZWdleDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvdW50cnkge1xyXG4gIHBob25lQ29kZTogc3RyaW5nO1xyXG4gIGlzbzogc3RyaW5nO1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBuYXRpdmVDb3VudHJ5TmFtZTogc3RyaW5nO1xyXG4gIGxhbmd1YWdlOiBzdHJpbmdbXTtcclxuICBjdXJyZW5jeTogc3RyaW5nO1xyXG4gIGN1cnJlbmN5U3ltYm9sOiBzdHJpbmc7XHJcbiAgY3VycmVuY3lJU086IHN0cmluZztcclxuICBjdXJyZW5jeVVuaXQ6IHN0cmluZztcclxuICBjdXJyZW5jeURlbm9taW5hdGlvbjogbnVtYmVyO1xyXG4gIHBob25lTWFzazogc3RyaW5nW107XHJcbiAgZmxhZzogc3RyaW5nO1xyXG59XHJcblxyXG4vKiog0JTQsNC90L3Ri9C1INC+INC80L7QtNC10LvQuCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC90LAg0YHQsNC50YLQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgVXNlclJlc3RyaWN0aW9ucyB7XHJcbiAgLyoqINCf0L7QutCw0LfRi9Cy0LDQtdGCLCDQutCw0LrQvtC5INCy0LjQtCDQtNCw0L3QvdGL0YUg0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC8INC00LvRjyDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4ICovXHJcbiAgbG9naW5GaWVsZDogc3RyaW5nO1xyXG5cclxuICBjdXN0b21GaWVsZHM/OiBIdG1sRm9ybUZpZWxkW10gfCBudWxsO1xyXG5cclxuICAvKipcclxuICAgKiDQntGC0LrQu9GO0YfQtdC9INC70Lgg0JvQmlxyXG4gICAqL1xyXG4gIGFjY291bnRzRGlzYWJsZTogYm9vbGVhbjtcclxuICAvKipcclxuICAgKiDQntGC0LrQu9GO0YfQtdC90Ysg0LvQuCDQsdC+0L3Rg9GB0L3Ri9C1INC/0YDQvtCz0YDQsNC80LzRi1xyXG4gICAqL1xyXG4gIGJvbnVzUHJvZ3JhbURpc2FibGU6IGJvb2xlYW47XHJcbiAgLyoqXHJcbiAgICog0KLRgNC10LHRg9C10YLRgdGPINC70Lgg0LTQu9GPINCw0LLRgtC+0YDQuNC30LDRhtC40Lgv0YDQtdCz0LjRgdGC0YDQsNGG0LjQuCDQstCy0L7QtCDQv9Cw0YDQvtC70Y9cclxuICAgKi9cclxuICBwYXNzd29yZFJlcXVpcmVkOiBib29sZWFuO1xyXG4gIHJlZ2lzdHJhdGlvbk9UUFJlcXVpcmVkOiBib29sZWFuO1xyXG4gIC8qKlxyXG4gICAqINCU0L7RgdGC0YPQv9C90L4g0LvQuCDQstC+0YHRgdGC0LDQvdC+0LLQu9C10L3QuNC1INC/0LDRgNC+0LvRj1xyXG4gICAqL1xyXG4gIGFsbG93UmVzdG9yZVBhc3N3b3JkOiBib29sZWFuO1xyXG4gIC8qKlxyXG4gICAqINCh0L/QuNGB0L7QuiDRgdGC0YDQsNC9LCDRgtC10LvQtdGE0L7QvdC90YvQtSDQutC+0LTRiyDQutC+0YLQvtGA0YvRhSDQtNC+0YHRgtGD0L/QvdGLINC00LvRjyDRg9C60LDQt9Cw0L3QuNGPINCyINC90L7QvNC10YDQtSDRgtC10LvQtdGE0L7QvdCwINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIGFsbG93ZWRQaG9uZUNvdW50cmllczogQ291bnRyeVtdO1xyXG4gIC8qKlxyXG4gICAqINCh0YHRi9C70LrQsCDQvdCwINC/0L7Qu9C40YLQuNC60YMg0L7QsdGA0LDQsdC+0YLQutC4INC/0LXRgNGB0L7QvdCw0LvRjNC90YvRhSDQtNCw0L3QvdGL0YVcclxuICAgKi9cclxuICBsaW5rVG9Qcm9jZXNzaW5nUGVyc29uYWxEYXRhOiBzdHJpbmc7XHJcbiAgLyoqXHJcbiAgICog0KHRgdGL0LvQutCwINC90LAg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GM0YHQutC+0LUg0YHQvtCz0LvQsNGI0LXQvdC40LVcclxuICAgKi9cclxuICBsaW5rVG9Vc2VyQWdyZWVtZW50OiBzdHJpbmc7XHJcbiAgLyoqXHJcbiAgICog0JTQu9C40L3QsCDQutC+0LTQsCDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjRjyBPVFBcclxuICAgKi9cclxuICBPVFBsZW5ndGg6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZXN0cmljdGlvbnNPcmRlciBleHRlbmRzIFJlc3RyaWN0aW9ucyB7XHJcbiAgLyoqINC80LjQvdC40LzQsNC70YzQvdC+0LUg0LLRgNC10LzRjyDQtNC+0YHRgtCw0LLQutC4Ki9cclxuICBtaW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXM6IHN0cmluZztcclxuXHJcbiAgLyoqINC+0LPRgNCw0L3QuNGH0LXQvdC40LUg0LzQsNC60YHQuNC80LDQu9GM0L3QvtC5INC00LDRgtGLINC30LDQutCw0LfQsCDQsiDQsdGD0LTRg9GJ0LXQvCAo0LIg0LzQuNC90YPRgtCw0YUpKi9cclxuICBwb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXM6IG51bWJlcjtcclxuXHJcbiAgLyoqICDRg9GB0YLQsNC90L7QstC70LXQvdC+INC70Lgg0L3QsCDRgtC10LrRg9GJ0LjQuSDQvNC+0LzQtdC90YIg0L7Qs9GA0LDQvdC40YfQtdC90LjQtSDQtNC+0YHRgtCw0LLQutC4INC90LAg0L7Qv9GA0LXQtNC10LvQtdC90L3QvtC1INCy0YDQtdC80Y8gKi9cclxuICBkZWxpdmVyeVRvVGltZUVuYWJsZWQ/OiBib29sZWFuO1xyXG5cclxuICAvKiog0JTQvtC/0L7Qu9C90LjRgtC10LvRjNC90YvQuSDQutC+0LzQvNC10L3RgtCw0YDQuNC5INC/0L4g0LTQvtGB0YLQsNCy0LrQtSAqL1xyXG4gIGRlbGl2ZXJ5RGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcblxyXG4gIC8qKiDQoNCw0LfQvdC+0LLQuNC00L3QvtGB0YLRjCDQstCy0L7QtNC40LzQvtC5INC60LDQv9GH0LggKi9cclxuICBjYXB0Y2hhVHlwZT86IHN0cmluZyB8IG51bGw7XHJcblxyXG4gIC8qKiDQlNCw0L3QvdGL0LUg0L4g0LzQvtC00LXQu9C4INCw0LLRgtC+0YDQuNC30LDRhtC40Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9C10Lkg0L3QsCDRgdCw0LnRgtC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cclxuICB1c2VyPzogVXNlclJlc3RyaWN0aW9ucyB8IG51bGw7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVmFsaWRhdG9yUmVzdWx0IHtcclxuICB3b3JrTm93OiBib29sZWFuO1xyXG4gIGlzTmV3RGF5PzogYm9vbGVhbjtcclxuICBjdXJyZW50VGltZT86IG51bWJlcjtcclxuICBjdXJlbnREYXlTdGFydFRpbWU/OiBudW1iZXI7XHJcbiAgY3VyZW50RGF5U3RvcFRpbWU/OiBudW1iZXI7XHJcbn1cclxuXHJcbi8qKiDQotC40L8sINC+0L/QuNGB0YvQstCw0Y7RidC40Lkg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YHQtdGFINGG0LjRhNGAICovXHJcbnR5cGUgRGlnaXRzID0gJzAnIHwgJzEnIHwgJzInIHwgJzMnIHwgJzQnIHwgJzUnIHwgJzYnIHwgJzcnIHwgJzgnIHwgJzknO1xyXG5cclxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUgMjQg0YfQsNGB0L7QsiDQvtC00L3QuNGFINGB0YPRgtC+0LogKi9cclxuZXhwb3J0IHR5cGUgSG91cnNEaWdpdHMgPVxyXG4gIHwgJzAwJ1xyXG4gIHwgJzAxJ1xyXG4gIHwgJzAyJ1xyXG4gIHwgJzAzJ1xyXG4gIHwgJzA0J1xyXG4gIHwgJzA1J1xyXG4gIHwgJzA2J1xyXG4gIHwgJzA3J1xyXG4gIHwgJzA4J1xyXG4gIHwgJzA5J1xyXG4gIHwgJzEwJ1xyXG4gIHwgJzExJ1xyXG4gIHwgJzEyJ1xyXG4gIHwgJzEzJ1xyXG4gIHwgJzE0J1xyXG4gIHwgJzE1J1xyXG4gIHwgJzE2J1xyXG4gIHwgJzE3J1xyXG4gIHwgJzE4J1xyXG4gIHwgJzE5J1xyXG4gIHwgJzIwJ1xyXG4gIHwgJzIxJ1xyXG4gIHwgJzIyJ1xyXG4gIHwgJzIzJztcclxuXHJcbi8qKiDQotC40L8sINC+0L/QuNGB0YvQstCw0Y7RidC40Lkg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1IDYwINC80LjQvdGD0YIg0L7QtNC90L7Qs9C+INGH0LDRgdCwKi9cclxuZXhwb3J0IHR5cGUgTWludXRlRGlnaXRzID0gYCR7JzAnIHwgJzEnIHwgJzInIHwgJzMnIHwgJzQnIHwgJzUnfSR7RGlnaXRzfWA7XHJcblxyXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgICovXHJcbmV4cG9ydCB0eXBlIFRpbWVTdHJpbmcgPSBgJHtIb3Vyc0RpZ2l0c306JHtNaW51dGVEaWdpdHN9YDtcclxuXHJcbi8qKlxyXG4gKiDQpNGD0L3QutGG0LjRjyDQstCw0LvQuNC00LDRhtC40Lgg0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQvtCx0YrQtdC60YLQsCByZXN0cmljdGlvbiDQvdCwINGB0L7QvtGC0LLQtdGC0YHRgtCy0LjQtSDQuNC90YLQtdGA0YTQtdC50YHRgyBSZXN0cmljdGlvbnNcclxuICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L/RgNC+0LLQtdGA0Y/QtdC80YvQuSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC4INCy0YDQtdC80LXQvdC90L7QuSDQt9C+0L3QtS5cclxuICovXHJcbmZ1bmN0aW9uIGlzVmFsaWRSZXN0cmljdGlvbihyZXN0cmljdGlvbjogdW5rbm93bik6IHJlc3RyaWN0aW9uIGlzIFJlc3RyaWN0aW9ucyB7XHJcbiAgcmV0dXJuIChcclxuICAgIHR5cGVvZiByZXN0cmljdGlvbiA9PT0gJ29iamVjdCcgJiZcclxuICAgIHJlc3RyaWN0aW9uICE9PSBudWxsICYmXHJcbiAgICAndGltZXpvbmUnIGluIHJlc3RyaWN0aW9uICYmXHJcbiAgICAnd29ya3RpbWUnIGluIHJlc3RyaWN0aW9uXHJcbiAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqINCk0YPQvdC60YbQuNGPINCy0LDQu9C40LTQsNGG0LjQuCDQv9C10YDQtdC00LDQvdC90L7Qs9C+INC+0LHRitC10LrRgtCwIHJlc3RyaWN0aW9uINC90LAg0YHQvtC+0YLQstC10YLRgdGC0LLQuNC1INC80LjQvdC40LzQsNC70YzQvdGL0Lwg0LTQsNC90L3Ri9C8INC00LvRjyDQt9Cw0LrQsNC30LBcclxuICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gKi9cclxuZnVuY3Rpb24gaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIoXHJcbiAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyXHJcbik6IHJlc3RyaWN0aW9uIGlzIFJlc3RyaWN0aW9uc09yZGVyIHtcclxuICByZXR1cm4gKFxyXG4gICAgJ21pbkRlbGl2ZXJ5VGltZUluTWludXRlcycgaW4gcmVzdHJpY3Rpb24gJiZcclxuICAgICdwb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXMnIGluIHJlc3RyaWN0aW9uICYmXHJcbiAgICAndGltZXpvbmUnIGluIHJlc3RyaWN0aW9uICYmXHJcbiAgICAnd29ya3RpbWUnIGluIHJlc3RyaWN0aW9uXHJcbiAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqINCa0LvQsNGB0YEsINGB0L7QtNC10YDQttCw0YnQuNC5INGB0YLQsNGC0LjRh9C10YHQutC40LUg0LzQtdGC0L7QtNGLLCDQvdC10L7QsdGF0L7QtNC40LzRi9C1INC00LvRjyDRgNCw0LHQvtGC0Ysg0YEg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9C80Lgg0YDQsNCx0L7Rh9C10LPQviDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gKiDQodC+0LfQtNCw0LLQsNGC0Ywg0L3QvtCy0YvQuSDRjdC60LfQtdC80L/Qu9GP0YAg0Y3RgtC+0LPQviDQutC70LDRgdGB0LAg0LTQu9GPINC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPINGB0YLQsNGC0LjRh9C10YHQutC40YUg0LzQtdGC0L7QtNC+0LIg0L3QtSDRgtGA0LXQsdGD0LXRgtGB0Y8uXHJcbiAqXHJcbiAqINCf0YDQuCDRjdGC0L7QvCDQv9GA0Lgg0YHQvtC30LTQsNC90LjQuCDRjdC60LfQtdC80L/Qu9GP0YDQsCDQutC70LDRgdGB0LAg0YMg0L7QsdGK0LXQutGC0LAg0YLQsNC60LbQtSDQsdGD0LTRg9GCINC00L7RgdGC0YPQv9C90Ysg0YHQvtCx0YHRgtCy0LXQvdC90YvQtSDRgNC10LDQu9C40LfQsNGG0LjQuFxyXG4gKiDQstGB0LXRhSDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyLlxyXG4gKiDQrdGC0Lgg0YDQtdCw0LvQuNC30LDRhtC40Lgg0L7RgtC70LjRh9Cw0Y7RgtGB0Y8g0L7RgiDQstGL0LfQvtCy0L7QsiDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyINGC0L7Qu9GM0LrQviDQvNC10LzQvtC40LfQsNGG0LjQtdC5INCy0YvQv9C+0LvQvdC10L3QvdGL0YUg0YDQsNGB0YfQtdGC0L7Qsi5cclxuICpcclxuICovXHJcbmV4cG9ydCBjbGFzcyBXb3JrVGltZVZhbGlkYXRvciB7XHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLCDQvdCwINC60L7RgtC+0YDRg9GOINC80L7QttC90L4g0LfQsNC60LDQt9Cw0YLRjCDQtNC+0YHRgtCw0LLQutGDLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcmV0dXJuINCh0YLRgNC+0LrQsCwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LDRjyDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LTQvtGB0YLRg9C/0L3Rg9GOINC00LDRgtGDINC00L7RgdGC0LDQstC60Lgg0LIg0YTQvtGA0LzQsNGC0LUgeXl5eS1NTS1kZC5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0TWF4T3JkZXJEYXRlKFxyXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxyXG4gICAgY3VycmVudGRhdGU6IERhdGVcclxuICApOiBzdHJpbmcge1xyXG4gICAgaWYgKFxyXG4gICAgICByZXN0cmljdGlvbiAmJlxyXG4gICAgICBpc1ZhbGlkUmVzdHJpY3Rpb25PcmRlcihyZXN0cmljdGlvbikgJiZcclxuICAgICAgaXNEYXRlKGN1cnJlbnRkYXRlKVxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBmb3JtYXREYXRlKFxyXG4gICAgICAgIGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIHJlc3RyaWN0aW9uLnBvc3NpYmxlVG9PcmRlckluTWludXRlcyAqIDYwMDAwLFxyXG4gICAgICAgICd5eXl5LU1NLWRkJyxcclxuICAgICAgICAnZW4nXHJcbiAgICAgICk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgaXNEYXRlKGN1cnJlbnRkYXRlKVxyXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnXHJcbiAgICAgICAgICA6ICFyZXN0cmljdGlvblxyXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJ1xyXG4gICAgICAgICAgOiAn0J/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucydcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0YHRgtGA0L7QutCwINCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC1gKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAgLSDQstGA0LXQvNGPLlxyXG4gICAqIEByZXR1cm4g0LrQvtC7LdCy0L4g0LzQuNC90YPRgi5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0VGltZUZyb21TdHJpbmcodGltZTogVGltZVN0cmluZyk6IG51bWJlciB7XHJcbiAgICBpZiAoIXRpbWUpIHtcclxuICAgICAgdGhyb3cgJ9Cd0LUg0L/QtdGA0LXQtNCw0L3QsCDRgdGC0YDQvtC60LAg0YEg0L/RgNC10L7QsdGA0LDQt9GD0LXQvNGL0Lwg0LLRgNC10LzQtdC90LXQvCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSc7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZWdFeHAgPSBuZXcgUmVnRXhwKFxyXG4gICAgICAgIC9eKDAwfDAxfDAyfDAzfDA0fDA1fDA2fDA3fDA4fDA5fDEwfDExfDEyfDEzfDE0fDE1fDE2fDE3fDE4fDE5fDIwfDIxfDIyfDIzKSs6KFswLTVdXFxkKSsvXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAocmVnRXhwLnRlc3QodGltZSkpIHtcclxuICAgICAgICBsZXQgY2hlY2tlZFRpbWUgPSB0aW1lLnRyaW0oKTtcclxuICAgICAgICBpZiAoY2hlY2tlZFRpbWUuaW5jbHVkZXMoJyAnKSB8fCBjaGVja2VkVGltZS5pbmNsdWRlcygnVCcpKSB7XHJcbiAgICAgICAgICBjaGVja2VkVGltZSA9IGNoZWNrZWRUaW1lLnNwbGl0KFxyXG4gICAgICAgICAgICBjaGVja2VkVGltZS5pbmNsdWRlcygnICcpID8gJyAnIDogJ1QnXHJcbiAgICAgICAgICApWzFdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICtjaGVja2VkVGltZS5zcGxpdCgnOicpWzBdICogNjAgKyArY2hlY2tlZFRpbWUuc3BsaXQoJzonKVsxXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyAn0J/QtdGA0LXQtNCw0L3QvdCw0Y8g0YHRgtGA0L7QutCwINC90LUg0YHQvtC+0YLQstC10YLRgdGC0LLRg9C10YIg0YTQvtGA0LzQsNGC0YMgSEg6bW0gLWAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYCc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINC/0LXRgNC10LTQsNC90L3QvtC1INC60L7Quy3QstC+INC80LjQvdGD0YIg0LIg0YHRgtGA0L7QutC+0LLQtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtIGAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYC5cclxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxyXG4gICAqXHJcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDUwKSAvLyBhID0gJzAwOjUwJ1xyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxMjAwKSAvLyBiID0gJzIwOjAwJ1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHRpbWUgLSDQp9C40YHQu9C+INCyINC00LjQsNC/0LDQt9C+0L3QtSDQvtGCIDAg0LTQviAxNDQwICjRgtCw0Log0LrQsNC6INC80LDQutGB0LjQvNGD0Lwg0LIgMSDRgdGD0YLQutCw0YUgPSAxNDQwINC80LjQvdGD0YIpLlxyXG4gICAqINCf0YDQuCDQv9C10YDQtdC00LDRh9C1INCyIHRpbWUg0L7RgtGA0LjRhtCw0YLQtdC70YzQvdC+0LPQviDQt9C90LDRh9C10L3QuNGPLCDQt9C90LDQuiDQsdGD0LTQtdGCIFwi0L7RgtC+0LHRgNGI0LXQvVwiLCDQsCDQtNC70Y8g0LzQtdGC0L7QtCDQstC10YDQvdC10YIg0YDQtdC30YPQu9GM0YLQsNGCLCDRgNCw0YHRgdGH0LjRgtCw0L3QvdGL0Lkg0LTQu9GPINC/0L7Qu9GD0YfQtdC90L3QvtCz0L4g0L/QvtC70L7QttC40YLQtdC70YzQvdC+0LPQviDQt9C90LDRh9C10L3QuNGPLlxyXG4gICAqINCV0YHQu9C4INCyIHRpbWUg0LHRg9C00LXRgiDQv9C10YDQtdC00LDQvdC+INC30L3QsNGH0LXQvdC40LUg0LHQvtC70YzRiNC1IDE0NDAgLSDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIg0LTQu9GPINC30L3QsNGH0LXQvdC40Y8g0LHQtdC3INGD0YfQtdGC0LAgXCLQv9GA0LXQstGL0YjQsNGO0YnQuNGFINGB0YPRgtC+0LpcIiAo0YIu0LUuINGBINC60YDQsNGC0L3Ri9C8INCy0YvRh9C10YLQvtC8IDE0NDAg0LzQuNC90YPRgilcclxuICAgKlxyXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XHJcbiAgICpcclxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNjApIC8vIGEgPSAnMDE6MDAnXHJcbiAgICogY29uc3QgYiA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDE1MDApIC8vIGIgPSAnMDE6MDAnICgxNDQwINC80LjQvdGD0YIgXCLRhtC10LvRi9GFXCIg0YHRg9GC0L7QuiDQsdGL0LvQuCBcItC+0YLQsdGA0L7RiNC10L3Ri1wiKVxyXG4gICAqXHJcbiAgICogQHJldHVybnNcclxuICAgKi9cclxuICBzdGF0aWMgY29udmVydE1pbnV0ZXNUb1RpbWUodGltZTogbnVtYmVyKTogVGltZVN0cmluZyB7XHJcbiAgICBpZiAodGltZSA8IDE0NDEpIHtcclxuICAgICAgY29uc3QgaG91ciA9IE1hdGguZmxvb3IodGltZSAvIDYwKTtcclxuICAgICAgY29uc3QgaG91clN0cjogSG91cnNEaWdpdHMgPSA8SG91cnNEaWdpdHM+KFxyXG4gICAgICAgIChob3VyIDw9IDkgPyBgMCR7U3RyaW5nKGhvdXIpfWAgOiBTdHJpbmcoaG91cikpXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnN0IG1pbnV0ZXNTdHI6IE1pbnV0ZURpZ2l0cyA9IDxNaW51dGVEaWdpdHM+U3RyaW5nKHRpbWUgLSBob3VyICogNjApO1xyXG4gICAgICByZXR1cm4gYCR7aG91clN0cn06JHttaW51dGVzU3RyfWA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUodGltZSAtIDE0NDApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQv9GA0L7QstC10YDRj9C10YIsINC00L7RgdGC0YPQv9C90LAg0LvQuCDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60Lgg0L3QsCDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRjy5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPLCDQtNC70Y8g0LrQvtGC0L7RgNGL0YUg0Lgg0L/RgNC+0LLQtdGA0Y/QtdGC0YHRjyDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60LhcclxuICAgKiBAcmV0dXJuINCe0LHRjNC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y46XHJcbiAgICoge1xyXG4gICAgICAgIGlzV29ya05vdzpib29sZWFuIC0g0JLQvtC30LzQvtC20L3QsCDQu9C4INC00L7RgdGC0LDQstC60LAg0LIg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y9cclxuICAgICAgICBpc05ld0RheTpib29sZWFuIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC40LfQvdCw0LosINGH0YLQviDQuNC3LdC30LAg0YDQsNC30L3QuNGG0Ysg0YfQsNGB0L7QstGL0YUg0L/QvtGP0YHQvtCyINGA0LDRgdGH0LXRgiDQtNCw0YLRiyBcItC/0LXRgNC10L/RgNGL0LPQvdGD0LtcIiDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwuXHJcbiAgICAgICAgY3VycmVudFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC+0LLQtdGA0Y/QtdC80L7QtSDQvNC10YLQvtC00L7QvCDQstGA0LXQvNGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICAgIGN1cmVudERheVN0YXJ0VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBpc1dvcmtOb3coXHJcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zIHwgUmVzdHJpY3Rpb25zT3JkZXIsXHJcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKClcclxuICApOiBWYWxpZGF0b3JSZXN1bHQge1xyXG4gICAgaWYgKCFyZXN0cmljdGlvbi53b3JrdGltZSB8fCAhT2JqZWN0LmtleXMocmVzdHJpY3Rpb24ud29ya3RpbWUpLmxlbmd0aCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHdvcmtOb3c6IHRydWUsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8g0JXRgdC70Lgg0LjRgdC/0L7Qu9GM0L3Rj9C10YLRgdGPINCyIE5vZGVKU1xyXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAhcmVzdHJpY3Rpb24udGltZXpvbmUpIHtcclxuICAgICAgcmVzdHJpY3Rpb24udGltZXpvbmUgPSBwcm9jZXNzLmVudi5UWlxyXG4gICAgICAgID8gcHJvY2Vzcy5lbnYuVFpcclxuICAgICAgICA6IEludGwuRGF0ZVRpbWVGb3JtYXQoKS5yZXNvbHZlZE9wdGlvbnMoKS50aW1lWm9uZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXJlc3RyaWN0aW9uIHx8ICFpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAhaXNEYXRlKGN1cnJlbnRkYXRlKVxyXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnXHJcbiAgICAgICAgICA6ICFyZXN0cmljdGlvblxyXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJ1xyXG4gICAgICAgICAgOiAn0J/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucydcclxuICAgICAgKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IGNvbXBhbnlMb2NhbFRpbWVab25lID1cclxuICAgICAgICBUaW1lWm9uZUlkZW50aWZpZXIuZ2V0VGltZVpvbmVHTVRPZmZzZXRmcm9tTmFtZVpvbmUoXHJcbiAgICAgICAgICByZXN0cmljdGlvbi50aW1lem9uZVxyXG4gICAgICAgICkuc3BsaXQoJzonKTtcclxuICAgICAgY29uc3QgY29tcGFueUxvY2FsVGltZVpvbmVEZWx0YSA9XHJcbiAgICAgICAgK2NvbXBhbnlMb2NhbFRpbWVab25lWzBdICogNjAgKyArY29tcGFueUxvY2FsVGltZVpvbmVbMV07XHJcbiAgICAgIGNvbnN0IGxva2FsVGltZURlbHRhID1cclxuICAgICAgICBjb21wYW55TG9jYWxUaW1lWm9uZURlbHRhICsgY3VycmVudGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKTsgLy8g0YHQvNC10YnQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0L7RgtC90L7RgdC40YLQtdC70YzQvdC+INCy0YDQtdC80LXQvdC4INGC0L7RgNCz0L7QstC+0Lkg0YLQvtGH0LrQuFxyXG4gICAgICBjb25zdCBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID1cclxuICAgICAgICBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyhcclxuICAgICAgICAgIDxUaW1lU3RyaW5nPmZvcm1hdERhdGUoY3VycmVudGRhdGUsICdISDptbScsICdlbicpXHJcbiAgICAgICAgKSArIGxva2FsVGltZURlbHRhO1xyXG4gICAgICAvKipcclxuICAgICAgICog0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQsiDQvNC40L3Rg9GC0LDRhSDRgSDQvdCw0YfQsNC70LAg0LTQvdGPICg2MDAgPSAxMDowMC4gMTIwMCA9IDIwOjAwKVxyXG4gICAgICAgKiDQtdGB0LvQuCDQuNC3LdC30LAg0YDQsNC30L3QuNGG0Ysg0L/QvtGP0YHQvtCyINGA0LDRgdGH0LXRgiDQv9C10YDQtdC/0YDRi9Cz0L3Rg9C7INC90LAg0L3QvtCy0YvQuSDQtNC10L3RjCwg0YLQviDQv9GA0LjQstC+0LTQuNC8INCy0YDQtdC80Y8g0Log0L/RgNCw0LLQuNC70YzQvdC+0LzRgyDQt9C90LDRh9C10L3QuNGOINCyINC00LjQsNC/0LDQt9C+0L3QtSAyNCDRh9Cw0YHQvtCyXHJcbiAgICAgICAqICovXHJcbiAgICAgIGNvbnN0IGN1cnJlbnRUaW1lID1cclxuICAgICAgICBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID4gMTQ0MFxyXG4gICAgICAgICAgPyBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhIC0gMTQ0MFxyXG4gICAgICAgICAgOiBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhO1xyXG5cclxuICAgICAgY29uc3QgY3VycmVudERheVdvcmtUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxyXG4gICAgICAgIHJlc3RyaWN0aW9uLFxyXG4gICAgICAgIGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwXHJcbiAgICAgICAgICA/IG5ldyBEYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKVxyXG4gICAgICAgICAgOiBjdXJyZW50ZGF0ZVxyXG4gICAgICApOyAvLyDRgtC10LrRg9GJ0LXQtSDRgNCw0LHQvtGH0LXQtSDQstGA0LXQvNGPXHJcbiAgICAgIGNvbnN0IGN1cmVudERheVN0YXJ0VGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxyXG4gICAgICAgIDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdGFydFxyXG4gICAgICApOyAvLyDRgtC10LrRg9GJ0LXQtSDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhVxyXG4gICAgICBjb25zdCBjdXJlbnREYXlTdG9wVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxyXG4gICAgICAgIDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdG9wXHJcbiAgICAgICk7IC8vINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgd29ya05vdzpcclxuICAgICAgICAgIGN1cnJlbnRUaW1lIDwgY3VyZW50RGF5U3RvcFRpbWUgJiYgY3VycmVudFRpbWUgPiBjdXJlbnREYXlTdGFydFRpbWUsXHJcbiAgICAgICAgaXNOZXdEYXk6IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwLFxyXG4gICAgICAgIGN1cnJlbnRUaW1lLFxyXG4gICAgICAgIGN1cmVudERheVN0YXJ0VGltZSxcclxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZSxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCU0L7RgdGC0LDQstC60LAg0LrRg9GA0YzQtdGA0L7QvFwiLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKFxyXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxyXG4gICAgY3VycmVudGRhdGU6IERhdGVcclxuICApOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY2hlY2tUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuaXNXb3JrTm93KHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcblxyXG4gICAgaWYgKGNoZWNrVGltZS53b3JrTm93ICYmIGNoZWNrVGltZS5jdXJyZW50VGltZSkge1xyXG4gICAgICBjb25zb2xlLmxvZygn0KHQtdC50YfQsNGBINGA0LDQsdC+0YfQtdC1INCy0YDQtdC80Y8uINCg0LDRgdGH0LXRgiDQvdC1INGC0YDQtdCx0YPQtdGC0YHRjy4nKTtcclxuICAgICAgY29uc3QgcG9zc2libGVUaW1lID1cclxuICAgICAgICBjaGVja1RpbWUuY3VycmVudFRpbWUgKyAoK3Jlc3RyaWN0aW9uLm1pbkRlbGl2ZXJ5VGltZUluTWludXRlcyB8fCAwKTtcclxuICAgICAgY29uc3QgcG9zc2libGVUaW1lU3RyID1cclxuICAgICAgICBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZShwb3NzaWJsZVRpbWUpO1xyXG4gICAgICByZXR1cm4gZm9ybWF0RGF0ZShjdXJyZW50ZGF0ZSwgYHl5eXktTU0tZGQgJHtwb3NzaWJsZVRpbWVTdHJ9YCwgJ2VuJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoY2hlY2tUaW1lLmN1cnJlbnRUaW1lICYmIGNoZWNrVGltZS5jdXJlbnREYXlTdG9wVGltZSkge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnREYXlXb3JrVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldEN1cnJlbnRXb3JrVGltZShcclxuICAgICAgICAgIHJlc3RyaWN0aW9uLFxyXG4gICAgICAgICAgY2hlY2tUaW1lLmlzTmV3RGF5XHJcbiAgICAgICAgICAgID8gbmV3IERhdGUoY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDApXHJcbiAgICAgICAgICAgIDogY3VycmVudGRhdGVcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbnN0IHRpbWUgPVxyXG4gICAgICAgICAgdGhpcy5nZXRUaW1lRnJvbVN0cmluZyg8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RhcnQpICtcclxuICAgICAgICAgICtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXM7XHJcbiAgICAgICAgY29uc3QgdGltZVN0cmluZyA9IFdvcmtUaW1lVmFsaWRhdG9yLmNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWUpO1xyXG4gICAgICAgIHJldHVybiBmb3JtYXREYXRlKFxyXG4gICAgICAgICAgY2hlY2tUaW1lLmlzTmV3RGF5IHx8XHJcbiAgICAgICAgICAgIGNoZWNrVGltZS5jdXJyZW50VGltZSA+IGNoZWNrVGltZS5jdXJlbnREYXlTdG9wVGltZVxyXG4gICAgICAgICAgICA/IGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwXHJcbiAgICAgICAgICAgIDogY3VycmVudGRhdGUsXHJcbiAgICAgICAgICBgeXl5eS1NTS1kZCAke3RpbWVTdHJpbmd9YCxcclxuICAgICAgICAgICdlbidcclxuICAgICAgICApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93ICfQndC1INGD0LTQsNC70L7RgdGMINGA0LDRgdGB0YfQuNGC0LDRgtGMIGN1cnJlbnRUaW1lINC4IGN1cmVudERheVN0b3BUaW1lLic7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCh0LDQvNC+0LLRi9Cy0L7Qt1wiLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUoXHJcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXHJcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxyXG4gICk6IHN0cmluZyB7XHJcbiAgICAvKipcclxuICAgICAqINCU0LvRjyDQvtCx0LXRgdC/0LXRh9C10L3QuNGPINC40LzQvNGD0YLQsNCx0LXQu9GM0L3QvtGB0YLQuCDQtNCw0L3QvdGL0YUg0YHQvtC30LTQsNC10YLRgdGPINC90L7QstGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucywg0LjQtNC10L3RgtC40YfQvdGL0Lkg0L/QvtC70YPRh9C10L3QvdC+0LzRgyDQsiDQv9Cw0YDQsNC80LXRgtGA0LDRhSwg0L3QviDRgSDQuNC30LzQtdC90LXQvdC90YvQvCDQvNCw0YHRgdC40LLQvtC8IHdvcmt0aW1lLlxyXG4gICAgICog0JIg0LzQsNGB0YHQuNCy0LUgd29ya3RpbWUg0L7QsdC90L7QstC70Y/RjtGC0YHRjyDQvtCz0YDQsNC90LjRh9C10L3QuNGPINCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDRgSDQvtCx0YvRh9C90YvRhSDQvdCwINCw0LrRgtGD0LDQu9GM0L3Ri9C1INC00LvRjyDRgdCw0LzQvtCy0YvQstC+0LfQsC5cclxuICAgICAqICovXHJcbiAgICBjb25zdCBuZXdSZXN0cmljdGlvbiA9IHtcclxuICAgICAgLi4ucmVzdHJpY3Rpb24sXHJcbiAgICAgIHdvcmt0aW1lOiAoPFdvcmtUaW1lW10+cmVzdHJpY3Rpb24ud29ya3RpbWUpLm1hcCgod29ya3RpbWUpID0+XHJcbiAgICAgICAgd29ya3RpbWUuc2VsZlNlcnZpY2VcclxuICAgICAgICAgID8geyAuLi53b3JrdGltZSwgLi4ud29ya3RpbWUuc2VsZlNlcnZpY2UgfVxyXG4gICAgICAgICAgOiB3b3JrdGltZVxyXG4gICAgICApLFxyXG4gICAgfTtcclxuICAgIHJldHVybiBXb3JrVGltZVZhbGlkYXRvci5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUoXHJcbiAgICAgIG5ld1Jlc3RyaWN0aW9uLFxyXG4gICAgICBjdXJyZW50ZGF0ZVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQuNC3INC80LDRgdGB0LjQstCwINCy0YHQtdGFINCy0LDRgNC40LDQvdGC0L7QsiDQvtCx0YzQtdC60YLQsCByZXN0cmljdGlvbi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgc3RhdGljIGdldEN1cnJlbnRXb3JrVGltZShcclxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMsXHJcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxyXG4gICk6IFdvcmtUaW1lIHtcclxuICAgIGxldCBpID0gMDtcclxuICAgIGxldCByZXN1bHQgPSBudWxsO1xyXG4gICAgd2hpbGUgKGkgPCByZXN0cmljdGlvbi53b3JrdGltZS5sZW5ndGggJiYgIXJlc3VsdCkge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgcmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrID09PSAnYWxsJyB8fFxyXG4gICAgICAgICh0eXBlb2YgcmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrID09PSAnc3RyaW5nJ1xyXG4gICAgICAgICAgPyAoPHN0cmluZz5yZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWspLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgIDogKDxzdHJpbmdbXT5yZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWspLm1hcCgoZGF5KSA9PlxyXG4gICAgICAgICAgICAgIGRheS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApLmluY2x1ZGVzKGZvcm1hdERhdGUoY3VycmVudGRhdGUsICdFRUVFJywgJ2VuJykudG9Mb3dlckNhc2UoKSlcclxuICAgICAgKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gcmVzdHJpY3Rpb24ud29ya3RpbWVbaV07XHJcbiAgICAgIH1cclxuICAgICAgaSArPSAxO1xyXG4gICAgfVxyXG4gICAgaWYgKCFyZXN1bHQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCfQndC10YIg0LDQutGC0YPQsNC70YzQvdC+0LPQviDRgNCw0YHQv9C40YHQsNC90LjRjyDRgNCw0LHQvtGC0Ysg0LTQu9GPINGC0LXQutGD0YnQtdCz0L4g0LTQvdGPJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JvQvtCz0LjQutCwINC90LjQttC1INC/0YDQtdC00L3QsNC30L3QsNGH0LXQvdCwINC00LvRjyDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjyDRjdC60LfQtdC80L/Qu9GP0YDQsCDQutC70LDRgdGB0LAgV29ya1RpbWVWYWxpZGF0b3JcclxuICAgKi9cclxuXHJcbiAgY29uc3RydWN0b3IoKSB7fVxyXG5cclxuICBwcml2YXRlIF9tZW1vcnk6IHtcclxuICAgIGdldE1heE9yZGVyRGF0ZTogTWFwPHN0cmluZywgc3RyaW5nPjtcclxuICAgIGdldFRpbWVGcm9tU3RyaW5nOiBNYXA8c3RyaW5nLCBudW1iZXI+O1xyXG4gICAgaXNXb3JrTm93OiBNYXA8c3RyaW5nLCBWYWxpZGF0b3JSZXN1bHQ+O1xyXG4gICAgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xyXG4gICAgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWU6IE1hcDxzdHJpbmcsIHN0cmluZz47XHJcbiAgICBnZXRDdXJyZW50V29ya1RpbWU6IE1hcDxzdHJpbmcsIFdvcmtUaW1lPjtcclxuICAgIGNvbnZlcnRNaW51dGVzVG9UaW1lOiBNYXA8c3RyaW5nLCBUaW1lU3RyaW5nPjtcclxuICB9ID0ge1xyXG4gICAgZ2V0TWF4T3JkZXJEYXRlOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxyXG4gICAgZ2V0VGltZUZyb21TdHJpbmc6IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCksXHJcbiAgICBpc1dvcmtOb3c6IG5ldyBNYXA8c3RyaW5nLCBWYWxpZGF0b3JSZXN1bHQ+KCksXHJcbiAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXHJcbiAgICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZTogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKSxcclxuICAgIGdldEN1cnJlbnRXb3JrVGltZTogbmV3IE1hcDxzdHJpbmcsIFdvcmtUaW1lPigpLFxyXG4gICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBUaW1lU3RyaW5nPigpLFxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgywg0L3QsCDQutC+0YLQvtGA0YPRjiDQvNC+0LbQvdC+INC30LDQutCw0LfQsNGC0Ywg0LTQvtGB0YLQsNCy0LrRgy5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHJldHVybiA6c3RyaW5nIC0g0KHRgtGA0L7QutCwLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQsNGPINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQtNC+0YHRgtGD0L/QvdGD0Y4g0LTQsNGC0YMg0LTQvtGB0YLQsNCy0LrQuCDQsiDRhNC+0YDQvNCw0YLQtSB5eXl5LU1NLWRkLlxyXG4gICAqL1xyXG4gIGdldE1heE9yZGVyRGF0ZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0TWF4T3JkZXJEYXRlLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldE1heE9yZGVyRGF0ZShcclxuICAgICAgICByZXN0cmljdGlvbixcclxuICAgICAgICBjdXJyZW50ZGF0ZVxyXG4gICAgICApO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0TWF4T3JkZXJEYXRlLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INGB0YfQuNGC0LDQtdGCLCDRgdC60L7Qu9GM0LrQviDQvNC40L3Rg9GCINC+0YIg0L3QsNGH0LDQu9CwINC00L3RjyAoMDA6MDApINC/0YDQvtGI0LvQviDQtNC70Y8g0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQstGA0LXQvNC10L3QuC5cclxuICAgKiBAcGFyYW0gdGltZSAtINGB0YLRgNC+0LrQsCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtINCy0YDQtdC80Y8uXHJcbiAgICogQHJldHVybiA6bnVtYmVyIC0g0LrQvtC7LdCy0L4g0LzQuNC90YPRgi5cclxuICAgKi9cclxuICBnZXRUaW1lRnJvbVN0cmluZyh0aW1lOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyB0aW1lIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0VGltZUZyb21TdHJpbmcuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoPFRpbWVTdHJpbmc+dGltZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRUaW1lRnJvbVN0cmluZy5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INC/0YDQvtCy0LXRgNGP0LXRgiwg0LTQvtGB0YLRg9C/0L3QsCDQu9C4INCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8sINC00LvRjyDQutC+0YLQvtGA0YvRhSDQuCDQv9GA0L7QstC10YDRj9C10YLRgdGPINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuFxyXG4gICAqIEByZXR1cm4g0J7QsdGM0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjjpcclxuICAgKiB7XHJcbiAgICAgICAgaXNXb3JrTm93OmJvb2xlYW4gLSDQktC+0LfQvNC+0LbQvdCwINC70Lgg0LTQvtGB0YLQsNCy0LrQsCDQsiDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRj1xyXG4gICAgICAgIGlzTmV3RGF5OmJvb2xlYW4gLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0LjQt9C90LDQuiwg0YfRgtC+INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDRh9Cw0YHQvtCy0YvRhSDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC00LDRgtGLIFwi0L/QtdGA0LXQv9GA0YvQs9C90YPQu1wiINC90LAg0L3QvtCy0YvQuSDQtNC10L3RjC5cclxuICAgICAgICBjdXJyZW50VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0L7QstC10YDRj9C10LzQvtC1INC80LXRgtC+0LTQvtC8INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICB9XHJcbiAgICovXHJcbiAgaXNXb3JrTm93KFxyXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucyB8IFJlc3RyaWN0aW9uc09yZGVyLFxyXG4gICAgY3VycmVudGRhdGU/OiBEYXRlXHJcbiAgKTogVmFsaWRhdG9yUmVzdWx0IHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuaXNXb3JrTm93LmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmlzV29ya05vdyhyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuaXNXb3JrTm93LnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCU0L7RgdGC0LDQstC60LAg0LrRg9GA0YzQtdGA0L7QvFwiLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUoXHJcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXHJcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxyXG4gICk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID1cclxuICAgICAgdGhpcy5fbWVtb3J5LmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZS5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUoXHJcbiAgICAgICAgcmVzdHJpY3Rpb24sXHJcbiAgICAgICAgY3VycmVudGRhdGVcclxuICAgICAgKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQodCw0LzQvtCy0YvQstC+0LdcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUoXHJcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXHJcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxyXG4gICk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID1cclxuICAgICAgdGhpcy5fbWVtb3J5LmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKFxyXG4gICAgICAgIHJlc3RyaWN0aW9uLFxyXG4gICAgICAgIGN1cnJlbnRkYXRlXHJcbiAgICAgICk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCw0LrRgtGD0LDQu9GM0L3Ri9C1INC00LDQvdC90YvQtSDQviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0LjQtyDQvNCw0YHRgdC40LLQsCDQstGB0LXRhSDQstCw0YDQuNCw0L3RgtC+0LIg0L7QsdGM0LXQutGC0LAgcmVzdHJpY3Rpb24uXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIGdldEN1cnJlbnRXb3JrVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IFdvcmtUaW1lIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0Q3VycmVudFdvcmtUaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiA8V29ya1RpbWU+Y2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXHJcbiAgICAgICAgcmVzdHJpY3Rpb24sXHJcbiAgICAgICAgY3VycmVudGRhdGVcclxuICAgICAgKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldEN1cnJlbnRXb3JrVGltZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQutC+0L3QstC10YDRgtC40YDRg9C10YIg0L/QtdGA0LXQtNCw0L3QvdC+0LUg0LrQvtC7LdCy0L4g0LzQuNC90YPRgiDQsiDRgdGC0YDQvtC60L7QstC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YDQtdC80LXQvdC4INCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0gYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgLlxyXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XHJcbiAgICpcclxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNTApIC8vIGEgPSAnMDA6NTAnXHJcbiAgICogY29uc3QgYiA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDEyMDApIC8vIGIgPSAnMjA6MDAnXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdGltZSAtINCn0LjRgdC70L4g0LIg0LTQuNCw0L/QsNC30L7QvdC1INC+0YIgMCDQtNC+IDE0NDAgKNGC0LDQuiDQutCw0Log0LzQsNC60YHQuNC80YPQvCDQsiAxINGB0YPRgtC60LDRhSA9IDE0NDAg0LzQuNC90YPRgikuXHJcbiAgICog0J/RgNC4INC/0LXRgNC10LTQsNGH0LUg0LIgdGltZSDQvtGC0YDQuNGG0LDRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8sINC30L3QsNC6INCx0YPQtNC10YIgXCLQvtGC0L7QsdGA0YjQtdC9XCIsINCwINC00LvRjyDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIsINGA0LDRgdGB0YfQuNGC0LDQvdC90YvQuSDQtNC70Y8g0L/QvtC70YPRh9C10L3QvdC+0LPQviDQv9C+0LvQvtC20LjRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8uXHJcbiAgICog0JXRgdC70Lgg0LIgdGltZSDQsdGD0LTQtdGCINC/0LXRgNC10LTQsNC90L4g0LfQvdCw0YfQtdC90LjQtSDQsdC+0LvRjNGI0LUgMTQ0MCAtINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiDQtNC70Y8g0LfQvdCw0YfQtdC90LjRjyDQsdC10Lcg0YPRh9C10YLQsCBcItC/0YDQtdCy0YvRiNCw0Y7RidC40YUg0YHRg9GC0L7QulwiICjRgi7QtS4g0YEg0LrRgNCw0YLQvdGL0Lwg0LLRi9GH0LXRgtC+0LwgMTQ0MCDQvNC40L3Rg9GCKVxyXG4gICAqXHJcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcclxuICAgKlxyXG4gICAqIGNvbnN0IGEgPSBjb252ZXJ0TWludXRlc1RvVGltZSg2MCkgLy8gYSA9ICcwMTowMCdcclxuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTUwMCkgLy8gYiA9ICcwMTowMCcgKDE0NDAg0LzQuNC90YPRgiBcItGG0LXQu9GL0YVcIiDRgdGD0YLQvtC6INCx0YvQu9C4IFwi0L7RgtCx0YDQvtGI0LXQvdGLXCIpXHJcbiAgICpcclxuICAgKiBAcmV0dXJuc1xyXG4gICAqL1xyXG4gIGNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWU6IG51bWJlcik6IFRpbWVTdHJpbmcge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyB0aW1lIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuY29udmVydE1pbnV0ZXNUb1RpbWUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUodGltZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5jb252ZXJ0TWludXRlc1RvVGltZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=