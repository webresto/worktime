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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sTUFBTSxDQUFDO0FBZ0sxQzs7O0dBR0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLFdBQW9CO0lBQzlDLE9BQU8sQ0FDTCxPQUFPLFdBQVcsS0FBSyxRQUFRO1FBQy9CLFdBQVcsS0FBSyxJQUFJO1FBQ3BCLFVBQVUsSUFBSSxXQUFXO1FBQ3pCLFVBQVUsSUFBSSxXQUFXLENBQzFCLENBQUM7QUFDSixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FDOUIsV0FBOEI7SUFFOUIsT0FBTyxDQUNMLDBCQUEwQixJQUFJLFdBQVc7UUFDekMsMEJBQTBCLElBQUksV0FBVztRQUN6QyxVQUFVLElBQUksV0FBVztRQUN6QixVQUFVLElBQUksV0FBVyxDQUMxQixDQUFDO0FBQ0osQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQUM1Qjs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FDcEIsV0FBOEIsRUFDOUIsV0FBaUI7UUFFakIsSUFDRSxXQUFXO1lBQ1gsdUJBQXVCLENBQUMsV0FBVyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFDbkI7WUFDQSxPQUFPLFVBQVUsQ0FDZixXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsV0FBVyxDQUFDLHdCQUF3QixHQUFHLEtBQUssRUFDcEUsWUFBWSxFQUNaLElBQUksQ0FDTCxDQUFDO1NBQ0g7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQztnQkFDakIsQ0FBQyxDQUFDLG1D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QUFZO1FBQy9CLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLElBQUksV0FBVyxFQUFFO1lBQ2YsT0FBTyxXQUFXLENBQUM7U0FDcEI7YUFBTTtZQUNMLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6RCxPQUFPLE1BQU0sQ0FBQztTQUNmO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZm9ybWF0RGF0ZSwgaXNEYXRlIH0gZnJvbSAnLi9mb3JtYXREYXRlJztcbmltcG9ydCB7IFRpbWVab25lSWRlbnRpZmllciB9IGZyb20gJy4vdHonO1xuXG4vKipcbiAqINCR0LDQt9C+0LLRi9C1INC00LDQvdC90YvQtSDQviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0YsgLSDRgdC70YPQttC10LHQvdGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtUaW1lQmFzZSB7XG4gIC8qKiDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyovXG4gIHN0YXJ0OiBzdHJpbmc7XG5cbiAgLyoqINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cbiAgc3RvcDogc3RyaW5nO1xuXG4gIC8qKiDQv9C10YDQtdGA0YvQsiDQvdCwINC+0LHQtdC0Ki9cbiAgYnJlYWs/OiBzdHJpbmc7XG59XG5cbi8qKlxuICog0JjQvdGE0L7RgNC80LDRhtC40Y8g0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gLSDRgdC70YPQttC10LHQvdGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtUaW1lIGV4dGVuZHMgV29ya1RpbWVCYXNlIHtcbiAgLyoqINC00LXQvdGMINC90LXQtNC10LvQuCwg0Log0LrQvtGC0L7RgNC+0LzRgyDQv9GA0LjQvNC10L3Rj9C10YLRgdGPINGN0YLQviDQstGA0LXQvNGPINC00L7RgdGC0LDQstC60LggICAqL1xuICBkYXlPZldlZWs6IHN0cmluZyB8IHN0cmluZ1tdO1xuXG4gIC8qKiDQvtCz0YDQsNC90LjRh9C10L3QuNGPINC/0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC00LvRjyDRgdCw0LzQvtCy0YvQstC+0LfQsCAqL1xuICBzZWxmU2VydmljZT86IFdvcmtUaW1lQmFzZTtcbn1cblxuLyoqXG4gKiDQmNC90YLQtdGA0YTQtdC50YEg0L7QsdGK0LXQutGC0LAsINC/0L7Qu9GD0YfQsNC10LzQvtCz0L4g0L7RgiBBUEkgQHdlYnJlc3RvL2NvcmUg0Lgg0YHQvtC00LXRgNC20LDRidC10LPQviDRgtC10LrRg9GJ0LjQtSDQtNCw0L3QvdGL0LUg0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRj1xuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc3RyaWN0aW9ucyB7XG4gIC8qKiDQstGA0LXQvNC10L3QvdCw0Y8g0LfQvtC90LAg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyAqL1xuICB0aW1lem9uZT86IHN0cmluZztcblxuICAvKiogINC80LDRgdGB0LjQsiDQvtCz0YDQsNC90LjRh9C10L3QuNC5INC/0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0LTQu9GPINGA0LDQt9C90YvRhSDQtNC90LXQuSDQvdC10LTQtdC70LguICovXG4gIHdvcmt0aW1lOiBXb3JrVGltZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEh0bWxGb3JtRmllbGQge1xuICBpZDogc3RyaW5nO1xuICB0eXBlOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIHJlcXVpcmVkOiBib29sZWFuO1xuICByZWdleDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvdW50cnkge1xuICBwaG9uZUNvZGU6IHN0cmluZztcbiAgaXNvOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgbmF0aXZlQ291bnRyeU5hbWU6IHN0cmluZztcbiAgbGFuZ3VhZ2U6IHN0cmluZ1tdO1xuICBjdXJyZW5jeTogc3RyaW5nO1xuICBjdXJyZW5jeVN5bWJvbDogc3RyaW5nO1xuICBjdXJyZW5jeUlTTzogc3RyaW5nO1xuICBjdXJyZW5jeVVuaXQ6IHN0cmluZztcbiAgY3VycmVuY3lEZW5vbWluYXRpb246IG51bWJlcjtcbiAgcGhvbmVNYXNrOiBzdHJpbmdbXTtcbiAgZmxhZzogc3RyaW5nO1xufVxuXG4vKiog0JTQsNC90L3Ri9C1INC+INC80L7QtNC10LvQuCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC90LAg0YHQsNC50YLQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXG5leHBvcnQgdHlwZSBVc2VyUmVzdHJpY3Rpb25zPFQgZXh0ZW5kcyB7fSA9IHt9PiA9IHtcbiAgLyoqINCf0L7QutCw0LfRi9Cy0LDQtdGCLCDQutCw0LrQvtC5INCy0LjQtCDQtNCw0L3QvdGL0YUg0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC8INC00LvRjyDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4ICovXG4gIGxvZ2luRmllbGQ6IHN0cmluZztcbiAgLyoqXG4gICAqIFpvZGlhYyBzaWduLCBIdW1hbiBkZXNpbmcgdHlwZSwgQmVzdCBGcmllbmQsIHJlZmVyYWwgbGluayBldGNcbiAgICovXG4gIGN1c3RvbUZpZWxkcz86IEh0bWxGb3JtRmllbGRbXSB8IG51bGw7XG4gIC8qKlxuICAgKiBwb3NzaWJsZSAzIHZhcmlhbnRzIFsncmVxdWlyZWQnLCAnZnJvbV9vdHAnLCAnZGlzYWJsZWQnXSBieSBkZWZhdWx0OiBgZnJvbV9vdHBgIGl0IG1lYW5zIHdoYXQgbmVlZCBvbmx5IE9UUCwgZm9yIG5leHQgbG9naW5zICBwYXNzd29yZFJlcXVpcmVkLCBkaXNhYmxlZCBpcyBtZWFucyBwYXNzd29yZCBmb3JiaWRkZW4gYW5kIHlvdSBuZWVkIGFsbCB0aW1lIGdldCBPVFAgcGFzc3dvcmRcbiAgICovXG4gIHBhc3N3b3JkUG9saWN5OiAncmVxdWlyZWQnIHwgJ2Zyb21fb3RwJyB8ICdkaXNhYmxlZCc7XG4gIC8qKlxuICAgKiBieSBkZWZhdWx0ID0gZmFsc2VcbiAgICovXG4gIGxvZ2luT1RQUmVxdWlyZWQ6IGJvb2xlYW47XG4gIC8qKlxuICAgKiDQodC/0LjRgdC+0Log0YHRgtGA0LDQvSwg0YLQtdC70LXRhNC+0L3QvdGL0LUg0LrQvtC00Ysg0LrQvtGC0L7RgNGL0YUg0LTQvtGB0YLRg9C/0L3RiyDQtNC70Y8g0YPQutCw0LfQsNC90LjRjyDQsiDQvdC+0LzQtdGA0LUg0YLQtdC70LXRhNC+0L3QsCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cbiAgICovXG4gIGFsbG93ZWRQaG9uZUNvdW50cmllczogQ291bnRyeVtdO1xuICAvKipcbiAgICog0KHRgdGL0LvQutCwINC90LAg0L/QvtC70LjRgtC40LrRgyDQvtCx0YDQsNCx0L7RgtC60Lgg0L/QtdGA0YHQvtC90LDQu9GM0L3Ri9GFINC00LDQvdC90YvRhVxuICAgKi9cbiAgbGlua1RvUHJvY2Vzc2luZ1BlcnNvbmFsRGF0YTogc3RyaW5nO1xuICAvKipcbiAgICog0KHRgdGL0LvQutCwINC90LAg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GM0YHQutC+0LUg0YHQvtCz0LvQsNGI0LXQvdC40LVcbiAgICovXG4gIGxpbmtUb1VzZXJBZ3JlZW1lbnQ6IHN0cmluZztcbiAgLyoqXG4gICAqINCU0LvQuNC90LAg0LrQvtC00LAg0L/QvtC00YLQstC10YDQttC00LXQvdC40Y8gT1RQXG4gICAqL1xuICBPVFBsZW5ndGg6IG51bWJlcjtcbn0gJiBUO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc3RyaWN0aW9uc09yZGVyPFQgZXh0ZW5kcyB7fSA9IHt9PiBleHRlbmRzIFJlc3RyaWN0aW9ucyB7XG4gIC8qKiDQvNC40L3QuNC80LDQu9GM0L3QvtC1INCy0YDQtdC80Y8g0LTQvtGB0YLQsNCy0LrQuCovXG4gIG1pbkRlbGl2ZXJ5VGltZUluTWludXRlczogc3RyaW5nO1xuXG4gIC8qKiDQvtCz0YDQsNC90LjRh9C10L3QuNC1INC80LDQutGB0LjQvNCw0LvRjNC90L7QuSDQtNCw0YLRiyDQt9Cw0LrQsNC30LAg0LIg0LHRg9C00YPRidC10LwgKNCyINC80LjQvdGD0YLQsNGFKSovXG4gIHBvc3NpYmxlVG9PcmRlckluTWludXRlczogbnVtYmVyO1xuXG4gIC8qKiAg0YPRgdGC0LDQvdC+0LLQu9C10L3QviDQu9C4INC90LAg0YLQtdC60YPRidC40Lkg0LzQvtC80LXQvdGCINC+0LPRgNCw0L3QuNGH0LXQvdC40LUg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90L7QtSDQstGA0LXQvNGPICovXG4gIGRlbGl2ZXJ5VG9UaW1lRW5hYmxlZD86IGJvb2xlYW47XG5cbiAgLyoqINCU0L7Qv9C+0LvQvdC40YLQtdC70YzQvdGL0Lkg0LrQvtC80LzQtdC90YLQsNGA0LjQuSDQv9C+INC00L7RgdGC0LDQstC60LUgKi9cbiAgZGVsaXZlcnlEZXNjcmlwdGlvbj86IHN0cmluZztcblxuICAvKiog0KDQsNC30L3QvtCy0LjQtNC90L7RgdGC0Ywg0LLQstC+0LTQuNC80L7QuSDQutCw0L/Rh9C4ICovXG4gIGNhcHRjaGFUeXBlPzogc3RyaW5nIHwgbnVsbDtcblxuICAvKiog0JTQsNC90L3Ri9C1INC+INC80L7QtNC10LvQuCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC90LAg0YHQsNC50YLQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXG4gIHVzZXI/OiBVc2VyUmVzdHJpY3Rpb25zPFQ+IHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0b3JSZXN1bHQge1xuICB3b3JrTm93OiBib29sZWFuO1xuICBpc05ld0RheT86IGJvb2xlYW47XG4gIGN1cnJlbnRUaW1lPzogbnVtYmVyO1xuICBjdXJlbnREYXlTdGFydFRpbWU/OiBudW1iZXI7XG4gIGN1cmVudERheVN0b3BUaW1lPzogbnVtYmVyO1xufVxuXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGB0LXRhSDRhtC40YTRgCAqL1xudHlwZSBEaWdpdHMgPSAnMCcgfCAnMScgfCAnMicgfCAnMycgfCAnNCcgfCAnNScgfCAnNicgfCAnNycgfCAnOCcgfCAnOSc7XG5cbi8qKiDQotC40L8sINC+0L/QuNGB0YvQstCw0Y7RidC40Lkg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1IDI0INGH0LDRgdC+0LIg0L7QtNC90LjRhSDRgdGD0YLQvtC6ICovXG5leHBvcnQgdHlwZSBIb3Vyc0RpZ2l0cyA9XG4gIHwgJzAwJ1xuICB8ICcwMSdcbiAgfCAnMDInXG4gIHwgJzAzJ1xuICB8ICcwNCdcbiAgfCAnMDUnXG4gIHwgJzA2J1xuICB8ICcwNydcbiAgfCAnMDgnXG4gIHwgJzA5J1xuICB8ICcxMCdcbiAgfCAnMTEnXG4gIHwgJzEyJ1xuICB8ICcxMydcbiAgfCAnMTQnXG4gIHwgJzE1J1xuICB8ICcxNidcbiAgfCAnMTcnXG4gIHwgJzE4J1xuICB8ICcxOSdcbiAgfCAnMjAnXG4gIHwgJzIxJ1xuICB8ICcyMidcbiAgfCAnMjMnO1xuXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSA2MCDQvNC40L3Rg9GCINC+0LTQvdC+0LPQviDRh9Cw0YHQsCovXG5leHBvcnQgdHlwZSBNaW51dGVEaWdpdHMgPSBgJHsnMCcgfCAnMScgfCAnMicgfCAnMycgfCAnNCcgfCAnNSd9JHtEaWdpdHN9YDtcblxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLWAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYCAqL1xuZXhwb3J0IHR5cGUgVGltZVN0cmluZyA9IGAke0hvdXJzRGlnaXRzfToke01pbnV0ZURpZ2l0c31gO1xuXG4vKipcbiAqINCk0YPQvdC60YbQuNGPINCy0LDQu9C40LTQsNGG0LjQuCDQv9C10YDQtdC00LDQvdC90L7Qs9C+INC+0LHRitC10LrRgtCwIHJlc3RyaWN0aW9uINC90LAg0YHQvtC+0YLQstC10YLRgdGC0LLQuNC1INC40L3RgtC10YDRhNC10LnRgdGDIFJlc3RyaWN0aW9uc1xuICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L/RgNC+0LLQtdGA0Y/QtdC80YvQuSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC4INCy0YDQtdC80LXQvdC90L7QuSDQt9C+0L3QtS5cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZFJlc3RyaWN0aW9uKHJlc3RyaWN0aW9uOiB1bmtub3duKTogcmVzdHJpY3Rpb24gaXMgUmVzdHJpY3Rpb25zIHtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgcmVzdHJpY3Rpb24gPT09ICdvYmplY3QnICYmXG4gICAgcmVzdHJpY3Rpb24gIT09IG51bGwgJiZcbiAgICAndGltZXpvbmUnIGluIHJlc3RyaWN0aW9uICYmXG4gICAgJ3dvcmt0aW1lJyBpbiByZXN0cmljdGlvblxuICApO1xufVxuXG4vKipcbiAqINCk0YPQvdC60YbQuNGPINCy0LDQu9C40LTQsNGG0LjQuCDQv9C10YDQtdC00LDQvdC90L7Qs9C+INC+0LHRitC10LrRgtCwIHJlc3RyaWN0aW9uINC90LAg0YHQvtC+0YLQstC10YLRgdGC0LLQuNC1INC80LjQvdC40LzQsNC70YzQvdGL0Lwg0LTQsNC90L3Ri9C8INC00LvRjyDQt9Cw0LrQsNC30LBcbiAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIoXG4gIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlclxuKTogcmVzdHJpY3Rpb24gaXMgUmVzdHJpY3Rpb25zT3JkZXIge1xuICByZXR1cm4gKFxuICAgICdtaW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXMnIGluIHJlc3RyaWN0aW9uICYmXG4gICAgJ3Bvc3NpYmxlVG9PcmRlckluTWludXRlcycgaW4gcmVzdHJpY3Rpb24gJiZcbiAgICAndGltZXpvbmUnIGluIHJlc3RyaWN0aW9uICYmXG4gICAgJ3dvcmt0aW1lJyBpbiByZXN0cmljdGlvblxuICApO1xufVxuXG4vKipcbiAqINCa0LvQsNGB0YEsINGB0L7QtNC10YDQttCw0YnQuNC5INGB0YLQsNGC0LjRh9C10YHQutC40LUg0LzQtdGC0L7QtNGLLCDQvdC10L7QsdGF0L7QtNC40LzRi9C1INC00LvRjyDRgNCw0LHQvtGC0Ysg0YEg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9C80Lgg0YDQsNCx0L7Rh9C10LPQviDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxuICog0KHQvtC30LTQsNCy0LDRgtGMINC90L7QstGL0Lkg0Y3QutC30LXQvNC/0LvRj9GAINGN0YLQvtCz0L4g0LrQu9Cw0YHRgdCwINC00LvRjyDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjyDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyINC90LUg0YLRgNC10LHRg9C10YLRgdGPLlxuICpcbiAqINCf0YDQuCDRjdGC0L7QvCDQv9GA0Lgg0YHQvtC30LTQsNC90LjQuCDRjdC60LfQtdC80L/Qu9GP0YDQsCDQutC70LDRgdGB0LAg0YMg0L7QsdGK0LXQutGC0LAg0YLQsNC60LbQtSDQsdGD0LTRg9GCINC00L7RgdGC0YPQv9C90Ysg0YHQvtCx0YHRgtCy0LXQvdC90YvQtSDRgNC10LDQu9C40LfQsNGG0LjQuFxuICog0LLRgdC10YUg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7Qsi5cbiAqINCt0YLQuCDRgNC10LDQu9C40LfQsNGG0LjQuCDQvtGC0LvQuNGH0LDRjtGC0YHRjyDQvtGCINCy0YvQt9C+0LLQvtCyINGB0YLQsNGC0LjRh9C10YHQutC40YUg0LzQtdGC0L7QtNC+0LIg0YLQvtC70YzQutC+INC80LXQvNC+0LjQt9Cw0YbQuNC10Lkg0LLRi9C/0L7Qu9C90LXQvdC90YvRhSDRgNCw0YHRh9C10YLQvtCyLlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIFdvcmtUaW1lVmFsaWRhdG9yIHtcbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgywg0L3QsCDQutC+0YLQvtGA0YPRjiDQvNC+0LbQvdC+INC30LDQutCw0LfQsNGC0Ywg0LTQvtGB0YLQsNCy0LrRgy5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcmV0dXJuINCh0YLRgNC+0LrQsCwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LDRjyDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LTQvtGB0YLRg9C/0L3Rg9GOINC00LDRgtGDINC00L7RgdGC0LDQstC60Lgg0LIg0YTQvtGA0LzQsNGC0LUgeXl5eS1NTS1kZC5cbiAgICovXG4gIHN0YXRpYyBnZXRNYXhPcmRlckRhdGUoXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXG4gICk6IHN0cmluZyB7XG4gICAgaWYgKFxuICAgICAgcmVzdHJpY3Rpb24gJiZcbiAgICAgIGlzVmFsaWRSZXN0cmljdGlvbk9yZGVyKHJlc3RyaWN0aW9uKSAmJlxuICAgICAgaXNEYXRlKGN1cnJlbnRkYXRlKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZvcm1hdERhdGUoXG4gICAgICAgIGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIHJlc3RyaWN0aW9uLnBvc3NpYmxlVG9PcmRlckluTWludXRlcyAqIDYwMDAwLFxuICAgICAgICAneXl5eS1NTS1kZCcsXG4gICAgICAgICdlbidcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgaXNEYXRlKGN1cnJlbnRkYXRlKVxuICAgICAgICAgID8gJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LrQvtGA0YDQtdC60YLQvdGL0Lkg0L7QsdGK0LXQutGCINC00LDRgtGLJ1xuICAgICAgICAgIDogIXJlc3RyaWN0aW9uXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJ1xuICAgICAgICAgIDogJ9Cf0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMnXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INGB0YfQuNGC0LDQtdGCLCDRgdC60L7Qu9GM0LrQviDQvNC40L3Rg9GCINC+0YIg0L3QsNGH0LDQu9CwINC00L3RjyAoMDA6MDApINC/0YDQvtGI0LvQviDQtNC70Y8g0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQstGA0LXQvNC10L3QuC5cbiAgICogQHBhcmFtIHRpbWUgLSDRgdGC0YDQvtC60LAg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLWAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYCAtINCy0YDQtdC80Y8uXG4gICAqIEByZXR1cm4g0LrQvtC7LdCy0L4g0LzQuNC90YPRgi5cbiAgICovXG4gIHN0YXRpYyBnZXRUaW1lRnJvbVN0cmluZyh0aW1lOiBUaW1lU3RyaW5nKTogbnVtYmVyIHtcbiAgICBpZiAoIXRpbWUpIHtcbiAgICAgIHRocm93ICfQndC1INC/0LXRgNC10LTQsNC90LAg0YHRgtGA0L7QutCwINGBINC/0YDQtdC+0LHRgNCw0LfRg9C10LzRi9C8INCy0YDQtdC80LXQvdC10Lwg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0nO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZWdFeHAgPSBuZXcgUmVnRXhwKFxuICAgICAgICAvXigwMHwwMXwwMnwwM3wwNHwwNXwwNnwwN3wwOHwwOXwxMHwxMXwxMnwxM3wxNHwxNXwxNnwxN3wxOHwxOXwyMHwyMXwyMnwyMykrOihbMC01XVxcZCkrL1xuICAgICAgKTtcblxuICAgICAgaWYgKHJlZ0V4cC50ZXN0KHRpbWUpKSB7XG4gICAgICAgIGxldCBjaGVja2VkVGltZSA9IHRpbWUudHJpbSgpO1xuICAgICAgICBpZiAoY2hlY2tlZFRpbWUuaW5jbHVkZXMoJyAnKSB8fCBjaGVja2VkVGltZS5pbmNsdWRlcygnVCcpKSB7XG4gICAgICAgICAgY2hlY2tlZFRpbWUgPSBjaGVja2VkVGltZS5zcGxpdChcbiAgICAgICAgICAgIGNoZWNrZWRUaW1lLmluY2x1ZGVzKCcgJykgPyAnICcgOiAnVCdcbiAgICAgICAgICApWzFdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICtjaGVja2VkVGltZS5zcGxpdCgnOicpWzBdICogNjAgKyArY2hlY2tlZFRpbWUuc3BsaXQoJzonKVsxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICfQn9C10YDQtdC00LDQvdC90LDRjyDRgdGC0YDQvtC60LAg0L3QtSDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0LXRgiDRhNC+0YDQvNCw0YLRgyBISDptbSAtYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQutC+0L3QstC10YDRgtC40YDRg9C10YIg0L/QtdGA0LXQtNCw0L3QvdC+0LUg0LrQvtC7LdCy0L4g0LzQuNC90YPRgiDQsiDRgdGC0YDQvtC60L7QstC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YDQtdC80LXQvdC4INCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0gYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgLlxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxuICAgKlxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNTApIC8vIGEgPSAnMDA6NTAnXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxMjAwKSAvLyBiID0gJzIwOjAwJ1xuICAgKlxuICAgKiBAcGFyYW0gdGltZSAtINCn0LjRgdC70L4g0LIg0LTQuNCw0L/QsNC30L7QvdC1INC+0YIgMCDQtNC+IDE0NDAgKNGC0LDQuiDQutCw0Log0LzQsNC60YHQuNC80YPQvCDQsiAxINGB0YPRgtC60LDRhSA9IDE0NDAg0LzQuNC90YPRgikuXG4gICAqINCf0YDQuCDQv9C10YDQtdC00LDRh9C1INCyIHRpbWUg0L7RgtGA0LjRhtCw0YLQtdC70YzQvdC+0LPQviDQt9C90LDRh9C10L3QuNGPLCDQt9C90LDQuiDQsdGD0LTQtdGCIFwi0L7RgtC+0LHRgNGI0LXQvVwiLCDQsCDQtNC70Y8g0LzQtdGC0L7QtCDQstC10YDQvdC10YIg0YDQtdC30YPQu9GM0YLQsNGCLCDRgNCw0YHRgdGH0LjRgtCw0L3QvdGL0Lkg0LTQu9GPINC/0L7Qu9GD0YfQtdC90L3QvtCz0L4g0L/QvtC70L7QttC40YLQtdC70YzQvdC+0LPQviDQt9C90LDRh9C10L3QuNGPLlxuICAgKiDQldGB0LvQuCDQsiB0aW1lINCx0YPQtNC10YIg0L/QtdGA0LXQtNCw0L3QviDQt9C90LDRh9C10L3QuNC1INCx0L7Qu9GM0YjQtSAxNDQwIC0g0LzQtdGC0L7QtCDQstC10YDQvdC10YIg0YDQtdC30YPQu9GM0YLQsNGCINC00LvRjyDQt9C90LDRh9C10L3QuNGPINCx0LXQtyDRg9GH0LXRgtCwIFwi0L/RgNC10LLRi9GI0LDRjtGJ0LjRhSDRgdGD0YLQvtC6XCIgKNGCLtC1LiDRgSDQutGA0LDRgtC90YvQvCDQstGL0YfQtdGC0L7QvCAxNDQwINC80LjQvdGD0YIpXG4gICAqXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XG4gICAqXG4gICAqIGNvbnN0IGEgPSBjb252ZXJ0TWludXRlc1RvVGltZSg2MCkgLy8gYSA9ICcwMTowMCdcbiAgICogY29uc3QgYiA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDE1MDApIC8vIGIgPSAnMDE6MDAnICgxNDQwINC80LjQvdGD0YIgXCLRhtC10LvRi9GFXCIg0YHRg9GC0L7QuiDQsdGL0LvQuCBcItC+0YLQsdGA0L7RiNC10L3Ri1wiKVxuICAgKlxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgc3RhdGljIGNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWU6IG51bWJlcik6IFRpbWVTdHJpbmcge1xuICAgIGlmICh0aW1lIDwgMTQ0MSkge1xuICAgICAgY29uc3QgaG91ciA9IE1hdGguZmxvb3IodGltZSAvIDYwKTtcbiAgICAgIGNvbnN0IGhvdXJTdHI6IEhvdXJzRGlnaXRzID0gPEhvdXJzRGlnaXRzPihcbiAgICAgICAgKGhvdXIgPD0gOSA/IGAwJHtTdHJpbmcoaG91cil9YCA6IFN0cmluZyhob3VyKSlcbiAgICAgICk7XG4gICAgICBjb25zdCBtaW51dGVzU3RyOiBNaW51dGVEaWdpdHMgPSA8TWludXRlRGlnaXRzPlN0cmluZyh0aW1lIC0gaG91ciAqIDYwKTtcbiAgICAgIHJldHVybiBgJHtob3VyU3RyfToke21pbnV0ZXNTdHJ9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFdvcmtUaW1lVmFsaWRhdG9yLmNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWUgLSAxNDQwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQv9GA0L7QstC10YDRj9C10YIsINC00L7RgdGC0YPQv9C90LAg0LvQuCDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60Lgg0L3QsCDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRjy5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8sINC00LvRjyDQutC+0YLQvtGA0YvRhSDQuCDQv9GA0L7QstC10YDRj9C10YLRgdGPINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuFxuICAgKiBAcmV0dXJuINCe0LHRjNC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y46XG4gICAqIHtcbiAgICAgICAgaXNXb3JrTm93OmJvb2xlYW4gLSDQktC+0LfQvNC+0LbQvdCwINC70Lgg0LTQvtGB0YLQsNCy0LrQsCDQsiDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRj1xuICAgICAgICBpc05ld0RheTpib29sZWFuIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQuNC30L3QsNC6LCDRh9GC0L4g0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINGH0LDRgdC+0LLRi9GFINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0LTQsNGC0YsgXCLQv9C10YDQtdC/0YDRi9Cz0L3Rg9C7XCIg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLlxuICAgICAgICBjdXJyZW50VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC+0LLQtdGA0Y/QtdC80L7QtSDQvNC10YLQvtC00L7QvCDQstGA0LXQvNGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gICAgICB9XG4gICAqL1xuICBzdGF0aWMgaXNXb3JrTm93KFxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMgfCBSZXN0cmljdGlvbnNPcmRlcixcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKClcbiAgKTogVmFsaWRhdG9yUmVzdWx0IHtcbiAgICBpZiAoIXJlc3RyaWN0aW9uLndvcmt0aW1lIHx8ICFPYmplY3Qua2V5cyhyZXN0cmljdGlvbi53b3JrdGltZSkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB3b3JrTm93OiB0cnVlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDQldGB0LvQuCDQuNGB0L/QvtC70YzQvdGP0LXRgtGB0Y8g0LIgTm9kZUpTXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAhcmVzdHJpY3Rpb24udGltZXpvbmUpIHtcbiAgICAgIHJlc3RyaWN0aW9uLnRpbWV6b25lID0gcHJvY2Vzcy5lbnYuVFpcbiAgICAgICAgPyBwcm9jZXNzLmVudi5UWlxuICAgICAgICA6IEludGwuRGF0ZVRpbWVGb3JtYXQoKS5yZXNvbHZlZE9wdGlvbnMoKS50aW1lWm9uZTtcbiAgICB9XG5cbiAgICBpZiAoIXJlc3RyaWN0aW9uIHx8ICFpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICFpc0RhdGUoY3VycmVudGRhdGUpXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnXG4gICAgICAgICAgOiAhcmVzdHJpY3Rpb25cbiAgICAgICAgICA/ICfQndC1INC/0LXRgNC10LTQsNC9INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnXG4gICAgICAgICAgOiAn0J/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucydcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNvbXBhbnlMb2NhbFRpbWVab25lID1cbiAgICAgICAgVGltZVpvbmVJZGVudGlmaWVyLmdldFRpbWVab25lR01UT2Zmc2V0ZnJvbU5hbWVab25lKFxuICAgICAgICAgIHJlc3RyaWN0aW9uLnRpbWV6b25lXG4gICAgICAgICkuc3BsaXQoJzonKTtcbiAgICAgIGNvbnN0IGNvbXBhbnlMb2NhbFRpbWVab25lRGVsdGEgPVxuICAgICAgICArY29tcGFueUxvY2FsVGltZVpvbmVbMF0gKiA2MCArICtjb21wYW55TG9jYWxUaW1lWm9uZVsxXTtcbiAgICAgIGNvbnN0IGxva2FsVGltZURlbHRhID1cbiAgICAgICAgY29tcGFueUxvY2FsVGltZVpvbmVEZWx0YSArIGN1cnJlbnRkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCk7IC8vINGB0LzQtdGJ0LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPINC+0YLQvdC+0YHQuNGC0LXQu9GM0L3QviDQstGA0LXQvNC10L3QuCDRgtC+0YDQs9C+0LLQvtC5INGC0L7Rh9C60LhcbiAgICAgIGNvbnN0IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPVxuICAgICAgICBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyhcbiAgICAgICAgICA8VGltZVN0cmluZz5mb3JtYXREYXRlKGN1cnJlbnRkYXRlLCAnSEg6bW0nLCAnZW4nKVxuICAgICAgICApICsgbG9rYWxUaW1lRGVsdGE7XG4gICAgICAvKipcbiAgICAgICAqINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0YEg0L3QsNGH0LDQu9CwINC00L3RjyAoNjAwID0gMTA6MDAuIDEyMDAgPSAyMDowMClcbiAgICAgICAqINC10YHQu9C4INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC/0LXRgNC10L/RgNGL0LPQvdGD0Lsg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLCDRgtC+INC/0YDQuNCy0L7QtNC40Lwg0LLRgNC10LzRjyDQuiDQv9GA0LDQstC40LvRjNC90L7QvNGDINC30L3QsNGH0LXQvdC40Y4g0LIg0LTQuNCw0L/QsNC30L7QvdC1IDI0INGH0LDRgdC+0LJcbiAgICAgICAqICovXG4gICAgICBjb25zdCBjdXJyZW50VGltZSA9XG4gICAgICAgIGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwXG4gICAgICAgICAgPyBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhIC0gMTQ0MFxuICAgICAgICAgIDogY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YTtcblxuICAgICAgY29uc3QgY3VycmVudERheVdvcmtUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxuICAgICAgICByZXN0cmljdGlvbixcbiAgICAgICAgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDBcbiAgICAgICAgICA/IG5ldyBEYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKVxuICAgICAgICAgIDogY3VycmVudGRhdGVcbiAgICAgICk7IC8vINGC0LXQutGD0YnQtdC1INGA0LDQsdC+0YfQtdC1INCy0YDQtdC80Y9cbiAgICAgIGNvbnN0IGN1cmVudERheVN0YXJ0VGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxuICAgICAgICA8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RhcnRcbiAgICAgICk7IC8vINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFXG4gICAgICBjb25zdCBjdXJlbnREYXlTdG9wVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxuICAgICAgICA8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RvcFxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YVcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHdvcmtOb3c6XG4gICAgICAgICAgY3VycmVudFRpbWUgPCBjdXJlbnREYXlTdG9wVGltZSAmJiBjdXJyZW50VGltZSA+IGN1cmVudERheVN0YXJ0VGltZSxcbiAgICAgICAgaXNOZXdEYXk6IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwLFxuICAgICAgICBjdXJyZW50VGltZSxcbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lLFxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCU0L7RgdGC0LDQstC60LAg0LrRg9GA0YzQtdGA0L7QvFwiLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xuICAgKi9cbiAgc3RhdGljIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU6IERhdGVcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBjaGVja1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5pc1dvcmtOb3cocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcblxuICAgIGlmIChjaGVja1RpbWUud29ya05vdyAmJiBjaGVja1RpbWUuY3VycmVudFRpbWUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfQodC10LnRh9Cw0YEg0YDQsNCx0L7Rh9C10LUg0LLRgNC10LzRjy4g0KDQsNGB0YfQtdGCINC90LUg0YLRgNC10LHRg9C10YLRgdGPLicpO1xuICAgICAgY29uc3QgcG9zc2libGVUaW1lID1cbiAgICAgICAgY2hlY2tUaW1lLmN1cnJlbnRUaW1lICsgKCtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXMgfHwgMCk7XG4gICAgICBjb25zdCBwb3NzaWJsZVRpbWVTdHIgPVxuICAgICAgICBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZShwb3NzaWJsZVRpbWUpO1xuICAgICAgcmV0dXJuIGZvcm1hdERhdGUoY3VycmVudGRhdGUsIGB5eXl5LU1NLWRkICR7cG9zc2libGVUaW1lU3RyfWAsICdlbicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY2hlY2tUaW1lLmN1cnJlbnRUaW1lICYmIGNoZWNrVGltZS5jdXJlbnREYXlTdG9wVGltZSkge1xuICAgICAgICBjb25zdCBjdXJyZW50RGF5V29ya1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXG4gICAgICAgICAgcmVzdHJpY3Rpb24sXG4gICAgICAgICAgY2hlY2tUaW1lLmlzTmV3RGF5XG4gICAgICAgICAgICA/IG5ldyBEYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKVxuICAgICAgICAgICAgOiBjdXJyZW50ZGF0ZVxuICAgICAgICApO1xuICAgICAgICBjb25zdCB0aW1lID1cbiAgICAgICAgICB0aGlzLmdldFRpbWVGcm9tU3RyaW5nKDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdGFydCkgK1xuICAgICAgICAgICtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXM7XG4gICAgICAgIGNvbnN0IHRpbWVTdHJpbmcgPSBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lKTtcbiAgICAgICAgcmV0dXJuIGZvcm1hdERhdGUoXG4gICAgICAgICAgY2hlY2tUaW1lLmlzTmV3RGF5IHx8XG4gICAgICAgICAgICBjaGVja1RpbWUuY3VycmVudFRpbWUgPiBjaGVja1RpbWUuY3VyZW50RGF5U3RvcFRpbWVcbiAgICAgICAgICAgID8gY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDBcbiAgICAgICAgICAgIDogY3VycmVudGRhdGUsXG4gICAgICAgICAgYHl5eXktTU0tZGQgJHt0aW1lU3RyaW5nfWAsXG4gICAgICAgICAgJ2VuJ1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0YDQsNGB0YHRh9C40YLQsNGC0YwgY3VycmVudFRpbWUg0LggY3VyZW50RGF5U3RvcFRpbWUuJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0KHQsNC80L7QstGL0LLQvtC3XCIuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBzdGF0aWMgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUoXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXG4gICk6IHN0cmluZyB7XG4gICAgLyoqXG4gICAgICog0JTQu9GPINC+0LHQtdGB0L/QtdGH0LXQvdC40Y8g0LjQvNC80YPRgtCw0LHQtdC70YzQvdC+0YHRgtC4INC00LDQvdC90YvRhSDRgdC+0LfQtNCw0LXRgtGB0Y8g0L3QvtCy0YvQuSDQvtCx0YzQtdC60YIgcmVzdHJpY3Rpb25zLCDQuNC00LXQvdGC0LjRh9C90YvQuSDQv9C+0LvRg9GH0LXQvdC90L7QvNGDINCyINC/0LDRgNCw0LzQtdGC0YDQsNGFLCDQvdC+INGBINC40LfQvNC10L3QtdC90L3Ri9C8INC80LDRgdGB0LjQstC+0Lwgd29ya3RpbWUuXG4gICAgICog0JIg0LzQsNGB0YHQuNCy0LUgd29ya3RpbWUg0L7QsdC90L7QstC70Y/RjtGC0YHRjyDQvtCz0YDQsNC90LjRh9C10L3QuNGPINCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDRgSDQvtCx0YvRh9C90YvRhSDQvdCwINCw0LrRgtGD0LDQu9GM0L3Ri9C1INC00LvRjyDRgdCw0LzQvtCy0YvQstC+0LfQsC5cbiAgICAgKiAqL1xuICAgIGNvbnN0IG5ld1Jlc3RyaWN0aW9uID0ge1xuICAgICAgLi4ucmVzdHJpY3Rpb24sXG4gICAgICB3b3JrdGltZTogKDxXb3JrVGltZVtdPnJlc3RyaWN0aW9uLndvcmt0aW1lKS5tYXAoKHdvcmt0aW1lKSA9PlxuICAgICAgICB3b3JrdGltZS5zZWxmU2VydmljZVxuICAgICAgICAgID8geyAuLi53b3JrdGltZSwgLi4ud29ya3RpbWUuc2VsZlNlcnZpY2UgfVxuICAgICAgICAgIDogd29ya3RpbWVcbiAgICAgICksXG4gICAgfTtcbiAgICByZXR1cm4gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKFxuICAgICAgbmV3UmVzdHJpY3Rpb24sXG4gICAgICBjdXJyZW50ZGF0ZVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsNC60YLRg9Cw0LvRjNC90YvQtSDQtNCw0L3QvdGL0LUg0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC40Lcg0LzQsNGB0YHQuNCy0LAg0LLRgdC10YUg0LLQsNGA0LjQsNC90YLQvtCyINC+0LHRjNC10LrRgtCwIHJlc3RyaWN0aW9uLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xuICAgKi9cbiAgc3RhdGljIGdldEN1cnJlbnRXb3JrVGltZShcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zLFxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXG4gICk6IFdvcmtUaW1lIHtcbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XG4gICAgd2hpbGUgKGkgPCByZXN0cmljdGlvbi53b3JrdGltZS5sZW5ndGggJiYgIXJlc3VsdCkge1xuICAgICAgaWYgKFxuICAgICAgICByZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWsgPT09ICdhbGwnIHx8XG4gICAgICAgICh0eXBlb2YgcmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrID09PSAnc3RyaW5nJ1xuICAgICAgICAgID8gKDxzdHJpbmc+cmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgOiAoPHN0cmluZ1tdPnJlc3RyaWN0aW9uLndvcmt0aW1lW2ldLmRheU9mV2VlaykubWFwKChkYXkpID0+XG4gICAgICAgICAgICAgIGRheS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICApXG4gICAgICAgICkuaW5jbHVkZXMoZm9ybWF0RGF0ZShjdXJyZW50ZGF0ZSwgJ0VFRUUnLCAnZW4nKS50b0xvd2VyQ2FzZSgpKVxuICAgICAgKSB7XG4gICAgICAgIHJlc3VsdCA9IHJlc3RyaWN0aW9uLndvcmt0aW1lW2ldO1xuICAgICAgfVxuICAgICAgaSArPSAxO1xuICAgIH1cbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfQndC10YIg0LDQutGC0YPQsNC70YzQvdC+0LPQviDRgNCw0YHQv9C40YHQsNC90LjRjyDRgNCw0LHQvtGC0Ysg0LTQu9GPINGC0LXQutGD0YnQtdCz0L4g0LTQvdGPJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCb0L7Qs9C40LrQsCDQvdC40LbQtSDQv9GA0LXQtNC90LDQt9C90LDRh9C10L3QsCDQtNC70Y8g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8g0Y3QutC30LXQvNC/0LvRj9GA0LAg0LrQu9Cw0YHRgdCwIFdvcmtUaW1lVmFsaWRhdG9yXG4gICAqL1xuXG4gIGNvbnN0cnVjdG9yKCkge31cblxuICBwcml2YXRlIF9tZW1vcnk6IHtcbiAgICBnZXRNYXhPcmRlckRhdGU6IE1hcDxzdHJpbmcsIHN0cmluZz47XG4gICAgZ2V0VGltZUZyb21TdHJpbmc6IE1hcDxzdHJpbmcsIG51bWJlcj47XG4gICAgaXNXb3JrTm93OiBNYXA8c3RyaW5nLCBWYWxpZGF0b3JSZXN1bHQ+O1xuICAgIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZTogTWFwPHN0cmluZywgc3RyaW5nPjtcbiAgICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZTogTWFwPHN0cmluZywgc3RyaW5nPjtcbiAgICBnZXRDdXJyZW50V29ya1RpbWU6IE1hcDxzdHJpbmcsIFdvcmtUaW1lPjtcbiAgICBjb252ZXJ0TWludXRlc1RvVGltZTogTWFwPHN0cmluZywgVGltZVN0cmluZz47XG4gIH0gPSB7XG4gICAgZ2V0TWF4T3JkZXJEYXRlOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxuICAgIGdldFRpbWVGcm9tU3RyaW5nOiBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpLFxuICAgIGlzV29ya05vdzogbmV3IE1hcDxzdHJpbmcsIFZhbGlkYXRvclJlc3VsdD4oKSxcbiAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXG4gICAgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXG4gICAgZ2V0Q3VycmVudFdvcmtUaW1lOiBuZXcgTWFwPHN0cmluZywgV29ya1RpbWU+KCksXG4gICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBUaW1lU3RyaW5nPigpLFxuICB9O1xuXG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMsINC90LAg0LrQvtGC0L7RgNGD0Y4g0LzQvtC20L3QviDQt9Cw0LrQsNC30LDRgtGMINC00L7RgdGC0LDQstC60YMuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHJldHVybiA6c3RyaW5nIC0g0KHRgtGA0L7QutCwLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQsNGPINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQtNC+0YHRgtGD0L/QvdGD0Y4g0LTQsNGC0YMg0LTQvtGB0YLQsNCy0LrQuCDQsiDRhNC+0YDQvNCw0YLQtSB5eXl5LU1NLWRkLlxuICAgKi9cbiAgZ2V0TWF4T3JkZXJEYXRlKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmdldE1heE9yZGVyRGF0ZS5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0TWF4T3JkZXJEYXRlKFxuICAgICAgICByZXN0cmljdGlvbixcbiAgICAgICAgY3VycmVudGRhdGVcbiAgICAgICk7XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0TWF4T3JkZXJEYXRlLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INGB0YfQuNGC0LDQtdGCLCDRgdC60L7Qu9GM0LrQviDQvNC40L3Rg9GCINC+0YIg0L3QsNGH0LDQu9CwINC00L3RjyAoMDA6MDApINC/0YDQvtGI0LvQviDQtNC70Y8g0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQstGA0LXQvNC10L3QuC5cbiAgICogQHBhcmFtIHRpbWUgLSDRgdGC0YDQvtC60LAg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLSDQstGA0LXQvNGPLlxuICAgKiBAcmV0dXJuIDpudW1iZXIgLSDQutC+0Lst0LLQviDQvNC40L3Rg9GCLlxuICAgKi9cbiAgZ2V0VGltZUZyb21TdHJpbmcodGltZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHRpbWUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0VGltZUZyb21TdHJpbmcuZ2V0KG1lbW9yeUtleSk7XG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKDxUaW1lU3RyaW5nPnRpbWUpO1xuICAgICAgdGhpcy5fbWVtb3J5LmdldFRpbWVGcm9tU3RyaW5nLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQv9GA0L7QstC10YDRj9C10YIsINC00L7RgdGC0YPQv9C90LAg0LvQuCDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60Lgg0L3QsCDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRjy5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8sINC00LvRjyDQutC+0YLQvtGA0YvRhSDQuCDQv9GA0L7QstC10YDRj9C10YLRgdGPINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuFxuICAgKiBAcmV0dXJuINCe0LHRjNC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y46XG4gICAqIHtcbiAgICAgICAgaXNXb3JrTm93OmJvb2xlYW4gLSDQktC+0LfQvNC+0LbQvdCwINC70Lgg0LTQvtGB0YLQsNCy0LrQsCDQsiDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRj1xuICAgICAgICBpc05ld0RheTpib29sZWFuIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQuNC30L3QsNC6LCDRh9GC0L4g0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINGH0LDRgdC+0LLRi9GFINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0LTQsNGC0YsgXCLQv9C10YDQtdC/0YDRi9Cz0L3Rg9C7XCIg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLlxuICAgICAgICBjdXJyZW50VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC+0LLQtdGA0Y/QtdC80L7QtSDQvNC10YLQvtC00L7QvCDQstGA0LXQvNGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gICAgICB9XG4gICAqL1xuICBpc1dvcmtOb3coXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucyB8IFJlc3RyaWN0aW9uc09yZGVyLFxuICAgIGN1cnJlbnRkYXRlPzogRGF0ZVxuICApOiBWYWxpZGF0b3JSZXN1bHQge1xuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmlzV29ya05vdy5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuaXNXb3JrTm93KHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XG4gICAgICB0aGlzLl9tZW1vcnkuaXNXb3JrTm93LnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0JTQvtGB0YLQsNCy0LrQsCDQutGD0YDRjNC10YDQvtC8XCIuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUoXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPVxuICAgICAgdGhpcy5fbWVtb3J5LmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZS5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKFxuICAgICAgICByZXN0cmljdGlvbixcbiAgICAgICAgY3VycmVudGRhdGVcbiAgICAgICk7XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0KHQsNC80L7QstGL0LLQvtC3XCIuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZShcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU6IERhdGVcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcbiAgICBjb25zdCBjaGVja01lbW9yeSA9XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUuZ2V0KG1lbW9yeUtleSk7XG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKFxuICAgICAgICByZXN0cmljdGlvbixcbiAgICAgICAgY3VycmVudGRhdGVcbiAgICAgICk7XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCw0LrRgtGD0LDQu9GM0L3Ri9C1INC00LDQvdC90YvQtSDQviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0LjQtyDQvNCw0YHRgdC40LLQsCDQstGB0LXRhSDQstCw0YDQuNCw0L3RgtC+0LIg0L7QsdGM0LXQutGC0LAgcmVzdHJpY3Rpb24uXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBnZXRDdXJyZW50V29ya1RpbWUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucywgY3VycmVudGRhdGU6IERhdGUpOiBXb3JrVGltZSB7XG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0Q3VycmVudFdvcmtUaW1lLmdldChtZW1vcnlLZXkpO1xuICAgIGlmIChjaGVja01lbW9yeSkge1xuICAgICAgcmV0dXJuIDxXb3JrVGltZT5jaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxuICAgICAgICByZXN0cmljdGlvbixcbiAgICAgICAgY3VycmVudGRhdGVcbiAgICAgICk7XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0Q3VycmVudFdvcmtUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INC60L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQv9C10YDQtdC00LDQvdC90L7QtSDQutC+0Lst0LLQviDQvNC40L3Rg9GCINCyINGB0YLRgNC+0LrQvtCy0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLSBgKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAuXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XG4gICAqXG4gICAqIGNvbnN0IGEgPSBjb252ZXJ0TWludXRlc1RvVGltZSg1MCkgLy8gYSA9ICcwMDo1MCdcbiAgICogY29uc3QgYiA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDEyMDApIC8vIGIgPSAnMjA6MDAnXG4gICAqXG4gICAqIEBwYXJhbSB0aW1lIC0g0KfQuNGB0LvQviDQsiDQtNC40LDQv9Cw0LfQvtC90LUg0L7RgiAwINC00L4gMTQ0MCAo0YLQsNC6INC60LDQuiDQvNCw0LrRgdC40LzRg9C8INCyIDEg0YHRg9GC0LrQsNGFID0gMTQ0MCDQvNC40L3Rg9GCKS5cbiAgICog0J/RgNC4INC/0LXRgNC10LTQsNGH0LUg0LIgdGltZSDQvtGC0YDQuNGG0LDRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8sINC30L3QsNC6INCx0YPQtNC10YIgXCLQvtGC0L7QsdGA0YjQtdC9XCIsINCwINC00LvRjyDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIsINGA0LDRgdGB0YfQuNGC0LDQvdC90YvQuSDQtNC70Y8g0L/QvtC70YPRh9C10L3QvdC+0LPQviDQv9C+0LvQvtC20LjRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8uXG4gICAqINCV0YHQu9C4INCyIHRpbWUg0LHRg9C00LXRgiDQv9C10YDQtdC00LDQvdC+INC30L3QsNGH0LXQvdC40LUg0LHQvtC70YzRiNC1IDE0NDAgLSDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIg0LTQu9GPINC30L3QsNGH0LXQvdC40Y8g0LHQtdC3INGD0YfQtdGC0LAgXCLQv9GA0LXQstGL0YjQsNGO0YnQuNGFINGB0YPRgtC+0LpcIiAo0YIu0LUuINGBINC60YDQsNGC0L3Ri9C8INCy0YvRh9C10YLQvtC8IDE0NDAg0LzQuNC90YPRgilcbiAgICpcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcbiAgICpcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDYwKSAvLyBhID0gJzAxOjAwJ1xuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTUwMCkgLy8gYiA9ICcwMTowMCcgKDE0NDAg0LzQuNC90YPRgiBcItGG0LXQu9GL0YVcIiDRgdGD0YLQvtC6INCx0YvQu9C4IFwi0L7RgtCx0YDQvtGI0LXQvdGLXCIpXG4gICAqXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBjb252ZXJ0TWludXRlc1RvVGltZSh0aW1lOiBudW1iZXIpOiBUaW1lU3RyaW5nIHtcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHRpbWUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuY29udmVydE1pbnV0ZXNUb1RpbWUuZ2V0KG1lbW9yeUtleSk7XG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWUpO1xuICAgICAgdGhpcy5fbWVtb3J5LmNvbnZlcnRNaW51dGVzVG9UaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxufVxuIl19