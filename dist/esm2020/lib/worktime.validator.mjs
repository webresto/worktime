import { formatDate, isDate } from './formatDate';
import { TimeZoneIdentifier } from './tz';
/**
 * Функция валидации переданного объекта restriction на соответствие интерфейсу Restrictions
 * @param restriction - проверяемый объект, содержащий информацию о рабочем времени и временной зоне.
 */
function isValidRestriction(restriction) {
    return 'timezone' in restriction && 'workTime' in restriction;
}
/**
 * Функция валидации переданного объекта restriction на соответствие минимальным данным для заказа
 * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
 */
function isValidRestrictionOrder(restriction) {
    return 'minDeliveryTime' in restriction && 'periodPossibleForOrder' in restriction && 'timezone' in restriction && 'workTime' in restriction;
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
    static getMaxOrderDate(restriction, currentdate) {
        if (restriction && isValidRestrictionOrder(restriction) && isDate(currentdate)) {
            return formatDate(currentdate.getTime() + restriction.periodPossibleForOrder * 60000, 'yyyy-MM-dd', 'en');
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
        if (!restriction.workTime || !Object.keys(restriction.workTime).length) {
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
            const possibleTime = checkTime.currentTime + (+restriction.minDeliveryTime || 0);
            const possibleTimeStr = WorkTimeValidator.convertMinutesToTime(possibleTime);
            return formatDate(currentdate, `yyyy-MM-dd ${possibleTimeStr}`, 'en');
        }
        else {
            if (checkTime.currentTime && checkTime.curentDayStopTime) {
                const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, checkTime.isNewDay ? new Date(currentdate.getTime() + 86400000) : currentdate);
                const time = this.getTimeFromString(currentDayWorkTime.start) + (+restriction.minDeliveryTime);
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
         * Для обеспечения иммутабельности данных создается новый обьект restrictions, идентичный полученному в параметрах, но с измененным массивом workTime.
         * В массиве workTime обновляются ограничения времени работы с обычных на актуальные для самовывоза.
         * */
        const newRestriction = {
            ...restriction, workTime: restriction.workTime.map(workTime => workTime.selfService ? ({ ...workTime, ...workTime.selfService }) : workTime)
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
        while (i < restriction.workTime.length && !result) {
            if (restriction.workTime[i].dayOfWeek === 'all' || (typeof restriction.workTime[i].dayOfWeek === 'string' ?
                restriction.workTime[i].dayOfWeek.toLowerCase() :
                restriction.workTime[i].dayOfWeek.map(day => day.toLowerCase())).includes(formatDate(currentdate, 'EEEE', 'en').toLowerCase())) {
                result = restriction.workTime[i];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sTUFBTSxDQUFDO0FBd0UxQzs7O0dBR0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLFdBQWdCO0lBRTFDLE9BQU8sVUFBVSxJQUFJLFdBQVcsSUFBSSxVQUFVLElBQUksV0FBVyxDQUFDO0FBRWhFLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHVCQUF1QixDQUFDLFdBQThCO0lBRTdELE9BQU8saUJBQWlCLElBQUksV0FBVyxJQUFJLHdCQUF3QixJQUFJLFdBQVcsSUFBSSxVQUFVLElBQUksV0FBVyxJQUFJLFVBQVUsSUFBSSxXQUFXLENBQUM7QUFFL0ksQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQThPNUI7O01BRUU7SUFFRjtRQUVRLFlBQU8sR0FRWDtZQUNBLGVBQWUsRUFBRSxJQUFJLEdBQUcsRUFBa0I7WUFDMUMsaUJBQWlCLEVBQUUsSUFBSSxHQUFHLEVBQWtCO1lBQzVDLFNBQVMsRUFBRSxJQUFJLEdBQUcsRUFBMkI7WUFDN0MsaUNBQWlDLEVBQUUsSUFBSSxHQUFHLEVBQWtCO1lBQzVELG1DQUFtQyxFQUFFLElBQUksR0FBRyxFQUFrQjtZQUM5RCxrQkFBa0IsRUFBRSxJQUFJLEdBQUcsRUFBb0I7WUFDL0Msb0JBQW9CLEVBQUUsSUFBSSxHQUFHLEVBQXNCO1NBQ3BELENBQUM7SUFsQlksQ0FBQztJQWpQakI7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBOEIsRUFBRSxXQUFpQjtRQUN0RSxJQUFJLFdBQVcsSUFBSSx1QkFBdUIsQ0FBQyxXQUFX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QUMsSUFBWTtRQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMzQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNyRSxJQUFJLFdBQVcsRUFBRTtZQUNmLE9BQU8sV0FBVyxDQUFDO1NBQ3BCO2FBQU07WUFDTCxNQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1RCxJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekQsT0FBTyxNQUFNLENBQUM7U0FDZjtJQUNILENBQUM7Q0FFRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZvcm1hdERhdGUsIGlzRGF0ZSB9IGZyb20gJy4vZm9ybWF0RGF0ZSc7XHJcbmltcG9ydCB7IFRpbWVab25lSWRlbnRpZmllciB9IGZyb20gJy4vdHonO1xyXG5cclxuLyoqXHJcbiAqINCR0LDQt9C+0LLRi9C1INC00LDQvdC90YvQtSDQviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0YsgLSDRgdC70YPQttC10LHQvdGL0Lkg0LjQvdGC0LXRgNGE0LXQudGBLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBXb3JrVGltZUJhc2Uge1xyXG4gIC8qKiDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyovXHJcbiAgc3RhcnQ6IHN0cmluZztcclxuXHJcbiAgLyoqINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPKi9cclxuICBzdG9wOiBzdHJpbmc7XHJcblxyXG4gIC8qKiDQv9C10YDQtdGA0YvQsiDQvdCwINC+0LHQtdC0Ki9cclxuICBicmVhaz86IHN0cmluZztcclxufVxyXG5cclxuLyoqXHJcbiAqINCY0L3RhNC+0YDQvNCw0YbQuNGPINC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPIC0g0YHQu9GD0LbQtdCx0L3Ri9C5INC40L3RgtC10YDRhNC10LnRgS5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgV29ya1RpbWUgZXh0ZW5kcyBXb3JrVGltZUJhc2Uge1xyXG4gIC8qKiDQtNC10L3RjCDQvdC10LTQtdC70LgsINC6INC60L7RgtC+0YDQvtC80YMg0L/RgNC40LzQtdC90Y/QtdGC0YHRjyDRjdGC0L4g0LLRgNC10LzRjyDQtNC+0YHRgtCw0LLQutC4ICAgKi9cclxuICBkYXlPZldlZWs6IHN0cmluZyB8IHN0cmluZ1tdO1xyXG5cclxuICAvKiog0L7Qs9GA0LDQvdC40YfQtdC90LjRjyDQv9C+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQtNC70Y8g0YHQsNC80L7QstGL0LLQvtC30LAgKi9cclxuICBzZWxmU2VydmljZT86IFdvcmtUaW1lQmFzZTtcclxufVxyXG5cclxuLyoqXHJcbiAqINCY0L3RgtC10YDRhNC10LnRgSDQvtCx0YrQtdC60YLQsCwg0L/QvtC70YPRh9Cw0LXQvNC+0LPQviDQvtGCIEFQSSBAd2VicmVzdG8vY29yZSDQuCDRgdC+0LTQtdGA0LbQsNGJ0LXQs9C+INGC0LXQutGD0YnQuNC1INC00LDQvdC90YvQtSDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFJlc3RyaWN0aW9ucyB7XHJcbiAgLyoqINCy0YDQtdC80LXQvdC90LDRjyDQt9C+0L3QsCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPICovXHJcbiAgdGltZXpvbmU/OiBzdHJpbmc7XHJcblxyXG4gIC8qKiAg0LzQsNGB0YHQuNCyINC+0LPRgNCw0L3QuNGH0LXQvdC40Lkg0L/QviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQtNC70Y8g0YDQsNC30L3Ri9GFINC00L3QtdC5INC90LXQtNC10LvQuC4gKi9cclxuICB3b3JrVGltZTogV29ya1RpbWVbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZXN0cmljdGlvbnNPcmRlciBleHRlbmRzIFJlc3RyaWN0aW9ucyB7XHJcbiAgLyoqINC80LjQvdC40LzQsNC70YzQvdC+0LUg0LLRgNC10LzRjyDQtNC+0YHRgtCw0LLQutC4Ki9cclxuICBtaW5EZWxpdmVyeVRpbWU6IHN0cmluZztcclxuXHJcbiAgLyoqINC+0LPRgNCw0L3QuNGH0LXQvdC40LUg0LzQsNC60YHQuNC80LDQu9GM0L3QvtC5INC00LDRgtGLINC30LDQutCw0LfQsCDQsiDQsdGD0LTRg9GJ0LXQvCAo0LIg0LzQuNC90YPRgtCw0YUpKi9cclxuICBwZXJpb2RQb3NzaWJsZUZvck9yZGVyOiBudW1iZXI7XHJcblxyXG4gIC8qKtGD0YHRgtCw0L3QvtCy0LvQtdC90L4g0LvQuCDQvdCwINGC0LXQutGD0YnQuNC5INC80L7QvNC10L3RgiDQvtCz0YDQsNC90LjRh9C10L3QuNC1INC00L7RgdGC0LDQstC60Lgg0L3QsCDQvtC/0YDQtdC00LXQu9C10L3QvdC+0LUg0LLRgNC10LzRjyAqL1xyXG4gIGRlbGl2ZXJ5VG9UaW1lRW5hYmxlZD86IGJvb2xlYW47XHJcblxyXG4gIC8qKiDQlNC+0L/QvtC70L3QuNGC0LXQu9GM0L3Ri9C5INC60L7QvNC80LXQvdGC0LDRgNC40Lkg0L/QviDQtNC+0YHRgtCw0LLQutC1ICovXHJcbiAgZGVsaXZlcnlEZXNjcmlwdGlvbj86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0b3JSZXN1bHQge1xyXG4gIHdvcmtOb3c6IGJvb2xlYW4sXHJcbiAgaXNOZXdEYXk/OiBib29sZWFuLFxyXG4gIGN1cnJlbnRUaW1lPzogbnVtYmVyLFxyXG4gIGN1cmVudERheVN0YXJ0VGltZT86IG51bWJlcixcclxuICBjdXJlbnREYXlTdG9wVGltZT86IG51bWJlclxyXG59XHJcblxyXG4vKiog0KLQuNC/LCDQvtC/0LjRgdGL0LLQsNGO0YnQuNC5INGB0YLRgNC+0LrQvtCy0L7QtSDQv9GA0LXQtNGB0YLQsNCy0LvQtdC90LjQtSDQstGB0LXRhSDRhtC40YTRgCAqL1xyXG50eXBlIERpZ2l0cyA9ICcwJyB8ICcxJyB8ICcyJyB8ICczJyB8ICc0JyB8ICc1JyB8ICc2JyB8ICc3JyB8ICc4JyB8ICc5JztcclxuXHJcbi8qKiDQotC40L8sINC+0L/QuNGB0YvQstCw0Y7RidC40Lkg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1IDI0INGH0LDRgdC+0LIg0L7QtNC90LjRhSDRgdGD0YLQvtC6ICovXHJcbmV4cG9ydCB0eXBlIEhvdXJzRGlnaXRzID0gJzAwJyB8ICcwMScgfCAnMDInIHwgJzAzJyB8ICcwNCcgfCAnMDUnIHwgJzA2JyB8ICcwNycgfCAnMDgnIHwgJzA5JyB8ICcxMCcgfCAnMTEnIHwgJzEyJyB8ICcxMycgfCAnMTQnIHwgJzE1JyB8ICcxNicgfCAnMTcnIHwgJzE4JyB8ICcxOScgfCAnMjAnIHwgJzIxJyB8ICcyMicgfCAnMjMnO1xyXG5cclxuLyoqINCi0LjQvywg0L7Qv9C40YHRi9Cy0LDRjtGJ0LjQuSDRgdGC0YDQvtC60L7QstC+0LUg0L/RgNC10LTRgdGC0LDQstC70LXQvdC40LUgNjAg0LzQuNC90YPRgiDQvtC00L3QvtCz0L4g0YfQsNGB0LAqL1xyXG5leHBvcnQgdHlwZSBNaW51dGVEaWdpdHMgPSBgJHsnMCcgfCAnMScgfCAnMicgfCAnMycgfCAnNCcgfCAnNSd9JHtEaWdpdHN9YDtcclxuXHJcbi8qKiDQotC40L8sINC+0L/QuNGB0YvQstCw0Y7RidC40Lkg0YHRgtGA0L7QutC+0LLQvtC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YDQtdC80LXQvdC4INCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC1gKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAgKi9cclxuZXhwb3J0IHR5cGUgVGltZVN0cmluZyA9IGAke0hvdXJzRGlnaXRzfToke01pbnV0ZURpZ2l0c31gO1xyXG5cclxuLyoqXHJcbiAqINCk0YPQvdC60YbQuNGPINCy0LDQu9C40LTQsNGG0LjQuCDQv9C10YDQtdC00LDQvdC90L7Qs9C+INC+0LHRitC10LrRgtCwIHJlc3RyaWN0aW9uINC90LAg0YHQvtC+0YLQstC10YLRgdGC0LLQuNC1INC40L3RgtC10YDRhNC10LnRgdGDIFJlc3RyaWN0aW9uc1xyXG4gKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQv9GA0L7QstC10YDRj9C10LzRi9C5INC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0Lgg0LLRgNC10LzQtdC90L3QvtC5INC30L7QvdC1LlxyXG4gKi9cclxuZnVuY3Rpb24gaXNWYWxpZFJlc3RyaWN0aW9uKHJlc3RyaWN0aW9uOiBhbnkpOiByZXN0cmljdGlvbiBpcyBSZXN0cmljdGlvbnMge1xyXG5cclxuICByZXR1cm4gJ3RpbWV6b25lJyBpbiByZXN0cmljdGlvbiAmJiAnd29ya1RpbWUnIGluIHJlc3RyaWN0aW9uO1xyXG5cclxufVxyXG5cclxuLyoqXHJcbiAqINCk0YPQvdC60YbQuNGPINCy0LDQu9C40LTQsNGG0LjQuCDQv9C10YDQtdC00LDQvdC90L7Qs9C+INC+0LHRitC10LrRgtCwIHJlc3RyaWN0aW9uINC90LAg0YHQvtC+0YLQstC10YLRgdGC0LLQuNC1INC80LjQvdC40LzQsNC70YzQvdGL0Lwg0LTQsNC90L3Ri9C8INC00LvRjyDQt9Cw0LrQsNC30LBcclxuICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gKi9cclxuZnVuY3Rpb24gaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyKTogcmVzdHJpY3Rpb24gaXMgUmVzdHJpY3Rpb25zT3JkZXIge1xyXG5cclxuICByZXR1cm4gJ21pbkRlbGl2ZXJ5VGltZScgaW4gcmVzdHJpY3Rpb24gJiYgJ3BlcmlvZFBvc3NpYmxlRm9yT3JkZXInIGluIHJlc3RyaWN0aW9uICYmICd0aW1lem9uZScgaW4gcmVzdHJpY3Rpb24gJiYgJ3dvcmtUaW1lJyBpbiByZXN0cmljdGlvbjtcclxuXHJcbn1cclxuXHJcbi8qKlxyXG4gKiDQmtC70LDRgdGBLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDRgdGC0LDRgtC40YfQtdGB0LrQuNC1INC80LXRgtC+0LTRiywg0L3QtdC+0LHRhdC+0LTQuNC80YvQtSDQtNC70Y8g0YDQsNCx0L7RgtGLINGBINC+0LPRgNCw0L3QuNGH0LXQvdC40Y/QvNC4INGA0LDQsdC+0YfQtdCz0L4g0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICog0KHQvtC30LTQsNCy0LDRgtGMINC90L7QstGL0Lkg0Y3QutC30LXQvNC/0LvRj9GAINGN0YLQvtCz0L4g0LrQu9Cw0YHRgdCwINC00LvRjyDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjyDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyINC90LUg0YLRgNC10LHRg9C10YLRgdGPLlxyXG4gKiBcclxuICog0J/RgNC4INGN0YLQvtC8INC/0YDQuCDRgdC+0LfQtNCw0L3QuNC4INGN0LrQt9C10LzQv9C70Y/RgNCwINC60LvQsNGB0YHQsCDRgyDQvtCx0YrQtdC60YLQsCDRgtCw0LrQttC1INCx0YPQtNGD0YIg0LTQvtGB0YLRg9C/0L3RiyDRgdC+0LHRgdGC0LLQtdC90L3Ri9C1INGA0LXQsNC70LjQt9Cw0YbQuNC4IFxyXG4gKiDQstGB0LXRhSDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyLlxyXG4gKiDQrdGC0Lgg0YDQtdCw0LvQuNC30LDRhtC40Lgg0L7RgtC70LjRh9Cw0Y7RgtGB0Y8g0L7RgiDQstGL0LfQvtCy0L7QsiDRgdGC0LDRgtC40YfQtdGB0LrQuNGFINC80LXRgtC+0LTQvtCyINGC0L7Qu9GM0LrQviDQvNC10LzQvtC40LfQsNGG0LjQtdC5INCy0YvQv9C+0LvQvdC10L3QvdGL0YUg0YDQsNGB0YfQtdGC0L7Qsi5cclxuICogXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgV29ya1RpbWVWYWxpZGF0b3Ige1xyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgywg0L3QsCDQutC+0YLQvtGA0YPRjiDQvNC+0LbQvdC+INC30LDQutCw0LfQsNGC0Ywg0LTQvtGB0YLQsNCy0LrRgy5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHJldHVybiA6c3RyaW5nIC0g0KHRgtGA0L7QutCwLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQsNGPINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQtNC+0YHRgtGD0L/QvdGD0Y4g0LTQsNGC0YMg0LTQvtGB0YLQsNCy0LrQuCDQsiDRhNC+0YDQvNCw0YLQtSB5eXl5LU1NLWRkLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRNYXhPcmRlckRhdGUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IHN0cmluZyB7XHJcbiAgICBpZiAocmVzdHJpY3Rpb24gJiYgaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIocmVzdHJpY3Rpb24pICYmIGlzRGF0ZShjdXJyZW50ZGF0ZSkpIHtcclxuXHJcbiAgICAgIHJldHVybiBmb3JtYXREYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIHJlc3RyaWN0aW9uLnBlcmlvZFBvc3NpYmxlRm9yT3JkZXIgKiA2MDAwMCwgJ3l5eXktTU0tZGQnLCAnZW4nKTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgIGlzRGF0ZShjdXJyZW50ZGF0ZSkgP1xyXG4gICAgICAgICAgJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0LrQvtGA0YDQtdC60YLQvdGL0Lkg0L7QsdGK0LXQutGCINC00LDRgtGLJyA6XHJcbiAgICAgICAgICAhcmVzdHJpY3Rpb24gPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQvtCx0YrQtdC60YIgcmVzdHJpY3Rpb25zJyA6XHJcbiAgICAgICAgICAgICfQn9C10YDQtdC00LDQvSDQvdC10LLQsNC70LjQtNC90YvQuSDQvtCx0YzQtdC60YIgcmVzdHJpY3Rpb25zJ1xyXG4gICAgICApO1xyXG5cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0YHRgtGA0L7QutCwINCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC1gKDAwLTI0INGH0LDRgdCwKTooMC01OSDQvNC40L3Rg9GCKWAgLSDQstGA0LXQvNGPLlxyXG4gICAqIEByZXR1cm4g0LrQvtC7LdCy0L4g0LzQuNC90YPRgi5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0VGltZUZyb21TdHJpbmcodGltZTogVGltZVN0cmluZyk6IG51bWJlciB7XHJcbiAgICBpZiAoIXRpbWUpIHtcclxuXHJcbiAgICAgIHRocm93ICfQndC1INC/0LXRgNC10LTQsNC90LAg0YHRgtGA0L7QutCwINGBINC/0YDQtdC+0LHRgNCw0LfRg9C10LzRi9C8INCy0YDQtdC80LXQvdC10Lwg0LIg0YTQvtGA0LzQsNGC0LUgSEg6bW0nO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICBjb25zdCByZWdFeHAgPSBuZXcgUmVnRXhwKC9eKDAwfDAxfDAyfDAzfDA0fDA1fDA2fDA3fDA4fDA5fDEwfDExfDEyfDEzfDE0fDE1fDE2fDE3fDE4fDE5fDIwfDIxfDIyfDIzKSs6KFswLTVdXFxkKSsvKTtcclxuXHJcbiAgICAgIGlmIChyZWdFeHAudGVzdCh0aW1lKSkge1xyXG5cclxuICAgICAgICBsZXQgY2hlY2tlZFRpbWUgPSB0aW1lLnRyaW0oKTtcclxuICAgICAgICBpZiAoY2hlY2tlZFRpbWUuaW5jbHVkZXMoJyAnKSB8fCBjaGVja2VkVGltZS5pbmNsdWRlcygnVCcpKSB7XHJcblxyXG4gICAgICAgICAgY2hlY2tlZFRpbWUgPSBjaGVja2VkVGltZS5zcGxpdChjaGVja2VkVGltZS5pbmNsdWRlcygnICcpID8gJyAnIDogJ1QnKVsxXTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gKCtjaGVja2VkVGltZS5zcGxpdCgnOicpWzBdKSAqIDYwICsgKCtjaGVja2VkVGltZS5zcGxpdCgnOicpWzFdKTtcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIHRocm93ICfQn9C10YDQtdC00LDQvdC90LDRjyDRgdGC0YDQvtC60LAg0L3QtSDRgdC+0L7RgtCy0LXRgtGB0YLQstGD0LXRgiDRhNC+0YDQvNCw0YLRgyBISDptbSAtYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgJ1xyXG5cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQutC+0L3QstC10YDRgtC40YDRg9C10YIg0L/QtdGA0LXQtNCw0L3QvdC+0LUg0LrQvtC7LdCy0L4g0LzQuNC90YPRgiDQsiDRgdGC0YDQvtC60L7QstC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YDQtdC80LXQvdC4INCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0gYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgLlxyXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XHJcbiAgICogXHJcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDUwKSAvLyBhID0gJzAwOjUwJ1xyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxMjAwKSAvLyBiID0gJzIwOjAwJ1xyXG4gICAqIFxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0KfQuNGB0LvQviDQsiDQtNC40LDQv9Cw0LfQvtC90LUg0L7RgiAwINC00L4gMTQ0MCAo0YLQsNC6INC60LDQuiDQvNCw0LrRgdC40LzRg9C8INCyIDEg0YHRg9GC0LrQsNGFID0gMTQ0MCDQvNC40L3Rg9GCKS5cclxuICAgKiDQn9GA0Lgg0L/QtdGA0LXQtNCw0YfQtSDQsiB0aW1lINC+0YLRgNC40YbQsNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjywg0LfQvdCw0Log0LHRg9C00LXRgiBcItC+0YLQvtCx0YDRiNC10L1cIiwg0LAg0LTQu9GPINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiwg0YDQsNGB0YHRh9C40YLQsNC90L3Ri9C5INC00LvRjyDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INC/0L7Qu9C+0LbQuNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjy5cclxuICAgKiDQldGB0LvQuCDQsiB0aW1lINCx0YPQtNC10YIg0L/QtdGA0LXQtNCw0L3QviDQt9C90LDRh9C10L3QuNC1INCx0L7Qu9GM0YjQtSAxNDQwIC0g0LzQtdGC0L7QtCDQstC10YDQvdC10YIg0YDQtdC30YPQu9GM0YLQsNGCINC00LvRjyDQt9C90LDRh9C10L3QuNGPINCx0LXQtyDRg9GH0LXRgtCwIFwi0L/RgNC10LLRi9GI0LDRjtGJ0LjRhSDRgdGD0YLQvtC6XCIgKNGCLtC1LiDRgSDQutGA0LDRgtC90YvQvCDQstGL0YfQtdGC0L7QvCAxNDQwINC80LjQvdGD0YIpXHJcbiAgICogXHJcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcclxuICAgKiBcclxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNjApIC8vIGEgPSAnMDE6MDAnIFxyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxNTAwKSAvLyBiID0gJzAxOjAwJyAoMTQ0MCDQvNC40L3Rg9GCIFwi0YbQtdC70YvRhVwiINGB0YPRgtC+0Log0LHRi9C70LggXCLQvtGC0LHRgNC+0YjQtdC90YtcIilcclxuICAgKiBcclxuICAgKiBAcmV0dXJucyBcclxuICAgKi9cclxuICBzdGF0aWMgY29udmVydE1pbnV0ZXNUb1RpbWUodGltZTogbnVtYmVyKTogVGltZVN0cmluZyB7XHJcblxyXG4gICAgaWYgKHRpbWUgPCAxNDQxKSB7XHJcblxyXG4gICAgICBjb25zdCBob3VyID0gTWF0aC5mbG9vcih0aW1lIC8gNjApO1xyXG4gICAgICBjb25zdCBob3VyU3RyOiBIb3Vyc0RpZ2l0cyA9IDxIb3Vyc0RpZ2l0cz4oaG91ciA8PSA5ID8gYDAke1N0cmluZyhob3VyKX1gIDogU3RyaW5nKGhvdXIpKTtcclxuICAgICAgY29uc3QgbWludXRlc1N0cjogTWludXRlRGlnaXRzID0gPE1pbnV0ZURpZ2l0cz5TdHJpbmcodGltZSAtIChob3VyICogNjApKTtcclxuICAgICAgcmV0dXJuIGAke2hvdXJTdHJ9OiR7bWludXRlc1N0cn1gO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICByZXR1cm4gV29ya1RpbWVWYWxpZGF0b3IuY29udmVydE1pbnV0ZXNUb1RpbWUodGltZSAtIDE0NDApO1xyXG5cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0L/RgNC+0LLQtdGA0Y/QtdGCLCDQtNC+0YHRgtGD0L/QvdCwINC70Lgg0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4INC90LAg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y8uXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjywg0LTQu9GPINC60L7RgtC+0YDRi9GFINC4INC/0YDQvtCy0LXRgNGP0LXRgtGB0Y8g0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4XHJcbiAgICogQHJldHVybiDQntCx0YzQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOOlxyXG4gICAqIHtcclxuICAgICAgICBpc1dvcmtOb3c6Ym9vbGVhbiAtINCS0L7Qt9C80L7QttC90LAg0LvQuCDQtNC+0YHRgtCw0LLQutCwINCyINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPXHJcbiAgICAgICAgaXNOZXdEYXk6Ym9vbGVhbiAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQuNC30L3QsNC6LCDRh9GC0L4g0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINGH0LDRgdC+0LLRi9GFINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0LTQsNGC0YsgXCLQv9C10YDQtdC/0YDRi9Cz0L3Rg9C7XCIg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLlxyXG4gICAgICAgIGN1cnJlbnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQvtCy0LXRgNGP0LXQvNC+0LUg0LzQtdGC0L7QtNC+0Lwg0LLRgNC10LzRjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgICAgY3VyZW50RGF5U3RvcFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgIH1cclxuICAgKi9cclxuICBzdGF0aWMgaXNXb3JrTm93KHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMgfCBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUgPSBuZXcgRGF0ZSgpKTogVmFsaWRhdG9yUmVzdWx0IHtcclxuXHJcbiAgICBpZiAoIXJlc3RyaWN0aW9uLndvcmtUaW1lIHx8ICFPYmplY3Qua2V5cyhyZXN0cmljdGlvbi53b3JrVGltZSkubGVuZ3RoKSB7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHdvcmtOb3c6IHRydWVcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyDQldGB0LvQuCDQuNGB0L/QvtC70YzQvdGP0LXRgtGB0Y8g0LIgTm9kZUpTXHJcbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICFyZXN0cmljdGlvbi50aW1lem9uZSkge1xyXG5cclxuICAgICAgcmVzdHJpY3Rpb24udGltZXpvbmUgPSBwcm9jZXNzLmVudi5UWiA/IHByb2Nlc3MuZW52LlRaIDogSW50bC5EYXRlVGltZUZvcm1hdCgpLnJlc29sdmVkT3B0aW9ucygpLnRpbWVab25lXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoIXJlc3RyaWN0aW9uIHx8ICFpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pKSB7XHJcblxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgIWlzRGF0ZShjdXJyZW50ZGF0ZSkgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnIDpcclxuICAgICAgICAgICFyZXN0cmljdGlvbiA/ICfQndC1INC/0LXRgNC10LTQsNC9INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnXHJcbiAgICAgICAgICAgIDogJ9Cf0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMnKTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgY29uc3QgY29tcGFueUxvY2FsVGltZVpvbmUgPSBUaW1lWm9uZUlkZW50aWZpZXIuZ2V0VGltZVpvbmVHTVRPZmZzZXRmcm9tTmFtZVpvbmUocmVzdHJpY3Rpb24udGltZXpvbmUpLnNwbGl0KCc6Jyk7XHJcbiAgICAgIGNvbnN0IGNvbXBhbnlMb2NhbFRpbWVab25lRGVsdGEgPSArY29tcGFueUxvY2FsVGltZVpvbmVbMF0gKiA2MCArICgrKGNvbXBhbnlMb2NhbFRpbWVab25lWzFdKSk7XHJcbiAgICAgIGNvbnN0IGxva2FsVGltZURlbHRhID0gY29tcGFueUxvY2FsVGltZVpvbmVEZWx0YSArIGN1cnJlbnRkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCk7IC8vINGB0LzQtdGJ0LXQvdC40LUg0LLRgNC10LzQtdC90Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPINC+0YLQvdC+0YHQuNGC0LXQu9GM0L3QviDQstGA0LXQvNC10L3QuCDRgtC+0YDQs9C+0LLQvtC5INGC0L7Rh9C60LhcclxuICAgICAgY29uc3QgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKFxyXG4gICAgICAgIDxUaW1lU3RyaW5nPmZvcm1hdERhdGUoY3VycmVudGRhdGUsICdISDptbScsICdlbicpXHJcbiAgICAgICkgKyBsb2thbFRpbWVEZWx0YTtcclxuICAgICAgLyoqXHJcbiAgICAgICAqINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0YEg0L3QsNGH0LDQu9CwINC00L3RjyAoNjAwID0gMTA6MDAuIDEyMDAgPSAyMDowMClcclxuICAgICAgICog0LXRgdC70Lgg0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0L/QtdGA0LXQv9GA0YvQs9C90YPQuyDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwsINGC0L4g0L/RgNC40LLQvtC00LjQvCDQstGA0LXQvNGPINC6INC/0YDQsNCy0LjQu9GM0L3QvtC80YMg0LfQvdCw0YfQtdC90LjRjiDQsiDQtNC40LDQv9Cw0LfQvtC90LUgMjQg0YfQsNGB0L7QslxyXG4gICAgICAgKiAqL1xyXG4gICAgICBjb25zdCBjdXJyZW50VGltZSA9IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwID8gY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSAtIDE0NDAgOiBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhO1xyXG5cclxuICAgICAgY29uc3QgY3VycmVudERheVdvcmtUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0Q3VycmVudFdvcmtUaW1lKFxyXG4gICAgICAgIHJlc3RyaWN0aW9uLFxyXG4gICAgICAgIGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwID8gbmV3IERhdGUoY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDApIDogY3VycmVudGRhdGVcclxuICAgICAgKTsgLy8g0YLQtdC60YPRidC10LUg0YDQsNCx0L7Rh9C10LUg0LLRgNC10LzRj1xyXG4gICAgICBjb25zdCBjdXJlbnREYXlTdGFydFRpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyg8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RhcnQpOyAvLyDRgtC10LrRg9GJ0LXQtSDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhVxyXG4gICAgICBjb25zdCBjdXJlbnREYXlTdG9wVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKDxUaW1lU3RyaW5nPmN1cnJlbnREYXlXb3JrVGltZS5zdG9wKTsgLy8g0YLQtdC60YPRidC10LUg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YVcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB3b3JrTm93OiBjdXJyZW50VGltZSA8IGN1cmVudERheVN0b3BUaW1lICYmIGN1cnJlbnRUaW1lID4gY3VyZW50RGF5U3RhcnRUaW1lLFxyXG4gICAgICAgIGlzTmV3RGF5OiBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID4gMTQ0MCxcclxuICAgICAgICBjdXJyZW50VGltZSxcclxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWUsXHJcbiAgICAgICAgY3VyZW50RGF5U3RvcFRpbWVcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCU0L7RgdGC0LDQstC60LAg0LrRg9GA0YzQtdGA0L7QvFwiLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY2hlY2tUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuaXNXb3JrTm93KHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcblxyXG4gICAgaWYgKGNoZWNrVGltZS53b3JrTm93ICYmIGNoZWNrVGltZS5jdXJyZW50VGltZSkge1xyXG5cclxuICAgICAgY29uc29sZS5sb2coJ9Ch0LXQudGH0LDRgSDRgNCw0LHQvtGH0LXQtSDQstGA0LXQvNGPLiDQoNCw0YHRh9C10YIg0L3QtSDRgtGA0LXQsdGD0LXRgtGB0Y8uJyk7XHJcbiAgICAgIGNvbnN0IHBvc3NpYmxlVGltZSA9IGNoZWNrVGltZS5jdXJyZW50VGltZSArICgrcmVzdHJpY3Rpb24ubWluRGVsaXZlcnlUaW1lIHx8IDApO1xyXG4gICAgICBjb25zdCBwb3NzaWJsZVRpbWVTdHIgPSBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZShwb3NzaWJsZVRpbWUpO1xyXG4gICAgICByZXR1cm4gZm9ybWF0RGF0ZShjdXJyZW50ZGF0ZSwgYHl5eXktTU0tZGQgJHtwb3NzaWJsZVRpbWVTdHJ9YCwgJ2VuJylcclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICBpZiAoY2hlY2tUaW1lLmN1cnJlbnRUaW1lICYmIGNoZWNrVGltZS5jdXJlbnREYXlTdG9wVGltZSkge1xyXG5cclxuICAgICAgICBjb25zdCBjdXJyZW50RGF5V29ya1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXHJcbiAgICAgICAgICByZXN0cmljdGlvbixcclxuICAgICAgICAgIGNoZWNrVGltZS5pc05ld0RheSA/IG5ldyBEYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKSA6IGN1cnJlbnRkYXRlXHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zdCB0aW1lID0gdGhpcy5nZXRUaW1lRnJvbVN0cmluZyg8VGltZVN0cmluZz5jdXJyZW50RGF5V29ya1RpbWUuc3RhcnQpICsgKCtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWUpO1xyXG4gICAgICAgIGNvbnN0IHRpbWVTdHJpbmcgPSBXb3JrVGltZVZhbGlkYXRvci5jb252ZXJ0TWludXRlc1RvVGltZSh0aW1lKTtcclxuICAgICAgICByZXR1cm4gZm9ybWF0RGF0ZShcclxuICAgICAgICAgIGNoZWNrVGltZS5pc05ld0RheSB8fCBjaGVja1RpbWUuY3VycmVudFRpbWUgPiBjaGVja1RpbWUuY3VyZW50RGF5U3RvcFRpbWUgPyAoY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDApIDogY3VycmVudGRhdGUsXHJcbiAgICAgICAgICBgeXl5eS1NTS1kZCAke3RpbWVTdHJpbmd9YCxcclxuICAgICAgICAgICdlbicpO1xyXG5cclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgdGhyb3cgJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0YDQsNGB0YHRh9C40YLQsNGC0YwgY3VycmVudFRpbWUg0LggY3VyZW50RGF5U3RvcFRpbWUuJztcclxuXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQodCw0LzQvtCy0YvQstC+0LdcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgc3RhdGljIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgLyoqXHJcbiAgICAgKiDQlNC70Y8g0L7QsdC10YHQv9C10YfQtdC90LjRjyDQuNC80LzRg9GC0LDQsdC10LvRjNC90L7RgdGC0Lgg0LTQsNC90L3Ri9GFINGB0L7Qt9C00LDQtdGC0YHRjyDQvdC+0LLRi9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMsINC40LTQtdC90YLQuNGH0L3Ri9C5INC/0L7Qu9GD0YfQtdC90L3QvtC80YMg0LIg0L/QsNGA0LDQvNC10YLRgNCw0YUsINC90L4g0YEg0LjQt9C80LXQvdC10L3QvdGL0Lwg0LzQsNGB0YHQuNCy0L7QvCB3b3JrVGltZS5cclxuICAgICAqINCSINC80LDRgdGB0LjQstC1IHdvcmtUaW1lINC+0LHQvdC+0LLQu9GP0Y7RgtGB0Y8g0L7Qs9GA0LDQvdC40YfQtdC90LjRjyDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0YEg0L7QsdGL0YfQvdGL0YUg0L3QsCDQsNC60YLRg9Cw0LvRjNC90YvQtSDQtNC70Y8g0YHQsNC80L7QstGL0LLQvtC30LAuXHJcbiAgICAgKiAqL1xyXG4gICAgY29uc3QgbmV3UmVzdHJpY3Rpb24gPSB7XHJcbiAgICAgIC4uLnJlc3RyaWN0aW9uLCB3b3JrVGltZTogKDxXb3JrVGltZVtdPnJlc3RyaWN0aW9uLndvcmtUaW1lKS5tYXAod29ya1RpbWUgPT4gd29ya1RpbWUuc2VsZlNlcnZpY2UgPyAoeyAuLi53b3JrVGltZSwgLi4ud29ya1RpbWUuc2VsZlNlcnZpY2UgfSkgOiB3b3JrVGltZSlcclxuICAgIH07XHJcbiAgICByZXR1cm4gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKG5ld1Jlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQuNC3INC80LDRgdGB0LjQstCwINCy0YHQtdGFINCy0LDRgNC40LDQvdGC0L7QsiDQvtCx0YzQtdC60YLQsCByZXN0cmljdGlvbi5cclxuICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICovXHJcbiAgc3RhdGljIGdldEN1cnJlbnRXb3JrVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IFdvcmtUaW1lIHtcclxuICAgIGxldCBpID0gMDtcclxuICAgIGxldCByZXN1bHQgPSBudWxsO1xyXG4gICAgd2hpbGUgKGkgPCByZXN0cmljdGlvbi53b3JrVGltZS5sZW5ndGggJiYgIXJlc3VsdCkge1xyXG4gICAgICBpZiAocmVzdHJpY3Rpb24ud29ya1RpbWVbaV0uZGF5T2ZXZWVrID09PSAnYWxsJyB8fCAoXHJcbiAgICAgICAgdHlwZW9mIHJlc3RyaWN0aW9uLndvcmtUaW1lW2ldLmRheU9mV2VlayA9PT0gJ3N0cmluZycgP1xyXG4gICAgICAgICAgKDxzdHJpbmc+cmVzdHJpY3Rpb24ud29ya1RpbWVbaV0uZGF5T2ZXZWVrKS50b0xvd2VyQ2FzZSgpIDpcclxuICAgICAgICAgICg8c3RyaW5nW10+cmVzdHJpY3Rpb24ud29ya1RpbWVbaV0uZGF5T2ZXZWVrKS5tYXAoZGF5ID0+IGRheS50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICApLmluY2x1ZGVzKGZvcm1hdERhdGUoY3VycmVudGRhdGUsICdFRUVFJywgJ2VuJykudG9Mb3dlckNhc2UoKSkpIHtcclxuICAgICAgICByZXN1bHQgPSByZXN0cmljdGlvbi53b3JrVGltZVtpXTtcclxuICAgICAgfVxyXG4gICAgICBpICs9IDE7XHJcbiAgICB9XHJcbiAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ9Cd0LXRgiDQsNC60YLRg9Cw0LvRjNC90L7Qs9C+INGA0LDRgdC/0LjRgdCw0L3QuNGPINGA0LDQsdC+0YLRiyDQtNC70Y8g0YLQtdC60YPRidC10LPQviDQtNC90Y8nKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAqINCb0L7Qs9C40LrQsCDQvdC40LbQtSDQv9GA0LXQtNC90LDQt9C90LDRh9C10L3QsCDQtNC70Y8g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8g0Y3QutC30LXQvNC/0LvRj9GA0LAg0LrQu9Cw0YHRgdCwIFdvcmtUaW1lVmFsaWRhdG9yIFxyXG4gICovXHJcblxyXG4gIGNvbnN0cnVjdG9yKCkgeyB9XHJcblxyXG4gIHByaXZhdGUgX21lbW9yeToge1xyXG4gICAgZ2V0TWF4T3JkZXJEYXRlOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xyXG4gICAgZ2V0VGltZUZyb21TdHJpbmc6IE1hcDxzdHJpbmcsIG51bWJlcj47XHJcbiAgICBpc1dvcmtOb3c6IE1hcDxzdHJpbmcsIFZhbGlkYXRvclJlc3VsdD47XHJcbiAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IE1hcDxzdHJpbmcsIHN0cmluZz47XHJcbiAgICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZTogTWFwPHN0cmluZywgc3RyaW5nPjtcclxuICAgIGdldEN1cnJlbnRXb3JrVGltZTogTWFwPHN0cmluZywgV29ya1RpbWU+O1xyXG4gICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IE1hcDxzdHJpbmcsIFRpbWVTdHJpbmc+XHJcbiAgfSA9IHtcclxuICAgICAgZ2V0TWF4T3JkZXJEYXRlOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxyXG4gICAgICBnZXRUaW1lRnJvbVN0cmluZzogbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKSxcclxuICAgICAgaXNXb3JrTm93OiBuZXcgTWFwPHN0cmluZywgVmFsaWRhdG9yUmVzdWx0PigpLFxyXG4gICAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXHJcbiAgICAgIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxyXG4gICAgICBnZXRDdXJyZW50V29ya1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBXb3JrVGltZT4oKSxcclxuICAgICAgY29udmVydE1pbnV0ZXNUb1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBUaW1lU3RyaW5nPigpXHJcbiAgICB9O1xyXG5cclxuICAvKipcclxuICAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLCDQvdCwINC60L7RgtC+0YDRg9GOINC80L7QttC90L4g0LfQsNC60LDQt9Cw0YLRjCDQtNC+0YHRgtCw0LLQutGDLlxyXG4gICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICAqIEByZXR1cm4gOnN0cmluZyAtINCh0YLRgNC+0LrQsCwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LDRjyDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LTQvtGB0YLRg9C/0L3Rg9GOINC00LDRgtGDINC00L7RgdGC0LDQstC60Lgg0LIg0YTQvtGA0LzQsNGC0LUgeXl5eS1NTS1kZC5cclxuICAgICovXHJcbiAgZ2V0TWF4T3JkZXJEYXRlKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRNYXhPcmRlckRhdGUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0TWF4T3JkZXJEYXRlKHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRNYXhPcmRlckRhdGUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0YHRgtGA0L7QutCwINCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0g0LLRgNC10LzRjy5cclxuICAgKiBAcmV0dXJuIDpudW1iZXIgLSDQutC+0Lst0LLQviDQvNC40L3Rg9GCLlxyXG4gICAqL1xyXG4gIGdldFRpbWVGcm9tU3RyaW5nKHRpbWU6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHRpbWUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRUaW1lRnJvbVN0cmluZy5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyg8VGltZVN0cmluZz50aW1lKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldFRpbWVGcm9tU3RyaW5nLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INC/0YDQvtCy0LXRgNGP0LXRgiwg0LTQvtGB0YLRg9C/0L3QsCDQu9C4INCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuCDQvdCwINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8sINC00LvRjyDQutC+0YLQvtGA0YvRhSDQuCDQv9GA0L7QstC10YDRj9C10YLRgdGPINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0LTQvtGB0YLQsNCy0LrQuFxyXG4gICAqIEByZXR1cm4g0J7QsdGM0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjjpcclxuICAgKiB7XHJcbiAgICAgICAgaXNXb3JrTm93OmJvb2xlYW4gLSDQktC+0LfQvNC+0LbQvdCwINC70Lgg0LTQvtGB0YLQsNCy0LrQsCDQsiDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRj1xyXG4gICAgICAgIGlzTmV3RGF5OmJvb2xlYW4gLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0LjQt9C90LDQuiwg0YfRgtC+INC40Lct0LfQsCDRgNCw0LfQvdC40YbRiyDRh9Cw0YHQvtCy0YvRhSDQv9C+0Y/RgdC+0LIg0YDQsNGB0YfQtdGCINC00LDRgtGLIFwi0L/QtdGA0LXQv9GA0YvQs9C90YPQu1wiINC90LAg0L3QvtCy0YvQuSDQtNC10L3RjC5cclxuICAgICAgICBjdXJyZW50VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQv9GA0L7QstC10YDRj9C10LzQvtC1INC80LXRgtC+0LTQvtC8INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgICAgY3VyZW50RGF5U3RhcnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICAgIGN1cmVudERheVN0b3BUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINCy0YDQtdC80Y8g0L7QutC+0L3Rh9Cw0L3QuNGPINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICB9XHJcbiAgICovXHJcbiAgaXNXb3JrTm93KHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMgfCBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU/OiBEYXRlKTogVmFsaWRhdG9yUmVzdWx0IHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuaXNXb3JrTm93LmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmlzV29ya05vdyhyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuaXNXb3JrTm93LnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQlNC+0YHRgtCw0LLQutCwINC60YPRgNGM0LXRgNC+0LxcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lKHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9O1xyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCh0LDQvNC+0LLRi9Cy0L7Qt1wiLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBnZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LDQutGC0YPQsNC70YzQvdGL0LUg0LTQsNC90L3Ri9C1INC+INCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDQuNC3INC80LDRgdGB0LjQstCwINCy0YHQtdGFINCy0LDRgNC40LDQvdGC0L7QsiDQvtCx0YzQtdC60YLQsCByZXN0cmljdGlvbi5cclxuICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICovXHJcbiAgZ2V0Q3VycmVudFdvcmtUaW1lKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMsIGN1cnJlbnRkYXRlOiBEYXRlKTogV29ya1RpbWUge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyByZXN0cmljdGlvbiwgY3VycmVudGRhdGUgfSk7XHJcbiAgICBjb25zdCBjaGVja01lbW9yeSA9IHRoaXMuX21lbW9yeS5nZXRDdXJyZW50V29ya1RpbWUuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIDxXb3JrVGltZT5jaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldEN1cnJlbnRXb3JrVGltZShyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0Q3VycmVudFdvcmtUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQutC+0L3QstC10YDRgtC40YDRg9C10YIg0L/QtdGA0LXQtNCw0L3QvdC+0LUg0LrQvtC7LdCy0L4g0LzQuNC90YPRgiDQsiDRgdGC0YDQvtC60L7QstC1INC/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INCy0YDQtdC80LXQvdC4INCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0gYCgwMC0yNCDRh9Cw0YHQsCk6KDAtNTkg0LzQuNC90YPRgilgLlxyXG4gICAqINCd0LDQv9GA0LjQvNC10YA6XHJcbiAgICogXHJcbiAgICogY29uc3QgYSA9IGNvbnZlcnRNaW51dGVzVG9UaW1lKDUwKSAvLyBhID0gJzAwOjUwJ1xyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxMjAwKSAvLyBiID0gJzIwOjAwJ1xyXG4gICAqIFxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0KfQuNGB0LvQviDQsiDQtNC40LDQv9Cw0LfQvtC90LUg0L7RgiAwINC00L4gMTQ0MCAo0YLQsNC6INC60LDQuiDQvNCw0LrRgdC40LzRg9C8INCyIDEg0YHRg9GC0LrQsNGFID0gMTQ0MCDQvNC40L3Rg9GCKS5cclxuICAgKiDQn9GA0Lgg0L/QtdGA0LXQtNCw0YfQtSDQsiB0aW1lINC+0YLRgNC40YbQsNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjywg0LfQvdCw0Log0LHRg9C00LXRgiBcItC+0YLQvtCx0YDRiNC10L1cIiwg0LAg0LTQu9GPINC80LXRgtC+0LQg0LLQtdGA0L3QtdGCINGA0LXQt9GD0LvRjNGC0LDRgiwg0YDQsNGB0YHRh9C40YLQsNC90L3Ri9C5INC00LvRjyDQv9C+0LvRg9GH0LXQvdC90L7Qs9C+INC/0L7Qu9C+0LbQuNGC0LXQu9GM0L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjy5cclxuICAgKiDQldGB0LvQuCDQsiB0aW1lINCx0YPQtNC10YIg0L/QtdGA0LXQtNCw0L3QviDQt9C90LDRh9C10L3QuNC1INCx0L7Qu9GM0YjQtSAxNDQwIC0g0LzQtdGC0L7QtCDQstC10YDQvdC10YIg0YDQtdC30YPQu9GM0YLQsNGCINC00LvRjyDQt9C90LDRh9C10L3QuNGPINCx0LXQtyDRg9GH0LXRgtCwIFwi0L/RgNC10LLRi9GI0LDRjtGJ0LjRhSDRgdGD0YLQvtC6XCIgKNGCLtC1LiDRgSDQutGA0LDRgtC90YvQvCDQstGL0YfQtdGC0L7QvCAxNDQwINC80LjQvdGD0YIpXHJcbiAgICogXHJcbiAgICog0J3QsNC/0YDQuNC80LXRgDpcclxuICAgKiBcclxuICAgKiBjb25zdCBhID0gY29udmVydE1pbnV0ZXNUb1RpbWUoNjApIC8vIGEgPSAnMDE6MDAnIFxyXG4gICAqIGNvbnN0IGIgPSBjb252ZXJ0TWludXRlc1RvVGltZSgxNTAwKSAvLyBiID0gJzAxOjAwJyAoMTQ0MCDQvNC40L3Rg9GCIFwi0YbQtdC70YvRhVwiINGB0YPRgtC+0Log0LHRi9C70LggXCLQvtGC0LHRgNC+0YjQtdC90YtcIilcclxuICAgKiBcclxuICAgKiBAcmV0dXJucyBcclxuICAgKi9cclxuICBjb252ZXJ0TWludXRlc1RvVGltZSh0aW1lOiBudW1iZXIpOiBUaW1lU3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgdGltZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmNvbnZlcnRNaW51dGVzVG9UaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmNvbnZlcnRNaW51dGVzVG9UaW1lKHRpbWUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuY29udmVydE1pbnV0ZXNUb1RpbWUuc2V0KG1lbW9yeUtleSwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcbiJdfQ==