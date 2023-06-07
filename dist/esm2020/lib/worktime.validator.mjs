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
        if (restriction &&
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
        if (!isValidRestrictionOrder(restriction)) {
            throw new Error('Не передан или передан невалидный объект restrictions');
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sTUFBTSxDQUFDO0FBZ0sxQywwRkFBMEY7QUFDMUYsU0FBUyxPQUFPLENBQ2QsS0FBMkI7SUFFM0IsT0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLENBQUM7QUFDL0MsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsa0JBQWtCLENBQUMsV0FBb0I7SUFDOUMsT0FBTyxDQUNMLE9BQU8sV0FBVyxLQUFLLFFBQVE7UUFDL0IsT0FBTyxDQUFDLFdBQVcsQ0FBQztRQUNwQixVQUFVLElBQUksV0FBVztRQUN6QixVQUFVLElBQUksV0FBVztRQUN6QixPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztRQUM3QixPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUM5QixDQUFDO0FBQ0osQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsdUJBQXVCLENBQzlCLFdBQThCO0lBRTlCLE9BQU8sQ0FDTCxrQkFBa0IsQ0FBQyxXQUFXLENBQUM7UUFDL0IsMEJBQTBCLElBQUksV0FBVztRQUN6QywwQkFBMEIsSUFBSSxXQUFXO1FBQ3pDLE9BQU8sQ0FBQyxXQUFXLENBQUMsd0JBQXdCLENBQUM7UUFDN0MsT0FBTyxDQUFDLFdBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUM5QyxDQUFDO0FBQ0osQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQUM1Qjs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FDcEIsV0FBOEIsRUFDOUIsV0FBaUI7UUFFakIsSUFDRSxX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QUFFO1lBQ2YsT0FBTyxXQUFXLENBQUM7U0FDcEI7YUFBTTtZQUNMLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6RCxPQUFPLE1BQU0sQ0FBQztTQUNmO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZm9ybWF0RGF0ZSwgaXNEYXRlIH0gZnJvbSAnLi9mb3JtYXREYXRlJztcclxuaW1wb3J0IHsgVGltZVpvbmVJZGVudGlmaWVyIH0gZnJvbSAnLi90eic7XHJcblxyXG4vKipcclxuICog0JHQsNC30L7QstGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyAtINGB0LvRg9C20LXQsdC90YvQuSDQuNC90YLQtdGA0YTQtdC50YEuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtUaW1lQmFzZSB7XHJcbiAgLyoqINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cclxuICBzdGFydDogc3RyaW5nO1xyXG5cclxuICAvKiog0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8qL1xyXG4gIHN0b3A6IHN0cmluZztcclxuXHJcbiAgLyoqINC/0LXRgNC10YDRi9CyINC90LAg0L7QsdC10LQqL1xyXG4gIGJyZWFrPzogc3RyaW5nO1xyXG59XHJcblxyXG4vKipcclxuICog0JjQvdGE0L7RgNC80LDRhtC40Y8g0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gLSDRgdC70YPQttC10LHQvdGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBXb3JrVGltZSBleHRlbmRzIFdvcmtUaW1lQmFzZSB7XHJcbiAgLyoqINC00LXQvdGMINC90LXQtNC10LvQuCwg0Log0LrQvtGC0L7RgNC+0LzRgyDQv9GA0LjQvNC10L3Rj9C10YLRgdGPINGN0YLQviDQstGA0LXQvNGPINC00L7RgdGC0LDQstC60LggICAqL1xyXG4gIGRheU9mV2Vlazogc3RyaW5nIHwgc3RyaW5nW107XHJcblxyXG4gIC8qKiDQvtCz0YDQsNC90LjRh9C10L3QuNGPINC/0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC00LvRjyDRgdCw0LzQvtCy0YvQstC+0LfQsCAqL1xyXG4gIHNlbGZTZXJ2aWNlPzogV29ya1RpbWVCYXNlO1xyXG59XHJcblxyXG4vKipcclxuICog0JjQvdGC0LXRgNGE0LXQudGBINC+0LHRitC10LrRgtCwLCDQv9C+0LvRg9GH0LDQtdC80L7Qs9C+INC+0YIgQVBJIEB3ZWJyZXN0by9jb3JlINC4INGB0L7QtNC10YDQttCw0YnQtdCz0L4g0YLQtdC60YPRidC40LUg0LTQsNC90L3Ri9C1INC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y9cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVzdHJpY3Rpb25zIHtcclxuICAvKiog0LLRgNC10LzQtdC90L3QsNGPINC30L7QvdCwINC/0YDQtdC00L/RgNC40Y/RgtC40Y8gKi9cclxuICB0aW1lem9uZT86IHN0cmluZztcclxuXHJcbiAgLyoqICDQvNCw0YHRgdC40LIg0L7Qs9GA0LDQvdC40YfQtdC90LjQuSDQv9C+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC00LvRjyDRgNCw0LfQvdGL0YUg0LTQvdC10Lkg0L3QtdC00LXQu9C4LiAqL1xyXG4gIHdvcmt0aW1lOiBXb3JrVGltZVtdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEh0bWxGb3JtRmllbGQge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgdHlwZTogc3RyaW5nO1xyXG4gIGxhYmVsOiBzdHJpbmc7XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZztcclxuICByZXF1aXJlZDogYm9vbGVhbjtcclxuICByZWdleDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvdW50cnkge1xyXG4gIHBob25lQ29kZTogc3RyaW5nO1xyXG4gIGlzbzogc3RyaW5nO1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBuYXRpdmVDb3VudHJ5TmFtZTogc3RyaW5nO1xyXG4gIGxhbmd1YWdlOiBzdHJpbmdbXTtcclxuICBjdXJyZW5jeTogc3RyaW5nO1xyXG4gIGN1cnJlbmN5U3ltYm9sOiBzdHJpbmc7XHJcbiAgY3VycmVuY3lJU086IHN0cmluZztcclxuICBjdXJyZW5jeVVuaXQ6IHN0cmluZztcclxuICBjdXJyZW5jeURlbm9taW5hdGlvbjogbnVtYmVyO1xyXG4gIHBob25lTWFzazogc3RyaW5nW107XHJcbiAgZmxhZzogc3RyaW5nO1xyXG59XHJcblxyXG4vKiog0JTQsNC90L3Ri9C1INC+INC80L7QtNC10LvQuCDQsNCy0YLQvtGA0LjQt9Cw0YbQuNC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC90LAg0YHQsNC50YLQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXHJcbmV4cG9ydCB0eXBlIFVzZXJSZXN0cmljdGlvbnM8VCBleHRlbmRzIHt9ID0ge30+ID0ge1xyXG4gIC8qKiDQn9C+0LrQsNC30YvQstCw0LXRgiwg0LrQsNC60L7QuSDQstC40LQg0LTQsNC90L3Ri9GFINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70LXQvCDQtNC70Y8g0LDQstGC0L7RgNC40LfQsNGG0LjQuCAqL1xyXG4gIGxvZ2luRmllbGQ6IHN0cmluZztcclxuICAvKipcclxuICAgKiBab2RpYWMgc2lnbiwgSHVtYW4gZGVzaW5nIHR5cGUsIEJlc3QgRnJpZW5kLCByZWZlcmFsIGxpbmsgZXRjXHJcbiAgICovXHJcbiAgY3VzdG9tRmllbGRzPzogSHRtbEZvcm1GaWVsZFtdIHwgbnVsbDtcclxuICAvKipcclxuICAgKiBwb3NzaWJsZSAzIHZhcmlhbnRzIFsncmVxdWlyZWQnLCAnZnJvbV9vdHAnLCAnZGlzYWJsZWQnXSBieSBkZWZhdWx0OiBgZnJvbV9vdHBgIGl0IG1lYW5zIHdoYXQgbmVlZCBvbmx5IE9UUCwgZm9yIG5leHQgbG9naW5zICBwYXNzd29yZFJlcXVpcmVkLCBkaXNhYmxlZCBpcyBtZWFucyBwYXNzd29yZCBmb3JiaWRkZW4gYW5kIHlvdSBuZWVkIGFsbCB0aW1lIGdldCBPVFAgcGFzc3dvcmRcclxuICAgKi9cclxuICBwYXNzd29yZFBvbGljeTogJ3JlcXVpcmVkJyB8ICdmcm9tX290cCcgfCAnZGlzYWJsZWQnO1xyXG4gIC8qKlxyXG4gICAqIGJ5IGRlZmF1bHQgPSBmYWxzZVxyXG4gICAqL1xyXG4gIGxvZ2luT1RQUmVxdWlyZWQ6IGJvb2xlYW47XHJcbiAgLyoqXHJcbiAgICog0KHQv9C40YHQvtC6INGB0YLRgNCw0L0sINGC0LXQu9C10YTQvtC90L3Ri9C1INC60L7QtNGLINC60L7RgtC+0YDRi9GFINC00L7RgdGC0YPQv9C90Ysg0LTQu9GPINGD0LrQsNC30LDQvdC40Y8g0LIg0L3QvtC80LXRgNC1INGC0LXQu9C10YTQvtC90LAg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgYWxsb3dlZFBob25lQ291bnRyaWVzOiBDb3VudHJ5W107XHJcbiAgLyoqXHJcbiAgICog0KHRgdGL0LvQutCwINC90LAg0L/QvtC70LjRgtC40LrRgyDQvtCx0YDQsNCx0L7RgtC60Lgg0L/QtdGA0YHQvtC90LDQu9GM0L3Ri9GFINC00LDQvdC90YvRhVxyXG4gICAqL1xyXG4gIGxpbmtUb1Byb2Nlc3NpbmdQZXJzb25hbERhdGE6IHN0cmluZztcclxuICAvKipcclxuICAgKiDQodGB0YvQu9C60LAg0L3QsCDQv9C+0LvRjNC30L7QstCw0YLQtdC70YzRgdC60L7QtSDRgdC+0LPQu9Cw0YjQtdC90LjQtVxyXG4gICAqL1xyXG4gIGxpbmtUb1VzZXJBZ3JlZW1lbnQ6IHN0cmluZztcclxuICAvKipcclxuICAgKiDQlNC70LjQvdCwINC60L7QtNCwINC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNGPIE9UUFxyXG4gICAqL1xyXG4gIE9UUGxlbmd0aDogbnVtYmVyO1xyXG59ICYgVDtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVzdHJpY3Rpb25zT3JkZXI8VCBleHRlbmRzIHt9ID0ge30+IGV4dGVuZHMgUmVzdHJpY3Rpb25zIHtcclxuICAvKiog0LzQuNC90LjQvNCw0LvRjNC90L7QtSDQstGA0LXQvNGPINC00L7RgdGC0LDQstC60LgqL1xyXG4gIG1pbkRlbGl2ZXJ5VGltZUluTWludXRlczogc3RyaW5nO1xyXG5cclxuICAvKiog0L7Qs9GA0LDQvdC40YfQtdC90LjQtSDQvNCw0LrRgdC40LzQsNC70YzQvdC+0Lkg0LTQsNGC0Ysg0LfQsNC60LDQt9CwINCyINCx0YPQtNGD0YnQtdC8ICjQsiDQvNC40L3Rg9GC0LDRhSkqL1xyXG4gIHBvc3NpYmxlVG9PcmRlckluTWludXRlczogbnVtYmVyO1xyXG5cclxuICAvKiogINGD0YHRgtCw0L3QvtCy0LvQtdC90L4g0LvQuCDQvdCwINGC0LXQutGD0YnQuNC5INC80L7QvNC10L3RgiDQvtCz0YDQsNC90LjRh9C10L3QuNC1INC00L7RgdGC0LDQstC60Lgg0L3QsCDQvtC/0YDQtdC00LXQu9C10L3QvdC+0LUg0LLRgNC10LzRjyAqL1xyXG4gIGRlbGl2ZXJ5VG9UaW1lRW5hYmxlZD86IGJvb2xlYW47XHJcblxyXG4gIC8qKiDQlNC+0L/QvtC70L3QuNGC0LXQu9GM0L3Ri9C5INC60L7QvNC80LXQvdGC0LDRgNC40Lkg0L/QviDQtNC+0YHRgtCw0LLQutC1ICovXHJcbiAgZGVsaXZlcnlEZXNjcmlwdGlvbj86IHN0cmluZztcclxuXHJcbiAgLyoqINCg0LDQt9C90L7QstC40LTQvdC+0YHRgtGMINCy0LLQvtC00LjQvNC+0Lkg0LrQsNC/0YfQuCAqL1xyXG4gIGNhcHRjaGFUeXBlPzogc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgLyoqINCU0LDQvdC90YvQtSDQviDQvNC+0LTQtdC70Lgg0LDQstGC0L7RgNC40LfQsNGG0LjQuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70LXQuSDQvdCwINGB0LDQudGC0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyAqL1xyXG4gIHVzZXI/OiBVc2VyUmVzdHJpY3Rpb25zPFQ+IHwgbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0b3JSZXN1bHQge1xyXG4gIHdvcmtOb3c6IGJvb2xlYW47XHJcbiAgaXNOZXdEYXk/OiBib29sZWFuO1xyXG4gIGN1cnJlbnRUaW1lPzogbnVtYmVyO1xyXG4gIGN1cmVudERheVN0YXJ0VGltZT86IG51bWJlcjtcclxuICBjdXJlbnREYXlTdG9wVGltZT86IG51bWJlcjtcclxufVxyXG5cclxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgdC10YUg0YbQuNGE0YAgKi9cclxudHlwZSBEaWdpdHMgPSAnMCcgfCAnMScgfCAnMicgfCAnMycgfCAnNCcgfCAnNScgfCAnNicgfCAnNycgfCAnOCcgfCAnOSc7XHJcblxyXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSAyNCDRh9Cw0YHQvtCyINC+0LTQvdC40YUg0YHRg9GC0L7QuiAqL1xyXG5leHBvcnQgdHlwZSBIb3Vyc0RpZ2l0cyA9XHJcbiAgfCAnMDAnXHJcbiAgfCAnMDEnXHJcbiAgfCAnMDInXHJcbiAgfCAnMDMnXHJcbiAgfCAnMDQnXHJcbiAgfCAnMDUnXHJcbiAgfCAnMDYnXHJcbiAgfCAnMDcnXHJcbiAgfCAnMDgnXHJcbiAgfCAnMDknXHJcbiAgfCAnMTAnXHJcbiAgfCAnMTEnXHJcbiAgfCAnMTInXHJcbiAgfCAnMTMnXHJcbiAgfCAnMTQnXHJcbiAgfCAnMTUnXHJcbiAgfCAnMTYnXHJcbiAgfCAnMTcnXHJcbiAgfCAnMTgnXHJcbiAgfCAnMTknXHJcbiAgfCAnMjAnXHJcbiAgfCAnMjEnXHJcbiAgfCAnMjInXHJcbiAgfCAnMjMnO1xyXG5cclxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUgNjAg0LzQuNC90YPRgiDQvtC00L3QvtCz0L4g0YfQsNGB0LAqL1xyXG5leHBvcnQgdHlwZSBNaW51dGVEaWdpdHMgPSBgJHsnMCcgfCAnMScgfCAnMicgfCAnMycgfCAnNCcgfCAnNSd9JHtEaWdpdHN9YDtcclxuXHJcbi8qKiDQotC40L8sINC+0L/QuNGB0YvQstCw0Y7RidC40Lkg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YDQtdC80LXQvdC4INCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC1gKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAgKi9cclxuZXhwb3J0IHR5cGUgVGltZVN0cmluZyA9IGAke0hvdXJzRGlnaXRzfToke01pbnV0ZURpZ2l0c31gO1xyXG5cclxuLyoqINCk0YPQvdC60YbQuNGPLdGF0LXQu9C/0LXRgCDQtNC70Y8g0L/RgNC+0LLQtdGA0LrQuCwg0YfRgtC+INC/0LXRgNC10LTQsNC90L3QvtC1INC30L3QsNGH0LXQvdC40LUg0L3QtSDRj9Cy0LvRj9C10YLRgdGPIG51bGwg0LjQu9C4IHVuZGVmaW5lZCAqL1xyXG5mdW5jdGlvbiBpc1ZhbHVlPFQgZXh0ZW5kcyBhbnk+KFxyXG4gIHZhbHVlOiBUIHwgbnVsbCB8IHVuZGVmaW5lZFxyXG4pOiB2YWx1ZSBpcyBOb25OdWxsYWJsZTxUPiB7XHJcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDQpNGD0L3QutGG0LjRjyDQstCw0LvQuNC00LDRhtC40Lgg0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQvtCx0YrQtdC60YLQsCByZXN0cmljdGlvbiDQvdCwINGB0L7QvtGC0LLQtdGC0YHRgtCy0LjQtSDQuNC90YLQtdGA0YTQtdC50YHRgyBSZXN0cmljdGlvbnNcclxuICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L/RgNC+0LLQtdGA0Y/QtdC80YvQuSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC4INCy0YDQtdC80LXQvdC90L7QuSDQt9C+0L3QtS5cclxuICovXHJcbmZ1bmN0aW9uIGlzVmFsaWRSZXN0cmljdGlvbihyZXN0cmljdGlvbjogdW5rbm93bik6IHJlc3RyaWN0aW9uIGlzIFJlc3RyaWN0aW9ucyB7XHJcbiAgcmV0dXJuIChcclxuICAgIHR5cGVvZiByZXN0cmljdGlvbiA9PT0gJ29iamVjdCcgJiZcclxuICAgIGlzVmFsdWUocmVzdHJpY3Rpb24pICYmXHJcbiAgICAndGltZXpvbmUnIGluIHJlc3RyaWN0aW9uICYmXHJcbiAgICAnd29ya3RpbWUnIGluIHJlc3RyaWN0aW9uICYmXHJcbiAgICBpc1ZhbHVlKHJlc3RyaWN0aW9uLnRpbWV6b25lKSAmJlxyXG4gICAgaXNWYWx1ZShyZXN0cmljdGlvbi53b3JrdGltZSlcclxuICApO1xyXG59XHJcblxyXG4vKipcclxuICog0KTRg9C90LrRhtC40Y8g0LLQsNC70LjQtNCw0YbQuNC4INC/0LXRgNC10LTQsNC90L3QvtCz0L4g0L7QsdGK0LXQutGC0LAgcmVzdHJpY3Rpb24g0L3QsCDRgdC+0L7RgtCy0LXRgtGB0YLQstC40LUg0LzQuNC90LjQvNCw0LvRjNC90YvQvCDQtNCw0L3QvdGL0Lwg0LTQu9GPINC30LDQutCw0LfQsFxyXG4gKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAqL1xyXG5mdW5jdGlvbiBpc1ZhbGlkUmVzdHJpY3Rpb25PcmRlcihcclxuICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXJcclxuKTogcmVzdHJpY3Rpb24gaXMgUmVzdHJpY3Rpb25zT3JkZXIge1xyXG4gIHJldHVybiAoXHJcbiAgICBpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pICYmXHJcbiAgICAnbWluRGVsaXZlcnlUaW1lSW5NaW51dGVzJyBpbiByZXN0cmljdGlvbiAmJlxyXG4gICAgJ3Bvc3NpYmxlVG9PcmRlckluTWludXRlcycgaW4gcmVzdHJpY3Rpb24gJiZcclxuICAgIGlzVmFsdWUocmVzdHJpY3Rpb24ubWluRGVsaXZlcnlUaW1lSW5NaW51dGVzKSAmJlxyXG4gICAgaXNWYWx1ZShyZXN0cmljdGlvbi5wb3NzaWJsZVRvT3JkZXJJbk1pbnV0ZXMpXHJcbiAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqINCa0LvQsNGB0YEsINGB0L7QtNC10YDQttCw0YnQuNC5INGB0YLQsNGC0LjRh9C10YHQutC40LUg0LzQtdGC0L7QtNGLLCDQvdC10L7QsdGF0L7QtNC40LzRi9C1INC00LvRjyDRgNCw0LHQvtGC0Ysg0YEg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9C80Lgg0YDQsNCx0L7Rh9C10LPQviDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gKiDQodC+0LfQtNCw0LLQsNGC0Ywg0L3QvtCy0YvQuSDRjdC60LfQtdC80L/Qu9GP0YAg0Y3RgtC+0LPQviDQutC70LDRgdGB0LAg0LTQu9GPINC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPINGB0YLQsNGC0LjRh9C10YHQutC40YUg0LzQtdGC0L7QtNC+0LIg0L3QtSDRgtGA0LXQsdGD0LXRgtGB0Y8uXHJcbiAqXHJcbiAqINCf0YDQuCDRjdGC0L7QvCDQv9GA0Lgg0YHQvtC30LTQsNC90LjQuCDRjdC60LfQtdC80L/Qu9GP0YDQsCDQutC70LDRgdGB0LAg0YMg0L7QsdGK0LXQutGC0LAg0YLQsNC60LbQtSDQsdGD0LTRg9GCINC00L7RgdGC0YPQv9C90Ysg0YHQvtCx0YHRgtCy0LXQvdC90YvQtSDRgNC10LDQu9C40LfQsNGG0LjQuFxyXG4gKiDQstGB0LXRhSDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyLlxyXG4gKiDQrdGC0Lgg0YDQtdCw0LvQuNC30LDRhtC40Lgg0L7RgtC70LjRh9Cw0Y7RgtGB0Y8g0L7RgiDQstGL0LfQvtCy0L7QsiDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyINGC0L7Qu9GM0LrQviDQvNC10LzQvtC40LfQsNGG0LjQtdC5INCy0YvQv9C+0LvQvdC10L3QvdGL0YUg0YDQsNGB0YfQtdGC0L7Qsi5cclxuICpcclxuICovXHJcbmV4cG9ydCBjbGFzcyBXb3JrVGltZVZhbGlkYXRvciB7XHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLCDQvdCwINC60L7RgtC+0YDRg9GOINC80L7QttC90L4g0LfQsNC60LDQt9Cw0YLRjCDQtNC+0YHRgtCw0LLQutGDLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcmV0dXJuINCh0YLRgNC+0LrQsCwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LDRjyDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LTQvtGB0YLRg9C/0L3Rg9GOINC00LDRgtGDINC00L7RgdGC0LDQstC60Lgg0LIg0YTQvtGA0LzQsNGC0LUgeXl5eS1NTS1kZC5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0TWF4T3JkZXJEYXRlKFxyXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxyXG4gICAgY3VycmVudGRhdGU6IERhdGVcclxuICApOiBzdHJpbmcge1xyXG4gICAgaWYgKFxyXG4gICAgICByZXN0cmljdGlvbiAmJlxyXG4gICAgICBpc1ZhbGlkUmVzdHJpY3Rpb25PcmRlcihyZXN0cmljdGlvbikgJiZcclxuICAgICAgaXNEYXRlKGN1cnJlbnRkYXRlKVxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBmb3JtYXREYXRlKFxyXG4gICAgICAgIGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIHJlc3RyaWN0aW9uLnBvc3NpYmxlVG9PcmRlckluTWludXRlcyAqIDYwMDAwLFxyXG4gICAgICAgICd5eXl5LU1NLWRkJyxcclxuICAgICAgICAnZW4nXHJcbiAgICAgICk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgaXNEYXRlKGN1cnJlbnRkYXRlKVxyXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnXHJcbiAgICAgICAgICA6ICFpc1ZhbHVlKHJlc3RyaWN0aW9uKVxyXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJ1xyXG4gICAgICAgICAgOiAn0J/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucydcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0YHRgtGA0L7QutCwINCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC1gKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAgLSDQstGA0LXQvNGPLlxyXG4gICAqIEByZXR1cm4g0LrQvtC7LdCy0L4g0LzQuNC90YPRgi5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0VGltZUZyb21TdHJpbmcodGltZTogVGltZVN0cmluZyk6IG51bWJlciB7XHJcbiAgICBpZiAoIWlzVmFsdWUodGltZSkpIHtcclxuICAgICAgdGhyb3cgJ9Cd0LUg0L/QtdGA0LXQtNCw0L3QsCDRgdGC0YDQvtC60LAg0YEg0L/RgNC10L7QsdGA0LDQt9GD0LXQvNGL0Lwg0LLRgNC10LzQtdC90LXQvCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSc7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZWdFeHAgPSBuZXcgUmVnRXhwKFxyXG4gICAgICAgIC9eKDAwfDAxfDAyfDAzfDA0fDA1fDA2fDA3fDA4fDA5fDEwfDExfDEyfDEzfDE0fDE1fDE2fDE3fDE4fDE5fDIwfDIxfDIyfDIzKSs6KFswLTVdXFxkKSsvXHJcbiAgICAgICk7XHJcbiAgICAgIGxldCBjaGVja2VkVGltZSA9IHRpbWUudHJpbSgpO1xyXG5cclxuICAgICAgaWYgKGNoZWNrZWRUaW1lLmluY2x1ZGVzKCcgJykgfHwgY2hlY2tlZFRpbWUuaW5jbHVkZXMoJ1QnKSkge1xyXG4gICAgICAgIGNoZWNrZWRUaW1lID0gY2hlY2tlZFRpbWUuc3BsaXQoXHJcbiAgICAgICAgICBjaGVja2VkVGltZS5pbmNsdWRlcygnICcpID8gJyAnIDogJ1QnXHJcbiAgICAgICAgKVsxXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHJlZ0V4cC50ZXN0KGNoZWNrZWRUaW1lKSkge1xyXG4gICAgICAgIHJldHVybiArY2hlY2tlZFRpbWUuc3BsaXQoJzonKVswXSAqIDYwICsgK2NoZWNrZWRUaW1lLnNwbGl0KCc6JylbMV07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgJ9Cf0LXRgNC10LTQsNC90L3QsNGPINGB0YLRgNC+0LrQsCDQvdC1INGB0L7QvtGC0LLQtdGC0YHRgtCy0YPQtdGCINGE0L7RgNC80LDRgtGDIEhIOm1tIC1gKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAnO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INC60L7QvdCy0LXRgNGC0LjRgNGD0LXRgiDQv9C10YDQtdC00LDQvdC90L7QtSDQutC+0Lst0LLQviDQvNC40L3Rg9GCINCyINGB0YLRgNC+0LrQvtCy0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLSBgKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAuXHJcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcclxuICAgKlxyXG4gICAqIGNvbnN0IGEgPSBjb252ZXJ0TWludXRlc1RvVGltZSg1MCkgLy8gYSA9ICcwMDo1MCdcclxuICAgKiBjb25zdCBiID0gY29udmVydE1pbnV0ZXNUb1RpbWUoMTIwMCkgLy8gYiA9ICcyMDowMCdcclxuICAgKlxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0KfQuNGB0LvQviDQsiDQtNC40LDQv9Cw0LfQvtC90LUg0L7RgiAwINC00L4gMTQ0MCAo0YLQsNC6INC60LDQuiDQvNCw0LrRgdC40LzRg9C8INCyIDEg0YHRg9GC0LrQsNGFID0gMTQ0MCDQvNC40L3Rg9GCKS5cclxuICAgKiDQn9GA0Lgg0L/QtdGA0LXQtNCw0YfQtSDQsiB0aW1lINC+0YLRgNC40YbQsNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjywg0LfQvdCw0Log0LHRg9C00LXRgiBcItC+0YLQvtCx0YDRiNC10L1cIiwg0LAg0LTQu9GPINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiwg0YDQsNGB0YHRh9C40YLQsNC90L3Ri9C5INC00LvRjyDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INC/0L7Qu9C+0LbQuNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjy5cclxuICAgKiDQldGB0LvQuCDQsiB0aW1lINCx0YPQtNC10YIg0L/QtdGA0LXQtNCw0L3QviDQt9C90LDRh9C10L3QuNC1INCx0L7Qu9GM0YjQtSAxNDQwIC0g0LzQtdGC0L7QtCDQstC10YDQvdC10YIg0YDQtdC30YPQu9GM0YLQsNGCINC00LvRjyDQt9C90LDRh9C10L3QuNGPINCx0LXQtyDRg9GH0LXRgtCwIFwi0L/RgNC10LLRi9GI0LDRjtGJ0LjRhSDRgdGD0YLQvtC6XCIgKNGCLtC1LiDRgSDQutGA0LDRgtC90YvQvCDQstGL0YfQtdGC0L7QvCAxNDQwINC80LjQvdGD0YIpXHJcbiAgICpcclxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxyXG4gICAqXHJcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDYwKSAvLyBhID0gJzAxOjAwJ1xyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxNTAwKSAvLyBiID0gJzAxOjAwJyAoMTQ0MCDQvNC40L3Rg9GCIFwi0YbQtdC70YvRhVwiINGB0YPRgtC+0Log0LHRi9C70LggXCLQvtGC0LHRgNC+0YjQtdC90YtcIilcclxuICAgKlxyXG4gICAqIEByZXR1cm5zXHJcbiAgICovXHJcbiAgc3RhdGljIGNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWU6IG51bWJlcik6IFRpbWVTdHJpbmcge1xyXG4gICAgaWYgKHRpbWUgPCAxNDQxKSB7XHJcbiAgICAgIGNvbnN0IGhvdXIgPSBNYXRoLmZsb29yKHRpbWUgLyA2MCk7XHJcbiAgICAgIGNvbnN0IGhvdXJTdHI6IEhvdXJzRGlnaXRzID0gPEhvdXJzRGlnaXRzPihcclxuICAgICAgICAoaG91ciA8PSA5ID8gYDAke1N0cmluZyhob3VyKX1gIDogU3RyaW5nKGhvdXIpKVxyXG4gICAgICApO1xyXG4gICAgICBjb25zdCBtaW51dGVzID0gU3RyaW5nKHRpbWUgLSBob3VyICogNjApO1xyXG4gICAgICBjb25zdCBtaW51dGVzU3RyOiBNaW51dGVEaWdpdHMgPSA8TWludXRlRGlnaXRzPihcclxuICAgICAgICBgJHttaW51dGVzLmxlbmd0aCA9PSAxID8gJzAnIDogJyd9JHttaW51dGVzfWBcclxuICAgICAgKTtcclxuICAgICAgcmV0dXJuIGAke2hvdXJTdHJ9OiR7bWludXRlc1N0cn1gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIFdvcmtUaW1lVmFsaWRhdG9yLmNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWUgLSAxNDQwKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0L/RgNC+0LLQtdGA0Y/QtdGCLCDQtNC+0YHRgtGD0L/QvdCwINC70Lgg0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4INC90LAg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y8uXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjywg0LTQu9GPINC60L7RgtC+0YDRi9GFINC4INC/0YDQvtCy0LXRgNGP0LXRgtGB0Y8g0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4XHJcbiAgICogQHJldHVybiDQntCx0YzQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOOlxyXG4gICAqIHtcclxuICAgICAgICBpc1dvcmtOb3c6Ym9vbGVhbiAtINCS0L7Qt9C80L7QttC90LAg0LvQuCDQtNC+0YHRgtCw0LLQutCwINCyINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPXHJcbiAgICAgICAgaXNOZXdEYXk6Ym9vbGVhbiAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQuNC30L3QsNC6LCDRh9GC0L4g0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINGH0LDRgdC+0LLRi9GFINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0LTQsNGC0YsgXCLQv9C10YDQtdC/0YDRi9Cz0L3Rg9C7XCIg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLlxyXG4gICAgICAgIGN1cnJlbnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQvtCy0LXRgNGP0LXQvNC+0LUg0LzQtdGC0L7QtNC+0Lwg0LLRgNC10LzRjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgICAgY3VyZW50RGF5U3RvcFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgIH1cclxuICAgKi9cclxuICBzdGF0aWMgaXNXb3JrTm93KFxyXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucyB8IFJlc3RyaWN0aW9uc09yZGVyLFxyXG4gICAgY3VycmVudGRhdGU6IERhdGUgPSBuZXcgRGF0ZSgpXHJcbiAgKTogVmFsaWRhdG9yUmVzdWx0IHtcclxuICAgIC8vINCV0YHQu9C4INC40YHQv9C+0LvRjNC90Y/QtdGC0YHRjyDQsiBOb2RlSlNcclxuICAgIGlmIChcclxuICAgICAgaXNWYWx1ZShyZXN0cmljdGlvbikgJiZcclxuICAgICAgIWlzVmFsdWUocmVzdHJpY3Rpb24udGltZXpvbmUpICYmXHJcbiAgICAgIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJ1xyXG4gICAgKSB7XHJcbiAgICAgIHJlc3RyaWN0aW9uLnRpbWV6b25lID1cclxuICAgICAgICBwcm9jZXNzPy5lbnY/LlRaID8/IEludGwuRGF0ZVRpbWVGb3JtYXQoKS5yZXNvbHZlZE9wdGlvbnMoKS50aW1lWm9uZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWlzVmFsdWUocmVzdHJpY3Rpb24pIHx8ICFpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAhaXNEYXRlKGN1cnJlbnRkYXRlKVxyXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnXHJcbiAgICAgICAgICA6ICFpc1ZhbHVlKHJlc3RyaWN0aW9uKVxyXG4gICAgICAgICAgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJ1xyXG4gICAgICAgICAgOiAn0J/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucydcclxuICAgICAgKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICAhaXNWYWx1ZShyZXN0cmljdGlvbi53b3JrdGltZSkgfHxcclxuICAgICAgICAhT2JqZWN0LmtleXMocmVzdHJpY3Rpb24ud29ya3RpbWUpLmxlbmd0aFxyXG4gICAgICApIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgd29ya05vdzogdHJ1ZSxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBjb21wYW55TG9jYWxUaW1lWm9uZSA9XHJcbiAgICAgICAgVGltZVpvbmVJZGVudGlmaWVyLmdldFRpbWVab25lR01UT2Zmc2V0ZnJvbU5hbWVab25lKFxyXG4gICAgICAgICAgcmVzdHJpY3Rpb24udGltZXpvbmVcclxuICAgICAgICApLnNwbGl0KCc6Jyk7XHJcbiAgICAgIGNvbnN0IGNvbXBhbnlMb2NhbFRpbWVab25lRGVsdGEgPVxyXG4gICAgICAgICtjb21wYW55TG9jYWxUaW1lWm9uZVswXSAqIDYwICsgK2NvbXBhbnlMb2NhbFRpbWVab25lWzFdO1xyXG4gICAgICBjb25zdCBsb2thbFRpbWVEZWx0YSA9XHJcbiAgICAgICAgY29tcGFueUxvY2FsVGltZVpvbmVEZWx0YSArIGN1cnJlbnRkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCk7IC8vINGB0LzQtdGJ0LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPINC+0YLQvdC+0YHQuNGC0LXQu9GM0L3QviDQstGA0LXQvNC10L3QuCDRgtC+0YDQs9C+0LLQvtC5INGC0L7Rh9C60LhcclxuICAgICAgY29uc3QgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA9XHJcbiAgICAgICAgV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoXHJcbiAgICAgICAgICA8VGltZVN0cmluZz5mb3JtYXREYXRlKGN1cnJlbnRkYXRlLCAnSEg6bW0nLCAnZW4nKVxyXG4gICAgICAgICkgKyBsb2thbFRpbWVEZWx0YTtcclxuICAgICAgLyoqXHJcbiAgICAgICAqINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0YEg0L3QsNGH0LDQu9CwINC00L3RjyAoNjAwID0gMTA6MDAuIDEyMDAgPSAyMDowMClcclxuICAgICAgICog0LXRgdC70Lgg0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0L/QtdGA0LXQv9GA0YvQs9C90YPQuyDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwsINGC0L4g0L/RgNC40LLQvtC00LjQvCDQstGA0LXQvNGPINC6INC/0YDQsNCy0LjQu9GM0L3QvtC80YMg0LfQvdCw0YfQtdC90LjRjiDQsiDQtNC40LDQv9Cw0LfQvtC90LUgMjQg0YfQsNGB0L7QslxyXG4gICAgICAgKiAqL1xyXG4gICAgICBjb25zdCBjdXJyZW50VGltZSA9XHJcbiAgICAgICAgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDBcclxuICAgICAgICAgID8gY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSAtIDE0NDBcclxuICAgICAgICAgIDogY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YTtcclxuXHJcbiAgICAgIGNvbnN0IGN1cnJlbnREYXlXb3JrVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldEN1cnJlbnRXb3JrVGltZShcclxuICAgICAgICByZXN0cmljdGlvbixcclxuICAgICAgICBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID4gMTQ0MFxyXG4gICAgICAgICAgPyBuZXcgRGF0ZShjdXJyZW50ZGF0ZS5nZXRUaW1lKCkgKyA4NjQwMDAwMClcclxuICAgICAgICAgIDogY3VycmVudGRhdGVcclxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0YDQsNCx0L7Rh9C10LUg0LLRgNC10LzRj1xyXG4gICAgICBjb25zdCBjdXJlbnREYXlTdGFydFRpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyhcclxuICAgICAgICA8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RhcnRcclxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YVcclxuICAgICAgY29uc3QgY3VyZW50RGF5U3RvcFRpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyhcclxuICAgICAgICA8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RvcFxyXG4gICAgICApOyAvLyDRgtC10LrRg9GJ0LXQtSDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHdvcmtOb3c6XHJcbiAgICAgICAgICBjdXJyZW50VGltZSA8IGN1cmVudERheVN0b3BUaW1lICYmIGN1cnJlbnRUaW1lID4gY3VyZW50RGF5U3RhcnRUaW1lLFxyXG4gICAgICAgIGlzTmV3RGF5OiBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID4gMTQ0MCxcclxuICAgICAgICBjdXJyZW50VGltZSxcclxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWUsXHJcbiAgICAgICAgY3VyZW50RGF5U3RvcFRpbWUsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQlNC+0YHRgtCw0LLQutCwINC60YPRgNGM0LXRgNC+0LxcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgc3RhdGljIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShcclxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlcixcclxuICAgIGN1cnJlbnRkYXRlOiBEYXRlXHJcbiAgKTogc3RyaW5nIHtcclxuICAgIGlmICghaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIocmVzdHJpY3Rpb24pKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcign0J3QtSDQv9C10YDQtdC00LDQvSDQuNC70Lgg0L/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGK0LXQutGCIHJlc3RyaWN0aW9ucycpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNoZWNrVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmlzV29ya05vdyhyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG5cclxuICAgIGlmIChjaGVja1RpbWUud29ya05vdyAmJiBjaGVja1RpbWUuY3VycmVudFRpbWUpIHtcclxuICAgICAgY29uc29sZS5sb2coJ9Ch0LXQudGH0LDRgSDRgNCw0LHQvtGH0LXQtSDQstGA0LXQvNGPLiDQoNCw0YHRh9C10YIg0L3QtSDRgtGA0LXQsdGD0LXRgtGB0Y8uJyk7XHJcbiAgICAgIGNvbnN0IHBvc3NpYmxlVGltZSA9XHJcbiAgICAgICAgY2hlY2tUaW1lLmN1cnJlbnRUaW1lICsgKCtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWVJbk1pbnV0ZXMgfHwgMCk7XHJcbiAgICAgIGNvbnN0IHBvc3NpYmxlVGltZVN0ciA9XHJcbiAgICAgICAgV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUocG9zc2libGVUaW1lKTtcclxuICAgICAgcmV0dXJuIGZvcm1hdERhdGUoY3VycmVudGRhdGUsIGB5eXl5LU1NLWRkICR7cG9zc2libGVUaW1lU3RyfWAsICdlbicpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGNoZWNrVGltZS5jdXJyZW50VGltZSAmJiBjaGVja1RpbWUuY3VyZW50RGF5U3RvcFRpbWUpIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50RGF5V29ya1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXHJcbiAgICAgICAgICByZXN0cmljdGlvbixcclxuICAgICAgICAgIGNoZWNrVGltZS5pc05ld0RheVxyXG4gICAgICAgICAgICA/IG5ldyBEYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKVxyXG4gICAgICAgICAgICA6IGN1cnJlbnRkYXRlXHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zdCB0aW1lID1cclxuICAgICAgICAgIHRoaXMuZ2V0VGltZUZyb21TdHJpbmcoPFRpbWVTdHJpbmc+Y3VycmVudERheVdvcmtUaW1lLnN0YXJ0KSArXHJcbiAgICAgICAgICArcmVzdHJpY3Rpb24ubWluRGVsaXZlcnlUaW1lSW5NaW51dGVzO1xyXG4gICAgICAgIGNvbnN0IHRpbWVTdHJpbmcgPSBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lKTtcclxuICAgICAgICByZXR1cm4gZm9ybWF0RGF0ZShcclxuICAgICAgICAgIGNoZWNrVGltZS5pc05ld0RheSB8fFxyXG4gICAgICAgICAgICBjaGVja1RpbWUuY3VycmVudFRpbWUgPiBjaGVja1RpbWUuY3VyZW50RGF5U3RvcFRpbWVcclxuICAgICAgICAgICAgPyBjdXJyZW50ZGF0ZS5nZXRUaW1lKCkgKyA4NjQwMDAwMFxyXG4gICAgICAgICAgICA6IGN1cnJlbnRkYXRlLFxyXG4gICAgICAgICAgYHl5eXktTU0tZGQgJHt0aW1lU3RyaW5nfWAsXHJcbiAgICAgICAgICAnZW4nXHJcbiAgICAgICAgKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyAn0J3QtSDRg9C00LDQu9C+0YHRjCDRgNCw0YHRgdGH0LjRgtCw0YLRjCBjdXJyZW50VGltZSDQuCBjdXJlbnREYXlTdG9wVGltZS4nO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQodCw0LzQvtCy0YvQstC+0LdcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgc3RhdGljIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKFxyXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxyXG4gICAgY3VycmVudGRhdGU6IERhdGVcclxuICApOiBzdHJpbmcge1xyXG4gICAgaWYgKCFpc1ZhbGlkUmVzdHJpY3Rpb25PcmRlcihyZXN0cmljdGlvbikpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCfQndC1INC/0LXRgNC10LTQsNC9INC40LvQuCDQv9C10YDQtdC00LDQvSDQvdC10LLQsNC70LjQtNC90YvQuSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDQlNC70Y8g0L7QsdC10YHQv9C10YfQtdC90LjRjyDQuNC80LzRg9GC0LDQsdC10LvRjNC90L7RgdGC0Lgg0LTQsNC90L3Ri9GFINGB0L7Qt9C00LDQtdGC0YHRjyDQvdC+0LLRi9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMsINC40LTQtdC90YLQuNGH0L3Ri9C5INC/0L7Qu9GD0YfQtdC90L3QvtC80YMg0LIg0L/QsNGA0LDQvNC10YLRgNCw0YUsINC90L4g0YEg0LjQt9C80LXQvdC10L3QvdGL0Lwg0LzQsNGB0YHQuNCy0L7QvCB3b3JrdGltZS5cclxuICAgICAqINCSINC80LDRgdGB0LjQstC1IHdvcmt0aW1lINC+0LHQvdC+0LLQu9GP0Y7RgtGB0Y8g0L7Qs9GA0LDQvdC40YfQtdC90LjRjyDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0YEg0L7QsdGL0YfQvdGL0YUg0L3QsCDQsNC60YLRg9Cw0LvRjNC90YvQtSDQtNC70Y8g0YHQsNC80L7QstGL0LLQvtC30LAuXHJcbiAgICAgKiAqL1xyXG4gICAgY29uc3QgbmV3UmVzdHJpY3Rpb24gPSB7XHJcbiAgICAgIC4uLnJlc3RyaWN0aW9uLFxyXG4gICAgICB3b3JrdGltZTogKDxXb3JrVGltZVtdPnJlc3RyaWN0aW9uLndvcmt0aW1lKS5tYXAoKHdvcmt0aW1lKSA9PlxyXG4gICAgICAgIHdvcmt0aW1lLnNlbGZTZXJ2aWNlXHJcbiAgICAgICAgICA/IHsgLi4ud29ya3RpbWUsIC4uLndvcmt0aW1lLnNlbGZTZXJ2aWNlIH1cclxuICAgICAgICAgIDogd29ya3RpbWVcclxuICAgICAgKSxcclxuICAgIH07XHJcbiAgICByZXR1cm4gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKFxyXG4gICAgICBuZXdSZXN0cmljdGlvbixcclxuICAgICAgY3VycmVudGRhdGVcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCw0LrRgtGD0LDQu9GM0L3Ri9C1INC00LDQvdC90YvQtSDQviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0LjQtyDQvNCw0YHRgdC40LLQsCDQstGB0LXRhSDQstCw0YDQuNCw0L3RgtC+0LIg0L7QsdGM0LXQutGC0LAgcmVzdHJpY3Rpb24uXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRDdXJyZW50V29ya1RpbWUoXHJcbiAgICByZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zLFxyXG4gICAgY3VycmVudGRhdGU6IERhdGVcclxuICApOiBXb3JrVGltZSB7XHJcbiAgICBpZiAoIWlzVmFsaWRSZXN0cmljdGlvbihyZXN0cmljdGlvbikpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCfQndC1INC/0LXRgNC10LTQsNC9INC40LvQuCDQv9C10YDQtdC00LDQvSDQvdC10LLQsNC70LjQtNC90YvQuSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJyk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGkgPSAwO1xyXG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XHJcblxyXG4gICAgd2hpbGUgKGkgPCByZXN0cmljdGlvbi53b3JrdGltZS5sZW5ndGggJiYgIWlzVmFsdWUocmVzdWx0KSkge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgcmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrID09PSAnYWxsJyB8fFxyXG4gICAgICAgICh0eXBlb2YgcmVzdHJpY3Rpb24ud29ya3RpbWVbaV0uZGF5T2ZXZWVrID09PSAnc3RyaW5nJ1xyXG4gICAgICAgICAgPyAoPHN0cmluZz5yZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWspLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgIDogKDxzdHJpbmdbXT5yZXN0cmljdGlvbi53b3JrdGltZVtpXS5kYXlPZldlZWspLm1hcCgoZGF5KSA9PlxyXG4gICAgICAgICAgICAgIGRheS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApLmluY2x1ZGVzKGZvcm1hdERhdGUoY3VycmVudGRhdGUsICdFRUVFJywgJ2VuJykudG9Mb3dlckNhc2UoKSlcclxuICAgICAgKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gcmVzdHJpY3Rpb24ud29ya3RpbWVbaV07XHJcbiAgICAgIH1cclxuICAgICAgaSArPSAxO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghaXNWYWx1ZShyZXN1bHQpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcign0J3QtdGCINCw0LrRgtGD0LDQu9GM0L3QvtCz0L4g0YDQsNGB0L/QuNGB0LDQvdC40Y8g0YDQsNCx0L7RgtGLINC00LvRjyDRgtC10LrRg9GJ0LXQs9C+INC00L3RjycpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCb0L7Qs9C40LrQsCDQvdC40LbQtSDQv9GA0LXQtNC90LDQt9C90LDRh9C10L3QsCDQtNC70Y8g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8g0Y3QutC30LXQvNC/0LvRj9GA0LAg0LrQu9Cw0YHRgdCwIFdvcmtUaW1lVmFsaWRhdG9yXHJcbiAgICovXHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge31cclxuXHJcbiAgcHJpdmF0ZSBfbWVtb3J5OiB7XHJcbiAgICBnZXRNYXhPcmRlckRhdGU6IE1hcDxzdHJpbmcsIHN0cmluZz47XHJcbiAgICBnZXRUaW1lRnJvbVN0cmluZzogTWFwPHN0cmluZywgbnVtYmVyPjtcclxuICAgIGlzV29ya05vdzogTWFwPHN0cmluZywgVmFsaWRhdG9yUmVzdWx0PjtcclxuICAgIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZTogTWFwPHN0cmluZywgc3RyaW5nPjtcclxuICAgIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xyXG4gICAgZ2V0Q3VycmVudFdvcmtUaW1lOiBNYXA8c3RyaW5nLCBXb3JrVGltZT47XHJcbiAgICBjb252ZXJ0TWludXRlc1RvVGltZTogTWFwPHN0cmluZywgVGltZVN0cmluZz47XHJcbiAgfSA9IHtcclxuICAgIGdldE1heE9yZGVyRGF0ZTogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKSxcclxuICAgIGdldFRpbWVGcm9tU3RyaW5nOiBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpLFxyXG4gICAgaXNXb3JrTm93OiBuZXcgTWFwPHN0cmluZywgVmFsaWRhdG9yUmVzdWx0PigpLFxyXG4gICAgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxyXG4gICAgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXHJcbiAgICBnZXRDdXJyZW50V29ya1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBXb3JrVGltZT4oKSxcclxuICAgIGNvbnZlcnRNaW51dGVzVG9UaW1lOiBuZXcgTWFwPHN0cmluZywgVGltZVN0cmluZz4oKSxcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMsINC90LAg0LrQvtGC0L7RgNGD0Y4g0LzQvtC20L3QviDQt9Cw0LrQsNC30LDRgtGMINC00L7RgdGC0LDQstC60YMuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEByZXR1cm4gOnN0cmluZyAtINCh0YLRgNC+0LrQsCwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LDRjyDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LTQvtGB0YLRg9C/0L3Rg9GOINC00LDRgtGDINC00L7RgdGC0LDQstC60Lgg0LIg0YTQvtGA0LzQsNGC0LUgeXl5eS1NTS1kZC5cclxuICAgKi9cclxuICBnZXRNYXhPcmRlckRhdGUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmdldE1heE9yZGVyRGF0ZS5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRNYXhPcmRlckRhdGUoXHJcbiAgICAgICAgcmVzdHJpY3Rpb24sXHJcbiAgICAgICAgY3VycmVudGRhdGVcclxuICAgICAgKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldE1heE9yZGVyRGF0ZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDRgdGH0LjRgtCw0LXRgiwg0YHQutC+0LvRjNC60L4g0LzQuNC90YPRgiDQvtGCINC90LDRh9Cw0LvQsCDQtNC90Y8gKDAwOjAwKSDQv9GA0L7RiNC70L4g0LTQu9GPINC/0LXRgNC10LTQsNC90L3QvtCz0L4g0LLRgNC10LzQtdC90LguXHJcbiAgICogQHBhcmFtIHRpbWUgLSDRgdGC0YDQvtC60LAg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0gLSDQstGA0LXQvNGPLlxyXG4gICAqIEByZXR1cm4gOm51bWJlciAtINC60L7Quy3QstC+INC80LjQvdGD0YIuXHJcbiAgICovXHJcbiAgZ2V0VGltZUZyb21TdHJpbmcodGltZTogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgdGltZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmdldFRpbWVGcm9tU3RyaW5nLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKDxUaW1lU3RyaW5nPnRpbWUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0VGltZUZyb21TdHJpbmcuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQv9GA0L7QstC10YDRj9C10YIsINC00L7RgdGC0YPQv9C90LAg0LvQuCDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60Lgg0L3QsCDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRjy5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPLCDQtNC70Y8g0LrQvtGC0L7RgNGL0YUg0Lgg0L/RgNC+0LLQtdGA0Y/QtdGC0YHRjyDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60LhcclxuICAgKiBAcmV0dXJuINCe0LHRjNC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y46XHJcbiAgICoge1xyXG4gICAgICAgIGlzV29ya05vdzpib29sZWFuIC0g0JLQvtC30LzQvtC20L3QsCDQu9C4INC00L7RgdGC0LDQstC60LAg0LIg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y9cclxuICAgICAgICBpc05ld0RheTpib29sZWFuIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC40LfQvdCw0LosINGH0YLQviDQuNC3LdC30LAg0YDQsNC30L3QuNGG0Ysg0YfQsNGB0L7QstGL0YUg0L/QvtGP0YHQvtCyINGA0LDRgdGH0LXRgiDQtNCw0YLRiyBcItC/0LXRgNC10L/RgNGL0LPQvdGD0LtcIiDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwuXHJcbiAgICAgICAgY3VycmVudFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC+0LLQtdGA0Y/QtdC80L7QtSDQvNC10YLQvtC00L7QvCDQstGA0LXQvNGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICAgIGN1cmVudERheVN0YXJ0VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgfVxyXG4gICAqL1xyXG4gIGlzV29ya05vdyhcclxuICAgIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMgfCBSZXN0cmljdGlvbnNPcmRlcixcclxuICAgIGN1cnJlbnRkYXRlPzogRGF0ZVxyXG4gICk6IFZhbGlkYXRvclJlc3VsdCB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmlzV29ya05vdy5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5pc1dvcmtOb3cocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmlzV29ya05vdy5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH1cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQlNC+0YHRgtCw0LLQutCwINC60YPRgNGM0LXRgNC+0LxcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKFxyXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxyXG4gICAgY3VycmVudGRhdGU6IERhdGVcclxuICApOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKFxyXG4gICAgICAgIHJlc3RyaWN0aW9uLFxyXG4gICAgICAgIGN1cnJlbnRkYXRlXHJcbiAgICAgICk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0KHQsNC80L7QstGL0LLQvtC3XCIuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKFxyXG4gICAgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLFxyXG4gICAgY3VycmVudGRhdGU6IERhdGVcclxuICApOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZS5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZShcclxuICAgICAgICByZXN0cmljdGlvbixcclxuICAgICAgICBjdXJyZW50ZGF0ZVxyXG4gICAgICApO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsNC60YLRg9Cw0LvRjNC90YvQtSDQtNCw0L3QvdGL0LUg0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC40Lcg0LzQsNGB0YHQuNCy0LAg0LLRgdC10YUg0LLQsNGA0LjQsNC90YLQvtCyINC+0LHRjNC10LrRgtCwIHJlc3RyaWN0aW9uLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBnZXRDdXJyZW50V29ya1RpbWUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9ucywgY3VycmVudGRhdGU6IERhdGUpOiBXb3JrVGltZSB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmdldEN1cnJlbnRXb3JrVGltZS5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gPFdvcmtUaW1lPmNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxyXG4gICAgICAgIHJlc3RyaWN0aW9uLFxyXG4gICAgICAgIGN1cnJlbnRkYXRlXHJcbiAgICAgICk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRDdXJyZW50V29ya1RpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LrQvtC90LLQtdGA0YLQuNGA0YPQtdGCINC/0LXRgNC10LTQsNC90L3QvtC1INC60L7Quy3QstC+INC80LjQvdGD0YIg0LIg0YHRgtGA0L7QutC+0LLQtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGA0LXQvNC10L3QuCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtIGAoMDAtMjQg0YfQsNGB0LApOigwLTU5INC80LjQvdGD0YIpYC5cclxuICAgKiDQndCw0L/RgNC40LzQtdGAOlxyXG4gICAqXHJcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDUwKSAvLyBhID0gJzAwOjUwJ1xyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxMjAwKSAvLyBiID0gJzIwOjAwJ1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHRpbWUgLSDQp9C40YHQu9C+INCyINC00LjQsNC/0LDQt9C+0L3QtSDQvtGCIDAg0LTQviAxNDQwICjRgtCw0Log0LrQsNC6INC80LDQutGB0LjQvNGD0Lwg0LIgMSDRgdGD0YLQutCw0YUgPSAxNDQwINC80LjQvdGD0YIpLlxyXG4gICAqINCf0YDQuCDQv9C10YDQtdC00LDRh9C1INCyIHRpbWUg0L7RgtGA0LjRhtCw0YLQtdC70YzQvdC+0LPQviDQt9C90LDRh9C10L3QuNGPLCDQt9C90LDQuiDQsdGD0LTQtdGCIFwi0L7RgtC+0LHRgNGI0LXQvVwiLCDQsCDQtNC70Y8g0LzQtdGC0L7QtCDQstC10YDQvdC10YIg0YDQtdC30YPQu9GM0YLQsNGCLCDRgNCw0YHRgdGH0LjRgtCw0L3QvdGL0Lkg0LTQu9GPINC/0L7Qu9GD0YfQtdC90L3QvtCz0L4g0L/QvtC70L7QttC40YLQtdC70YzQvdC+0LPQviDQt9C90LDRh9C10L3QuNGPLlxyXG4gICAqINCV0YHQu9C4INCyIHRpbWUg0LHRg9C00LXRgiDQv9C10YDQtdC00LDQvdC+INC30L3QsNGH0LXQvdC40LUg0LHQvtC70YzRiNC1IDE0NDAgLSDQvNC10YLQvtC0INCy0LXRgNC90LXRgiDRgNC10LfRg9C70YzRgtCw0YIg0LTQu9GPINC30L3QsNGH0LXQvdC40Y8g0LHQtdC3INGD0YfQtdGC0LAgXCLQv9GA0LXQstGL0YjQsNGO0YnQuNGFINGB0YPRgtC+0LpcIiAo0YIu0LUuINGBINC60YDQsNGC0L3Ri9C8INCy0YvRh9C10YLQvtC8IDE0NDAg0LzQuNC90YPRgilcclxuICAgKlxyXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XHJcbiAgICpcclxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNjApIC8vIGEgPSAnMDE6MDAnXHJcbiAgICogY29uc3QgYiA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDE1MDApIC8vIGIgPSAnMDE6MDAnICgxNDQwINC80LjQvdGD0YIgXCLRhtC10LvRi9GFXCIg0YHRg9GC0L7QuiDQsdGL0LvQuCBcItC+0YLQsdGA0L7RiNC10L3Ri1wiKVxyXG4gICAqXHJcbiAgICogQHJldHVybnNcclxuICAgKi9cclxuICBjb252ZXJ0TWludXRlc1RvVGltZSh0aW1lOiBudW1iZXIpOiBUaW1lU3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgdGltZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmNvbnZlcnRNaW51dGVzVG9UaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuY29udmVydE1pbnV0ZXNUb1RpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19