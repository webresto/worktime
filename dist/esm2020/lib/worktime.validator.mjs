import { formatDate, isDate } from './formatDate';
import { TimeZoneIdentifier } from './tz';
/** Функция-хелпер для проверки, что переданное значение не является null или undefined */
function isValue(value) {
    return value !== null && value !== undefined;
}
/**
 * Функция валидации переданного объекта restriction на соответствие интерфейсу Restrictions
 * @param restriction - проверяемый объект, содержащий информацию о рабочем времени и временной зоне.
 */
function isValidRestriction(restriction) {
    return (typeof restriction === 'object' &&
        isValue(restriction) &&
        'timezone' in restriction &&
        'worktime' in restriction &&
        isValue(restriction.timezone) &&
        isValue(restriction.worktime));
}
/**
 * Функция валидации переданного объекта restriction на соответствие минимальным данным для заказа
 * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
 */
function isValidRestrictionOrder(restriction) {
    return (isValidRestriction(restriction) &&
        'minDeliveryTimeInMinutes' in restriction &&
        'possibleToOrderInMinutes' in restriction &&
        isValue(restriction.minDeliveryTimeInMinutes) &&
        isValue(restriction.possibleToOrderInMinutes));
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
     * @deprecated Будет перемещена из либы
     * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @return Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
     */
    static getMaxOrderDate(restriction, currentdate) {
        if (isValue(restriction) &&
            isValidRestrictionOrder(restriction) &&
            isDate(currentdate)) {
            return formatDate(currentdate.getTime() + restriction.possibleToOrderInMinutes * 60000, 'yyyy-MM-dd', 'en');
        }
        else {
            throw new Error(isDate(currentdate)
                ? 'Не передан корректный объект даты'
                : !isValue(restriction)
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
        if (!isValue(time)) {
            throw 'Не передана строка с преобразуемым временем в формате HH:mm';
        }
        else {
            const regExp = new RegExp(/^(00|01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23)+:([0-5]\d)+/);
            let checkedTime = time.trim();
            if (checkedTime.includes(' ') || checkedTime.includes('T')) {
                checkedTime = checkedTime.split(checkedTime.includes(' ') ? ' ' : 'T')[1];
            }
            if (regExp.test(checkedTime)) {
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
            const minutes = String(time - hour * 60);
            const minutesStr = (`${minutes.length == 1 ? '0' : ''}${minutes}`);
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
        // Если испольняется в NodeJS
        if (isValue(restriction) &&
            !isValue(restriction.timezone) &&
            typeof process !== 'undefined') {
            restriction.timezone =
                process?.env?.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        if (!isValue(restriction) || !isValidRestriction(restriction)) {
            throw new Error(!isDate(currentdate)
                ? 'Не передан корректный объект даты'
                : !isValue(restriction)
                    ? 'Не передан объект restrictions'
                    : 'Передан невалидный обьект restrictions');
        }
        else {
            if (!isValue(restriction.worktime) ||
                !Object.keys(restriction.worktime).length) {
                return {
                    workNow: true,
                };
            }
            const companyLocalTimeZone = TimeZoneIdentifier.getTimeZoneGMTOffset(restriction.timezone).split(':');
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
        if (!isValidRestrictionOrder(restriction)) {
            throw new Error('Не передан или передан невалидный объект restrictions');
        }
        const checkTime = WorkTimeValidator.isWorkNow(restriction, currentdate);
        if (checkTime.workNow && isValue(checkTime.currentTime)) {
            console.log('Сейчас рабочее время. Расчет не требуется.');
            const possibleTime = checkTime.currentTime + (+restriction.minDeliveryTimeInMinutes || 0);
            const possibleTimeStr = WorkTimeValidator.convertMinutesToTime(possibleTime);
            return formatDate(currentdate, `yyyy-MM-dd ${possibleTimeStr}`, 'en');
        }
        else {
            if (isValue(checkTime.currentTime) &&
                isValue(checkTime.curentDayStopTime)) {
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
        if (!isValidRestrictionOrder(restriction)) {
            throw new Error('Не передан или передан невалидный объект restrictions');
        }
        /**
         * Для обеспечения иммутабельности данных создается новый обьект restrictions, идентичный полученному в параметрах, но с измененным массивом worktime.
         * В массиве worktime обновляются ограничения времени работы с обычных на актуальные для самовывоза.
         * */
        const newRestriction = {
            ...restriction,
            worktime: restriction.worktime.map((worktime) => worktime)
        };
        return WorkTimeValidator.getPossibleDelieveryOrderDateTime(newRestriction, currentdate);
    }
    /**
     * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    static getCurrentWorkTime(restriction, currentdate) {
        if (!isValidRestriction(restriction)) {
            throw new Error('Не передан или передан невалидный объект restrictions');
        }
        let i = 0;
        let result = null;
        while (i < restriction.worktime.length && !isValue(result)) {
            if (restriction.worktime[i].dayOfWeek === undefined) {
                throw `dayOfWeek is required`;
            }
            if (restriction.worktime[i].dayOfWeek.includes(formatDate(currentdate, 'EEEE', 'en').toLowerCase())) {
                result = restriction.worktime[i];
            }
            i += 1;
        }
        if (!isValue(result)) {
            throw new Error('There is no current work schedule for the current day');
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
        if (isValue(checkMemory)) {
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
        if (isValue(checkMemory)) {
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
        if (isValue(checkMemory)) {
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
        if (isValue(checkMemory)) {
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
        if (isValue(checkMemory)) {
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
        if (isValue(checkMemory)) {
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
        if (isValue(checkMemory)) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.convertMinutesToTime(time);
            this._memory.convertMinutesToTime.set(memoryKey, result);
            return result;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFrQixNQUFNLE1BQU0sQ0FBQztBQXlKMUQsMEZBQTBGO0FBQzFGLFNBQVMsT0FBTyxDQUNkLEtBQTJCO0lBRTNCLE9BQU8sS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUyxDQUFDO0FBQy9DLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLFdBQW9CO0lBQzlDLE9BQU8sQ0FDTCxPQUFPLFdBQVcsS0FBSyxRQUFRO1FBQy9CLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFDcEIsVUFBVSxJQUFJLFdBQVc7UUFDekIsVUFBVSxJQUFJLFdBQVc7UUFDekIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7UUFDN0IsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FDOUIsQ0FBQztBQUNKLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHVCQUF1QixDQUM5QixXQUE4QjtJQUU5QixPQUFPLENBQ0wsa0JBQWtCLENBQUMsV0FBVyxDQUFDO1FBQy9CLDBCQUEwQixJQUFJLFdBQVc7UUFDekMsMEJBQTBCLElBQUksV0FBVztRQUN6QyxPQUFPLENBQUMsV0FBVyxDQUFDLHdCQUF3QixDQUFDO1FBQzdDLE9BQU8sQ0FBQyxXQUFXLENBQUMsd0JBQXdCLENBQUMsQ0FDOUMsQ0FBQztBQUNKLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sT0FBTyxpQkFBaUI7SUFDNUI7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsZUFBZSxDQUNwQixXQUE4QixFQUM5QixXQUFpQjtRQUVqQixJQUNF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RCxJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekQsT0FBTyxNQUFNLENBQUM7U0FDZjtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZvcm1hdERhdGUsIGlzRGF0ZSB9IGZyb20gJy4vZm9ybWF0RGF0ZSc7XG5pbXBvcnQgeyBUaW1lWm9uZUlkZW50aWZpZXIgLCBUaW1lWm9uZVN0cmluZ30gZnJvbSAnLi90eic7XG5cbi8qKlxuICog0JHQsNC30L7QstGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyAtINGB0LvRg9C20LXQsdC90YvQuSDQuNC90YLQtdGA0YTQtdC50YEuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgV29ya1RpbWVCYXNlIHtcbiAgLyoqINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cbiAgc3RhcnQ6IFRpbWVTdHJpbmc7XG5cbiAgLyoqINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cbiAgc3RvcDogVGltZVN0cmluZztcblxuICAvKiog0L/QtdGA0LXRgNGL0LIg0L3QsCDQvtCx0LXQtCovXG4gIGJyZWFrPzogYCR7bnVtYmVyfSR7bnVtYmVyfToke251bWJlcn0ke251bWJlcn0tJHtudW1iZXJ9JHtudW1iZXJ9OiR7bnVtYmVyfSR7bnVtYmVyfWA7XG59XG5cblxudHlwZSBEYXkgPSBcIm1vbmRheVwiIHwgXCJ0dWVzZGF5XCIgfCBcIndlZG5lc2RheVwiIHwgXCJ0aHVyc2RheVwiIHwgXCJmcmlkYXlcIiB8IFwic2F0dXJkYXlcIiB8IFwic3VuZGF5XCJcblxuXG5cbi8qKlxuICog0JjQvdGE0L7RgNC80LDRhtC40Y8g0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gLSDRgdC70YPQttC10LHQvdGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtUaW1lIGV4dGVuZHMgV29ya1RpbWVCYXNlIHtcbiAgLyoqINC00LXQvdGMINC90LXQtNC10LvQuCwg0Log0LrQvtGC0L7RgNC+0LzRgyDQv9GA0LjQvNC10L3Rj9C10YLRgdGPINGN0YLQviDQstGA0LXQvNGPICovXG4gIGRheU9mV2VlazogRGF5W107XG5cbiAgLyoqIFxuICAgKiBAZGVwcmVjYXRlZCBcbiAgICog0L7Qs9GA0LDQvdC40YfQtdC90LjRjyDQv9C+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQtNC70Y8g0YHQsNC80L7QstGL0LLQvtC30LBcbiAgKi9cbiAgc2VsZlNlcnZpY2U/OiBXb3JrVGltZUJhc2U7XG59XG5cbi8qKlxuICog0JjQvdGC0LXRgNGE0LXQudGBINC+0LHRitC10LrRgtCwLCDQv9C+0LvRg9GH0LDQtdC80L7Qs9C+INC+0YIgQVBJIEB3ZWJyZXN0by9jb3JlINC4INGB0L7QtNC10YDQttCw0YnQtdCz0L4g0YLQtdC60YPRidC40LUg0LTQsNC90L3Ri9C1INC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y9cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXN0cmljdGlvbnMge1xuICAvKiog0LLRgNC10LzQtdC90L3QsNGPINC30L7QvdCwINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cbiAgdGltZXpvbmU/OiBUaW1lWm9uZVN0cmluZztcblxuICAvKiogINC80LDRgdGB0LjQsiDQvtCz0YDQsNC90LjRh9C10L3QuNC5INC/0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0LTQu9GPINGA0LDQt9C90YvRhSDQtNC90LXQuSDQvdC10LTQtdC70LguICovXG4gIHdvcmt0aW1lOiBXb3JrVGltZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEh0bWxGb3JtRmllbGQge1xuICBpZDogc3RyaW5nO1xuICB0eXBlOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIHJlcXVpcmVkOiBib29sZWFuO1xuICByZWdleDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvdW50cnkge1xuICBwaG9uZUNvZGU6IHN0cmluZztcbiAgaXNvOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgbmF0aXZlQ291bnRyeU5hbWU6IHN0cmluZztcbiAgbGFuZ3VhZ2U6IHN0cmluZ1tdO1xuICBjdXJyZW5jeTogc3RyaW5nO1xuICBjdXJyZW5jeVN5bWJvbDogc3RyaW5nO1xuICBjdXJyZW5jeUlTTzogc3RyaW5nO1xuICBjdXJyZW5jeVVuaXQ6IHN0cmluZztcbiAgY3VycmVuY3lEZW5vbWluYXRpb246IG51bWJlcjtcbiAgcGhvbmVNYXNrOiBzdHJpbmdbXTtcbiAgZmxhZzogc3RyaW5nO1xufVxuXG4vKiog0JTQsNC90L3Ri9C1INC+INC80L7QtNC10LvQuCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC90LAg0YHQsNC50YLQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXG4vKipcbiAqIEBkZXByZWNhdGVkINC90YPQttC90L4g0LLRi9C90LXRgdGC0Lgg0LjQtyDQu9C40LHRiyDRgNCw0LHQvtGC0Ysg0YEg0YDQsNGB0L/QuNGB0LDQvdC40Y/QvNC4XG4gKi9cbmV4cG9ydCB0eXBlIFVzZXJSZXN0cmljdGlvbnM8VCBleHRlbmRzIHt9ID0ge30+ID0ge1xuICAvKiog0J/QvtC60LDQt9GL0LLQsNC10YIsINC60LDQutC+0Lkg0LLQuNC0INC00LDQvdC90YvRhSDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9C10Lwg0LTQu9GPINCw0LLRgtC+0YDQuNC30LDRhtC40LggKi9cbiAgbG9naW5GaWVsZDogc3RyaW5nO1xuICAvKipcbiAgICogWm9kaWFjIHNpZ24sIEh1bWFuIGRlc2luZyB0eXBlLCBCZXN0IEZyaWVuZCwgcmVmZXJhbCBsaW5rIGV0Y1xuICAgKi9cbiAgY3VzdG9tRmllbGRzPzogSHRtbEZvcm1GaWVsZFtdIHwgbnVsbDtcbiAgLyoqXG4gICAqIHBvc3NpYmxlIDMgdmFyaWFudHMgWydyZXF1aXJlZCcsICdmcm9tX290cCcsICdkaXNhYmxlZCddIGJ5IGRlZmF1bHQ6IGBmcm9tX290cGAgaXQgbWVhbnMgd2hhdCBuZWVkIG9ubHkgT1RQLCBmb3IgbmV4dCBsb2dpbnMgIHBhc3N3b3JkUmVxdWlyZWQsIGRpc2FibGVkIGlzIG1lYW5zIHBhc3N3b3JkIGZvcmJpZGRlbiBhbmQgeW91IG5lZWQgYWxsIHRpbWUgZ2V0IE9UUCBwYXNzd29yZFxuICAgKi9cbiAgcGFzc3dvcmRQb2xpY3k6ICdyZXF1aXJlZCcgfCAnZnJvbV9vdHAnIHwgJ2Rpc2FibGVkJztcbiAgLyoqXG4gICAqIGJ5IGRlZmF1bHQgPSBmYWxzZVxuICAgKi9cbiAgbG9naW5PVFBSZXF1aXJlZDogYm9vbGVhbjtcbiAgLyoqXG4gICAqINCh0L/QuNGB0L7QuiDRgdGC0YDQsNC9LCDRgtC10LvQtdGE0L7QvdC90YvQtSDQutC+0LTRiyDQutC+0YLQvtGA0YvRhSDQtNC+0YHRgtGD0L/QvdGLINC00LvRjyDRg9C60LDQt9Cw0L3QuNGPINCyINC90L7QvNC10YDQtSDRgtC10LvQtdGE0L7QvdCwINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xuICAgKi9cbiAgYWxsb3dlZFBob25lQ291bnRyaWVzOiBDb3VudHJ5W107XG4gIC8qKlxuICAgKiDQodGB0YvQu9C60LAg0L3QsCDQv9C+0LvQuNGC0LjQutGDINC+0LHRgNCw0LHQvtGC0LrQuCDQv9C10YDRgdC+0L3QsNC70YzQvdGL0YUg0LTQsNC90L3Ri9GFXG4gICAqL1xuICBsaW5rVG9Qcm9jZXNzaW5nUGVyc29uYWxEYXRhOiBzdHJpbmc7XG4gIC8qKlxuICAgKiDQodGB0YvQu9C60LAg0L3QsCDQv9C+0LvRjNC30L7QstCw0YLQtdC70YzRgdC60L7QtSDRgdC+0LPQu9Cw0YjQtdC90LjQtVxuICAgKi9cbiAgbGlua1RvVXNlckFncmVlbWVudDogc3RyaW5nO1xuICAvKipcbiAgICog0JTQu9C40L3QsCDQutC+0LTQsCDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjRjyBPVFBcbiAgICovXG4gIE9UUGxlbmd0aDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBbGxvdyBzcGVuZGluZyBib251c2VzXG4gICAqL1xuICBhbGxvd0JvbnVzU3BlbmRpbmc6IGJvb2xlYW5cbn0gJiBUO1xuXG4vKipcbiAqIEBkZXByZWNhdGVkINCt0YLQviDQvdGD0LbQvdC+INC/0LXRgNC10L3QtdGB0YLQuCDQuNC3INC70LjQsdGLIHdvcmt0aW1lINCyIG5nR1FMINC/0L7RgtC+0LzRg9GH0YLQviDRgtGD0YIg0L7Rh9C10L3RjCDQvNC90L7Qs9C+INCy0YHQtdCz0L4g0YfRgtC+INC90LUg0L7RgtC90L7RgdC40YLRgdGPINC6INCy0L7RgNC60YLQsNC50LzRg1xuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc3RyaWN0aW9uc09yZGVyPFQgZXh0ZW5kcyB7fSA9IHt9PiBleHRlbmRzIFJlc3RyaWN0aW9ucyB7XG5cbiAgLyoqXG4gICAqIEdyYXBoUUwgc2NoZW1hIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgdmVyc2lvblxuICAgKi9cbiAgZ3JhcGhxbFNjaGVtYUJhY2t3YXJkQ29tcGF0aWJpbGl0eVZlcnNpb246IG51bWJlclxuXG4gIC8qKiDQvNC40L3QuNC80LDQu9GM0L3QvtC1INCy0YDQtdC80Y8g0LTQvtGB0YLQsNCy0LrQuCovXG4gIG1pbkRlbGl2ZXJ5VGltZUluTWludXRlczogc3RyaW5nO1xuXG4gIC8qKiDQvtCz0YDQsNC90LjRh9C10L3QuNC1INC80LDQutGB0LjQvNCw0LvRjNC90L7QuSDQtNCw0YLRiyDQt9Cw0LrQsNC30LAg0LIg0LHRg9C00YPRidC10LwgKNCyINC80LjQvdGD0YLQsNGFKSovXG4gIHBvc3NpYmxlVG9PcmRlckluTWludXRlczogbnVtYmVyO1xuXG4gIC8qKiAg0YPRgdGC0LDQvdC+0LLQu9C10L3QviDQu9C4INC90LAg0YLQtdC60YPRidC40Lkg0LzQvtC80LXQvdGCINC+0LPRgNCw0L3QuNGH0LXQvdC40LUg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90L7QtSDQstGA0LXQvNGPICovXG4gIGRlbGl2ZXJ5VG9UaW1lRW5hYmxlZD86IGJvb2xlYW47XG5cbiAgLyoqINCU0L7Qv9C+0LvQvdC40YLQtdC70YzQvdGL0Lkg0LrQvtC80LzQtdC90YLQsNGA0LjQuSDQv9C+INC00L7RgdGC0LDQstC60LUgKi9cbiAgZGVsaXZlcnlEZXNjcmlwdGlvbj86IHN0cmluZztcblxuICAvKiog0KDQsNC30L3QvtCy0LjQtNC90L7RgdGC0Ywg0LLQstC+0LTQuNC80L7QuSDQutCw0L/Rh9C4ICovXG4gIGNhcHRjaGFUeXBlPzogc3RyaW5nIHwgbnVsbDtcblxuICAvKiog0JTQsNC90L3Ri9C1INC+INC80L7QtNC10LvQuCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC90LAg0YHQsNC50YLQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXG4gIHVzZXI/OiBVc2VyUmVzdHJpY3Rpb25zPFQ+IHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0b3JSZXN1bHQge1xuICB3b3JrTm93OiBib29sZWFuO1xuICBpc05ld0RheT86IGJvb2xlYW47XG4gIGN1cnJlbnRUaW1lPzogbnVtYmVyO1xuICBjdXJlbnREYXlTdGFydFRpbWU/OiBudW1iZXI7XG4gIGN1cmVudERheVN0b3BUaW1lPzogbnVtYmVyO1xufVxuXG50eXBlIEhvdXJzRGlnaXRzID0gYCR7bnVtYmVyfSR7bnVtYmVyfWBcbnR5cGUgTWludXRlRGlnaXRzID0gYCR7bnVtYmVyfSR7bnVtYmVyfWBcbmV4cG9ydCB0eXBlIFRpbWVTdHJpbmcgPSBgJHtIb3Vyc0RpZ2l0c306JHtNaW51dGVEaWdpdHN9YDtcblxuLyoqINCk0YPQvdC60YbQuNGPLdGF0LXQu9C/0LXRgCDQtNC70Y8g0L/RgNC+0LLQtdGA0LrQuCwg0YfRgtC+INC/0LXRgNC10LTQsNC90L3QvtC1INC30L3QsNGH0LXQvdC40LUg0L3QtSDRj9Cy0LvRj9C10YLRgdGPIG51bGwg0LjQu9C4IHVuZGVmaW5lZCAqL1xuZnVuY3Rpb24gaXNWYWx1ZTxUIGV4dGVuZHMgYW55PihcbiAgdmFsdWU6IFQgfCBudWxsIHwgdW5kZWZpbmVkXG4pOiB2YWx1ZSBpcyBOb25OdWxsYWJsZTxUPiB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqINCk0YPQvdC60YbQuNGPINCy0LDQu9C40LTQsNGG0LjQuCDQv9C10YDQtdC00LDQvdC90L7Qs9C+INC+0LHRitC10LrRgtCwIHJlc3RyaWN0aW9uINC90LAg0YHQvtC+0YLQstC10YLRgdGC0LLQuNC1INC40L3RgtC10YDRhNC10LnRgdGDIFJlc3RyaWN0aW9uc1xuICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L/RgNC+0LLQtdGA0Y/QtdC80YvQuSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC4INCy0YDQtdC80LXQvdC90L7QuSDQt9C+0L3QtS5cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZFJlc3RyaWN0aW9uKHJlc3RyaWN0aW9uOiB1bmtub3duKTogcmVzdHJpY3Rpb24gaXMgUmVzdHJpY3Rpb25zIHtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgcmVzdHJpY3Rpb24gPT09ICdvYmplY3QnICYmXG4gICAgaXNWYWx1ZShyZXN0cmljdGlvbikgJiZcbiAgICAndGltZXpvbmUnIGluIHJlc3RyaWN0aW9uICYmXG4gICAgJ3dvcmt0aW1lJyBpbiByZXN0cmljdGlvbiAmJlxuICAgIGlzVmFsdWUocmVzdHJpY3Rpb24udGltZXpvbmUpICYmXG4gICAgaXNWYWx1ZShyZXN0cmljdGlvbi53b3JrdGltZSlcbiAgKTtcbn1cblxuLyoqXG4gKiDQpNGD0L3QutGG0LjRjyDQstCw0LvQuNC00LDRhtC40Lgg0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQvtCx0YrQtdC60YLQsCByZXN0cmljdGlvbiDQvdCwINGB0L7QvtGC0LLQtdGC0YHRgtCy0LjQtSDQvNC40L3QuNC80LDQu9GM0L3Ri9C8INC00LDQvdC90YvQvCDQtNC70Y8g0LfQsNC60LDQt9CwXG4gKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXG4gKi9cbmZ1bmN0aW9uIGlzVmFsaWRSZXN0cmljdGlvbk9yZGVyKFxuICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXJcbik6IHJlc3RyaWN0aW9uIGlzIFJlc3RyaWN0aW9uc09yZGVyIHtcbiAgcmV0dXJuIChcbiAgICBpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pICYmXG4gICAgJ21pbkRlbGl2ZXJ5VGltZUluTWludXRlcycgaW4gcmVzdHJpY3Rpb24gJiZcbiAgICAncG9zc2libGVUb09yZGVySW5NaW51dGVzJyBpbiByZXN0cmljdGlvbiAmJlxuICAgIGlzVmFsdWUocmVzdHJpY3Rpb24ubWluRGVsaXZlcnlUaW1lSW5NaW51dGVzKSAmJlxuICAgIGlzVmFsdWUocmVzdHJpY3Rpb24ucG9zc2libGVUb09yZGVySW5NaW51dGVzKVxuICApO1xufVxuXG4vKipcbiAqINCa0LvQsNGB0YEsINGB0L7QtNC10YDQttCw0YnQuNC5INGB0YLQsNGC0LjRh9C10YHQutC40LUg0LzQtdGC0L7QtNGLLCDQvdC10L7QsdGF0L7QtNC40LzRi9C1INC00LvRjyDRgNCw0LHQvtGC0Ysg0YEg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9C80Lgg0YDQsNCx0L7Rh9C10LPQviDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxuICog0KHQvtC30LTQsNCy0LDRgtGMINC90L7QstGL0Lkg0Y3QutC30LXQvNC/0LvRj9GAINGN0YLQvtCz0L4g0LrQu9Cw0YHRgdCwINC00LvRjyDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjyDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyINC90LUg0YLRgNC10LHRg9C10YLRgdGPLlxuICpcbiAqINCf0YDQuCDRjdGC0L7QvCDQv9GA0Lgg0YHQvtC30LTQsNC90LjQuCDRjdC60LfQtdC80L/Qu9GP0YDQsCDQutC70LDRgdGB0LAg0YMg0L7QsdGK0LXQutGC0LAg0YLQsNC60LbQtSDQsdGD0LTRg9GCINC00L7RgdGC0YPQv9C90Ysg0YHQvtCx0YHRgtCy0LXQvdC90YvQtSDRgNC10LDQu9C40LfQsNGG0LjQuFxuICog0LLRgdC10YUg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7Qsi5cbiAqINCt0YLQuCDRgNC10LDQu9C40LfQsNGG0LjQuCDQvtGC0LvQuNGH0LDRjtGC0YHRjyDQvtGCINCy0YvQt9C+0LLQvtCyINGB0YLQsNGC0LjRh9C10YHQutC40YUg0LzQtdGC0L7QtNC+0LIg0YLQvtC70YzQutC+INC80LXQvNC+0LjQt9Cw0YbQuNC10Lkg0LLRi9C/0L7Qu9C90LXQvdC90YvRhSDRgNCw0YHRh9C10YLQvtCyLlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIFdvcmtUaW1lVmFsaWRhdG9yIHtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkINCR0YPQtNC10YIg0L/QtdGA0LXQvNC10YnQtdC90LAg0LjQtyDQu9C40LHRi1xuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMsINC90LAg0LrQvtGC0L7RgNGD0Y4g0LzQvtC20L3QviDQt9Cw0LrQsNC30LDRgtGMINC00L7RgdGC0LDQstC60YMuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHJldHVybiDQodGC0YDQvtC60LAsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidCw0Y8g0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINC00L7RgdGC0YPQv9C90YPRjiDQtNCw0YLRgyDQtNC+0YHRgtCw0LLQutC4INCyINGE0L7RgNC80LDRgtC1IHl5eXktTU0tZGQuXG4gICAqL1xuICBzdGF0aWMgZ2V0TWF4T3JkZXJEYXRlKFxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcixcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxuICApOiBzdHJpbmcge1xuICAgIGlmIChcbiAgICAgIGlzVmFsdWUocmVzdHJpY3Rpb24pICYmXG4gICAgICBpc1ZhbGlkUmVzdHJpY3Rpb25PcmRlcihyZXN0cmljdGlvbikgJiZcbiAgICAgIGlzRGF0ZShjdXJyZW50ZGF0ZSlcbiAgICApIHtcbiAgICAgIHJldHVybiBmb3JtYXREYXRlKFxuICAgICAgICBjdXJyZW50ZGF0ZS5nZXRUaW1lKCkgKyByZXN0cmljdGlvbi5wb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXMgKiA2MDAwMCxcbiAgICAgICAgJ3l5eXktTU0tZGQnLFxuICAgICAgICAnZW4nXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGlzRGF0ZShjdXJyZW50ZGF0ZSlcbiAgICAgICAgICA/ICfQndC1INC/0LXRgNC10LTQsNC9INC60L7RgNGA0LXQutGC0L3Ri9C5INC+0LHRitC10LrRgiDQtNCw0YLRiydcbiAgICAgICAgICA6ICFpc1ZhbHVlKHJlc3RyaWN0aW9uKVxuICAgICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJ1xuICAgICAgICAgICAgOiAn0J/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucydcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxuICAgKiBAcGFyYW0gdGltZSAtINGB0YLRgNC+0LrQsCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgIC0g0LLRgNC10LzRjy5cbiAgICogQHJldHVybiDQutC+0Lst0LLQviDQvNC40L3Rg9GCLlxuICAgKi9cbiAgc3RhdGljIGdldFRpbWVGcm9tU3RyaW5nKHRpbWU6IFRpbWVTdHJpbmcpOiBudW1iZXIge1xuICAgIGlmICghaXNWYWx1ZSh0aW1lKSkge1xuICAgICAgdGhyb3cgJ9Cd0LUg0L/QtdGA0LXQtNCw0L3QsCDRgdGC0YDQvtC60LAg0YEg0L/RgNC10L7QsdGA0LDQt9GD0LXQvNGL0Lwg0LLRgNC10LzQtdC90LXQvCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlZ0V4cCA9IG5ldyBSZWdFeHAoXG4gICAgICAgIC9eKDAwfDAxfDAyfDAzfDA0fDA1fDA2fDA3fDA4fDA5fDEwfDExfDEyfDEzfDE0fDE1fDE2fDE3fDE4fDE5fDIwfDIxfDIyfDIzKSs6KFswLTVdXFxkKSsvXG4gICAgICApO1xuICAgICAgbGV0IGNoZWNrZWRUaW1lID0gdGltZS50cmltKCk7XG5cbiAgICAgIGlmIChjaGVja2VkVGltZS5pbmNsdWRlcygnICcpIHx8IGNoZWNrZWRUaW1lLmluY2x1ZGVzKCdUJykpIHtcbiAgICAgICAgY2hlY2tlZFRpbWUgPSBjaGVja2VkVGltZS5zcGxpdChcbiAgICAgICAgICBjaGVja2VkVGltZS5pbmNsdWRlcygnICcpID8gJyAnIDogJ1QnXG4gICAgICAgIClbMV07XG4gICAgICB9XG5cbiAgICAgIGlmIChyZWdFeHAudGVzdChjaGVja2VkVGltZSkpIHtcbiAgICAgICAgcmV0dXJuICtjaGVja2VkVGltZS5zcGxpdCgnOicpWzBdICogNjAgKyArY2hlY2tlZFRpbWUuc3BsaXQoJzonKVsxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICfQn9C10YDQtdC00LDQvdC90LDRjyDRgdGC0YDQvtC60LAg0L3QtSDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0LXRgiDRhNC+0YDQvNCw0YLRgyBISDptbSAtYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INC60L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQv9C10YDQtdC00LDQvdC90L7QtSDQutC+0Lst0LLQviDQvNC40L3Rg9GCINCyINGB0YLRgNC+0LrQvtCy0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLSBgKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAuXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XG4gICAqXG4gICAqIGNvbnN0IGEgPSBjb252ZXJ0TWludXRlc1RvVGltZSg1MCkgLy8gYSA9ICcwMDo1MCdcbiAgICogY29uc3QgYiA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDEyMDApIC8vIGIgPSAnMjA6MDAnXG4gICAqXG4gICAqIEBwYXJhbSB0aW1lIC0g0KfQuNGB0LvQviDQsiDQtNC40LDQv9Cw0LfQvtC90LUg0L7RgiAwINC00L4gMTQ0MCAo0YLQsNC6INC60LDQuiDQvNCw0LrRgdC40LzRg9C8INCyIDEg0YHRg9GC0LrQsNGFID0gMTQ0MCDQvNC40L3Rg9GCKS5cbiAgICog0J/RgNC4INC/0LXRgNC10LTQsNGH0LUg0LIgdGltZSDQvtGC0YDQuNGG0LDRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8sINC30L3QsNC6INCx0YPQtNC10YIgXCLQvtGC0L7QsdGA0YjQtdC9XCIsINCwINC00LvRjyDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIsINGA0LDRgdGB0YfQuNGC0LDQvdC90YvQuSDQtNC70Y8g0L/QvtC70YPRh9C10L3QvdC+0LPQviDQv9C+0LvQvtC20LjRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8uXG4gICAqINCV0YHQu9C4INCyIHRpbWUg0LHRg9C00LXRgiDQv9C10YDQtdC00LDQvdC+INC30L3QsNGH0LXQvdC40LUg0LHQvtC70YzRiNC1IDE0NDAgLSDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIg0LTQu9GPINC30L3QsNGH0LXQvdC40Y8g0LHQtdC3INGD0YfQtdGC0LAgXCLQv9GA0LXQstGL0YjQsNGO0YnQuNGFINGB0YPRgtC+0LpcIiAo0YIu0LUuINGBINC60YDQsNGC0L3Ri9C8INCy0YvRh9C10YLQvtC8IDE0NDAg0LzQuNC90YPRgilcbiAgICpcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcbiAgICpcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDYwKSAvLyBhID0gJzAxOjAwJ1xuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTUwMCkgLy8gYiA9ICcwMTowMCcgKDE0NDAg0LzQuNC90YPRgiBcItGG0LXQu9GL0YVcIiDRgdGD0YLQvtC6INCx0YvQu9C4IFwi0L7RgtCx0YDQvtGI0LXQvdGLXCIpXG4gICAqXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBzdGF0aWMgY29udmVydE1pbnV0ZXNUb1RpbWUodGltZTogbnVtYmVyKTogVGltZVN0cmluZyB7XG4gICAgaWYgKHRpbWUgPCAxNDQxKSB7XG4gICAgICBjb25zdCBob3VyID0gTWF0aC5mbG9vcih0aW1lIC8gNjApO1xuICAgICAgY29uc3QgaG91clN0cjogSG91cnNEaWdpdHMgPSA8SG91cnNEaWdpdHM+KFxuICAgICAgICAoaG91ciA8PSA5ID8gYDAke1N0cmluZyhob3VyKX1gIDogU3RyaW5nKGhvdXIpKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IG1pbnV0ZXMgPSBTdHJpbmcodGltZSAtIGhvdXIgKiA2MCk7XG4gICAgICBjb25zdCBtaW51dGVzU3RyOiBNaW51dGVEaWdpdHMgPSA8TWludXRlRGlnaXRzPihcbiAgICAgICAgYCR7bWludXRlcy5sZW5ndGggPT0gMSA/ICcwJyA6ICcnfSR7bWludXRlc31gXG4gICAgICApO1xuICAgICAgcmV0dXJuIGAke2hvdXJTdHJ9OiR7bWludXRlc1N0cn1gO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUodGltZSAtIDE0NDApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INC/0YDQvtCy0LXRgNGP0LXRgiwg0LTQvtGB0YLRg9C/0L3QsCDQu9C4INCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjywg0LTQu9GPINC60L7RgtC+0YDRi9GFINC4INC/0YDQvtCy0LXRgNGP0LXRgtGB0Y8g0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4XG4gICAqIEByZXR1cm4g0J7QsdGM0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjjpcbiAgICoge1xuICAgICAgICBpc1dvcmtOb3c6Ym9vbGVhbiAtINCS0L7Qt9C80L7QttC90LAg0LvQuCDQtNC+0YHRgtCw0LLQutCwINCyINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPXG4gICAgICAgIGlzTmV3RGF5OmJvb2xlYW4gLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC40LfQvdCw0LosINGH0YLQviDQuNC3LdC30LAg0YDQsNC30L3QuNGG0Ysg0YfQsNGB0L7QstGL0YUg0L/QvtGP0YHQvtCyINGA0LDRgdGH0LXRgiDQtNCw0YLRiyBcItC/0LXRgNC10L/RgNGL0LPQvdGD0LtcIiDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwuXG4gICAgICAgIGN1cnJlbnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0L7QstC10YDRj9C10LzQvtC1INC80LXRgtC+0LTQvtC8INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gICAgICAgIGN1cmVudERheVN0YXJ0VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cbiAgICAgIH1cbiAgICovXG4gIHN0YXRpYyBpc1dvcmtOb3coXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucyB8IFJlc3RyaWN0aW9uc09yZGVyLFxuICAgIGN1cnJlbnRkYXRlOiBEYXRlID0gbmV3IERhdGUoKVxuICApOiBWYWxpZGF0b3JSZXN1bHQge1xuICAgIC8vINCV0YHQu9C4INC40YHQv9C+0LvRjNC90Y/QtdGC0YHRjyDQsiBOb2RlSlNcbiAgICBpZiAoXG4gICAgICBpc1ZhbHVlKHJlc3RyaWN0aW9uKSAmJlxuICAgICAgIWlzVmFsdWUocmVzdHJpY3Rpb24udGltZXpvbmUpICYmXG4gICAgICB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCdcbiAgICApIHtcbiAgICAgIHJlc3RyaWN0aW9uLnRpbWV6b25lID1cbiAgICAgICAgcHJvY2Vzcz8uZW52Py5UWiBhcyBUaW1lWm9uZVN0cmluZyA/PyBJbnRsLkRhdGVUaW1lRm9ybWF0KCkucmVzb2x2ZWRPcHRpb25zKCkudGltZVpvbmUgYXMgVGltZVpvbmVTdHJpbmc7XG4gICAgfVxuXG4gICAgaWYgKCFpc1ZhbHVlKHJlc3RyaWN0aW9uKSB8fCAhaXNWYWxpZFJlc3RyaWN0aW9uKHJlc3RyaWN0aW9uKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAhaXNEYXRlKGN1cnJlbnRkYXRlKVxuICAgICAgICAgID8gJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LrQvtGA0YDQtdC60YLQvdGL0Lkg0L7QsdGK0LXQutGCINC00LDRgtGLJ1xuICAgICAgICAgIDogIWlzVmFsdWUocmVzdHJpY3Rpb24pXG4gICAgICAgICAgICA/ICfQndC1INC/0LXRgNC10LTQsNC9INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnXG4gICAgICAgICAgICA6ICfQn9C10YDQtdC00LDQvSDQvdC10LLQsNC70LjQtNC90YvQuSDQvtCx0YzQtdC60YIgcmVzdHJpY3Rpb25zJ1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICAhaXNWYWx1ZShyZXN0cmljdGlvbi53b3JrdGltZSkgfHxcbiAgICAgICAgIU9iamVjdC5rZXlzKHJlc3RyaWN0aW9uLndvcmt0aW1lKS5sZW5ndGhcbiAgICAgICkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHdvcmtOb3c6IHRydWUsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbXBhbnlMb2NhbFRpbWVab25lID1cbiAgICAgICAgVGltZVpvbmVJZGVudGlmaWVyLmdldFRpbWVab25lR01UT2Zmc2V0KFxuICAgICAgICAgIHJlc3RyaWN0aW9uLnRpbWV6b25lXG4gICAgICAgICkuc3BsaXQoJzonKTtcbiAgICAgIGNvbnN0IGNvbXBhbnlMb2NhbFRpbWVab25lRGVsdGEgPVxuICAgICAgICArY29tcGFueUxvY2FsVGltZVpvbmVbMF0gKiA2MCArICtjb21wYW55TG9jYWxUaW1lWm9uZVsxXTtcbiAgICAgIGNvbnN0IGxva2FsVGltZURlbHRhID1cbiAgICAgICAgY29tcGFueUxvY2FsVGltZVpvbmVEZWx0YSArIGN1cnJlbnRkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCk7IC8vINGB0LzQtdGJ0LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPINC+0YLQvdC+0YHQuNGC0LXQu9GM0L3QviDQstGA0LXQvNC10L3QuCDRgtC+0YDQs9C+0LLQvtC5INGC0L7Rh9C60LhcbiAgICAgIGNvbnN0IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPVxuICAgICAgICBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyhcbiAgICAgICAgICA8VGltZVN0cmluZz5mb3JtYXREYXRlKGN1cnJlbnRkYXRlLCAnSEg6bW0nLCAnZW4nKVxuICAgICAgICApICsgbG9rYWxUaW1lRGVsdGE7XG4gICAgICAvKipcbiAgICAgICAqINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0YEg0L3QsNGH0LDQu9CwINC00L3RjyAoNjAwID0gMTA6MDAuIDEyMDAgPSAyMDowMClcbiAgICAgICAqINC10YHQu9C4INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC/0LXRgNC10L/RgNGL0LPQvdGD0Lsg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLCDRgtC+INC/0YDQuNCy0L7QtNC40Lwg0LLRgNC10LzRjyDQuiDQv9GA0LDQstC40LvRjNC90L7QvNGDINC30L3QsNGH0LXQvdC40Y4g0LIg0LTQuNCw0L/QsNC30L7QvdC1IDI0INGH0LDRgdC+0LJcbiAgICAgICAqICovXG4gICAgICBjb25zdCBjdXJyZW50VGltZSA9XG4gICAgICAgIGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwXG4gICAgICAgICAgPyBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhIC0gMTQ0MFxuICAgICAgICAgIDogY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YTtcblxuICAgICAgY29uc3QgY3VycmVudERheVdvcmtUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxuICAgICAgICByZXN0cmljdGlvbixcbiAgICAgICAgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDBcbiAgICAgICAgICA/IG5ldyBEYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKVxuICAgICAgICAgIDogY3VycmVudGRhdGVcbiAgICAgICk7IC8vINGC0LXQutGD0YnQtdC1INGA0LDQsdC+0YfQtdC1INCy0YDQtdC80Y9cbiAgICAgIGNvbnN0IGN1cmVudERheVN0YXJ0VGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxuICAgICAgICA8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RhcnRcbiAgICAgICk7IC8vINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFXG4gICAgICBjb25zdCBjdXJlbnREYXlTdG9wVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxuICAgICAgICA8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RvcFxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YVcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHdvcmtOb3c6XG4gICAgICAgICAgY3VycmVudFRpbWUgPCBjdXJlbnREYXlTdG9wVGltZSAmJiBjdXJyZW50VGltZSA+IGN1cmVudERheVN0YXJ0VGltZSxcbiAgICAgICAgaXNOZXdEYXk6IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwLFxuICAgICAgICBjdXJyZW50VGltZSxcbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lLFxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCU0L7RgdGC0LDQstC60LAg0LrRg9GA0YzQtdGA0L7QvFwiLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xuICAgKi9cbiAgc3RhdGljIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU6IERhdGVcbiAgKTogc3RyaW5nIHtcbiAgICBpZiAoIWlzVmFsaWRSZXN0cmljdGlvbk9yZGVyKHJlc3RyaWN0aW9uKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfQndC1INC/0LXRgNC10LTQsNC9INC40LvQuCDQv9C10YDQtdC00LDQvSDQvdC10LLQsNC70LjQtNC90YvQuSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY2hlY2tUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuaXNXb3JrTm93KHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XG5cbiAgICBpZiAoY2hlY2tUaW1lLndvcmtOb3cgJiYgaXNWYWx1ZShjaGVja1RpbWUuY3VycmVudFRpbWUpKSB7XG4gICAgICBjb25zb2xlLmxvZygn0KHQtdC50YfQsNGBINGA0LDQsdC+0YfQtdC1INCy0YDQtdC80Y8uINCg0LDRgdGH0LXRgiDQvdC1INGC0YDQtdCx0YPQtdGC0YHRjy4nKTtcbiAgICAgIGNvbnN0IHBvc3NpYmxlVGltZSA9XG4gICAgICAgIGNoZWNrVGltZS5jdXJyZW50VGltZSArICgrcmVzdHJpY3Rpb24ubWluRGVsaXZlcnlUaW1lSW5NaW51dGVzIHx8IDApO1xuICAgICAgY29uc3QgcG9zc2libGVUaW1lU3RyID1cbiAgICAgICAgV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUocG9zc2libGVUaW1lKTtcbiAgICAgIHJldHVybiBmb3JtYXREYXRlKGN1cnJlbnRkYXRlLCBgeXl5eS1NTS1kZCAke3Bvc3NpYmxlVGltZVN0cn1gLCAnZW4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICBpc1ZhbHVlKGNoZWNrVGltZS5jdXJyZW50VGltZSkgJiZcbiAgICAgICAgaXNWYWx1ZShjaGVja1RpbWUuY3VyZW50RGF5U3RvcFRpbWUpXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgY3VycmVudERheVdvcmtUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxuICAgICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICAgIGNoZWNrVGltZS5pc05ld0RheVxuICAgICAgICAgICAgPyBuZXcgRGF0ZShjdXJyZW50ZGF0ZS5nZXRUaW1lKCkgKyA4NjQwMDAwMClcbiAgICAgICAgICAgIDogY3VycmVudGRhdGVcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgdGltZSA9XG4gICAgICAgICAgdGhpcy5nZXRUaW1lRnJvbVN0cmluZyg8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RhcnQpICtcbiAgICAgICAgICArcmVzdHJpY3Rpb24ubWluRGVsaXZlcnlUaW1lSW5NaW51dGVzO1xuICAgICAgICBjb25zdCB0aW1lU3RyaW5nID0gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUodGltZSk7XG4gICAgICAgIHJldHVybiBmb3JtYXREYXRlKFxuICAgICAgICAgIGNoZWNrVGltZS5pc05ld0RheSB8fFxuICAgICAgICAgICAgY2hlY2tUaW1lLmN1cnJlbnRUaW1lID4gY2hlY2tUaW1lLmN1cmVudERheVN0b3BUaW1lXG4gICAgICAgICAgICA/IGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwXG4gICAgICAgICAgICA6IGN1cnJlbnRkYXRlLFxuICAgICAgICAgIGB5eXl5LU1NLWRkICR7dGltZVN0cmluZ31gLFxuICAgICAgICAgICdlbidcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICfQndC1INGD0LTQsNC70L7RgdGMINGA0LDRgdGB0YfQuNGC0LDRgtGMIGN1cnJlbnRUaW1lINC4IGN1cmVudERheVN0b3BUaW1lLic7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCh0LDQvNC+0LLRi9Cy0L7Qt1wiLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xuICAgKi9cbiAgc3RhdGljIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKFxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcixcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxuICApOiBzdHJpbmcge1xuICAgIGlmICghaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIocmVzdHJpY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LjQu9C4INC/0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDQlNC70Y8g0L7QsdC10YHQv9C10YfQtdC90LjRjyDQuNC80LzRg9GC0LDQsdC10LvRjNC90L7RgdGC0Lgg0LTQsNC90L3Ri9GFINGB0L7Qt9C00LDQtdGC0YHRjyDQvdC+0LLRi9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMsINC40LTQtdC90YLQuNGH0L3Ri9C5INC/0L7Qu9GD0YfQtdC90L3QvtC80YMg0LIg0L/QsNGA0LDQvNC10YLRgNCw0YUsINC90L4g0YEg0LjQt9C80LXQvdC10L3QvdGL0Lwg0LzQsNGB0YHQuNCy0L7QvCB3b3JrdGltZS5cbiAgICAgKiDQkiDQvNCw0YHRgdC40LLQtSB3b3JrdGltZSDQvtCx0L3QvtCy0LvRj9GO0YLRgdGPINC+0LPRgNCw0L3QuNGH0LXQvdC40Y8g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINGBINC+0LHRi9GH0L3Ri9GFINC90LAg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQu9GPINGB0LDQvNC+0LLRi9Cy0L7Qt9CwLlxuICAgICAqICovXG4gICAgY29uc3QgbmV3UmVzdHJpY3Rpb24gPSB7XG4gICAgICAuLi5yZXN0cmljdGlvbixcbiAgICAgIHdvcmt0aW1lOiAoPFdvcmtUaW1lW10+cmVzdHJpY3Rpb24ud29ya3RpbWUpLm1hcCgod29ya3RpbWUpID0+IHdvcmt0aW1lKVxuICAgIH07XG4gICAgcmV0dXJuIFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShcbiAgICAgIG5ld1Jlc3RyaWN0aW9uLFxuICAgICAgY3VycmVudGRhdGVcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQuNC3INC80LDRgdGB0LjQstCwINCy0YHQtdGFINCy0LDRgNC40LDQvdGC0L7QsiDQvtCx0YzQtdC60YLQsCByZXN0cmljdGlvbi5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cbiAgICovXG4gIHN0YXRpYyBnZXRDdXJyZW50V29ya1RpbWUoXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucyxcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxuICApOiBXb3JrVGltZSB7XG4gICAgaWYgKCFpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LjQu9C4INC/0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnKTtcbiAgICB9XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XG5cbiAgICB3aGlsZSAoaSA8IHJlc3RyaWN0aW9uLndvcmt0aW1lLmxlbmd0aCAmJiAhaXNWYWx1ZShyZXN1bHQpKSB7XG4gICAgICBcbiAgICAgIGlmKHJlc3RyaWN0aW9uLndvcmt0aW1lW2ldLmRheU9mV2VlayA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IGBkYXlPZldlZWsgaXMgcmVxdWlyZWRgXG4gICAgICB9XG4gICAgICBpZiAoKDxzdHJpbmdbXT5yZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWspLmluY2x1ZGVzKGZvcm1hdERhdGUoY3VycmVudGRhdGUsICdFRUVFJywgJ2VuJykudG9Mb3dlckNhc2UoKSlcbiAgICAgICkge1xuICAgICAgICByZXN1bHQgPSByZXN0cmljdGlvbi53b3JrdGltZVtpXTtcbiAgICAgIH1cbiAgICAgIGkgKz0gMTtcbiAgICB9XG5cbiAgICBpZiAoIWlzVmFsdWUocmVzdWx0KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGVyZSBpcyBubyBjdXJyZW50IHdvcmsgc2NoZWR1bGUgZm9yIHRoZSBjdXJyZW50IGRheScpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDQm9C+0LPQuNC60LAg0L3QuNC20LUg0L/RgNC10LTQvdCw0LfQvdCw0YfQtdC90LAg0LTQu9GPINC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPINGN0LrQt9C10LzQv9C70Y/RgNCwINC60LvQsNGB0YHQsCBXb3JrVGltZVZhbGlkYXRvclxuICAgKi9cblxuICBjb25zdHJ1Y3RvcigpIHsgfVxuXG4gIHByaXZhdGUgX21lbW9yeToge1xuICAgIGdldE1heE9yZGVyRGF0ZTogTWFwPHN0cmluZywgc3RyaW5nPjtcbiAgICBnZXRUaW1lRnJvbVN0cmluZzogTWFwPHN0cmluZywgbnVtYmVyPjtcbiAgICBpc1dvcmtOb3c6IE1hcDxzdHJpbmcsIFZhbGlkYXRvclJlc3VsdD47XG4gICAgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGdldEN1cnJlbnRXb3JrVGltZTogTWFwPHN0cmluZywgV29ya1RpbWU+O1xuICAgIGNvbnZlcnRNaW51dGVzVG9UaW1lOiBNYXA8c3RyaW5nLCBUaW1lU3RyaW5nPjtcbiAgfSA9IHtcbiAgICAgIGdldE1heE9yZGVyRGF0ZTogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKSxcbiAgICAgIGdldFRpbWVGcm9tU3RyaW5nOiBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpLFxuICAgICAgaXNXb3JrTm93OiBuZXcgTWFwPHN0cmluZywgVmFsaWRhdG9yUmVzdWx0PigpLFxuICAgICAgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxuICAgICAgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXG4gICAgICBnZXRDdXJyZW50V29ya1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBXb3JrVGltZT4oKSxcbiAgICAgIGNvbnZlcnRNaW51dGVzVG9UaW1lOiBuZXcgTWFwPHN0cmluZywgVGltZVN0cmluZz4oKSxcbiAgICB9O1xuXG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMsINC90LAg0LrQvtGC0L7RgNGD0Y4g0LzQvtC20L3QviDQt9Cw0LrQsNC30LDRgtGMINC00L7RgdGC0LDQstC60YMuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHJldHVybiA6c3RyaW5nIC0g0KHRgtGA0L7QutCwLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQsNGPINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQtNC+0YHRgtGD0L/QvdGD0Y4g0LTQsNGC0YMg0LTQvtGB0YLQsNCy0LrQuCDQsiDRhNC+0YDQvNCw0YLQtSB5eXl5LU1NLWRkLlxuICAgKi9cbiAgZ2V0TWF4T3JkZXJEYXRlKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmdldE1heE9yZGVyRGF0ZS5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoaXNWYWx1ZShjaGVja01lbW9yeSkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0TWF4T3JkZXJEYXRlKFxuICAgICAgICByZXN0cmljdGlvbixcbiAgICAgICAgY3VycmVudGRhdGVcbiAgICAgICk7XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0TWF4T3JkZXJEYXRlLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INGB0YfQuNGC0LDQtdGCLCDRgdC60L7Qu9GM0LrQviDQvNC40L3Rg9GCINC+0YIg0L3QsNGH0LDQu9CwINC00L3RjyAoMDA6MDApINC/0YDQvtGI0LvQviDQtNC70Y8g0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQstGA0LXQvNC10L3QuC5cbiAgICogQHBhcmFtIHRpbWUgLSDRgdGC0YDQvtC60LAg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLSDQstGA0LXQvNGPLlxuICAgKiBAcmV0dXJuIDpudW1iZXIgLSDQutC+0Lst0LLQviDQvNC40L3Rg9GCLlxuICAgKi9cbiAgZ2V0VGltZUZyb21TdHJpbmcodGltZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHRpbWUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0VGltZUZyb21TdHJpbmcuZ2V0KG1lbW9yeUtleSk7XG4gICAgaWYgKGlzVmFsdWUoY2hlY2tNZW1vcnkpKSB7XG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKDxUaW1lU3RyaW5nPnRpbWUpO1xuICAgICAgdGhpcy5fbWVtb3J5LmdldFRpbWVGcm9tU3RyaW5nLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQv9GA0L7QstC10YDRj9C10YIsINC00L7RgdGC0YPQv9C90LAg0LvQuCDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60Lgg0L3QsCDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRjy5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8sINC00LvRjyDQutC+0YLQvtGA0YvRhSDQuCDQv9GA0L7QstC10YDRj9C10YLRgdGPINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuFxuICAgKiBAcmV0dXJuINCe0LHRjNC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y46XG4gICAqIHtcbiAgICAgICAgaXNXb3JrTm93OmJvb2xlYW4gLSDQktC+0LfQvNC+0LbQvdCwINC70Lgg0LTQvtGB0YLQsNCy0LrQsCDQsiDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRj1xuICAgICAgICBpc05ld0RheTpib29sZWFuIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQuNC30L3QsNC6LCDRh9GC0L4g0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINGH0LDRgdC+0LLRi9GFINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0LTQsNGC0YsgXCLQv9C10YDQtdC/0YDRi9Cz0L3Rg9C7XCIg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLlxuICAgICAgICBjdXJyZW50VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC+0LLQtdGA0Y/QtdC80L7QtSDQvNC10YLQvtC00L7QvCDQstGA0LXQvNGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gICAgICB9XG4gICAqL1xuICBpc1dvcmtOb3coXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucyB8IFJlc3RyaWN0aW9uc09yZGVyLFxuICAgIGN1cnJlbnRkYXRlPzogRGF0ZVxuICApOiBWYWxpZGF0b3JSZXN1bHQge1xuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmlzV29ya05vdy5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoaXNWYWx1ZShjaGVja01lbW9yeSkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuaXNXb3JrTm93KHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XG4gICAgICB0aGlzLl9tZW1vcnkuaXNXb3JrTm93LnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0JTQvtGB0YLQsNCy0LrQsCDQutGD0YDRjNC10YDQvtC8XCIuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUoXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPVxuICAgICAgdGhpcy5fbWVtb3J5LmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZS5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoaXNWYWx1ZShjaGVja01lbW9yeSkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKFxuICAgICAgICByZXN0cmljdGlvbixcbiAgICAgICAgY3VycmVudGRhdGVcbiAgICAgICk7XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0KHQsNC80L7QstGL0LLQvtC3XCIuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZShcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU6IERhdGVcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcbiAgICBjb25zdCBjaGVja01lbW9yeSA9XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUuZ2V0KG1lbW9yeUtleSk7XG4gICAgaWYgKGlzVmFsdWUoY2hlY2tNZW1vcnkpKSB7XG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKFxuICAgICAgICByZXN0cmljdGlvbixcbiAgICAgICAgY3VycmVudGRhdGVcbiAgICAgICk7XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCw0LrRgtGD0LDQu9GM0L3Ri9C1INC00LDQvdC90YvQtSDQviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0LjQtyDQvNCw0YHRgdC40LLQsCDQstGB0LXRhSDQstCw0YDQuNCw0L3RgtC+0LIg0L7QsdGM0LXQutGC0LAgcmVzdHJpY3Rpb24uXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBnZXRDdXJyZW50V29ya1RpbWUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucywgY3VycmVudGRhdGU6IERhdGUpOiBXb3JrVGltZSB7XG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0Q3VycmVudFdvcmtUaW1lLmdldChtZW1vcnlLZXkpO1xuICAgIGlmIChpc1ZhbHVlKGNoZWNrTWVtb3J5KSkge1xuICAgICAgcmV0dXJuIDxXb3JrVGltZT5jaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxuICAgICAgICByZXN0cmljdGlvbixcbiAgICAgICAgY3VycmVudGRhdGVcbiAgICAgICk7XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0Q3VycmVudFdvcmtUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INC60L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQv9C10YDQtdC00LDQvdC90L7QtSDQutC+0Lst0LLQviDQvNC40L3Rg9GCINCyINGB0YLRgNC+0LrQvtCy0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLSBgKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAuXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XG4gICAqXG4gICAqIGNvbnN0IGEgPSBjb252ZXJ0TWludXRlc1RvVGltZSg1MCkgLy8gYSA9ICcwMDo1MCdcbiAgICogY29uc3QgYiA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDEyMDApIC8vIGIgPSAnMjA6MDAnXG4gICAqXG4gICAqIEBwYXJhbSB0aW1lIC0g0KfQuNGB0LvQviDQsiDQtNC40LDQv9Cw0LfQvtC90LUg0L7RgiAwINC00L4gMTQ0MCAo0YLQsNC6INC60LDQuiDQvNCw0LrRgdC40LzRg9C8INCyIDEg0YHRg9GC0LrQsNGFID0gMTQ0MCDQvNC40L3Rg9GCKS5cbiAgICog0J/RgNC4INC/0LXRgNC10LTQsNGH0LUg0LIgdGltZSDQvtGC0YDQuNGG0LDRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8sINC30L3QsNC6INCx0YPQtNC10YIgXCLQvtGC0L7QsdGA0YjQtdC9XCIsINCwINC00LvRjyDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIsINGA0LDRgdGB0YfQuNGC0LDQvdC90YvQuSDQtNC70Y8g0L/QvtC70YPRh9C10L3QvdC+0LPQviDQv9C+0LvQvtC20LjRgtC10LvRjNC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8uXG4gICAqINCV0YHQu9C4INCyIHRpbWUg0LHRg9C00LXRgiDQv9C10YDQtdC00LDQvdC+INC30L3QsNGH0LXQvdC40LUg0LHQvtC70YzRiNC1IDE0NDAgLSDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIg0LTQu9GPINC30L3QsNGH0LXQvdC40Y8g0LHQtdC3INGD0YfQtdGC0LAgXCLQv9GA0LXQstGL0YjQsNGO0YnQuNGFINGB0YPRgtC+0LpcIiAo0YIu0LUuINGBINC60YDQsNGC0L3Ri9C8INCy0YvRh9C10YLQvtC8IDE0NDAg0LzQuNC90YPRgilcbiAgICpcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcbiAgICpcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDYwKSAvLyBhID0gJzAxOjAwJ1xuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTUwMCkgLy8gYiA9ICcwMTowMCcgKDE0NDAg0LzQuNC90YPRgiBcItGG0LXQu9GL0YVcIiDRgdGD0YLQvtC6INCx0YvQu9C4IFwi0L7RgtCx0YDQvtGI0LXQvdGLXCIpXG4gICAqXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBjb252ZXJ0TWludXRlc1RvVGltZSh0aW1lOiBudW1iZXIpOiBUaW1lU3RyaW5nIHtcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHRpbWUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuY29udmVydE1pbnV0ZXNUb1RpbWUuZ2V0KG1lbW9yeUtleSk7XG4gICAgaWYgKGlzVmFsdWUoY2hlY2tNZW1vcnkpKSB7XG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWUpO1xuICAgICAgdGhpcy5fbWVtb3J5LmNvbnZlcnRNaW51dGVzVG9UaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxufVxuIl19