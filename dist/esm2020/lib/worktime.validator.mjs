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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFrQixNQUFNLE1BQU0sQ0FBQztBQXlKMUQsMEZBQTBGO0FBQzFGLFNBQVMsT0FBTyxDQUNkLEtBQTJCO0lBRTNCLE9BQU8sS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUyxDQUFDO0FBQy9DLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLFdBQW9CO0lBQzlDLE9BQU8sQ0FDTCxPQUFPLFdBQVcsS0FBSyxRQUFRO1FBQy9CLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFDcEIsVUFBVSxJQUFJLFdBQVc7UUFDekIsVUFBVSxJQUFJLFdBQVc7UUFDekIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7UUFDN0IsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FDOUIsQ0FBQztBQUNKLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHVCQUF1QixDQUM5QixXQUE4QjtJQUU5QixPQUFPLENBQ0wsa0JBQWtCLENBQUMsV0FBVyxDQUFDO1FBQy9CLDBCQUEwQixJQUFJLFdBQVc7UUFDekMsMEJBQTBCLElBQUksV0FBVztRQUN6QyxPQUFPLENBQUMsV0FBVyxDQUFDLHdCQUF3QixDQUFDO1FBQzdDLE9BQU8sQ0FBQyxXQUFXLENBQUMsd0JBQXdCLENBQUMsQ0FDOUMsQ0FBQztBQUNKLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sT0FBTyxpQkFBaUI7SUFDNUI7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsZUFBZSxDQUNwQixXQUE4QixFQUM5QixXQUFpQjtRQUVqQixJQUNF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RCxJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekQsT0FBTyxNQUFNLENBQUM7U0FDZjtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZvcm1hdERhdGUsIGlzRGF0ZSB9IGZyb20gJy4vZm9ybWF0RGF0ZSc7XG5pbXBvcnQgeyBUaW1lWm9uZUlkZW50aWZpZXIgLCBUaW1lWm9uZVN0cmluZ30gZnJvbSAnLi90eic7XG5cbi8qKlxuICog0JHQsNC30L7QstGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyAtINGB0LvRg9C20LXQsdC90YvQuSDQuNC90YLQtdGA0YTQtdC50YEuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgV29ya1RpbWVCYXNlIHtcbiAgLyoqINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cbiAgc3RhcnQ6IFRpbWVTdHJpbmc7XG5cbiAgLyoqINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cbiAgc3RvcDogVGltZVN0cmluZztcblxuICAvKiog0L/QtdGA0LXRgNGL0LIg0L3QsCDQvtCx0LXQtCovXG4gIGJyZWFrPzogYCR7bnVtYmVyfSR7bnVtYmVyfToke251bWJlcn0ke251bWJlcn0tJHtudW1iZXJ9JHtudW1iZXJ9OiR7bnVtYmVyfSR7bnVtYmVyfWA7XG59XG5cblxudHlwZSBEYXkgPSBcIm1vbmRheVwiIHwgXCJ0dWVzZGF5XCIgfCBcIndlZG5lc2RheVwiIHwgXCJ0aHVyc2RheVwiIHwgXCJmcmlkYXlcIiB8IFwic2F0dXJkYXlcIiB8IFwic3VuZGF5XCJcblxuXG5cbi8qKlxuICog0JjQvdGE0L7RgNC80LDRhtC40Y8g0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gLSDRgdC70YPQttC10LHQvdGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtUaW1lIGV4dGVuZHMgV29ya1RpbWVCYXNlIHtcbiAgLyoqINC00LXQvdGMINC90LXQtNC10LvQuCwg0Log0LrQvtGC0L7RgNC+0LzRgyDQv9GA0LjQvNC10L3Rj9C10YLRgdGPINGN0YLQviDQstGA0LXQvNGPICovXG4gIGRheU9mV2VlazogRGF5W107XG5cbiAgLyoqIFxuICAgKiBAZGVwcmVjYXRlZCBcbiAgICog0L7Qs9GA0LDQvdC40YfQtdC90LjRjyDQv9C+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQtNC70Y8g0YHQsNC80L7QstGL0LLQvtC30LBcbiAgKi9cbiAgc2VsZlNlcnZpY2U/OiBXb3JrVGltZUJhc2U7XG59XG5cbi8qKlxuICog0JjQvdGC0LXRgNGE0LXQudGBINC+0LHRitC10LrRgtCwLCDQv9C+0LvRg9GH0LDQtdC80L7Qs9C+INC+0YIgQVBJIEB3ZWJyZXN0by9jb3JlINC4INGB0L7QtNC10YDQttCw0YnQtdCz0L4g0YLQtdC60YPRidC40LUg0LTQsNC90L3Ri9C1INC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y9cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXN0cmljdGlvbnMge1xuICAvKiogdGVtcG9yYXJ5IHpvbmUgb2YgdGhlIGVudGVycHJpc2UgKi9cbiAgdGltZXpvbmU6IFRpbWVab25lU3RyaW5nO1xuXG4gIC8qKiAg0LzQsNGB0YHQuNCyINC+0LPRgNCw0L3QuNGH0LXQvdC40Lkg0L/QviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQtNC70Y8g0YDQsNC30L3Ri9GFINC00L3QtdC5INC90LXQtNC10LvQuC4gKi9cbiAgd29ya3RpbWU6IFdvcmtUaW1lW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSHRtbEZvcm1GaWVsZCB7XG4gIGlkOiBzdHJpbmc7XG4gIHR5cGU6IHN0cmluZztcbiAgbGFiZWw6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgcmVxdWlyZWQ6IGJvb2xlYW47XG4gIHJlZ2V4OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ291bnRyeSB7XG4gIHBob25lQ29kZTogc3RyaW5nO1xuICBpc286IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBuYXRpdmVDb3VudHJ5TmFtZTogc3RyaW5nO1xuICBsYW5ndWFnZTogc3RyaW5nW107XG4gIGN1cnJlbmN5OiBzdHJpbmc7XG4gIGN1cnJlbmN5U3ltYm9sOiBzdHJpbmc7XG4gIGN1cnJlbmN5SVNPOiBzdHJpbmc7XG4gIGN1cnJlbmN5VW5pdDogc3RyaW5nO1xuICBjdXJyZW5jeURlbm9taW5hdGlvbjogbnVtYmVyO1xuICBwaG9uZU1hc2s6IHN0cmluZ1tdO1xuICBmbGFnOiBzdHJpbmc7XG59XG5cbi8qKiDQlNCw0L3QvdGL0LUg0L4g0LzQvtC00LXQu9C4INCw0LLRgtC+0YDQuNC30LDRhtC40Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9C10Lkg0L3QsCDRgdCw0LnRgtC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cbi8qKlxuICogQGRlcHJlY2F0ZWQg0L3Rg9C20L3QviDQstGL0L3QtdGB0YLQuCDQuNC3INC70LjQsdGLINGA0LDQsdC+0YLRiyDRgSDRgNCw0YHQv9C40YHQsNC90LjRj9C80LhcbiAqL1xuZXhwb3J0IHR5cGUgVXNlclJlc3RyaWN0aW9uczxUIGV4dGVuZHMge30gPSB7fT4gPSB7XG4gIC8qKiDQn9C+0LrQsNC30YvQstCw0LXRgiwg0LrQsNC60L7QuSDQstC40LQg0LTQsNC90L3Ri9GFINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70LXQvCDQtNC70Y8g0LDQstGC0L7RgNC40LfQsNGG0LjQuCAqL1xuICBsb2dpbkZpZWxkOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBab2RpYWMgc2lnbiwgSHVtYW4gZGVzaW5nIHR5cGUsIEJlc3QgRnJpZW5kLCByZWZlcmFsIGxpbmsgZXRjXG4gICAqL1xuICBjdXN0b21GaWVsZHM/OiBIdG1sRm9ybUZpZWxkW10gfCBudWxsO1xuICAvKipcbiAgICogcG9zc2libGUgMyB2YXJpYW50cyBbJ3JlcXVpcmVkJywgJ2Zyb21fb3RwJywgJ2Rpc2FibGVkJ10gYnkgZGVmYXVsdDogYGZyb21fb3RwYCBpdCBtZWFucyB3aGF0IG5lZWQgb25seSBPVFAsIGZvciBuZXh0IGxvZ2lucyAgcGFzc3dvcmRSZXF1aXJlZCwgZGlzYWJsZWQgaXMgbWVhbnMgcGFzc3dvcmQgZm9yYmlkZGVuIGFuZCB5b3UgbmVlZCBhbGwgdGltZSBnZXQgT1RQIHBhc3N3b3JkXG4gICAqL1xuICBwYXNzd29yZFBvbGljeTogJ3JlcXVpcmVkJyB8ICdmcm9tX290cCcgfCAnZGlzYWJsZWQnO1xuICAvKipcbiAgICogYnkgZGVmYXVsdCA9IGZhbHNlXG4gICAqL1xuICBsb2dpbk9UUFJlcXVpcmVkOiBib29sZWFuO1xuICAvKipcbiAgICog0KHQv9C40YHQvtC6INGB0YLRgNCw0L0sINGC0LXQu9C10YTQvtC90L3Ri9C1INC60L7QtNGLINC60L7RgtC+0YDRi9GFINC00L7RgdGC0YPQv9C90Ysg0LTQu9GPINGD0LrQsNC30LDQvdC40Y8g0LIg0L3QvtC80LXRgNC1INGC0LXQu9C10YTQvtC90LAg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBhbGxvd2VkUGhvbmVDb3VudHJpZXM6IENvdW50cnlbXTtcbiAgLyoqXG4gICAqINCh0YHRi9C70LrQsCDQvdCwINC/0L7Qu9C40YLQuNC60YMg0L7QsdGA0LDQsdC+0YLQutC4INC/0LXRgNGB0L7QvdCw0LvRjNC90YvRhSDQtNCw0L3QvdGL0YVcbiAgICovXG4gIGxpbmtUb1Byb2Nlc3NpbmdQZXJzb25hbERhdGE6IHN0cmluZztcbiAgLyoqXG4gICAqINCh0YHRi9C70LrQsCDQvdCwINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjNGB0LrQvtC1INGB0L7Qs9C70LDRiNC10L3QuNC1XG4gICAqL1xuICBsaW5rVG9Vc2VyQWdyZWVtZW50OiBzdHJpbmc7XG4gIC8qKlxuICAgKiDQlNC70LjQvdCwINC60L7QtNCwINC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNGPIE9UUFxuICAgKi9cbiAgT1RQbGVuZ3RoOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEFsbG93IHNwZW5kaW5nIGJvbnVzZXNcbiAgICovXG4gIGFsbG93Qm9udXNTcGVuZGluZzogYm9vbGVhblxufSAmIFQ7XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQg0K3RgtC+INC90YPQttC90L4g0L/QtdGA0LXQvdC10YHRgtC4INC40Lcg0LvQuNCx0Ysgd29ya3RpbWUg0LIgbmdHUUwg0L/QvtGC0L7QvNGD0YfRgtC+INGC0YPRgiDQvtGH0LXQvdGMINC80L3QvtCz0L4g0LLRgdC10LPQviDRh9GC0L4g0L3QtSDQvtGC0L3QvtGB0LjRgtGB0Y8g0Log0LLQvtGA0LrRgtCw0LnQvNGDXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVzdHJpY3Rpb25zT3JkZXI8VCBleHRlbmRzIHt9ID0ge30+IGV4dGVuZHMgUmVzdHJpY3Rpb25zIHtcblxuICAvKipcbiAgICogR3JhcGhRTCBzY2hlbWEgYmFja3dhcmQgY29tcGF0aWJpbGl0eSB2ZXJzaW9uXG4gICAqL1xuICBncmFwaHFsU2NoZW1hQmFja3dhcmRDb21wYXRpYmlsaXR5VmVyc2lvbjogbnVtYmVyXG5cbiAgLyoqINC80LjQvdC40LzQsNC70YzQvdC+0LUg0LLRgNC10LzRjyDQtNC+0YHRgtCw0LLQutC4Ki9cbiAgbWluRGVsaXZlcnlUaW1lSW5NaW51dGVzOiBzdHJpbmc7XG5cbiAgLyoqINC+0LPRgNCw0L3QuNGH0LXQvdC40LUg0LzQsNC60YHQuNC80LDQu9GM0L3QvtC5INC00LDRgtGLINC30LDQutCw0LfQsCDQsiDQsdGD0LTRg9GJ0LXQvCAo0LIg0LzQuNC90YPRgtCw0YUpKi9cbiAgcG9zc2libGVUb09yZGVySW5NaW51dGVzOiBudW1iZXI7XG5cbiAgLyoqICDRg9GB0YLQsNC90L7QstC70LXQvdC+INC70Lgg0L3QsCDRgtC10LrRg9GJ0LjQuSDQvNC+0LzQtdC90YIg0L7Qs9GA0LDQvdC40YfQtdC90LjQtSDQtNC+0YHRgtCw0LLQutC4INC90LAg0L7Qv9GA0LXQtNC10LvQtdC90L3QvtC1INCy0YDQtdC80Y8gKi9cbiAgZGVsaXZlcnlUb1RpbWVFbmFibGVkPzogYm9vbGVhbjtcblxuICAvKiog0JTQvtC/0L7Qu9C90LjRgtC10LvRjNC90YvQuSDQutC+0LzQvNC10L3RgtCw0YDQuNC5INC/0L4g0LTQvtGB0YLQsNCy0LrQtSAqL1xuICBkZWxpdmVyeURlc2NyaXB0aW9uPzogc3RyaW5nO1xuXG4gIC8qKiDQoNCw0LfQvdC+0LLQuNC00L3QvtGB0YLRjCDQstCy0L7QtNC40LzQvtC5INC60LDQv9GH0LggKi9cbiAgY2FwdGNoYVR5cGU/OiBzdHJpbmcgfCBudWxsO1xuXG4gIC8qKiDQlNCw0L3QvdGL0LUg0L4g0LzQvtC00LXQu9C4INCw0LLRgtC+0YDQuNC30LDRhtC40Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9C10Lkg0L3QsCDRgdCw0LnRgtC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cbiAgdXNlcj86IFVzZXJSZXN0cmljdGlvbnM8VD4gfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZhbGlkYXRvclJlc3VsdCB7XG4gIHdvcmtOb3c6IGJvb2xlYW47XG4gIGlzTmV3RGF5PzogYm9vbGVhbjtcbiAgY3VycmVudFRpbWU/OiBudW1iZXI7XG4gIGN1cmVudERheVN0YXJ0VGltZT86IG51bWJlcjtcbiAgY3VyZW50RGF5U3RvcFRpbWU/OiBudW1iZXI7XG59XG5cbnR5cGUgSG91cnNEaWdpdHMgPSBgJHtudW1iZXJ9JHtudW1iZXJ9YFxudHlwZSBNaW51dGVEaWdpdHMgPSBgJHtudW1iZXJ9JHtudW1iZXJ9YFxuZXhwb3J0IHR5cGUgVGltZVN0cmluZyA9IGAke0hvdXJzRGlnaXRzfToke01pbnV0ZURpZ2l0c31gO1xuXG4vKiog0KTRg9C90LrRhtC40Y8t0YXQtdC70L/QtdGAINC00LvRjyDQv9GA0L7QstC10YDQutC4LCDRh9GC0L4g0L/QtdGA0LXQtNCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSDQvdC1INGP0LLQu9GP0LXRgtGB0Y8gbnVsbCDQuNC70LggdW5kZWZpbmVkICovXG5mdW5jdGlvbiBpc1ZhbHVlPFQgZXh0ZW5kcyBhbnk+KFxuICB2YWx1ZTogVCB8IG51bGwgfCB1bmRlZmluZWRcbik6IHZhbHVlIGlzIE5vbk51bGxhYmxlPFQ+IHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICog0KTRg9C90LrRhtC40Y8g0LLQsNC70LjQtNCw0YbQuNC4INC/0LXRgNC10LTQsNC90L3QvtCz0L4g0L7QsdGK0LXQutGC0LAgcmVzdHJpY3Rpb24g0L3QsCDRgdC+0L7RgtCy0LXRgtGB0YLQstC40LUg0LjQvdGC0LXRgNGE0LXQudGB0YMgUmVzdHJpY3Rpb25zXG4gKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQv9GA0L7QstC10YDRj9C10LzRi9C5INC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0Lgg0LLRgNC10LzQtdC90L3QvtC5INC30L7QvdC1LlxuICovXG5mdW5jdGlvbiBpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb246IHVua25vd24pOiByZXN0cmljdGlvbiBpcyBSZXN0cmljdGlvbnMge1xuICByZXR1cm4gKFxuICAgIHR5cGVvZiByZXN0cmljdGlvbiA9PT0gJ29iamVjdCcgJiZcbiAgICBpc1ZhbHVlKHJlc3RyaWN0aW9uKSAmJlxuICAgICd0aW1lem9uZScgaW4gcmVzdHJpY3Rpb24gJiZcbiAgICAnd29ya3RpbWUnIGluIHJlc3RyaWN0aW9uICYmXG4gICAgaXNWYWx1ZShyZXN0cmljdGlvbi50aW1lem9uZSkgJiZcbiAgICBpc1ZhbHVlKHJlc3RyaWN0aW9uLndvcmt0aW1lKVxuICApO1xufVxuXG4vKipcbiAqINCk0YPQvdC60YbQuNGPINCy0LDQu9C40LTQsNGG0LjQuCDQv9C10YDQtdC00LDQvdC90L7Qs9C+INC+0LHRitC10LrRgtCwIHJlc3RyaWN0aW9uINC90LAg0YHQvtC+0YLQstC10YLRgdGC0LLQuNC1INC80LjQvdC40LzQsNC70YzQvdGL0Lwg0LTQsNC90L3Ri9C8INC00LvRjyDQt9Cw0LrQsNC30LBcbiAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIoXG4gIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlclxuKTogcmVzdHJpY3Rpb24gaXMgUmVzdHJpY3Rpb25zT3JkZXIge1xuICByZXR1cm4gKFxuICAgIGlzVmFsaWRSZXN0cmljdGlvbihyZXN0cmljdGlvbikgJiZcbiAgICAnbWluRGVsaXZlcnlUaW1lSW5NaW51dGVzJyBpbiByZXN0cmljdGlvbiAmJlxuICAgICdwb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXMnIGluIHJlc3RyaWN0aW9uICYmXG4gICAgaXNWYWx1ZShyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXMpICYmXG4gICAgaXNWYWx1ZShyZXN0cmljdGlvbi5wb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXMpXG4gICk7XG59XG5cbi8qKlxuICog0JrQu9Cw0YHRgSwg0YHQvtC00LXRgNC20LDRidC40Lkg0YHRgtCw0YLQuNGH0LXRgdC60LjQtSDQvNC10YLQvtC00YssINC90LXQvtCx0YXQvtC00LjQvNGL0LUg0LTQu9GPINGA0LDQsdC+0YLRiyDRgSDQvtCz0YDQsNC90LjRh9C10L3QuNGP0LzQuCDRgNCw0LHQvtGH0LXQs9C+INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gKiDQodC+0LfQtNCw0LLQsNGC0Ywg0L3QvtCy0YvQuSDRjdC60LfQtdC80L/Qu9GP0YAg0Y3RgtC+0LPQviDQutC70LDRgdGB0LAg0LTQu9GPINC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPINGB0YLQsNGC0LjRh9C10YHQutC40YUg0LzQtdGC0L7QtNC+0LIg0L3QtSDRgtGA0LXQsdGD0LXRgtGB0Y8uXG4gKlxuICog0J/RgNC4INGN0YLQvtC8INC/0YDQuCDRgdC+0LfQtNCw0L3QuNC4INGN0LrQt9C10LzQv9C70Y/RgNCwINC60LvQsNGB0YHQsCDRgyDQvtCx0YrQtdC60YLQsCDRgtCw0LrQttC1INCx0YPQtNGD0YIg0LTQvtGB0YLRg9C/0L3RiyDRgdC+0LHRgdGC0LLQtdC90L3Ri9C1INGA0LXQsNC70LjQt9Cw0YbQuNC4XG4gKiDQstGB0LXRhSDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyLlxuICog0K3RgtC4INGA0LXQsNC70LjQt9Cw0YbQuNC4INC+0YLQu9C40YfQsNGO0YLRgdGPINC+0YIg0LLRi9C30L7QstC+0LIg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7QsiDRgtC+0LvRjNC60L4g0LzQtdC80L7QuNC30LDRhtC40LXQuSDQstGL0L/QvtC70L3QtdC90L3Ri9GFINGA0LDRgdGH0LXRgtC+0LIuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgV29ya1RpbWVWYWxpZGF0b3Ige1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWQg0JHRg9C00LXRgiDQv9C10YDQtdC80LXRidC10L3QsCDQuNC3INC70LjQsdGLXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgywg0L3QsCDQutC+0YLQvtGA0YPRjiDQvNC+0LbQvdC+INC30LDQutCw0LfQsNGC0Ywg0LTQvtGB0YLQsNCy0LrRgy5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcmV0dXJuINCh0YLRgNC+0LrQsCwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LDRjyDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LTQvtGB0YLRg9C/0L3Rg9GOINC00LDRgtGDINC00L7RgdGC0LDQstC60Lgg0LIg0YTQvtGA0LzQsNGC0LUgeXl5eS1NTS1kZC5cbiAgICovXG4gIHN0YXRpYyBnZXRNYXhPcmRlckRhdGUoXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXG4gICk6IHN0cmluZyB7XG4gICAgaWYgKFxuICAgICAgaXNWYWx1ZShyZXN0cmljdGlvbikgJiZcbiAgICAgIGlzVmFsaWRSZXN0cmljdGlvbk9yZGVyKHJlc3RyaWN0aW9uKSAmJlxuICAgICAgaXNEYXRlKGN1cnJlbnRkYXRlKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZvcm1hdERhdGUoXG4gICAgICAgIGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIHJlc3RyaWN0aW9uLnBvc3NpYmxlVG9PcmRlckluTWludXRlcyAqIDYwMDAwLFxuICAgICAgICAneXl5eS1NTS1kZCcsXG4gICAgICAgICdlbidcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgaXNEYXRlKGN1cnJlbnRkYXRlKVxuICAgICAgICAgID8gJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LrQvtGA0YDQtdC60YLQvdGL0Lkg0L7QsdGK0LXQutGCINC00LDRgtGLJ1xuICAgICAgICAgIDogIWlzVmFsdWUocmVzdHJpY3Rpb24pXG4gICAgICAgICAgICA/ICfQndC1INC/0LXRgNC10LTQsNC9INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnXG4gICAgICAgICAgICA6ICfQn9C10YDQtdC00LDQvSDQvdC10LLQsNC70LjQtNC90YvQuSDQvtCx0YzQtdC60YIgcmVzdHJpY3Rpb25zJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog0JzQtdGC0L7QtCDRgdGH0LjRgtCw0LXRgiwg0YHQutC+0LvRjNC60L4g0LzQuNC90YPRgiDQvtGCINC90LDRh9Cw0LvQsCDQtNC90Y8gKDAwOjAwKSDQv9GA0L7RiNC70L4g0LTQu9GPINC/0LXRgNC10LTQsNC90L3QvtCz0L4g0LLRgNC10LzQtdC90LguXG4gICAqIEBwYXJhbSB0aW1lIC0g0YHRgtGA0L7QutCwINCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC1gKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAgLSDQstGA0LXQvNGPLlxuICAgKiBAcmV0dXJuINC60L7Quy3QstC+INC80LjQvdGD0YIuXG4gICAqL1xuICBzdGF0aWMgZ2V0VGltZUZyb21TdHJpbmcodGltZTogVGltZVN0cmluZyk6IG51bWJlciB7XG4gICAgaWYgKCFpc1ZhbHVlKHRpbWUpKSB7XG4gICAgICB0aHJvdyAn0J3QtSDQv9C10YDQtdC00LDQvdCwINGB0YLRgNC+0LrQsCDRgSDQv9GA0LXQvtCx0YDQsNC30YPQtdC80YvQvCDQstGA0LXQvNC10L3QtdC8INCyINGE0L7RgNC80LDRgtC1IEhIOm1tJztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVnRXhwID0gbmV3IFJlZ0V4cChcbiAgICAgICAgL14oMDB8MDF8MDJ8MDN8MDR8MDV8MDZ8MDd8MDh8MDl8MTB8MTF8MTJ8MTN8MTR8MTV8MTZ8MTd8MTh8MTl8MjB8MjF8MjJ8MjMpKzooWzAtNV1cXGQpKy9cbiAgICAgICk7XG4gICAgICBsZXQgY2hlY2tlZFRpbWUgPSB0aW1lLnRyaW0oKTtcblxuICAgICAgaWYgKGNoZWNrZWRUaW1lLmluY2x1ZGVzKCcgJykgfHwgY2hlY2tlZFRpbWUuaW5jbHVkZXMoJ1QnKSkge1xuICAgICAgICBjaGVja2VkVGltZSA9IGNoZWNrZWRUaW1lLnNwbGl0KFxuICAgICAgICAgIGNoZWNrZWRUaW1lLmluY2x1ZGVzKCcgJykgPyAnICcgOiAnVCdcbiAgICAgICAgKVsxXTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlZ0V4cC50ZXN0KGNoZWNrZWRUaW1lKSkge1xuICAgICAgICByZXR1cm4gK2NoZWNrZWRUaW1lLnNwbGl0KCc6JylbMF0gKiA2MCArICtjaGVja2VkVGltZS5zcGxpdCgnOicpWzFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgJ9Cf0LXRgNC10LTQsNC90L3QsNGPINGB0YLRgNC+0LrQsCDQvdC1INGB0L7QvtGC0LLQtdGC0YHRgtCy0YPQtdGCINGE0L7RgNC80LDRgtGDIEhIOm1tIC1gKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINC/0LXRgNC10LTQsNC90L3QvtC1INC60L7Quy3QstC+INC80LjQvdGD0YIg0LIg0YHRgtGA0L7QutC+0LLQtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtIGAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYC5cbiAgICog0J3QsNC/0YDQuNC80LXRgDpcbiAgICpcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDUwKSAvLyBhID0gJzAwOjUwJ1xuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTIwMCkgLy8gYiA9ICcyMDowMCdcbiAgICpcbiAgICogQHBhcmFtIHRpbWUgLSDQp9C40YHQu9C+INCyINC00LjQsNC/0LDQt9C+0L3QtSDQvtGCIDAg0LTQviAxNDQwICjRgtCw0Log0LrQsNC6INC80LDQutGB0LjQvNGD0Lwg0LIgMSDRgdGD0YLQutCw0YUgPSAxNDQwINC80LjQvdGD0YIpLlxuICAgKiDQn9GA0Lgg0L/QtdGA0LXQtNCw0YfQtSDQsiB0aW1lINC+0YLRgNC40YbQsNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjywg0LfQvdCw0Log0LHRg9C00LXRgiBcItC+0YLQvtCx0YDRiNC10L1cIiwg0LAg0LTQu9GPINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiwg0YDQsNGB0YHRh9C40YLQsNC90L3Ri9C5INC00LvRjyDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INC/0L7Qu9C+0LbQuNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjy5cbiAgICog0JXRgdC70Lgg0LIgdGltZSDQsdGD0LTQtdGCINC/0LXRgNC10LTQsNC90L4g0LfQvdCw0YfQtdC90LjQtSDQsdC+0LvRjNGI0LUgMTQ0MCAtINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiDQtNC70Y8g0LfQvdCw0YfQtdC90LjRjyDQsdC10Lcg0YPRh9C10YLQsCBcItC/0YDQtdCy0YvRiNCw0Y7RidC40YUg0YHRg9GC0L7QulwiICjRgi7QtS4g0YEg0LrRgNCw0YLQvdGL0Lwg0LLRi9GH0LXRgtC+0LwgMTQ0MCDQvNC40L3Rg9GCKVxuICAgKlxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxuICAgKlxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNjApIC8vIGEgPSAnMDE6MDAnXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxNTAwKSAvLyBiID0gJzAxOjAwJyAoMTQ0MCDQvNC40L3Rg9GCIFwi0YbQtdC70YvRhVwiINGB0YPRgtC+0Log0LHRi9C70LggXCLQvtGC0LHRgNC+0YjQtdC90YtcIilcbiAgICpcbiAgICogQHJldHVybnNcbiAgICovXG4gIHN0YXRpYyBjb252ZXJ0TWludXRlc1RvVGltZSh0aW1lOiBudW1iZXIpOiBUaW1lU3RyaW5nIHtcbiAgICBpZiAodGltZSA8IDE0NDEpIHtcbiAgICAgIGNvbnN0IGhvdXIgPSBNYXRoLmZsb29yKHRpbWUgLyA2MCk7XG4gICAgICBjb25zdCBob3VyU3RyOiBIb3Vyc0RpZ2l0cyA9IDxIb3Vyc0RpZ2l0cz4oXG4gICAgICAgIChob3VyIDw9IDkgPyBgMCR7U3RyaW5nKGhvdXIpfWAgOiBTdHJpbmcoaG91cikpXG4gICAgICApO1xuICAgICAgY29uc3QgbWludXRlcyA9IFN0cmluZyh0aW1lIC0gaG91ciAqIDYwKTtcbiAgICAgIGNvbnN0IG1pbnV0ZXNTdHI6IE1pbnV0ZURpZ2l0cyA9IDxNaW51dGVEaWdpdHM+KFxuICAgICAgICBgJHttaW51dGVzLmxlbmd0aCA9PSAxID8gJzAnIDogJyd9JHttaW51dGVzfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gYCR7aG91clN0cn06JHttaW51dGVzU3RyfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lIC0gMTQ0MCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0L/RgNC+0LLQtdGA0Y/QtdGCLCDQtNC+0YHRgtGD0L/QvdCwINC70Lgg0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4INC90LAg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y8uXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPLCDQtNC70Y8g0LrQvtGC0L7RgNGL0YUg0Lgg0L/RgNC+0LLQtdGA0Y/QtdGC0YHRjyDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60LhcbiAgICogQHJldHVybiDQntCx0YzQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOOlxuICAgKiB7XG4gICAgICAgIGlzV29ya05vdzpib29sZWFuIC0g0JLQvtC30LzQvtC20L3QsCDQu9C4INC00L7RgdGC0LDQstC60LAg0LIg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y9cbiAgICAgICAgaXNOZXdEYXk6Ym9vbGVhbiAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0LjQt9C90LDQuiwg0YfRgtC+INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDRh9Cw0YHQvtCy0YvRhSDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC00LDRgtGLIFwi0L/QtdGA0LXQv9GA0YvQs9C90YPQu1wiINC90LAg0L3QvtCy0YvQuSDQtNC10L3RjC5cbiAgICAgICAgY3VycmVudFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQvtCy0LXRgNGP0LXQvNC+0LUg0LzQtdGC0L7QtNC+0Lwg0LLRgNC10LzRjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cbiAgICAgICAgY3VyZW50RGF5U3RvcFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxuICAgICAgfVxuICAgKi9cbiAgc3RhdGljIGlzV29ya05vdyhcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zIHwgUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU6IERhdGUgPSBuZXcgRGF0ZSgpXG4gICk6IFZhbGlkYXRvclJlc3VsdCB7XG4gICAgLy8g0JXRgdC70Lgg0LjRgdC/0L7Qu9GM0L3Rj9C10YLRgdGPINCyIE5vZGVKU1xuICAgIGlmIChcbiAgICAgIGlzVmFsdWUocmVzdHJpY3Rpb24pICYmXG4gICAgICAhaXNWYWx1ZShyZXN0cmljdGlvbi50aW1lem9uZSkgJiZcbiAgICAgIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJ1xuICAgICkge1xuICAgICAgcmVzdHJpY3Rpb24udGltZXpvbmUgPVxuICAgICAgICBwcm9jZXNzPy5lbnY/LlRaIGFzIFRpbWVab25lU3RyaW5nID8/IEludGwuRGF0ZVRpbWVGb3JtYXQoKS5yZXNvbHZlZE9wdGlvbnMoKS50aW1lWm9uZSBhcyBUaW1lWm9uZVN0cmluZztcbiAgICB9XG5cbiAgICBpZiAoIWlzVmFsdWUocmVzdHJpY3Rpb24pIHx8ICFpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICFpc0RhdGUoY3VycmVudGRhdGUpXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnXG4gICAgICAgICAgOiAhaXNWYWx1ZShyZXN0cmljdGlvbilcbiAgICAgICAgICAgID8gJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0L7QsdGK0LXQutGCIHJlc3RyaWN0aW9ucydcbiAgICAgICAgICAgIDogJ9Cf0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMnXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgICFpc1ZhbHVlKHJlc3RyaWN0aW9uLndvcmt0aW1lKSB8fFxuICAgICAgICAhT2JqZWN0LmtleXMocmVzdHJpY3Rpb24ud29ya3RpbWUpLmxlbmd0aFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgd29ya05vdzogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29tcGFueUxvY2FsVGltZVpvbmUgPVxuICAgICAgICBUaW1lWm9uZUlkZW50aWZpZXIuZ2V0VGltZVpvbmVHTVRPZmZzZXQoXG4gICAgICAgICAgcmVzdHJpY3Rpb24udGltZXpvbmVcbiAgICAgICAgKS5zcGxpdCgnOicpO1xuICAgICAgY29uc3QgY29tcGFueUxvY2FsVGltZVpvbmVEZWx0YSA9XG4gICAgICAgICtjb21wYW55TG9jYWxUaW1lWm9uZVswXSAqIDYwICsgK2NvbXBhbnlMb2NhbFRpbWVab25lWzFdO1xuICAgICAgY29uc3QgbG9rYWxUaW1lRGVsdGEgPVxuICAgICAgICBjb21wYW55TG9jYWxUaW1lWm9uZURlbHRhICsgY3VycmVudGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKTsgLy8g0YHQvNC10YnQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0L7RgtC90L7RgdC40YLQtdC70YzQvdC+INCy0YDQtdC80LXQvdC4INGC0L7RgNCz0L7QstC+0Lkg0YLQvtGH0LrQuFxuICAgICAgY29uc3QgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA9XG4gICAgICAgIFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxuICAgICAgICAgIDxUaW1lU3RyaW5nPmZvcm1hdERhdGUoY3VycmVudGRhdGUsICdISDptbScsICdlbicpXG4gICAgICAgICkgKyBsb2thbFRpbWVEZWx0YTtcbiAgICAgIC8qKlxuICAgICAgICog0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQsiDQvNC40L3Rg9GC0LDRhSDRgSDQvdCw0YfQsNC70LAg0LTQvdGPICg2MDAgPSAxMDowMC4gMTIwMCA9IDIwOjAwKVxuICAgICAgICog0LXRgdC70Lgg0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0L/QtdGA0LXQv9GA0YvQs9C90YPQuyDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwsINGC0L4g0L/RgNC40LLQvtC00LjQvCDQstGA0LXQvNGPINC6INC/0YDQsNCy0LjQu9GM0L3QvtC80YMg0LfQvdCw0YfQtdC90LjRjiDQsiDQtNC40LDQv9Cw0LfQvtC90LUgMjQg0YfQsNGB0L7QslxuICAgICAgICogKi9cbiAgICAgIGNvbnN0IGN1cnJlbnRUaW1lID1cbiAgICAgICAgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDBcbiAgICAgICAgICA/IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgLSAxNDQwXG4gICAgICAgICAgOiBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhO1xuXG4gICAgICBjb25zdCBjdXJyZW50RGF5V29ya1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXG4gICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID4gMTQ0MFxuICAgICAgICAgID8gbmV3IERhdGUoY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDApXG4gICAgICAgICAgOiBjdXJyZW50ZGF0ZVxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0YDQsNCx0L7Rh9C10LUg0LLRgNC10LzRj1xuICAgICAgY29uc3QgY3VyZW50RGF5U3RhcnRUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoXG4gICAgICAgIDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdGFydFxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YVcbiAgICAgIGNvbnN0IGN1cmVudERheVN0b3BUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoXG4gICAgICAgIDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdG9wXG4gICAgICApOyAvLyDRgtC10LrRg9GJ0LXQtSDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgd29ya05vdzpcbiAgICAgICAgICBjdXJyZW50VGltZSA8IGN1cmVudERheVN0b3BUaW1lICYmIGN1cnJlbnRUaW1lID4gY3VyZW50RGF5U3RhcnRUaW1lLFxuICAgICAgICBpc05ld0RheTogY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDAsXG4gICAgICAgIGN1cnJlbnRUaW1lLFxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWUsXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0JTQvtGB0YLQsNCy0LrQsCDQutGD0YDRjNC10YDQvtC8XCIuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBzdGF0aWMgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKFxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcixcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxuICApOiBzdHJpbmcge1xuICAgIGlmICghaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIocmVzdHJpY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LjQu9C4INC/0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnKTtcbiAgICB9XG5cbiAgICBjb25zdCBjaGVja1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5pc1dvcmtOb3cocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcblxuICAgIGlmIChjaGVja1RpbWUud29ya05vdyAmJiBpc1ZhbHVlKGNoZWNrVGltZS5jdXJyZW50VGltZSkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfQodC10LnRh9Cw0YEg0YDQsNCx0L7Rh9C10LUg0LLRgNC10LzRjy4g0KDQsNGB0YfQtdGCINC90LUg0YLRgNC10LHRg9C10YLRgdGPLicpO1xuICAgICAgY29uc3QgcG9zc2libGVUaW1lID1cbiAgICAgICAgY2hlY2tUaW1lLmN1cnJlbnRUaW1lICsgKCtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXMgfHwgMCk7XG4gICAgICBjb25zdCBwb3NzaWJsZVRpbWVTdHIgPVxuICAgICAgICBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZShwb3NzaWJsZVRpbWUpO1xuICAgICAgcmV0dXJuIGZvcm1hdERhdGUoY3VycmVudGRhdGUsIGB5eXl5LU1NLWRkICR7cG9zc2libGVUaW1lU3RyfWAsICdlbicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgIGlzVmFsdWUoY2hlY2tUaW1lLmN1cnJlbnRUaW1lKSAmJlxuICAgICAgICBpc1ZhbHVlKGNoZWNrVGltZS5jdXJlbnREYXlTdG9wVGltZSlcbiAgICAgICkge1xuICAgICAgICBjb25zdCBjdXJyZW50RGF5V29ya1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXG4gICAgICAgICAgcmVzdHJpY3Rpb24sXG4gICAgICAgICAgY2hlY2tUaW1lLmlzTmV3RGF5XG4gICAgICAgICAgICA/IG5ldyBEYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKVxuICAgICAgICAgICAgOiBjdXJyZW50ZGF0ZVxuICAgICAgICApO1xuICAgICAgICBjb25zdCB0aW1lID1cbiAgICAgICAgICB0aGlzLmdldFRpbWVGcm9tU3RyaW5nKDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdGFydCkgK1xuICAgICAgICAgICtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXM7XG4gICAgICAgIGNvbnN0IHRpbWVTdHJpbmcgPSBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lKTtcbiAgICAgICAgcmV0dXJuIGZvcm1hdERhdGUoXG4gICAgICAgICAgY2hlY2tUaW1lLmlzTmV3RGF5IHx8XG4gICAgICAgICAgICBjaGVja1RpbWUuY3VycmVudFRpbWUgPiBjaGVja1RpbWUuY3VyZW50RGF5U3RvcFRpbWVcbiAgICAgICAgICAgID8gY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDBcbiAgICAgICAgICAgIDogY3VycmVudGRhdGUsXG4gICAgICAgICAgYHl5eXktTU0tZGQgJHt0aW1lU3RyaW5nfWAsXG4gICAgICAgICAgJ2VuJ1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0YDQsNGB0YHRh9C40YLQsNGC0YwgY3VycmVudFRpbWUg0LggY3VyZW50RGF5U3RvcFRpbWUuJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0KHQsNC80L7QstGL0LLQvtC3XCIuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBzdGF0aWMgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUoXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXG4gICk6IHN0cmluZyB7XG4gICAgaWYgKCFpc1ZhbGlkUmVzdHJpY3Rpb25PcmRlcihyZXN0cmljdGlvbikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign0J3QtSDQv9C10YDQtdC00LDQvSDQuNC70Lgg0L/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGK0LXQutGCIHJlc3RyaWN0aW9ucycpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqINCU0LvRjyDQvtCx0LXRgdC/0LXRh9C10L3QuNGPINC40LzQvNGD0YLQsNCx0LXQu9GM0L3QvtGB0YLQuCDQtNCw0L3QvdGL0YUg0YHQvtC30LTQsNC10YLRgdGPINC90L7QstGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucywg0LjQtNC10L3RgtC40YfQvdGL0Lkg0L/QvtC70YPRh9C10L3QvdC+0LzRgyDQsiDQv9Cw0YDQsNC80LXRgtGA0LDRhSwg0L3QviDRgSDQuNC30LzQtdC90LXQvdC90YvQvCDQvNCw0YHRgdC40LLQvtC8IHdvcmt0aW1lLlxuICAgICAqINCSINC80LDRgdGB0LjQstC1IHdvcmt0aW1lINC+0LHQvdC+0LLQu9GP0Y7RgtGB0Y8g0L7Qs9GA0LDQvdC40YfQtdC90LjRjyDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0YEg0L7QsdGL0YfQvdGL0YUg0L3QsCDQsNC60YLRg9Cw0LvRjNC90YvQtSDQtNC70Y8g0YHQsNC80L7QstGL0LLQvtC30LAuXG4gICAgICogKi9cbiAgICBjb25zdCBuZXdSZXN0cmljdGlvbiA9IHtcbiAgICAgIC4uLnJlc3RyaWN0aW9uLFxuICAgICAgd29ya3RpbWU6ICg8V29ya1RpbWVbXT5yZXN0cmljdGlvbi53b3JrdGltZSkubWFwKCh3b3JrdGltZSkgPT4gd29ya3RpbWUpXG4gICAgfTtcbiAgICByZXR1cm4gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKFxuICAgICAgbmV3UmVzdHJpY3Rpb24sXG4gICAgICBjdXJyZW50ZGF0ZVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsNC60YLRg9Cw0LvRjNC90YvQtSDQtNCw0L3QvdGL0LUg0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC40Lcg0LzQsNGB0YHQuNCy0LAg0LLRgdC10YUg0LLQsNGA0LjQsNC90YLQvtCyINC+0LHRjNC10LrRgtCwIHJlc3RyaWN0aW9uLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xuICAgKi9cbiAgc3RhdGljIGdldEN1cnJlbnRXb3JrVGltZShcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zLFxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXG4gICk6IFdvcmtUaW1lIHtcbiAgICBpZiAoIWlzVmFsaWRSZXN0cmljdGlvbihyZXN0cmljdGlvbikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign0J3QtSDQv9C10YDQtdC00LDQvSDQuNC70Lgg0L/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGK0LXQutGCIHJlc3RyaWN0aW9ucycpO1xuICAgIH1cblxuICAgIGxldCBpID0gMDtcbiAgICBsZXQgcmVzdWx0ID0gbnVsbDtcblxuICAgIHdoaWxlIChpIDwgcmVzdHJpY3Rpb24ud29ya3RpbWUubGVuZ3RoICYmICFpc1ZhbHVlKHJlc3VsdCkpIHtcbiAgICAgIFxuICAgICAgaWYocmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgYGRheU9mV2VlayBpcyByZXF1aXJlZGBcbiAgICAgIH1cbiAgICAgIGlmICgoPHN0cmluZ1tdPnJlc3RyaWN0aW9uLndvcmt0aW1lW2ldLmRheU9mV2VlaykuaW5jbHVkZXMoZm9ybWF0RGF0ZShjdXJyZW50ZGF0ZSwgJ0VFRUUnLCAnZW4nKS50b0xvd2VyQ2FzZSgpKVxuICAgICAgKSB7XG4gICAgICAgIHJlc3VsdCA9IHJlc3RyaWN0aW9uLndvcmt0aW1lW2ldO1xuICAgICAgfVxuICAgICAgaSArPSAxO1xuICAgIH1cblxuICAgIGlmICghaXNWYWx1ZShyZXN1bHQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZXJlIGlzIG5vIGN1cnJlbnQgd29yayBzY2hlZHVsZSBmb3IgdGhlIGN1cnJlbnQgZGF5Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCb0L7Qs9C40LrQsCDQvdC40LbQtSDQv9GA0LXQtNC90LDQt9C90LDRh9C10L3QsCDQtNC70Y8g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8g0Y3QutC30LXQvNC/0LvRj9GA0LAg0LrQu9Cw0YHRgdCwIFdvcmtUaW1lVmFsaWRhdG9yXG4gICAqL1xuXG4gIGNvbnN0cnVjdG9yKCkgeyB9XG5cbiAgcHJpdmF0ZSBfbWVtb3J5OiB7XG4gICAgZ2V0TWF4T3JkZXJEYXRlOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGdldFRpbWVGcm9tU3RyaW5nOiBNYXA8c3RyaW5nLCBudW1iZXI+O1xuICAgIGlzV29ya05vdzogTWFwPHN0cmluZywgVmFsaWRhdG9yUmVzdWx0PjtcbiAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IE1hcDxzdHJpbmcsIHN0cmluZz47XG4gICAgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWU6IE1hcDxzdHJpbmcsIHN0cmluZz47XG4gICAgZ2V0Q3VycmVudFdvcmtUaW1lOiBNYXA8c3RyaW5nLCBXb3JrVGltZT47XG4gICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IE1hcDxzdHJpbmcsIFRpbWVTdHJpbmc+O1xuICB9ID0ge1xuICAgICAgZ2V0TWF4T3JkZXJEYXRlOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxuICAgICAgZ2V0VGltZUZyb21TdHJpbmc6IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCksXG4gICAgICBpc1dvcmtOb3c6IG5ldyBNYXA8c3RyaW5nLCBWYWxpZGF0b3JSZXN1bHQ+KCksXG4gICAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXG4gICAgICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZTogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKSxcbiAgICAgIGdldEN1cnJlbnRXb3JrVGltZTogbmV3IE1hcDxzdHJpbmcsIFdvcmtUaW1lPigpLFxuICAgICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBUaW1lU3RyaW5nPigpLFxuICAgIH07XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgywg0L3QsCDQutC+0YLQvtGA0YPRjiDQvNC+0LbQvdC+INC30LDQutCw0LfQsNGC0Ywg0LTQvtGB0YLQsNCy0LrRgy5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcmV0dXJuIDpzdHJpbmcgLSDQodGC0YDQvtC60LAsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidCw0Y8g0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINC00L7RgdGC0YPQv9C90YPRjiDQtNCw0YLRgyDQtNC+0YHRgtCw0LLQutC4INCyINGE0L7RgNC80LDRgtC1IHl5eXktTU0tZGQuXG4gICAqL1xuICBnZXRNYXhPcmRlckRhdGUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IHN0cmluZyB7XG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0TWF4T3JkZXJEYXRlLmdldChtZW1vcnlLZXkpO1xuICAgIGlmIChpc1ZhbHVlKGNoZWNrTWVtb3J5KSkge1xuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRNYXhPcmRlckRhdGUoXG4gICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICBjdXJyZW50ZGF0ZVxuICAgICAgKTtcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRNYXhPcmRlckRhdGUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxuICAgKiBAcGFyYW0gdGltZSAtINGB0YLRgNC+0LrQsCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtINCy0YDQtdC80Y8uXG4gICAqIEByZXR1cm4gOm51bWJlciAtINC60L7Quy3QstC+INC80LjQvdGD0YIuXG4gICAqL1xuICBnZXRUaW1lRnJvbVN0cmluZyh0aW1lOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgdGltZSB9KTtcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRUaW1lRnJvbVN0cmluZy5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoaXNWYWx1ZShjaGVja01lbW9yeSkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoPFRpbWVTdHJpbmc+dGltZSk7XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0VGltZUZyb21TdHJpbmcuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INC/0YDQvtCy0LXRgNGP0LXRgiwg0LTQvtGB0YLRg9C/0L3QsCDQu9C4INCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjywg0LTQu9GPINC60L7RgtC+0YDRi9GFINC4INC/0YDQvtCy0LXRgNGP0LXRgtGB0Y8g0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4XG4gICAqIEByZXR1cm4g0J7QsdGM0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjjpcbiAgICoge1xuICAgICAgICBpc1dvcmtOb3c6Ym9vbGVhbiAtINCS0L7Qt9C80L7QttC90LAg0LvQuCDQtNC+0YHRgtCw0LLQutCwINCyINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPXG4gICAgICAgIGlzTmV3RGF5OmJvb2xlYW4gLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC40LfQvdCw0LosINGH0YLQviDQuNC3LdC30LAg0YDQsNC30L3QuNGG0Ysg0YfQsNGB0L7QstGL0YUg0L/QvtGP0YHQvtCyINGA0LDRgdGH0LXRgiDQtNCw0YLRiyBcItC/0LXRgNC10L/RgNGL0LPQvdGD0LtcIiDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwuXG4gICAgICAgIGN1cnJlbnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0L7QstC10YDRj9C10LzQvtC1INC80LXRgtC+0LTQvtC8INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gICAgICAgIGN1cmVudERheVN0YXJ0VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cbiAgICAgIH1cbiAgICovXG4gIGlzV29ya05vdyhcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zIHwgUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU/OiBEYXRlXG4gICk6IFZhbGlkYXRvclJlc3VsdCB7XG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuaXNXb3JrTm93LmdldChtZW1vcnlLZXkpO1xuICAgIGlmIChpc1ZhbHVlKGNoZWNrTWVtb3J5KSkge1xuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5pc1dvcmtOb3cocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcbiAgICAgIHRoaXMuX21lbW9yeS5pc1dvcmtOb3cuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQlNC+0YHRgtCw0LLQutCwINC60YPRgNGM0LXRgNC+0LxcIi5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cbiAgICovXG4gIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU6IERhdGVcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcbiAgICBjb25zdCBjaGVja01lbW9yeSA9XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lLmdldChtZW1vcnlLZXkpO1xuICAgIGlmIChpc1ZhbHVlKGNoZWNrTWVtb3J5KSkge1xuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUoXG4gICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICBjdXJyZW50ZGF0ZVxuICAgICAgKTtcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQodCw0LzQvtCy0YvQstC+0LdcIi5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cbiAgICovXG4gIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKFxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcixcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID1cbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZS5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoaXNWYWx1ZShjaGVja01lbW9yeSkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUoXG4gICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICBjdXJyZW50ZGF0ZVxuICAgICAgKTtcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQuNC3INC80LDRgdGB0LjQstCwINCy0YHQtdGFINCy0LDRgNC40LDQvdGC0L7QsiDQvtCx0YzQtdC60YLQsCByZXN0cmljdGlvbi5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cbiAgICovXG4gIGdldEN1cnJlbnRXb3JrVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IFdvcmtUaW1lIHtcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRDdXJyZW50V29ya1RpbWUuZ2V0KG1lbW9yeUtleSk7XG4gICAgaWYgKGlzVmFsdWUoY2hlY2tNZW1vcnkpKSB7XG4gICAgICByZXR1cm4gPFdvcmtUaW1lPmNoZWNrTWVtb3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXG4gICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICBjdXJyZW50ZGF0ZVxuICAgICAgKTtcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRDdXJyZW50V29ya1RpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINC/0LXRgNC10LTQsNC90L3QvtC1INC60L7Quy3QstC+INC80LjQvdGD0YIg0LIg0YHRgtGA0L7QutC+0LLQtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtIGAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYC5cbiAgICog0J3QsNC/0YDQuNC80LXRgDpcbiAgICpcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDUwKSAvLyBhID0gJzAwOjUwJ1xuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTIwMCkgLy8gYiA9ICcyMDowMCdcbiAgICpcbiAgICogQHBhcmFtIHRpbWUgLSDQp9C40YHQu9C+INCyINC00LjQsNC/0LDQt9C+0L3QtSDQvtGCIDAg0LTQviAxNDQwICjRgtCw0Log0LrQsNC6INC80LDQutGB0LjQvNGD0Lwg0LIgMSDRgdGD0YLQutCw0YUgPSAxNDQwINC80LjQvdGD0YIpLlxuICAgKiDQn9GA0Lgg0L/QtdGA0LXQtNCw0YfQtSDQsiB0aW1lINC+0YLRgNC40YbQsNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjywg0LfQvdCw0Log0LHRg9C00LXRgiBcItC+0YLQvtCx0YDRiNC10L1cIiwg0LAg0LTQu9GPINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiwg0YDQsNGB0YHRh9C40YLQsNC90L3Ri9C5INC00LvRjyDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INC/0L7Qu9C+0LbQuNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjy5cbiAgICog0JXRgdC70Lgg0LIgdGltZSDQsdGD0LTQtdGCINC/0LXRgNC10LTQsNC90L4g0LfQvdCw0YfQtdC90LjQtSDQsdC+0LvRjNGI0LUgMTQ0MCAtINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiDQtNC70Y8g0LfQvdCw0YfQtdC90LjRjyDQsdC10Lcg0YPRh9C10YLQsCBcItC/0YDQtdCy0YvRiNCw0Y7RidC40YUg0YHRg9GC0L7QulwiICjRgi7QtS4g0YEg0LrRgNCw0YLQvdGL0Lwg0LLRi9GH0LXRgtC+0LwgMTQ0MCDQvNC40L3Rg9GCKVxuICAgKlxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxuICAgKlxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNjApIC8vIGEgPSAnMDE6MDAnXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxNTAwKSAvLyBiID0gJzAxOjAwJyAoMTQ0MCDQvNC40L3Rg9GCIFwi0YbQtdC70YvRhVwiINGB0YPRgtC+0Log0LHRi9C70LggXCLQvtGC0LHRgNC+0YjQtdC90YtcIilcbiAgICpcbiAgICogQHJldHVybnNcbiAgICovXG4gIGNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWU6IG51bWJlcik6IFRpbWVTdHJpbmcge1xuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgdGltZSB9KTtcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5jb252ZXJ0TWludXRlc1RvVGltZS5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoaXNWYWx1ZShjaGVja01lbW9yeSkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUodGltZSk7XG4gICAgICB0aGlzLl9tZW1vcnkuY29udmVydE1pbnV0ZXNUb1RpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG59XG4iXX0=