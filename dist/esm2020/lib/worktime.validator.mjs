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
        if (!isValidRestriction(restriction)) {
            throw new Error('Не передан или передан невалидный объект restrictions');
        }
        let i = 0;
        let result = null;
        while (i < restriction.worktime.length && !isValue(result)) {
            if (restriction.worktime[i].dayOfWeek === 'all' ||
                (typeof restriction.worktime[i].dayOfWeek === 'string'
                    ? restriction.worktime[i].dayOfWeek.toLowerCase()
                    : restriction.worktime[i].dayOfWeek.map((day) => day.toLowerCase())).includes(formatDate(currentdate, 'EEEE', 'en').toLowerCase())) {
                result = restriction.worktime[i];
            }
            i += 1;
        }
        if (!isValue(result)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sTUFBTSxDQUFDO0FBMksxQywwRkFBMEY7QUFDMUYsU0FBUyxPQUFPLENBQ2QsS0FBMkI7SUFFM0IsT0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLENBQUM7QUFDL0MsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsa0JBQWtCLENBQUMsV0FBb0I7SUFDOUMsT0FBTyxDQUNMLE9BQU8sV0FBVyxLQUFLLFFBQVE7UUFDL0IsT0FBTyxDQUFDLFdBQVcsQ0FBQztRQUNwQixVQUFVLElBQUksV0FBVztRQUN6QixVQUFVLElBQUksV0FBVztRQUN6QixPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztRQUM3QixPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUM5QixDQUFDO0FBQ0osQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsdUJBQXVCLENBQzlCLFdBQThCO0lBRTlCLE9BQU8sQ0FDTCxrQkFBa0IsQ0FBQyxXQUFXLENBQUM7UUFDL0IsMEJBQTBCLElBQUksV0FBVztRQUN6QywwQkFBMEIsSUFBSSxXQUFXO1FBQ3pDLE9BQU8sQ0FBQyxXQUFXLENBQUMsd0JBQXdCLENBQUM7UUFDN0MsT0FBTyxDQUFDLFdBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUM5QyxDQUFDO0FBQ0osQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQUM1Qjs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FDcEIsV0FBOEIsRUFDOUIsV0FBaUI7UUFFakIsSUFDRSxP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Qy9CLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3hCLE9BQU8sV0FBVyxDQUFDO1NBQ3BCO2FBQU07WUFDTCxNQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1RCxJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekQsT0FBTyxNQUFNLENBQUM7U0FDZjtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZvcm1hdERhdGUsIGlzRGF0ZSB9IGZyb20gJy4vZm9ybWF0RGF0ZSc7XG5pbXBvcnQgeyBUaW1lWm9uZUlkZW50aWZpZXIgfSBmcm9tICcuL3R6JztcblxuLyoqXG4gKiDQkdCw0LfQvtCy0YvQtSDQtNCw0L3QvdGL0LUg0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLIC0g0YHQu9GD0LbQtdCx0L3Ri9C5INC40L3RgtC10YDRhNC10LnRgS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBXb3JrVGltZUJhc2Uge1xuICAvKiog0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8qL1xuICBzdGFydDogc3RyaW5nO1xuXG4gIC8qKiDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyovXG4gIHN0b3A6IHN0cmluZztcblxuICAvKiog0L/QtdGA0LXRgNGL0LIg0L3QsCDQvtCx0LXQtCovXG4gIGJyZWFrPzogc3RyaW5nO1xufVxuXG4vKipcbiAqINCY0L3RhNC+0YDQvNCw0YbQuNGPINC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPIC0g0YHQu9GD0LbQtdCx0L3Ri9C5INC40L3RgtC10YDRhNC10LnRgS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBXb3JrVGltZSBleHRlbmRzIFdvcmtUaW1lQmFzZSB7XG4gIC8qKiDQtNC10L3RjCDQvdC10LTQtdC70LgsINC6INC60L7RgtC+0YDQvtC80YMg0L/RgNC40LzQtdC90Y/QtdGC0YHRjyDRjdGC0L4g0LLRgNC10LzRjyDQtNC+0YHRgtCw0LLQutC4ICAgKi9cbiAgZGF5T2ZXZWVrOiBzdHJpbmcgfCBzdHJpbmdbXTtcblxuICAvKiog0L7Qs9GA0LDQvdC40YfQtdC90LjRjyDQv9C+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQtNC70Y8g0YHQsNC80L7QstGL0LLQvtC30LAgKi9cbiAgc2VsZlNlcnZpY2U/OiBXb3JrVGltZUJhc2U7XG59XG5cbi8qKlxuICog0JjQvdGC0LXRgNGE0LXQudGBINC+0LHRitC10LrRgtCwLCDQv9C+0LvRg9GH0LDQtdC80L7Qs9C+INC+0YIgQVBJIEB3ZWJyZXN0by9jb3JlINC4INGB0L7QtNC10YDQttCw0YnQtdCz0L4g0YLQtdC60YPRidC40LUg0LTQsNC90L3Ri9C1INC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y9cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXN0cmljdGlvbnMge1xuICAvKiog0LLRgNC10LzQtdC90L3QsNGPINC30L7QvdCwINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cbiAgdGltZXpvbmU/OiBzdHJpbmc7XG5cbiAgLyoqICDQvNCw0YHRgdC40LIg0L7Qs9GA0LDQvdC40YfQtdC90LjQuSDQv9C+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC00LvRjyDRgNCw0LfQvdGL0YUg0LTQvdC10Lkg0L3QtdC00LXQu9C4LiAqL1xuICB3b3JrdGltZTogV29ya1RpbWVbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIdG1sRm9ybUZpZWxkIHtcbiAgaWQ6IHN0cmluZztcbiAgdHlwZTogc3RyaW5nO1xuICBsYWJlbDogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICByZXF1aXJlZDogYm9vbGVhbjtcbiAgcmVnZXg6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb3VudHJ5IHtcbiAgcGhvbmVDb2RlOiBzdHJpbmc7XG4gIGlzbzogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIG5hdGl2ZUNvdW50cnlOYW1lOiBzdHJpbmc7XG4gIGxhbmd1YWdlOiBzdHJpbmdbXTtcbiAgY3VycmVuY3k6IHN0cmluZztcbiAgY3VycmVuY3lTeW1ib2w6IHN0cmluZztcbiAgY3VycmVuY3lJU086IHN0cmluZztcbiAgY3VycmVuY3lVbml0OiBzdHJpbmc7XG4gIGN1cnJlbmN5RGVub21pbmF0aW9uOiBudW1iZXI7XG4gIHBob25lTWFzazogc3RyaW5nW107XG4gIGZsYWc6IHN0cmluZztcbn1cblxuLyoqINCU0LDQvdC90YvQtSDQviDQvNC+0LTQtdC70Lgg0LDQstGC0L7RgNC40LfQsNGG0LjQuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70LXQuSDQvdCwINGB0LDQudGC0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyAqL1xuZXhwb3J0IHR5cGUgVXNlclJlc3RyaWN0aW9uczxUIGV4dGVuZHMge30gPSB7fT4gPSB7XG4gIC8qKiDQn9C+0LrQsNC30YvQstCw0LXRgiwg0LrQsNC60L7QuSDQstC40LQg0LTQsNC90L3Ri9GFINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70LXQvCDQtNC70Y8g0LDQstGC0L7RgNC40LfQsNGG0LjQuCAqL1xuICBsb2dpbkZpZWxkOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBab2RpYWMgc2lnbiwgSHVtYW4gZGVzaW5nIHR5cGUsIEJlc3QgRnJpZW5kLCByZWZlcmFsIGxpbmsgZXRjXG4gICAqL1xuICBjdXN0b21GaWVsZHM/OiBIdG1sRm9ybUZpZWxkW10gfCBudWxsO1xuICAvKipcbiAgICogcG9zc2libGUgMyB2YXJpYW50cyBbJ3JlcXVpcmVkJywgJ2Zyb21fb3RwJywgJ2Rpc2FibGVkJ10gYnkgZGVmYXVsdDogYGZyb21fb3RwYCBpdCBtZWFucyB3aGF0IG5lZWQgb25seSBPVFAsIGZvciBuZXh0IGxvZ2lucyAgcGFzc3dvcmRSZXF1aXJlZCwgZGlzYWJsZWQgaXMgbWVhbnMgcGFzc3dvcmQgZm9yYmlkZGVuIGFuZCB5b3UgbmVlZCBhbGwgdGltZSBnZXQgT1RQIHBhc3N3b3JkXG4gICAqL1xuICBwYXNzd29yZFBvbGljeTogJ3JlcXVpcmVkJyB8ICdmcm9tX290cCcgfCAnZGlzYWJsZWQnO1xuICAvKipcbiAgICogYnkgZGVmYXVsdCA9IGZhbHNlXG4gICAqL1xuICBsb2dpbk9UUFJlcXVpcmVkOiBib29sZWFuO1xuICAvKipcbiAgICog0KHQv9C40YHQvtC6INGB0YLRgNCw0L0sINGC0LXQu9C10YTQvtC90L3Ri9C1INC60L7QtNGLINC60L7RgtC+0YDRi9GFINC00L7RgdGC0YPQv9C90Ysg0LTQu9GPINGD0LrQsNC30LDQvdC40Y8g0LIg0L3QvtC80LXRgNC1INGC0LXQu9C10YTQvtC90LAg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBhbGxvd2VkUGhvbmVDb3VudHJpZXM6IENvdW50cnlbXTtcbiAgLyoqXG4gICAqINCh0YHRi9C70LrQsCDQvdCwINC/0L7Qu9C40YLQuNC60YMg0L7QsdGA0LDQsdC+0YLQutC4INC/0LXRgNGB0L7QvdCw0LvRjNC90YvRhSDQtNCw0L3QvdGL0YVcbiAgICovXG4gIGxpbmtUb1Byb2Nlc3NpbmdQZXJzb25hbERhdGE6IHN0cmluZztcbiAgLyoqXG4gICAqINCh0YHRi9C70LrQsCDQvdCwINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjNGB0LrQvtC1INGB0L7Qs9C70LDRiNC10L3QuNC1XG4gICAqL1xuICBsaW5rVG9Vc2VyQWdyZWVtZW50OiBzdHJpbmc7XG4gIC8qKlxuICAgKiDQlNC70LjQvdCwINC60L7QtNCwINC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNGPIE9UUFxuICAgKi9cbiAgT1RQbGVuZ3RoOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEFsbG93IHNwZW5kaW5nIGJvbnVzZXNcbiAgICovXG4gIGFsbG93Qm9udXNTcGVuZGluZzogYm9vbGVhblxufSAmIFQ7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzdHJpY3Rpb25zT3JkZXI8VCBleHRlbmRzIHt9ID0ge30+IGV4dGVuZHMgUmVzdHJpY3Rpb25zIHtcblxuICAvKipcbiAgICogR3JhcGhRTCBzY2hlbWEgYmFja3dhcmQgY29tcGF0aWJpbGl0eSB2ZXJzaW9uXG4gICAqL1xuICBncmFwaHFsU2NoZW1hQmFja3dhcmRDb21wYXRpYmlsaXR5VmVyc2lvbjogYm9vbGVhblxuXG4gIC8qKiDQvNC40L3QuNC80LDQu9GM0L3QvtC1INCy0YDQtdC80Y8g0LTQvtGB0YLQsNCy0LrQuCovXG4gIG1pbkRlbGl2ZXJ5VGltZUluTWludXRlczogc3RyaW5nO1xuXG4gIC8qKiDQvtCz0YDQsNC90LjRh9C10L3QuNC1INC80LDQutGB0LjQvNCw0LvRjNC90L7QuSDQtNCw0YLRiyDQt9Cw0LrQsNC30LAg0LIg0LHRg9C00YPRidC10LwgKNCyINC80LjQvdGD0YLQsNGFKSovXG4gIHBvc3NpYmxlVG9PcmRlckluTWludXRlczogbnVtYmVyO1xuXG4gIC8qKiAg0YPRgdGC0LDQvdC+0LLQu9C10L3QviDQu9C4INC90LAg0YLQtdC60YPRidC40Lkg0LzQvtC80LXQvdGCINC+0LPRgNCw0L3QuNGH0LXQvdC40LUg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINC+0L/RgNC10LTQtdC70LXQvdC90L7QtSDQstGA0LXQvNGPICovXG4gIGRlbGl2ZXJ5VG9UaW1lRW5hYmxlZD86IGJvb2xlYW47XG5cbiAgLyoqINCU0L7Qv9C+0LvQvdC40YLQtdC70YzQvdGL0Lkg0LrQvtC80LzQtdC90YLQsNGA0LjQuSDQv9C+INC00L7RgdGC0LDQstC60LUgKi9cbiAgZGVsaXZlcnlEZXNjcmlwdGlvbj86IHN0cmluZztcblxuICAvKiog0KDQsNC30L3QvtCy0LjQtNC90L7RgdGC0Ywg0LLQstC+0LTQuNC80L7QuSDQutCw0L/Rh9C4ICovXG4gIGNhcHRjaGFUeXBlPzogc3RyaW5nIHwgbnVsbDtcblxuICAvKiog0JTQsNC90L3Ri9C1INC+INC80L7QtNC10LvQuCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC90LAg0YHQsNC50YLQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXG4gIHVzZXI/OiBVc2VyUmVzdHJpY3Rpb25zPFQ+IHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0b3JSZXN1bHQge1xuICB3b3JrTm93OiBib29sZWFuO1xuICBpc05ld0RheT86IGJvb2xlYW47XG4gIGN1cnJlbnRUaW1lPzogbnVtYmVyO1xuICBjdXJlbnREYXlTdGFydFRpbWU/OiBudW1iZXI7XG4gIGN1cmVudERheVN0b3BUaW1lPzogbnVtYmVyO1xufVxuXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGB0LXRhSDRhtC40YTRgCAqL1xudHlwZSBEaWdpdHMgPSAnMCcgfCAnMScgfCAnMicgfCAnMycgfCAnNCcgfCAnNScgfCAnNicgfCAnNycgfCAnOCcgfCAnOSc7XG5cbi8qKiDQotC40L8sINC+0L/QuNGB0YvQstCw0Y7RidC40Lkg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1IDI0INGH0LDRgdC+0LIg0L7QtNC90LjRhSDRgdGD0YLQvtC6ICovXG5leHBvcnQgdHlwZSBIb3Vyc0RpZ2l0cyA9XG4gIHwgJzAwJ1xuICB8ICcwMSdcbiAgfCAnMDInXG4gIHwgJzAzJ1xuICB8ICcwNCdcbiAgfCAnMDUnXG4gIHwgJzA2J1xuICB8ICcwNydcbiAgfCAnMDgnXG4gIHwgJzA5J1xuICB8ICcxMCdcbiAgfCAnMTEnXG4gIHwgJzEyJ1xuICB8ICcxMydcbiAgfCAnMTQnXG4gIHwgJzE1J1xuICB8ICcxNidcbiAgfCAnMTcnXG4gIHwgJzE4J1xuICB8ICcxOSdcbiAgfCAnMjAnXG4gIHwgJzIxJ1xuICB8ICcyMidcbiAgfCAnMjMnO1xuXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSA2MCDQvNC40L3Rg9GCINC+0LTQvdC+0LPQviDRh9Cw0YHQsCovXG5leHBvcnQgdHlwZSBNaW51dGVEaWdpdHMgPSBgJHsnMCcgfCAnMScgfCAnMicgfCAnMycgfCAnNCcgfCAnNSd9JHtEaWdpdHN9YDtcblxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLWAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYCAqL1xuZXhwb3J0IHR5cGUgVGltZVN0cmluZyA9IGAke0hvdXJzRGlnaXRzfToke01pbnV0ZURpZ2l0c31gO1xuXG4vKiog0KTRg9C90LrRhtC40Y8t0YXQtdC70L/QtdGAINC00LvRjyDQv9GA0L7QstC10YDQutC4LCDRh9GC0L4g0L/QtdGA0LXQtNCw0L3QvdC+0LUg0LfQvdCw0YfQtdC90LjQtSDQvdC1INGP0LLQu9GP0LXRgtGB0Y8gbnVsbCDQuNC70LggdW5kZWZpbmVkICovXG5mdW5jdGlvbiBpc1ZhbHVlPFQgZXh0ZW5kcyBhbnk+KFxuICB2YWx1ZTogVCB8IG51bGwgfCB1bmRlZmluZWRcbik6IHZhbHVlIGlzIE5vbk51bGxhYmxlPFQ+IHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICog0KTRg9C90LrRhtC40Y8g0LLQsNC70LjQtNCw0YbQuNC4INC/0LXRgNC10LTQsNC90L3QvtCz0L4g0L7QsdGK0LXQutGC0LAgcmVzdHJpY3Rpb24g0L3QsCDRgdC+0L7RgtCy0LXRgtGB0YLQstC40LUg0LjQvdGC0LXRgNGE0LXQudGB0YMgUmVzdHJpY3Rpb25zXG4gKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQv9GA0L7QstC10YDRj9C10LzRi9C5INC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0Lgg0LLRgNC10LzQtdC90L3QvtC5INC30L7QvdC1LlxuICovXG5mdW5jdGlvbiBpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb246IHVua25vd24pOiByZXN0cmljdGlvbiBpcyBSZXN0cmljdGlvbnMge1xuICByZXR1cm4gKFxuICAgIHR5cGVvZiByZXN0cmljdGlvbiA9PT0gJ29iamVjdCcgJiZcbiAgICBpc1ZhbHVlKHJlc3RyaWN0aW9uKSAmJlxuICAgICd0aW1lem9uZScgaW4gcmVzdHJpY3Rpb24gJiZcbiAgICAnd29ya3RpbWUnIGluIHJlc3RyaWN0aW9uICYmXG4gICAgaXNWYWx1ZShyZXN0cmljdGlvbi50aW1lem9uZSkgJiZcbiAgICBpc1ZhbHVlKHJlc3RyaWN0aW9uLndvcmt0aW1lKVxuICApO1xufVxuXG4vKipcbiAqINCk0YPQvdC60YbQuNGPINCy0LDQu9C40LTQsNGG0LjQuCDQv9C10YDQtdC00LDQvdC90L7Qs9C+INC+0LHRitC10LrRgtCwIHJlc3RyaWN0aW9uINC90LAg0YHQvtC+0YLQstC10YLRgdGC0LLQuNC1INC80LjQvdC40LzQsNC70YzQvdGL0Lwg0LTQsNC90L3Ri9C8INC00LvRjyDQt9Cw0LrQsNC30LBcbiAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIoXG4gIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlclxuKTogcmVzdHJpY3Rpb24gaXMgUmVzdHJpY3Rpb25zT3JkZXIge1xuICByZXR1cm4gKFxuICAgIGlzVmFsaWRSZXN0cmljdGlvbihyZXN0cmljdGlvbikgJiZcbiAgICAnbWluRGVsaXZlcnlUaW1lSW5NaW51dGVzJyBpbiByZXN0cmljdGlvbiAmJlxuICAgICdwb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXMnIGluIHJlc3RyaWN0aW9uICYmXG4gICAgaXNWYWx1ZShyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXMpICYmXG4gICAgaXNWYWx1ZShyZXN0cmljdGlvbi5wb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXMpXG4gICk7XG59XG5cbi8qKlxuICog0JrQu9Cw0YHRgSwg0YHQvtC00LXRgNC20LDRidC40Lkg0YHRgtCw0YLQuNGH0LXRgdC60LjQtSDQvNC10YLQvtC00YssINC90LXQvtCx0YXQvtC00LjQvNGL0LUg0LTQu9GPINGA0LDQsdC+0YLRiyDRgSDQvtCz0YDQsNC90LjRh9C10L3QuNGP0LzQuCDRgNCw0LHQvtGH0LXQs9C+INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gKiDQodC+0LfQtNCw0LLQsNGC0Ywg0L3QvtCy0YvQuSDRjdC60LfQtdC80L/Qu9GP0YAg0Y3RgtC+0LPQviDQutC70LDRgdGB0LAg0LTQu9GPINC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPINGB0YLQsNGC0LjRh9C10YHQutC40YUg0LzQtdGC0L7QtNC+0LIg0L3QtSDRgtGA0LXQsdGD0LXRgtGB0Y8uXG4gKlxuICog0J/RgNC4INGN0YLQvtC8INC/0YDQuCDRgdC+0LfQtNCw0L3QuNC4INGN0LrQt9C10LzQv9C70Y/RgNCwINC60LvQsNGB0YHQsCDRgyDQvtCx0YrQtdC60YLQsCDRgtCw0LrQttC1INCx0YPQtNGD0YIg0LTQvtGB0YLRg9C/0L3RiyDRgdC+0LHRgdGC0LLQtdC90L3Ri9C1INGA0LXQsNC70LjQt9Cw0YbQuNC4XG4gKiDQstGB0LXRhSDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyLlxuICog0K3RgtC4INGA0LXQsNC70LjQt9Cw0YbQuNC4INC+0YLQu9C40YfQsNGO0YLRgdGPINC+0YIg0LLRi9C30L7QstC+0LIg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7QsiDRgtC+0LvRjNC60L4g0LzQtdC80L7QuNC30LDRhtC40LXQuSDQstGL0L/QvtC70L3QtdC90L3Ri9GFINGA0LDRgdGH0LXRgtC+0LIuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgV29ya1RpbWVWYWxpZGF0b3Ige1xuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLCDQvdCwINC60L7RgtC+0YDRg9GOINC80L7QttC90L4g0LfQsNC60LDQt9Cw0YLRjCDQtNC+0YHRgtCw0LLQutGDLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXG4gICAqIEByZXR1cm4g0KHRgtGA0L7QutCwLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQsNGPINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQtNC+0YHRgtGD0L/QvdGD0Y4g0LTQsNGC0YMg0LTQvtGB0YLQsNCy0LrQuCDQsiDRhNC+0YDQvNCw0YLQtSB5eXl5LU1NLWRkLlxuICAgKi9cbiAgc3RhdGljIGdldE1heE9yZGVyRGF0ZShcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU6IERhdGVcbiAgKTogc3RyaW5nIHtcbiAgICBpZiAoXG4gICAgICBpc1ZhbHVlKHJlc3RyaWN0aW9uKSAmJlxuICAgICAgaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIocmVzdHJpY3Rpb24pICYmXG4gICAgICBpc0RhdGUoY3VycmVudGRhdGUpXG4gICAgKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RGF0ZShcbiAgICAgICAgY3VycmVudGRhdGUuZ2V0VGltZSgpICsgcmVzdHJpY3Rpb24ucG9zc2libGVUb09yZGVySW5NaW51dGVzICogNjAwMDAsXG4gICAgICAgICd5eXl5LU1NLWRkJyxcbiAgICAgICAgJ2VuJ1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBpc0RhdGUoY3VycmVudGRhdGUpXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnXG4gICAgICAgICAgOiAhaXNWYWx1ZShyZXN0cmljdGlvbilcbiAgICAgICAgICAgID8gJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0L7QsdGK0LXQutGCIHJlc3RyaWN0aW9ucydcbiAgICAgICAgICAgIDogJ9Cf0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMnXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INGB0YfQuNGC0LDQtdGCLCDRgdC60L7Qu9GM0LrQviDQvNC40L3Rg9GCINC+0YIg0L3QsNGH0LDQu9CwINC00L3RjyAoMDA6MDApINC/0YDQvtGI0LvQviDQtNC70Y8g0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQstGA0LXQvNC10L3QuC5cbiAgICogQHBhcmFtIHRpbWUgLSDRgdGC0YDQvtC60LAg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLWAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYCAtINCy0YDQtdC80Y8uXG4gICAqIEByZXR1cm4g0LrQvtC7LdCy0L4g0LzQuNC90YPRgi5cbiAgICovXG4gIHN0YXRpYyBnZXRUaW1lRnJvbVN0cmluZyh0aW1lOiBUaW1lU3RyaW5nKTogbnVtYmVyIHtcbiAgICBpZiAoIWlzVmFsdWUodGltZSkpIHtcbiAgICAgIHRocm93ICfQndC1INC/0LXRgNC10LTQsNC90LAg0YHRgtGA0L7QutCwINGBINC/0YDQtdC+0LHRgNCw0LfRg9C10LzRi9C8INCy0YDQtdC80LXQvdC10Lwg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0nO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZWdFeHAgPSBuZXcgUmVnRXhwKFxuICAgICAgICAvXigwMHwwMXwwMnwwM3wwNHwwNXwwNnwwN3wwOHwwOXwxMHwxMXwxMnwxM3wxNHwxNXwxNnwxN3wxOHwxOXwyMHwyMXwyMnwyMykrOihbMC01XVxcZCkrL1xuICAgICAgKTtcbiAgICAgIGxldCBjaGVja2VkVGltZSA9IHRpbWUudHJpbSgpO1xuXG4gICAgICBpZiAoY2hlY2tlZFRpbWUuaW5jbHVkZXMoJyAnKSB8fCBjaGVja2VkVGltZS5pbmNsdWRlcygnVCcpKSB7XG4gICAgICAgIGNoZWNrZWRUaW1lID0gY2hlY2tlZFRpbWUuc3BsaXQoXG4gICAgICAgICAgY2hlY2tlZFRpbWUuaW5jbHVkZXMoJyAnKSA/ICcgJyA6ICdUJ1xuICAgICAgICApWzFdO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVnRXhwLnRlc3QoY2hlY2tlZFRpbWUpKSB7XG4gICAgICAgIHJldHVybiArY2hlY2tlZFRpbWUuc3BsaXQoJzonKVswXSAqIDYwICsgK2NoZWNrZWRUaW1lLnNwbGl0KCc6JylbMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAn0J/QtdGA0LXQtNCw0L3QvdCw0Y8g0YHRgtGA0L7QutCwINC90LUg0YHQvtC+0YLQstC10YLRgdGC0LLRg9C10YIg0YTQvtGA0LzQsNGC0YMgSEg6bW0gLWAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINC/0LXRgNC10LTQsNC90L3QvtC1INC60L7Quy3QstC+INC80LjQvdGD0YIg0LIg0YHRgtGA0L7QutC+0LLQtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtIGAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYC5cbiAgICog0J3QsNC/0YDQuNC80LXRgDpcbiAgICpcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDUwKSAvLyBhID0gJzAwOjUwJ1xuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTIwMCkgLy8gYiA9ICcyMDowMCdcbiAgICpcbiAgICogQHBhcmFtIHRpbWUgLSDQp9C40YHQu9C+INCyINC00LjQsNC/0LDQt9C+0L3QtSDQvtGCIDAg0LTQviAxNDQwICjRgtCw0Log0LrQsNC6INC80LDQutGB0LjQvNGD0Lwg0LIgMSDRgdGD0YLQutCw0YUgPSAxNDQwINC80LjQvdGD0YIpLlxuICAgKiDQn9GA0Lgg0L/QtdGA0LXQtNCw0YfQtSDQsiB0aW1lINC+0YLRgNC40YbQsNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjywg0LfQvdCw0Log0LHRg9C00LXRgiBcItC+0YLQvtCx0YDRiNC10L1cIiwg0LAg0LTQu9GPINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiwg0YDQsNGB0YHRh9C40YLQsNC90L3Ri9C5INC00LvRjyDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INC/0L7Qu9C+0LbQuNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjy5cbiAgICog0JXRgdC70Lgg0LIgdGltZSDQsdGD0LTQtdGCINC/0LXRgNC10LTQsNC90L4g0LfQvdCw0YfQtdC90LjQtSDQsdC+0LvRjNGI0LUgMTQ0MCAtINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiDQtNC70Y8g0LfQvdCw0YfQtdC90LjRjyDQsdC10Lcg0YPRh9C10YLQsCBcItC/0YDQtdCy0YvRiNCw0Y7RidC40YUg0YHRg9GC0L7QulwiICjRgi7QtS4g0YEg0LrRgNCw0YLQvdGL0Lwg0LLRi9GH0LXRgtC+0LwgMTQ0MCDQvNC40L3Rg9GCKVxuICAgKlxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxuICAgKlxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNjApIC8vIGEgPSAnMDE6MDAnXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxNTAwKSAvLyBiID0gJzAxOjAwJyAoMTQ0MCDQvNC40L3Rg9GCIFwi0YbQtdC70YvRhVwiINGB0YPRgtC+0Log0LHRi9C70LggXCLQvtGC0LHRgNC+0YjQtdC90YtcIilcbiAgICpcbiAgICogQHJldHVybnNcbiAgICovXG4gIHN0YXRpYyBjb252ZXJ0TWludXRlc1RvVGltZSh0aW1lOiBudW1iZXIpOiBUaW1lU3RyaW5nIHtcbiAgICBpZiAodGltZSA8IDE0NDEpIHtcbiAgICAgIGNvbnN0IGhvdXIgPSBNYXRoLmZsb29yKHRpbWUgLyA2MCk7XG4gICAgICBjb25zdCBob3VyU3RyOiBIb3Vyc0RpZ2l0cyA9IDxIb3Vyc0RpZ2l0cz4oXG4gICAgICAgIChob3VyIDw9IDkgPyBgMCR7U3RyaW5nKGhvdXIpfWAgOiBTdHJpbmcoaG91cikpXG4gICAgICApO1xuICAgICAgY29uc3QgbWludXRlcyA9IFN0cmluZyh0aW1lIC0gaG91ciAqIDYwKTtcbiAgICAgIGNvbnN0IG1pbnV0ZXNTdHI6IE1pbnV0ZURpZ2l0cyA9IDxNaW51dGVEaWdpdHM+KFxuICAgICAgICBgJHttaW51dGVzLmxlbmd0aCA9PSAxID8gJzAnIDogJyd9JHttaW51dGVzfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gYCR7aG91clN0cn06JHttaW51dGVzU3RyfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lIC0gMTQ0MCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0L/RgNC+0LLQtdGA0Y/QtdGCLCDQtNC+0YHRgtGD0L/QvdCwINC70Lgg0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4INC90LAg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y8uXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPLCDQtNC70Y8g0LrQvtGC0L7RgNGL0YUg0Lgg0L/RgNC+0LLQtdGA0Y/QtdGC0YHRjyDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60LhcbiAgICogQHJldHVybiDQntCx0YzQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOOlxuICAgKiB7XG4gICAgICAgIGlzV29ya05vdzpib29sZWFuIC0g0JLQvtC30LzQvtC20L3QsCDQu9C4INC00L7RgdGC0LDQstC60LAg0LIg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y9cbiAgICAgICAgaXNOZXdEYXk6Ym9vbGVhbiAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0LjQt9C90LDQuiwg0YfRgtC+INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDRh9Cw0YHQvtCy0YvRhSDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC00LDRgtGLIFwi0L/QtdGA0LXQv9GA0YvQs9C90YPQu1wiINC90LAg0L3QvtCy0YvQuSDQtNC10L3RjC5cbiAgICAgICAgY3VycmVudFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQvtCy0LXRgNGP0LXQvNC+0LUg0LzQtdGC0L7QtNC+0Lwg0LLRgNC10LzRjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cbiAgICAgICAgY3VyZW50RGF5U3RvcFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxuICAgICAgfVxuICAgKi9cbiAgc3RhdGljIGlzV29ya05vdyhcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zIHwgUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU6IERhdGUgPSBuZXcgRGF0ZSgpXG4gICk6IFZhbGlkYXRvclJlc3VsdCB7XG4gICAgLy8g0JXRgdC70Lgg0LjRgdC/0L7Qu9GM0L3Rj9C10YLRgdGPINCyIE5vZGVKU1xuICAgIGlmIChcbiAgICAgIGlzVmFsdWUocmVzdHJpY3Rpb24pICYmXG4gICAgICAhaXNWYWx1ZShyZXN0cmljdGlvbi50aW1lem9uZSkgJiZcbiAgICAgIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJ1xuICAgICkge1xuICAgICAgcmVzdHJpY3Rpb24udGltZXpvbmUgPVxuICAgICAgICBwcm9jZXNzPy5lbnY/LlRaID8/IEludGwuRGF0ZVRpbWVGb3JtYXQoKS5yZXNvbHZlZE9wdGlvbnMoKS50aW1lWm9uZTtcbiAgICB9XG5cbiAgICBpZiAoIWlzVmFsdWUocmVzdHJpY3Rpb24pIHx8ICFpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICFpc0RhdGUoY3VycmVudGRhdGUpXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnXG4gICAgICAgICAgOiAhaXNWYWx1ZShyZXN0cmljdGlvbilcbiAgICAgICAgICAgID8gJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0L7QsdGK0LXQutGCIHJlc3RyaWN0aW9ucydcbiAgICAgICAgICAgIDogJ9Cf0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMnXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgICFpc1ZhbHVlKHJlc3RyaWN0aW9uLndvcmt0aW1lKSB8fFxuICAgICAgICAhT2JqZWN0LmtleXMocmVzdHJpY3Rpb24ud29ya3RpbWUpLmxlbmd0aFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgd29ya05vdzogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29tcGFueUxvY2FsVGltZVpvbmUgPVxuICAgICAgICBUaW1lWm9uZUlkZW50aWZpZXIuZ2V0VGltZVpvbmVHTVRPZmZzZXRmcm9tTmFtZVpvbmUoXG4gICAgICAgICAgcmVzdHJpY3Rpb24udGltZXpvbmVcbiAgICAgICAgKS5zcGxpdCgnOicpO1xuICAgICAgY29uc3QgY29tcGFueUxvY2FsVGltZVpvbmVEZWx0YSA9XG4gICAgICAgICtjb21wYW55TG9jYWxUaW1lWm9uZVswXSAqIDYwICsgK2NvbXBhbnlMb2NhbFRpbWVab25lWzFdO1xuICAgICAgY29uc3QgbG9rYWxUaW1lRGVsdGEgPVxuICAgICAgICBjb21wYW55TG9jYWxUaW1lWm9uZURlbHRhICsgY3VycmVudGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKTsgLy8g0YHQvNC10YnQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0L7RgtC90L7RgdC40YLQtdC70YzQvdC+INCy0YDQtdC80LXQvdC4INGC0L7RgNCz0L7QstC+0Lkg0YLQvtGH0LrQuFxuICAgICAgY29uc3QgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA9XG4gICAgICAgIFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxuICAgICAgICAgIDxUaW1lU3RyaW5nPmZvcm1hdERhdGUoY3VycmVudGRhdGUsICdISDptbScsICdlbicpXG4gICAgICAgICkgKyBsb2thbFRpbWVEZWx0YTtcbiAgICAgIC8qKlxuICAgICAgICog0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQsiDQvNC40L3Rg9GC0LDRhSDRgSDQvdCw0YfQsNC70LAg0LTQvdGPICg2MDAgPSAxMDowMC4gMTIwMCA9IDIwOjAwKVxuICAgICAgICog0LXRgdC70Lgg0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0L/QtdGA0LXQv9GA0YvQs9C90YPQuyDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwsINGC0L4g0L/RgNC40LLQvtC00LjQvCDQstGA0LXQvNGPINC6INC/0YDQsNCy0LjQu9GM0L3QvtC80YMg0LfQvdCw0YfQtdC90LjRjiDQsiDQtNC40LDQv9Cw0LfQvtC90LUgMjQg0YfQsNGB0L7QslxuICAgICAgICogKi9cbiAgICAgIGNvbnN0IGN1cnJlbnRUaW1lID1cbiAgICAgICAgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDBcbiAgICAgICAgICA/IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgLSAxNDQwXG4gICAgICAgICAgOiBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhO1xuXG4gICAgICBjb25zdCBjdXJyZW50RGF5V29ya1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXG4gICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID4gMTQ0MFxuICAgICAgICAgID8gbmV3IERhdGUoY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDApXG4gICAgICAgICAgOiBjdXJyZW50ZGF0ZVxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0YDQsNCx0L7Rh9C10LUg0LLRgNC10LzRj1xuICAgICAgY29uc3QgY3VyZW50RGF5U3RhcnRUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoXG4gICAgICAgIDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdGFydFxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YVcbiAgICAgIGNvbnN0IGN1cmVudERheVN0b3BUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoXG4gICAgICAgIDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdG9wXG4gICAgICApOyAvLyDRgtC10LrRg9GJ0LXQtSDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgd29ya05vdzpcbiAgICAgICAgICBjdXJyZW50VGltZSA8IGN1cmVudERheVN0b3BUaW1lICYmIGN1cnJlbnRUaW1lID4gY3VyZW50RGF5U3RhcnRUaW1lLFxuICAgICAgICBpc05ld0RheTogY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDAsXG4gICAgICAgIGN1cnJlbnRUaW1lLFxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWUsXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0JTQvtGB0YLQsNCy0LrQsCDQutGD0YDRjNC10YDQvtC8XCIuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBzdGF0aWMgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKFxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcixcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxuICApOiBzdHJpbmcge1xuICAgIGlmICghaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIocmVzdHJpY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LjQu9C4INC/0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnKTtcbiAgICB9XG5cbiAgICBjb25zdCBjaGVja1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5pc1dvcmtOb3cocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcblxuICAgIGlmIChjaGVja1RpbWUud29ya05vdyAmJiBpc1ZhbHVlKGNoZWNrVGltZS5jdXJyZW50VGltZSkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfQodC10LnRh9Cw0YEg0YDQsNCx0L7Rh9C10LUg0LLRgNC10LzRjy4g0KDQsNGB0YfQtdGCINC90LUg0YLRgNC10LHRg9C10YLRgdGPLicpO1xuICAgICAgY29uc3QgcG9zc2libGVUaW1lID1cbiAgICAgICAgY2hlY2tUaW1lLmN1cnJlbnRUaW1lICsgKCtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXMgfHwgMCk7XG4gICAgICBjb25zdCBwb3NzaWJsZVRpbWVTdHIgPVxuICAgICAgICBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZShwb3NzaWJsZVRpbWUpO1xuICAgICAgcmV0dXJuIGZvcm1hdERhdGUoY3VycmVudGRhdGUsIGB5eXl5LU1NLWRkICR7cG9zc2libGVUaW1lU3RyfWAsICdlbicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoXG4gICAgICAgIGlzVmFsdWUoY2hlY2tUaW1lLmN1cnJlbnRUaW1lKSAmJlxuICAgICAgICBpc1ZhbHVlKGNoZWNrVGltZS5jdXJlbnREYXlTdG9wVGltZSlcbiAgICAgICkge1xuICAgICAgICBjb25zdCBjdXJyZW50RGF5V29ya1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXG4gICAgICAgICAgcmVzdHJpY3Rpb24sXG4gICAgICAgICAgY2hlY2tUaW1lLmlzTmV3RGF5XG4gICAgICAgICAgICA/IG5ldyBEYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKVxuICAgICAgICAgICAgOiBjdXJyZW50ZGF0ZVxuICAgICAgICApO1xuICAgICAgICBjb25zdCB0aW1lID1cbiAgICAgICAgICB0aGlzLmdldFRpbWVGcm9tU3RyaW5nKDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdGFydCkgK1xuICAgICAgICAgICtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXM7XG4gICAgICAgIGNvbnN0IHRpbWVTdHJpbmcgPSBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lKTtcbiAgICAgICAgcmV0dXJuIGZvcm1hdERhdGUoXG4gICAgICAgICAgY2hlY2tUaW1lLmlzTmV3RGF5IHx8XG4gICAgICAgICAgICBjaGVja1RpbWUuY3VycmVudFRpbWUgPiBjaGVja1RpbWUuY3VyZW50RGF5U3RvcFRpbWVcbiAgICAgICAgICAgID8gY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDBcbiAgICAgICAgICAgIDogY3VycmVudGRhdGUsXG4gICAgICAgICAgYHl5eXktTU0tZGQgJHt0aW1lU3RyaW5nfWAsXG4gICAgICAgICAgJ2VuJ1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0YDQsNGB0YHRh9C40YLQsNGC0YwgY3VycmVudFRpbWUg0LggY3VyZW50RGF5U3RvcFRpbWUuJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0KHQsNC80L7QstGL0LLQvtC3XCIuXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXG4gICAqL1xuICBzdGF0aWMgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUoXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXG4gICk6IHN0cmluZyB7XG4gICAgaWYgKCFpc1ZhbGlkUmVzdHJpY3Rpb25PcmRlcihyZXN0cmljdGlvbikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign0J3QtSDQv9C10YDQtdC00LDQvSDQuNC70Lgg0L/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGK0LXQutGCIHJlc3RyaWN0aW9ucycpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqINCU0LvRjyDQvtCx0LXRgdC/0LXRh9C10L3QuNGPINC40LzQvNGD0YLQsNCx0LXQu9GM0L3QvtGB0YLQuCDQtNCw0L3QvdGL0YUg0YHQvtC30LTQsNC10YLRgdGPINC90L7QstGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucywg0LjQtNC10L3RgtC40YfQvdGL0Lkg0L/QvtC70YPRh9C10L3QvdC+0LzRgyDQsiDQv9Cw0YDQsNC80LXRgtGA0LDRhSwg0L3QviDRgSDQuNC30LzQtdC90LXQvdC90YvQvCDQvNCw0YHRgdC40LLQvtC8IHdvcmt0aW1lLlxuICAgICAqINCSINC80LDRgdGB0LjQstC1IHdvcmt0aW1lINC+0LHQvdC+0LLQu9GP0Y7RgtGB0Y8g0L7Qs9GA0LDQvdC40YfQtdC90LjRjyDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0YEg0L7QsdGL0YfQvdGL0YUg0L3QsCDQsNC60YLRg9Cw0LvRjNC90YvQtSDQtNC70Y8g0YHQsNC80L7QstGL0LLQvtC30LAuXG4gICAgICogKi9cbiAgICBjb25zdCBuZXdSZXN0cmljdGlvbiA9IHtcbiAgICAgIC4uLnJlc3RyaWN0aW9uLFxuICAgICAgd29ya3RpbWU6ICg8V29ya1RpbWVbXT5yZXN0cmljdGlvbi53b3JrdGltZSkubWFwKCh3b3JrdGltZSkgPT5cbiAgICAgICAgd29ya3RpbWUuc2VsZlNlcnZpY2VcbiAgICAgICAgICA/IHsgLi4ud29ya3RpbWUsIC4uLndvcmt0aW1lLnNlbGZTZXJ2aWNlIH1cbiAgICAgICAgICA6IHdvcmt0aW1lXG4gICAgICApLFxuICAgIH07XG4gICAgcmV0dXJuIFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShcbiAgICAgIG5ld1Jlc3RyaWN0aW9uLFxuICAgICAgY3VycmVudGRhdGVcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQuNC3INC80LDRgdGB0LjQstCwINCy0YHQtdGFINCy0LDRgNC40LDQvdGC0L7QsiDQvtCx0YzQtdC60YLQsCByZXN0cmljdGlvbi5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cbiAgICovXG4gIHN0YXRpYyBnZXRDdXJyZW50V29ya1RpbWUoXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucyxcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxuICApOiBXb3JrVGltZSB7XG4gICAgaWYgKCFpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LjQu9C4INC/0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnKTtcbiAgICB9XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XG5cbiAgICB3aGlsZSAoaSA8IHJlc3RyaWN0aW9uLndvcmt0aW1lLmxlbmd0aCAmJiAhaXNWYWx1ZShyZXN1bHQpKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHJlc3RyaWN0aW9uLndvcmt0aW1lW2ldLmRheU9mV2VlayA9PT0gJ2FsbCcgfHxcbiAgICAgICAgKHR5cGVvZiByZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWsgPT09ICdzdHJpbmcnXG4gICAgICAgICAgPyAoPHN0cmluZz5yZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWspLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICA6ICg8c3RyaW5nW10+cmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrKS5tYXAoKGRheSkgPT5cbiAgICAgICAgICAgIGRheS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgKVxuICAgICAgICApLmluY2x1ZGVzKGZvcm1hdERhdGUoY3VycmVudGRhdGUsICdFRUVFJywgJ2VuJykudG9Mb3dlckNhc2UoKSlcbiAgICAgICkge1xuICAgICAgICByZXN1bHQgPSByZXN0cmljdGlvbi53b3JrdGltZVtpXTtcbiAgICAgIH1cbiAgICAgIGkgKz0gMTtcbiAgICB9XG5cbiAgICBpZiAoIWlzVmFsdWUocmVzdWx0KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfQndC10YIg0LDQutGC0YPQsNC70YzQvdC+0LPQviDRgNCw0YHQv9C40YHQsNC90LjRjyDRgNCw0LHQvtGC0Ysg0LTQu9GPINGC0LXQutGD0YnQtdCz0L4g0LTQvdGPJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCb0L7Qs9C40LrQsCDQvdC40LbQtSDQv9GA0LXQtNC90LDQt9C90LDRh9C10L3QsCDQtNC70Y8g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8g0Y3QutC30LXQvNC/0LvRj9GA0LAg0LrQu9Cw0YHRgdCwIFdvcmtUaW1lVmFsaWRhdG9yXG4gICAqL1xuXG4gIGNvbnN0cnVjdG9yKCkgeyB9XG5cbiAgcHJpdmF0ZSBfbWVtb3J5OiB7XG4gICAgZ2V0TWF4T3JkZXJEYXRlOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGdldFRpbWVGcm9tU3RyaW5nOiBNYXA8c3RyaW5nLCBudW1iZXI+O1xuICAgIGlzV29ya05vdzogTWFwPHN0cmluZywgVmFsaWRhdG9yUmVzdWx0PjtcbiAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IE1hcDxzdHJpbmcsIHN0cmluZz47XG4gICAgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWU6IE1hcDxzdHJpbmcsIHN0cmluZz47XG4gICAgZ2V0Q3VycmVudFdvcmtUaW1lOiBNYXA8c3RyaW5nLCBXb3JrVGltZT47XG4gICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IE1hcDxzdHJpbmcsIFRpbWVTdHJpbmc+O1xuICB9ID0ge1xuICAgICAgZ2V0TWF4T3JkZXJEYXRlOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxuICAgICAgZ2V0VGltZUZyb21TdHJpbmc6IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCksXG4gICAgICBpc1dvcmtOb3c6IG5ldyBNYXA8c3RyaW5nLCBWYWxpZGF0b3JSZXN1bHQ+KCksXG4gICAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXG4gICAgICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZTogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKSxcbiAgICAgIGdldEN1cnJlbnRXb3JrVGltZTogbmV3IE1hcDxzdHJpbmcsIFdvcmtUaW1lPigpLFxuICAgICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBUaW1lU3RyaW5nPigpLFxuICAgIH07XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgywg0L3QsCDQutC+0YLQvtGA0YPRjiDQvNC+0LbQvdC+INC30LDQutCw0LfQsNGC0Ywg0LTQvtGB0YLQsNCy0LrRgy5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcmV0dXJuIDpzdHJpbmcgLSDQodGC0YDQvtC60LAsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidCw0Y8g0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINC00L7RgdGC0YPQv9C90YPRjiDQtNCw0YLRgyDQtNC+0YHRgtCw0LLQutC4INCyINGE0L7RgNC80LDRgtC1IHl5eXktTU0tZGQuXG4gICAqL1xuICBnZXRNYXhPcmRlckRhdGUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IHN0cmluZyB7XG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0TWF4T3JkZXJEYXRlLmdldChtZW1vcnlLZXkpO1xuICAgIGlmIChpc1ZhbHVlKGNoZWNrTWVtb3J5KSkge1xuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRNYXhPcmRlckRhdGUoXG4gICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICBjdXJyZW50ZGF0ZVxuICAgICAgKTtcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRNYXhPcmRlckRhdGUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxuICAgKiBAcGFyYW0gdGltZSAtINGB0YLRgNC+0LrQsCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtINCy0YDQtdC80Y8uXG4gICAqIEByZXR1cm4gOm51bWJlciAtINC60L7Quy3QstC+INC80LjQvdGD0YIuXG4gICAqL1xuICBnZXRUaW1lRnJvbVN0cmluZyh0aW1lOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgdGltZSB9KTtcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRUaW1lRnJvbVN0cmluZy5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoaXNWYWx1ZShjaGVja01lbW9yeSkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoPFRpbWVTdHJpbmc+dGltZSk7XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0VGltZUZyb21TdHJpbmcuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INC/0YDQvtCy0LXRgNGP0LXRgiwg0LTQvtGB0YLRg9C/0L3QsCDQu9C4INCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjywg0LTQu9GPINC60L7RgtC+0YDRi9GFINC4INC/0YDQvtCy0LXRgNGP0LXRgtGB0Y8g0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4XG4gICAqIEByZXR1cm4g0J7QsdGM0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjjpcbiAgICoge1xuICAgICAgICBpc1dvcmtOb3c6Ym9vbGVhbiAtINCS0L7Qt9C80L7QttC90LAg0LvQuCDQtNC+0YHRgtCw0LLQutCwINCyINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPXG4gICAgICAgIGlzTmV3RGF5OmJvb2xlYW4gLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC40LfQvdCw0LosINGH0YLQviDQuNC3LdC30LAg0YDQsNC30L3QuNGG0Ysg0YfQsNGB0L7QstGL0YUg0L/QvtGP0YHQvtCyINGA0LDRgdGH0LXRgiDQtNCw0YLRiyBcItC/0LXRgNC10L/RgNGL0LPQvdGD0LtcIiDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwuXG4gICAgICAgIGN1cnJlbnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0L7QstC10YDRj9C10LzQvtC1INC80LXRgtC+0LTQvtC8INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gICAgICAgIGN1cmVudERheVN0YXJ0VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cbiAgICAgIH1cbiAgICovXG4gIGlzV29ya05vdyhcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zIHwgUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU/OiBEYXRlXG4gICk6IFZhbGlkYXRvclJlc3VsdCB7XG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuaXNXb3JrTm93LmdldChtZW1vcnlLZXkpO1xuICAgIGlmIChpc1ZhbHVlKGNoZWNrTWVtb3J5KSkge1xuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5pc1dvcmtOb3cocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcbiAgICAgIHRoaXMuX21lbW9yeS5pc1dvcmtOb3cuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQlNC+0YHRgtCw0LLQutCwINC60YPRgNGM0LXRgNC+0LxcIi5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cbiAgICovXG4gIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsXG4gICAgY3VycmVudGRhdGU6IERhdGVcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcbiAgICBjb25zdCBjaGVja01lbW9yeSA9XG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lLmdldChtZW1vcnlLZXkpO1xuICAgIGlmIChpc1ZhbHVlKGNoZWNrTWVtb3J5KSkge1xuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUoXG4gICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICBjdXJyZW50ZGF0ZVxuICAgICAgKTtcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQodCw0LzQvtCy0YvQstC+0LdcIi5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cbiAgICovXG4gIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKFxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcixcbiAgICBjdXJyZW50ZGF0ZTogRGF0ZVxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID1cbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZS5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoaXNWYWx1ZShjaGVja01lbW9yeSkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUoXG4gICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICBjdXJyZW50ZGF0ZVxuICAgICAgKTtcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQuNC3INC80LDRgdGB0LjQstCwINCy0YHQtdGFINCy0LDRgNC40LDQvdGC0L7QsiDQvtCx0YzQtdC60YLQsCByZXN0cmljdGlvbi5cbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cbiAgICovXG4gIGdldEN1cnJlbnRXb3JrVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IFdvcmtUaW1lIHtcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRDdXJyZW50V29ya1RpbWUuZ2V0KG1lbW9yeUtleSk7XG4gICAgaWYgKGlzVmFsdWUoY2hlY2tNZW1vcnkpKSB7XG4gICAgICByZXR1cm4gPFdvcmtUaW1lPmNoZWNrTWVtb3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXG4gICAgICAgIHJlc3RyaWN0aW9uLFxuICAgICAgICBjdXJyZW50ZGF0ZVxuICAgICAgKTtcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRDdXJyZW50V29ya1RpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqINCc0LXRgtC+0LQg0LrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINC/0LXRgNC10LTQsNC90L3QvtC1INC60L7Quy3QstC+INC80LjQvdGD0YIg0LIg0YHRgtGA0L7QutC+0LLQtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtIGAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYC5cbiAgICog0J3QsNC/0YDQuNC80LXRgDpcbiAgICpcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDUwKSAvLyBhID0gJzAwOjUwJ1xuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTIwMCkgLy8gYiA9ICcyMDowMCdcbiAgICpcbiAgICogQHBhcmFtIHRpbWUgLSDQp9C40YHQu9C+INCyINC00LjQsNC/0LDQt9C+0L3QtSDQvtGCIDAg0LTQviAxNDQwICjRgtCw0Log0LrQsNC6INC80LDQutGB0LjQvNGD0Lwg0LIgMSDRgdGD0YLQutCw0YUgPSAxNDQwINC80LjQvdGD0YIpLlxuICAgKiDQn9GA0Lgg0L/QtdGA0LXQtNCw0YfQtSDQsiB0aW1lINC+0YLRgNC40YbQsNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjywg0LfQvdCw0Log0LHRg9C00LXRgiBcItC+0YLQvtCx0YDRiNC10L1cIiwg0LAg0LTQu9GPINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiwg0YDQsNGB0YHRh9C40YLQsNC90L3Ri9C5INC00LvRjyDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INC/0L7Qu9C+0LbQuNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjy5cbiAgICog0JXRgdC70Lgg0LIgdGltZSDQsdGD0LTQtdGCINC/0LXRgNC10LTQsNC90L4g0LfQvdCw0YfQtdC90LjQtSDQsdC+0LvRjNGI0LUgMTQ0MCAtINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiDQtNC70Y8g0LfQvdCw0YfQtdC90LjRjyDQsdC10Lcg0YPRh9C10YLQsCBcItC/0YDQtdCy0YvRiNCw0Y7RidC40YUg0YHRg9GC0L7QulwiICjRgi7QtS4g0YEg0LrRgNCw0YLQvdGL0Lwg0LLRi9GH0LXRgtC+0LwgMTQ0MCDQvNC40L3Rg9GCKVxuICAgKlxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxuICAgKlxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNjApIC8vIGEgPSAnMDE6MDAnXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxNTAwKSAvLyBiID0gJzAxOjAwJyAoMTQ0MCDQvNC40L3Rg9GCIFwi0YbQtdC70YvRhVwiINGB0YPRgtC+0Log0LHRi9C70LggXCLQvtGC0LHRgNC+0YjQtdC90YtcIilcbiAgICpcbiAgICogQHJldHVybnNcbiAgICovXG4gIGNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWU6IG51bWJlcik6IFRpbWVTdHJpbmcge1xuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgdGltZSB9KTtcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5jb252ZXJ0TWludXRlc1RvVGltZS5nZXQobWVtb3J5S2V5KTtcbiAgICBpZiAoaXNWYWx1ZShjaGVja01lbW9yeSkpIHtcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUodGltZSk7XG4gICAgICB0aGlzLl9tZW1vcnkuY29udmVydE1pbnV0ZXNUb1RpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG59XG4iXX0=