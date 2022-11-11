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
            getCurrentWorkTime: new Map()
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
     * @param time - строка в формате HH:mm - время.
     * @return :number - кол-во минут.
     */
    static getTimeFromString(time) {
        if (!time) {
            throw new Error('Не передана строка с преобразуемым временем в формате HH:mm');
        }
        else {
            let checkedTime = time.trim();
            if (checkedTime.includes(' ') || checkedTime.includes('T')) {
                checkedTime = checkedTime.split(checkedTime.includes(' ') ? ' ' : 'T')[1];
            }
            return (+checkedTime.split(':')[0]) * 60 + (+checkedTime.split(':')[1]);
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
            const currentTime = currentTimeInMinutesWithLocalDelta > 1440 ? currentTimeInMinutesWithLocalDelta - 1440 : currentTimeInMinutesWithLocalDelta;
            /**
             * текущее время в минутах с начала дня (600 = 10:00. 1200 = 20:00)
             * если из-за разницы поясов расчет перепрыгнул на новый день, то приводим время к правильному значению в диапазоне 24 часов
             * */
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
            const hour = Math.floor(possibleTime / 60);
            const minutes = possibleTime - (hour * 60);
            return formatDate(currentdate, `yyyy-MM-dd ${hour <= 9 ? '0' + hour : hour}:${minutes <= 9 ? '0' + minutes : minutes}`, 'en');
        }
        else {
            if (checkTime.currentTime && checkTime.curentDayStopTime) {
                const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, checkTime.isNewDay ? new Date(currentdate.getTime() + 86400000) : currentdate);
                const time = this.getTimeFromString(currentDayWorkTime.start) + (+restriction.minDeliveryTime) + 1;
                const hour = Math.floor(time / 60);
                const minutes = time - (hour * 60);
                return formatDate(checkTime.isNewDay || checkTime.currentTime > checkTime.curentDayStopTime ? (currentdate.getTime() + 86400000) : currentdate, `yyyy-MM-dd ${hour <= 9 ? '0' + hour : hour}:${minutes <= 9 ? '0' + minutes : minutes}`, 'en');
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3RpbWUudmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93b3JrdGltZS52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sTUFBTSxDQUFDO0FBeUQxQzs7O0dBR0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLFdBQWdCO0lBQzFDLE9BQU8sVUFBVSxJQUFJLFdBQVcsSUFBSSxVQUFVLElBQUksV0FBVyxDQUFDO0FBQ2hFLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHVCQUF1QixDQUFDLFdBQThCO0lBQzdELE9BQU8saUJBQWlCLElBQUksV0FBVyxJQUFJLHdCQUF3QixJQUFJLFdBQVcsSUFBSSxVQUFVLElBQUksV0FBVyxJQUFJLFVBQVUsSUFBSSxXQUFXLENBQUM7QUFDL0ksQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQWtMNUI7O01BRUU7SUFFRjtRQUVRLFlBQU8sR0FPWDtZQUNBLGVBQWUsRUFBRSxJQUFJLEdBQUcsRUFBa0I7WUFDMUMsaUJBQWlCLEVBQUUsSUFBSSxHQUFHLEVBQWtCO1lBQzVDLFNBQVMsRUFBRSxJQUFJLEdBQUcsRUFBMkI7WUFDN0MsaUNBQWlDLEVBQUUsSUFBSSxHQUFHLEVBQWtCO1lBQzVELG1DQUFtQyxFQUFFLElBQUksR0FBRyxFQUFrQjtZQUM5RCxrQkFBa0IsRUFBRSxJQUFJLEdBQUcsRUFBb0I7U0FDaEQsQ0FBQztJQWhCWSxDQUFDO0lBckxqQjs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUE4QixFQUFFLFdBQWlCO1FBQ3RFLElBQUksV0FBVyxJQUFJLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFB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QUcsaUJBQWlCLENBQUMsbUNBQW1DLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQy9GLElBQUksQ0FBQyxPQUFPLENBQUMsbUNBQW1DLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN4RSxPQUFPLE1BQU0sQ0FBQztTQUNmO0lBQ0gsQ0FBQztJQUFBLENBQUM7SUFDRjs7OztNQUlFO0lBQ0Ysa0JBQWtCLENBQUMsV0FBeUIsRUFBRSxXQUFpQjtRQUM3RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDL0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkUsSUFBSSxXQUFXLEVBQUU7WUFDZixPQUFpQixXQUFXLENBQUM7U0FDOUI7YUFBTTtZQUNMLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM5RSxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDdkQsT0FBTyxNQUFNLENBQUM7U0FDZjtJQUNILENBQUM7SUFBQSxDQUFDO0NBRUgiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmb3JtYXREYXRlLCBpc0RhdGUgfSBmcm9tICcuL2Zvcm1hdERhdGUnO1xyXG5pbXBvcnQgeyBUaW1lWm9uZUlkZW50aWZpZXIgfSBmcm9tICcuL3R6JztcclxuXHJcbi8qKlxyXG4gKiDQkdCw0LfQvtCy0YvQtSDQtNCw0L3QvdGL0LUg0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLIC0g0YHQu9GD0LbQtdCx0L3Ri9C5INC40L3RgtC10YDRhNC10LnRgS5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgV29ya1RpbWVCYXNlIHtcclxuICAvKiog0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8qL1xyXG4gIHN0YXJ0OiBzdHJpbmc7XHJcblxyXG4gIC8qKiDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyovXHJcbiAgc3RvcDogc3RyaW5nO1xyXG5cclxuICAvKiog0L/QtdGA0LXRgNGL0LIg0L3QsCDQvtCx0LXQtCovXHJcbiAgYnJlYWs/OiBzdHJpbmc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDQmNC90YTQvtGA0LzQsNGG0LjRjyDQviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyAtINGB0LvRg9C20LXQsdC90YvQuSDQuNC90YLQtdGA0YTQtdC50YEuXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtUaW1lIGV4dGVuZHMgV29ya1RpbWVCYXNlIHtcclxuICAvKiog0LTQtdC90Ywg0L3QtdC00LXQu9C4LCDQuiDQutC+0YLQvtGA0L7QvNGDINC/0YDQuNC80LXQvdGP0LXRgtGB0Y8g0Y3RgtC+INCy0YDQtdC80Y8g0LTQvtGB0YLQsNCy0LrQuCAgICovXHJcbiAgZGF5T2ZXZWVrOiBzdHJpbmcgfCBzdHJpbmdbXTtcclxuXHJcbiAgLyoqINC+0LPRgNCw0L3QuNGH0LXQvdC40Y8g0L/QviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0LTQu9GPINGB0LDQvNC+0LLRi9Cy0L7Qt9CwICovXHJcbiAgc2VsZlNlcnZpY2U/OiBXb3JrVGltZUJhc2U7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDQmNC90YLQtdGA0YTQtdC50YEg0L7QsdGK0LXQutGC0LAsINC/0L7Qu9GD0YfQsNC10LzQvtCz0L4g0L7RgiBBUEkgQHdlYnJlc3RvL2NvcmUg0Lgg0YHQvtC00LXRgNC20LDRidC10LPQviDRgtC10LrRg9GJ0LjQtSDQtNCw0L3QvdGL0LUg0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRj1xyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBSZXN0cmljdGlvbnMge1xyXG4gIC8qKiDQstGA0LXQvNC10L3QvdCw0Y8g0LfQvtC90LAg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyAqL1xyXG4gIHRpbWV6b25lPzogc3RyaW5nO1xyXG5cclxuICAvKiogINC80LDRgdGB0LjQsiDQvtCz0YDQsNC90LjRh9C10L3QuNC5INC/0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0LTQu9GPINGA0LDQt9C90YvRhSDQtNC90LXQuSDQvdC10LTQtdC70LguICovXHJcbiAgd29ya1RpbWU6IFdvcmtUaW1lW107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVzdHJpY3Rpb25zT3JkZXIgZXh0ZW5kcyBSZXN0cmljdGlvbnMge1xyXG4gIC8qKiDQvNC40L3QuNC80LDQu9GM0L3QvtC1INCy0YDQtdC80Y8g0LTQvtGB0YLQsNCy0LrQuCovXHJcbiAgbWluRGVsaXZlcnlUaW1lOiBzdHJpbmc7XHJcblxyXG4gIC8qKtGD0YHRgtCw0L3QvtCy0LvQtdC90L4g0LvQuCDQvdCwINGC0LXQutGD0YnQuNC5INC80L7QvNC10L3RgiDQvtCz0YDQsNC90LjRh9C10L3QuNC1INC00L7RgdGC0LDQstC60Lgg0L3QsCDQvtC/0YDQtdC00LXQu9C10L3QvdC+0LUg0LLRgNC10LzRjyAqL1xyXG4gIGRlbGl2ZXJ5VG9UaW1lRW5hYmxlZDogYm9vbGVhbjtcclxuXHJcbiAgLyoqINC+0LPRgNCw0L3QuNGH0LXQvdC40LUg0LzQsNC60YHQuNC80LDQu9GM0L3QvtC5INC00LDRgtGLINC30LDQutCw0LfQsCDQsiDQsdGD0LTRg9GJ0LXQvCAo0LIg0LzQuNC90YPRgtCw0YUpKi9cclxuICBwZXJpb2RQb3NzaWJsZUZvck9yZGVyOiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBWYWxpZGF0b3JSZXN1bHQge1xyXG4gIHdvcmtOb3c6IGJvb2xlYW4sXHJcbiAgaXNOZXdEYXk/OiBib29sZWFuLFxyXG4gIGN1cnJlbnRUaW1lPzogbnVtYmVyLFxyXG4gIGN1cmVudERheVN0YXJ0VGltZT86IG51bWJlcixcclxuICBjdXJlbnREYXlTdG9wVGltZT86IG51bWJlclxyXG59XHJcblxyXG4vKipcclxuICog0KTRg9C90LrRhtC40Y8g0LLQsNC70LjQtNCw0YbQuNC4INC/0LXRgNC10LTQsNC90L3QvtCz0L4g0L7QsdGK0LXQutGC0LAgcmVzdHJpY3Rpb24g0L3QsCDRgdC+0L7RgtCy0LXRgtGB0YLQstC40LUg0LjQvdGC0LXRgNGE0LXQudGB0YMgUmVzdHJpY3Rpb25zXHJcbiAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC/0YDQvtCy0LXRgNGP0LXQvNGL0Lkg0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQuCDQstGA0LXQvNC10L3QvdC+0Lkg0LfQvtC90LUuXHJcbiAqL1xyXG5mdW5jdGlvbiBpc1ZhbGlkUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb246IGFueSk6IHJlc3RyaWN0aW9uIGlzIFJlc3RyaWN0aW9ucyB7XHJcbiAgcmV0dXJuICd0aW1lem9uZScgaW4gcmVzdHJpY3Rpb24gJiYgJ3dvcmtUaW1lJyBpbiByZXN0cmljdGlvbjtcclxufVxyXG5cclxuLyoqXHJcbiAqINCk0YPQvdC60YbQuNGPINCy0LDQu9C40LTQsNGG0LjQuCDQv9C10YDQtdC00LDQvdC90L7Qs9C+INC+0LHRitC10LrRgtCwIHJlc3RyaWN0aW9uINC90LAg0YHQvtC+0YLQstC10YLRgdGC0LLQuNC1INC80LjQvdC40LzQsNC70YzQvdGL0Lwg0LTQsNC90L3Ri9C8INC00LvRjyDQt9Cw0LrQsNC30LBcclxuICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gKi9cclxuZnVuY3Rpb24gaXNWYWxpZFJlc3RyaWN0aW9uT3JkZXIocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyKTogcmVzdHJpY3Rpb24gaXMgUmVzdHJpY3Rpb25zT3JkZXIge1xyXG4gIHJldHVybiAnbWluRGVsaXZlcnlUaW1lJyBpbiByZXN0cmljdGlvbiAmJiAncGVyaW9kUG9zc2libGVGb3JPcmRlcicgaW4gcmVzdHJpY3Rpb24gJiYgJ3RpbWV6b25lJyBpbiByZXN0cmljdGlvbiAmJiAnd29ya1RpbWUnIGluIHJlc3RyaWN0aW9uO1xyXG59XHJcblxyXG4vKipcclxuICog0JrQu9Cw0YHRgSwg0YHQvtC00LXRgNC20LDRidC40Lkg0YHRgtCw0YLQuNGH0LXRgdC60LjQtSDQvNC10YLQvtC00YssINC90LXQvtCx0YXQvtC00LjQvNGL0LUg0LTQu9GPINGA0LDQsdC+0YLRiyDRgSDQvtCz0YDQsNC90LjRh9C10L3QuNGP0LzQuCDRgNCw0LHQvtGH0LXQs9C+INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAqINCh0L7Qt9C00LDQstCw0YLRjCDQvdC+0LLRi9C5INGN0LrQt9C10LzQv9C70Y/RgCDRjdGC0L7Qs9C+INC60LvQsNGB0YHQsCDQtNC70Y8g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8g0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7QsiDQvdC1INGC0YDQtdCx0YPQtdGC0YHRjy5cclxuICogXHJcbiAqINCf0YDQuCDRjdGC0L7QvCDQv9GA0Lgg0YHQvtC30LTQsNC90LjQuCDRjdC60LfQtdC80L/Qu9GP0YDQsCDQutC70LDRgdGB0LAg0YMg0L7QsdGK0LXQutGC0LAg0YLQsNC60LbQtSDQsdGD0LTRg9GCINC00L7RgdGC0YPQv9C90Ysg0YHQvtCx0YHRgtCy0LXQvdC90YvQtSDRgNC10LDQu9C40LfQsNGG0LjQuCBcclxuICog0LLRgdC10YUg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7Qsi5cclxuICog0K3RgtC4INGA0LXQsNC70LjQt9Cw0YbQuNC4INC+0YLQu9C40YfQsNGO0YLRgdGPINC+0YIg0LLRi9C30L7QstC+0LIg0YHRgtCw0YLQuNGH0LXRgdC60LjRhSDQvNC10YLQvtC00L7QsiDRgtC+0LvRjNC60L4g0LzQtdC80L7QuNC30LDRhtC40LXQuSDQstGL0L/QvtC70L3QtdC90L3Ri9GFINGA0LDRgdGH0LXRgtC+0LIuXHJcbiAqIFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFdvcmtUaW1lVmFsaWRhdG9yIHtcclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINC80LDQutGB0LjQvNCw0LvRjNC90YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMsINC90LAg0LrQvtGC0L7RgNGD0Y4g0LzQvtC20L3QviDQt9Cw0LrQsNC30LDRgtGMINC00L7RgdGC0LDQstC60YMuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEByZXR1cm4gOnN0cmluZyAtINCh0YLRgNC+0LrQsCwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LDRjyDQvNCw0LrRgdC40LzQsNC70YzQvdGD0Y4g0LTQvtGB0YLRg9C/0L3Rg9GOINC00LDRgtGDINC00L7RgdGC0LDQstC60Lgg0LIg0YTQvtGA0LzQsNGC0LUgeXl5eS1NTS1kZC5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0TWF4T3JkZXJEYXRlKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgaWYgKHJlc3RyaWN0aW9uICYmIGlzVmFsaWRSZXN0cmljdGlvbk9yZGVyKHJlc3RyaWN0aW9uKSAmJiBpc0RhdGUoY3VycmVudGRhdGUpKSB7XHJcbiAgICAgIHJldHVybiBmb3JtYXREYXRlKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIHJlc3RyaWN0aW9uLnBlcmlvZFBvc3NpYmxlRm9yT3JkZXIgKiA2MDAwMCwgJ3l5eXktTU0tZGQnLCAnZW4nKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBpc0RhdGUoY3VycmVudGRhdGUpID9cclxuICAgICAgICAgICfQndC1INC/0LXRgNC10LTQsNC9INC60L7RgNGA0LXQutGC0L3Ri9C5INC+0LHRitC10LrRgiDQtNCw0YLRiycgOlxyXG4gICAgICAgICAgIXJlc3RyaWN0aW9uID8gJ9Cd0LUg0L/QtdGA0LXQtNCw0L0g0L7QsdGK0LXQutGCIHJlc3RyaWN0aW9ucycgOlxyXG4gICAgICAgICAgICAn0J/QtdGA0LXQtNCw0L0g0L3QtdCy0LDQu9C40LTQvdGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucydcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0YHRh9C40YLQsNC10YIsINGB0LrQvtC70YzQutC+INC80LjQvdGD0YIg0L7RgiDQvdCw0YfQsNC70LAg0LTQvdGPICgwMDowMCkg0L/RgNC+0YjQu9C+INC00LvRjyDQv9C10YDQtdC00LDQvdC90L7Qs9C+INCy0YDQtdC80LXQvdC4LlxyXG4gICAqIEBwYXJhbSB0aW1lIC0g0YHRgtGA0L7QutCwINCyINGE0L7RgNC80LDRgtC1IEhIOm1tIC0g0LLRgNC10LzRjy5cclxuICAgKiBAcmV0dXJuIDpudW1iZXIgLSDQutC+0Lst0LLQviDQvNC40L3Rg9GCLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRUaW1lRnJvbVN0cmluZyh0aW1lOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgaWYgKCF0aW1lKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcign0J3QtSDQv9C10YDQtdC00LDQvdCwINGB0YLRgNC+0LrQsCDRgSDQv9GA0LXQvtCx0YDQsNC30YPQtdC80YvQvCDQstGA0LXQvNC10L3QtdC8INCyINGE0L7RgNC80LDRgtC1IEhIOm1tJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsZXQgY2hlY2tlZFRpbWUgPSB0aW1lLnRyaW0oKTtcclxuICAgICAgaWYgKGNoZWNrZWRUaW1lLmluY2x1ZGVzKCcgJykgfHwgY2hlY2tlZFRpbWUuaW5jbHVkZXMoJ1QnKSkge1xyXG4gICAgICAgIGNoZWNrZWRUaW1lID0gY2hlY2tlZFRpbWUuc3BsaXQoY2hlY2tlZFRpbWUuaW5jbHVkZXMoJyAnKSA/ICcgJyA6ICdUJylbMV07XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuICgrY2hlY2tlZFRpbWUuc3BsaXQoJzonKVswXSkgKiA2MCArICgrY2hlY2tlZFRpbWUuc3BsaXQoJzonKVsxXSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0L/RgNC+0LLQtdGA0Y/QtdGCLCDQtNC+0YHRgtGD0L/QvdCwINC70Lgg0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4INC90LAg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y8uXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjywg0LTQu9GPINC60L7RgtC+0YDRi9GFINC4INC/0YDQvtCy0LXRgNGP0LXRgtGB0Y8g0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQtNC+0YHRgtCw0LLQutC4XHJcbiAgICogQHJldHVybiDQntCx0YzQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOOlxyXG4gICAqIHtcclxuICAgICAgICBpc1dvcmtOb3c6Ym9vbGVhbiAtINCS0L7Qt9C80L7QttC90LAg0LvQuCDQtNC+0YHRgtCw0LLQutCwINCyINCx0LvQuNC20LDQudGI0LXQtSDQstGA0LXQvNGPXHJcbiAgICAgICAgaXNOZXdEYXk6Ym9vbGVhbiAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQuNC30L3QsNC6LCDRh9GC0L4g0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINGH0LDRgdC+0LLRi9GFINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0LTQsNGC0YsgXCLQv9C10YDQtdC/0YDRi9Cz0L3Rg9C7XCIg0L3QsCDQvdC+0LLRi9C5INC00LXQvdGMLlxyXG4gICAgICAgIGN1cnJlbnRUaW1lOm51bWJlciAtINCh0LvRg9C20LXQsdC90YvQuSDQv9Cw0YDQsNC80LXRgtGAINC00LvRjyDQstC90YPRgtGA0LXQvdC90LXQs9C+INC40YHQv9C+0LvRjNC30L7QstCw0L3QuNGPLlxyXG4gICAgICAgICAg0J/RgNC10LTRgdGC0LDQstC70Y/QtdGCINC/0YDQvtCy0LXRgNGP0LXQvNC+0LUg0LzQtdGC0L7QtNC+0Lwg0LLRgNC10LzRjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgICBjdXJlbnREYXlTdGFydFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvdCw0YfQsNC70LAg0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgICAgY3VyZW50RGF5U3RvcFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0LLRgNC10LzRjyDQvtC60L7QvdGH0LDQvdC40Y8g0YDQsNCx0L7Rh9C10LPQviDQtNC90Y8g0LIg0LzQuNC90YPRgtCw0YUg0L7RgiAwMDowMCDQsiDRh9Cw0YHQvtCy0L7QvCDQv9C+0Y/RgdC1INC/0YDQtdC00L/RgNC40Y/RgtC40Y8uXHJcbiAgICAgIH1cclxuICAgKi9cclxuICBzdGF0aWMgaXNXb3JrTm93KHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMgfCBSZXN0cmljdGlvbnNPcmRlciwgY3VycmVudGRhdGU6IERhdGUgPSBuZXcgRGF0ZSgpKTogVmFsaWRhdG9yUmVzdWx0IHtcclxuXHJcbiAgICBpZiAoIXJlc3RyaWN0aW9uLndvcmtUaW1lIHx8ICFPYmplY3Qua2V5cyhyZXN0cmljdGlvbi53b3JrVGltZSkubGVuZ3RoKSB7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHdvcmtOb3c6IHRydWVcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyDQldGB0LvQuCDQuNGB0L/QvtC70YzQvdGP0LXRgtGB0Y8g0LIgTm9kZUpTXHJcbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICFyZXN0cmljdGlvbi50aW1lem9uZSkge1xyXG4gICAgICByZXN0cmljdGlvbi50aW1lem9uZSA9IHByb2Nlc3MuZW52LlRaID8gcHJvY2Vzcy5lbnYuVFogOiBJbnRsLkRhdGVUaW1lRm9ybWF0KCkucmVzb2x2ZWRPcHRpb25zKCkudGltZVpvbmVcclxuICAgIH07XHJcblxyXG4gICAgaWYgKCFyZXN0cmljdGlvbiB8fCAhaXNWYWxpZFJlc3RyaWN0aW9uKHJlc3RyaWN0aW9uKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgIWlzRGF0ZShjdXJyZW50ZGF0ZSkgPyAn0J3QtSDQv9C10YDQtdC00LDQvSDQutC+0YDRgNC10LrRgtC90YvQuSDQvtCx0YrQtdC60YIg0LTQsNGC0YsnIDpcclxuICAgICAgICAgICFyZXN0cmljdGlvbiA/ICfQndC1INC/0LXRgNC10LTQsNC9INC+0LHRitC10LrRgiByZXN0cmljdGlvbnMnXHJcbiAgICAgICAgICAgIDogJ9Cf0LXRgNC10LTQsNC9INC90LXQstCw0LvQuNC00L3Ri9C5INC+0LHRjNC10LrRgiByZXN0cmljdGlvbnMnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IGNvbXBhbnlMb2NhbFRpbWVab25lID0gVGltZVpvbmVJZGVudGlmaWVyLmdldFRpbWVab25lR01UT2Zmc2V0ZnJvbU5hbWVab25lKHJlc3RyaWN0aW9uLnRpbWV6b25lKS5zcGxpdCgnOicpO1xyXG4gICAgICBjb25zdCBjb21wYW55TG9jYWxUaW1lWm9uZURlbHRhID0gK2NvbXBhbnlMb2NhbFRpbWVab25lWzBdICogNjAgKyAoKyhjb21wYW55TG9jYWxUaW1lWm9uZVsxXSkpO1xyXG4gICAgICBjb25zdCBsb2thbFRpbWVEZWx0YSA9IGNvbXBhbnlMb2NhbFRpbWVab25lRGVsdGEgKyBjdXJyZW50ZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpOyAvLyDRgdC80LXRidC10L3QuNC1INCy0YDQtdC80LXQvdC4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjyDQvtGC0L3QvtGB0LjRgtC10LvRjNC90L4g0LLRgNC10LzQtdC90Lgg0YLQvtGA0LPQvtCy0L7QuSDRgtC+0YfQutC4XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRUaW1lRnJvbVN0cmluZyhmb3JtYXREYXRlKGN1cnJlbnRkYXRlLCAnSEg6bW0nLCAnZW4nKSkgKyBsb2thbFRpbWVEZWx0YTtcclxuICAgICAgY29uc3QgY3VycmVudFRpbWUgPSBjdXJyZW50VGltZUluTWludXRlc1dpdGhMb2NhbERlbHRhID4gMTQ0MCA/IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgLSAxNDQwIDogY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YTtcclxuICAgICAgLyoqXHJcbiAgICAgICAqINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0LIg0LzQuNC90YPRgtCw0YUg0YEg0L3QsNGH0LDQu9CwINC00L3RjyAoNjAwID0gMTA6MDAuIDEyMDAgPSAyMDowMClcclxuICAgICAgICog0LXRgdC70Lgg0LjQty3Qt9CwINGA0LDQt9C90LjRhtGLINC/0L7Rj9GB0L7QsiDRgNCw0YHRh9C10YIg0L/QtdGA0LXQv9GA0YvQs9C90YPQuyDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwsINGC0L4g0L/RgNC40LLQvtC00LjQvCDQstGA0LXQvNGPINC6INC/0YDQsNCy0LjQu9GM0L3QvtC80YMg0LfQvdCw0YfQtdC90LjRjiDQsiDQtNC40LDQv9Cw0LfQvtC90LUgMjQg0YfQsNGB0L7QslxyXG4gICAgICAgKiAqL1xyXG4gICAgICBjb25zdCBjdXJyZW50RGF5V29ya1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUoXHJcbiAgICAgICAgcmVzdHJpY3Rpb24sXHJcbiAgICAgICAgY3VycmVudFRpbWVJbk1pbnV0ZXNXaXRoTG9jYWxEZWx0YSA+IDE0NDAgPyBuZXcgRGF0ZShjdXJyZW50ZGF0ZS5nZXRUaW1lKCkgKyA4NjQwMDAwMCkgOiBjdXJyZW50ZGF0ZVxyXG4gICAgICApOyAvLyDRgtC10LrRg9GJ0LXQtSDRgNCw0LHQvtGH0LXQtSDQstGA0LXQvNGPXHJcbiAgICAgIGNvbnN0IGN1cmVudERheVN0YXJ0VGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFRpbWVGcm9tU3RyaW5nKGN1cnJlbnREYXlXb3JrVGltZS5zdGFydCk7IC8vINGC0LXQutGD0YnQtdC1INCy0YDQtdC80Y8g0L3QsNGH0LDQu9CwINGA0LDQsdC+0YfQtdCz0L4g0LTQvdGPINCyINC80LjQvdGD0YLQsNGFXHJcbiAgICAgIGNvbnN0IGN1cmVudERheVN0b3BUaW1lID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcoY3VycmVudERheVdvcmtUaW1lLnN0b3ApOyAvLyDRgtC10LrRg9GJ0LXQtSDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHdvcmtOb3c6IGN1cnJlbnRUaW1lIDwgY3VyZW50RGF5U3RvcFRpbWUgJiYgY3VycmVudFRpbWUgPiBjdXJlbnREYXlTdGFydFRpbWUsXHJcbiAgICAgICAgaXNOZXdEYXk6IGN1cnJlbnRUaW1lSW5NaW51dGVzV2l0aExvY2FsRGVsdGEgPiAxNDQwLFxyXG4gICAgICAgIGN1cnJlbnRUaW1lLFxyXG4gICAgICAgIGN1cmVudERheVN0YXJ0VGltZSxcclxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0JTQvtGB0YLQsNCy0LrQsCDQutGD0YDRjNC10YDQvtC8XCIuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBjaGVja1RpbWUgPSBXb3JrVGltZVZhbGlkYXRvci5pc1dvcmtOb3cocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcclxuXHJcbiAgICBpZiAoY2hlY2tUaW1lLndvcmtOb3cgJiYgY2hlY2tUaW1lLmN1cnJlbnRUaW1lKSB7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZygn0KHQtdC50YfQsNGBINGA0LDQsdC+0YfQtdC1INCy0YDQtdC80Y8uINCg0LDRgdGH0LXRgiDQvdC1INGC0YDQtdCx0YPQtdGC0YHRjy4nKTtcclxuICAgICAgY29uc3QgcG9zc2libGVUaW1lID0gY2hlY2tUaW1lLmN1cnJlbnRUaW1lICsgKCtyZXN0cmljdGlvbi5taW5EZWxpdmVyeVRpbWUgfHwgMCk7XHJcbiAgICAgIGNvbnN0IGhvdXIgPSBNYXRoLmZsb29yKHBvc3NpYmxlVGltZSAvIDYwKTtcclxuICAgICAgY29uc3QgbWludXRlcyA9IHBvc3NpYmxlVGltZSAtIChob3VyICogNjApO1xyXG4gICAgICByZXR1cm4gZm9ybWF0RGF0ZShjdXJyZW50ZGF0ZSwgYHl5eXktTU0tZGQgJHtob3VyIDw9IDkgPyAnMCcgKyBob3VyIDogaG91cn06JHttaW51dGVzIDw9IDkgPyAnMCcgKyBtaW51dGVzIDogbWludXRlc31gLCAnZW4nKVxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIGlmIChjaGVja1RpbWUuY3VycmVudFRpbWUgJiYgY2hlY2tUaW1lLmN1cmVudERheVN0b3BUaW1lKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IGN1cnJlbnREYXlXb3JrVGltZSA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldEN1cnJlbnRXb3JrVGltZShcclxuICAgICAgICAgIHJlc3RyaWN0aW9uLFxyXG4gICAgICAgICAgY2hlY2tUaW1lLmlzTmV3RGF5ID8gbmV3IERhdGUoY3VycmVudGRhdGUuZ2V0VGltZSgpICsgODY0MDAwMDApIDogY3VycmVudGRhdGVcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbnN0IHRpbWUgPSB0aGlzLmdldFRpbWVGcm9tU3RyaW5nKGN1cnJlbnREYXlXb3JrVGltZS5zdGFydCkgKyAoK3Jlc3RyaWN0aW9uLm1pbkRlbGl2ZXJ5VGltZSkgKyAxO1xyXG4gICAgICAgIGNvbnN0IGhvdXIgPSBNYXRoLmZsb29yKHRpbWUgLyA2MCk7XHJcbiAgICAgICAgY29uc3QgbWludXRlcyA9IHRpbWUgLSAoaG91ciAqIDYwKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZvcm1hdERhdGUoXHJcbiAgICAgICAgICBjaGVja1RpbWUuaXNOZXdEYXkgfHwgY2hlY2tUaW1lLmN1cnJlbnRUaW1lID4gY2hlY2tUaW1lLmN1cmVudERheVN0b3BUaW1lID8gKGN1cnJlbnRkYXRlLmdldFRpbWUoKSArIDg2NDAwMDAwKSA6IGN1cnJlbnRkYXRlLFxyXG4gICAgICAgICAgYHl5eXktTU0tZGQgJHtob3VyIDw9IDkgPyAnMCcgKyBob3VyIDogaG91cn06JHttaW51dGVzIDw9IDkgPyAnMCcgKyBtaW51dGVzIDogbWludXRlc31gLFxyXG4gICAgICAgICAgJ2VuJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgJ9Cd0LUg0YPQtNCw0LvQvtGB0Ywg0YDQsNGB0YHRh9C40YLQsNGC0YwgY3VycmVudFRpbWUg0LggY3VyZW50RGF5U3RvcFRpbWUuJztcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LHQu9C40LbQsNC50YjRg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgy3QstGA0LXQvNGPINC30LDQutCw0LfQsCDQtNC70Y8g0YHQv9C+0YHQvtCx0LAg0LTQvtGB0YLQsNCy0LrQuCBcItCh0LDQvNC+0LLRi9Cy0L7Qt1wiLlxyXG4gICAqIEBwYXJhbSByZXN0cmljdGlvbiAtINC+0LHRitC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y4g0L4g0YDQsNCx0L7Rh9C10Lwg0LLRgNC10LzQtdC90Lgg0L/RgNC10LTQv9GA0LjRj9GC0LjRjyDQuCDQvtCz0YDQsNC90LjRh9C10L3QuNGP0YUg0LTQsNGC0Ysv0LLRgNC10LzQtdC90Lgg0LTQvtGB0YLQsNCy0LrQuC5cclxuICAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IHN0cmluZyB7XHJcbiAgICAvKipcclxuICAgICAqINCU0LvRjyDQvtCx0LXRgdC/0LXRh9C10L3QuNGPINC40LzQvNGD0YLQsNCx0LXQu9GM0L3QvtGB0YLQuCDQtNCw0L3QvdGL0YUg0YHQvtC30LTQsNC10YLRgdGPINC90L7QstGL0Lkg0L7QsdGM0LXQutGCIHJlc3RyaWN0aW9ucywg0LjQtNC10L3RgtC40YfQvdGL0Lkg0L/QvtC70YPRh9C10L3QvdC+0LzRgyDQsiDQv9Cw0YDQsNC80LXRgtGA0LDRhSwg0L3QviDRgSDQuNC30LzQtdC90LXQvdC90YvQvCDQvNCw0YHRgdC40LLQvtC8IHdvcmtUaW1lLlxyXG4gICAgICog0JIg0LzQsNGB0YHQuNCy0LUgd29ya1RpbWUg0L7QsdC90L7QstC70Y/RjtGC0YHRjyDQvtCz0YDQsNC90LjRh9C10L3QuNGPINCy0YDQtdC80LXQvdC4INGA0LDQsdC+0YLRiyDRgSDQvtCx0YvRh9C90YvRhSDQvdCwINCw0LrRgtGD0LDQu9GM0L3Ri9C1INC00LvRjyDRgdCw0LzQvtCy0YvQstC+0LfQsC5cclxuICAgICAqICovXHJcbiAgICBjb25zdCBuZXdSZXN0cmljdGlvbiA9IHtcclxuICAgICAgLi4ucmVzdHJpY3Rpb24sIHdvcmtUaW1lOiAoPFdvcmtUaW1lW10+cmVzdHJpY3Rpb24ud29ya1RpbWUpLm1hcCh3b3JrVGltZSA9PiB3b3JrVGltZS5zZWxmU2VydmljZSA/ICh7IC4uLndvcmtUaW1lLCAuLi53b3JrVGltZS5zZWxmU2VydmljZSB9KSA6IHdvcmtUaW1lKVxyXG4gICAgfTtcclxuICAgIHJldHVybiBXb3JrVGltZVZhbGlkYXRvci5nZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWUobmV3UmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsNC60YLRg9Cw0LvRjNC90YvQtSDQtNCw0L3QvdGL0LUg0L4g0LLRgNC10LzQtdC90Lgg0YDQsNCx0L7RgtGLINC40Lcg0LzQsNGB0YHQuNCy0LAg0LLRgdC10YUg0LLQsNGA0LjQsNC90YLQvtCyINC+0LHRjNC10LrRgtCwIHJlc3RyaWN0aW9uLlxyXG4gICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgKi9cclxuICBzdGF0aWMgZ2V0Q3VycmVudFdvcmtUaW1lKHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbnMsIGN1cnJlbnRkYXRlOiBEYXRlKTogV29ya1RpbWUge1xyXG4gICAgbGV0IGkgPSAwO1xyXG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XHJcbiAgICB3aGlsZSAoaSA8IHJlc3RyaWN0aW9uLndvcmtUaW1lLmxlbmd0aCAmJiAhcmVzdWx0KSB7XHJcbiAgICAgIGlmIChyZXN0cmljdGlvbi53b3JrVGltZVtpXS5kYXlPZldlZWsgPT09ICdhbGwnIHx8IChcclxuICAgICAgICB0eXBlb2YgcmVzdHJpY3Rpb24ud29ya1RpbWVbaV0uZGF5T2ZXZWVrID09PSAnc3RyaW5nJyA/XHJcbiAgICAgICAgICAoPHN0cmluZz5yZXN0cmljdGlvbi53b3JrVGltZVtpXS5kYXlPZldlZWspLnRvTG93ZXJDYXNlKCkgOlxyXG4gICAgICAgICAgKDxzdHJpbmdbXT5yZXN0cmljdGlvbi53b3JrVGltZVtpXS5kYXlPZldlZWspLm1hcChkYXkgPT4gZGF5LnRvTG93ZXJDYXNlKCkpXHJcbiAgICAgICkuaW5jbHVkZXMoZm9ybWF0RGF0ZShjdXJyZW50ZGF0ZSwgJ0VFRUUnLCAnZW4nKS50b0xvd2VyQ2FzZSgpKSkge1xyXG4gICAgICAgIHJlc3VsdCA9IHJlc3RyaWN0aW9uLndvcmtUaW1lW2ldO1xyXG4gICAgICB9XHJcbiAgICAgIGkgKz0gMTtcclxuICAgIH1cclxuICAgIGlmICghcmVzdWx0KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcign0J3QtdGCINCw0LrRgtGD0LDQu9GM0L3QvtCz0L4g0YDQsNGB0L/QuNGB0LDQvdC40Y8g0YDQsNCx0L7RgtGLINC00LvRjyDRgtC10LrRg9GJ0LXQs9C+INC00L3RjycpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICog0JvQvtCz0LjQutCwINC90LjQttC1INC/0YDQtdC00L3QsNC30L3QsNGH0LXQvdCwINC00LvRjyDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjyDRjdC60LfQtdC80L/Qu9GP0YDQsCDQutC70LDRgdGB0LAgV29ya1RpbWVWYWxpZGF0b3IgXHJcbiAgKi9cclxuXHJcbiAgY29uc3RydWN0b3IoKSB7IH1cclxuXHJcbiAgcHJpdmF0ZSBfbWVtb3J5OiB7XHJcbiAgICBnZXRNYXhPcmRlckRhdGU6IE1hcDxzdHJpbmcsIHN0cmluZz47XHJcbiAgICBnZXRUaW1lRnJvbVN0cmluZzogTWFwPHN0cmluZywgbnVtYmVyPjtcclxuICAgIGlzV29ya05vdzogTWFwPHN0cmluZywgVmFsaWRhdG9yUmVzdWx0PjtcclxuICAgIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZTogTWFwPHN0cmluZywgc3RyaW5nPjtcclxuICAgIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xyXG4gICAgZ2V0Q3VycmVudFdvcmtUaW1lOiBNYXA8c3RyaW5nLCBXb3JrVGltZT47XHJcbiAgfSA9IHtcclxuICAgICAgZ2V0TWF4T3JkZXJEYXRlOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxyXG4gICAgICBnZXRUaW1lRnJvbVN0cmluZzogbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKSxcclxuICAgICAgaXNXb3JrTm93OiBuZXcgTWFwPHN0cmluZywgVmFsaWRhdG9yUmVzdWx0PigpLFxyXG4gICAgICBnZXRQb3NzaWJsZURlbGlldmVyeU9yZGVyRGF0ZVRpbWU6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksXHJcbiAgICAgIGdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpLFxyXG4gICAgICBnZXRDdXJyZW50V29ya1RpbWU6IG5ldyBNYXA8c3RyaW5nLCBXb3JrVGltZT4oKVxyXG4gICAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICAqINCc0LXRgtC+0LQg0LLQvtC30LLRgNCw0YnQsNC10YIg0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINCy0L7Qt9C80L7QttC90YPRjiDQtNCw0YLRgywg0L3QsCDQutC+0YLQvtGA0YPRjiDQvNC+0LbQvdC+INC30LDQutCw0LfQsNGC0Ywg0LTQvtGB0YLQsNCy0LrRgy5cclxuICAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAgKiBAcmV0dXJuIDpzdHJpbmcgLSDQodGC0YDQvtC60LAsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidCw0Y8g0LzQsNC60YHQuNC80LDQu9GM0L3Rg9GOINC00L7RgdGC0YPQv9C90YPRjiDQtNCw0YLRgyDQtNC+0YHRgtCw0LLQutC4INCyINGE0L7RgNC80LDRgtC1IHl5eXktTU0tZGQuXHJcbiAgICAqL1xyXG4gIGdldE1heE9yZGVyRGF0ZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0TWF4T3JkZXJEYXRlLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldE1heE9yZGVyRGF0ZShyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0TWF4T3JkZXJEYXRlLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INGB0YfQuNGC0LDQtdGCLCDRgdC60L7Qu9GM0LrQviDQvNC40L3Rg9GCINC+0YIg0L3QsNGH0LDQu9CwINC00L3RjyAoMDA6MDApINC/0YDQvtGI0LvQviDQtNC70Y8g0L/QtdGA0LXQtNCw0L3QvdC+0LPQviDQstGA0LXQvNC10L3QuC5cclxuICAgKiBAcGFyYW0gdGltZSAtINGB0YLRgNC+0LrQsCDQsiDRhNC+0YDQvNCw0YLQtSBISDptbSAtINCy0YDQtdC80Y8uXHJcbiAgICogQHJldHVybiA6bnVtYmVyIC0g0LrQvtC7LdCy0L4g0LzQuNC90YPRgi5cclxuICAgKi9cclxuICBnZXRUaW1lRnJvbVN0cmluZyh0aW1lOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgY29uc3QgbWVtb3J5S2V5ID0gSlNPTi5zdHJpbmdpZnkoeyB0aW1lIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0VGltZUZyb21TdHJpbmcuZ2V0KG1lbW9yeUtleSk7XHJcbiAgICBpZiAoY2hlY2tNZW1vcnkpIHtcclxuICAgICAgcmV0dXJuIGNoZWNrTWVtb3J5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gV29ya1RpbWVWYWxpZGF0b3IuZ2V0VGltZUZyb21TdHJpbmcodGltZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRUaW1lRnJvbVN0cmluZy5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQv9GA0L7QstC10YDRj9C10YIsINC00L7RgdGC0YPQv9C90LAg0LvQuCDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60Lgg0L3QsCDQsdC70LjQttCw0LnRiNC10LUg0LLRgNC10LzRjy5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPLCDQtNC70Y8g0LrQvtGC0L7RgNGL0YUg0Lgg0L/RgNC+0LLQtdGA0Y/QtdGC0YHRjyDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINC00L7RgdGC0LDQstC60LhcclxuICAgKiBAcmV0dXJuINCe0LHRjNC10LrRgiwg0YHQvtC00LXRgNC20LDRidC40Lkg0LjQvdGE0L7RgNC80LDRhtC40Y46XHJcbiAgICoge1xyXG4gICAgICAgIGlzV29ya05vdzpib29sZWFuIC0g0JLQvtC30LzQvtC20L3QsCDQu9C4INC00L7RgdGC0LDQstC60LAg0LIg0LHQu9C40LbQsNC50YjQtdC1INCy0YDQtdC80Y9cclxuICAgICAgICBpc05ld0RheTpib29sZWFuIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC40LfQvdCw0LosINGH0YLQviDQuNC3LdC30LAg0YDQsNC30L3QuNGG0Ysg0YfQsNGB0L7QstGL0YUg0L/QvtGP0YHQvtCyINGA0LDRgdGH0LXRgiDQtNCw0YLRiyBcItC/0LXRgNC10L/RgNGL0LPQvdGD0LtcIiDQvdCwINC90L7QstGL0Lkg0LTQtdC90YwuXHJcbiAgICAgICAgY3VycmVudFRpbWU6bnVtYmVyIC0g0KHQu9GD0LbQtdCx0L3Ri9C5INC/0LDRgNCw0LzQtdGC0YAg0LTQu9GPINCy0L3Rg9GC0YDQtdC90L3QtdCz0L4g0LjRgdC/0L7Qu9GM0LfQvtCy0LDQvdC40Y8uXHJcbiAgICAgICAgICDQn9GA0LXQtNGB0YLQsNCy0LvRj9C10YIg0L/RgNC+0LLQtdGA0Y/QtdC80L7QtSDQvNC10YLQvtC00L7QvCDQstGA0LXQvNGPINCyINC80LjQvdGD0YLQsNGFINC+0YIgMDA6MDAg0LIg0YfQsNGB0L7QstC+0Lwg0L/QvtGP0YHQtSDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPLlxyXG4gICAgICAgIGN1cmVudERheVN0YXJ0VGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC90LDRh9Cw0LvQsCDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgICBjdXJlbnREYXlTdG9wVGltZTpudW1iZXIgLSDQodC70YPQttC10LHQvdGL0Lkg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0LLQvdGD0YLRgNC10L3QvdC10LPQviDQuNGB0L/QvtC70YzQt9C+0LLQsNC90LjRjy5cclxuICAgICAgICAgINCf0YDQtdC00YHRgtCw0LLQu9GP0LXRgiDQstGA0LXQvNGPINC+0LrQvtC90YfQsNC90LjRjyDRgNCw0LHQvtGH0LXQs9C+INC00L3RjyDQsiDQvNC40L3Rg9GC0LDRhSDQvtGCIDAwOjAwINCyINGH0LDRgdC+0LLQvtC8INC/0L7Rj9GB0LUg0L/RgNC10LTQv9GA0LjRj9GC0LjRjy5cclxuICAgICAgfVxyXG4gICAqL1xyXG4gIGlzV29ya05vdyhyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zIHwgUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlPzogRGF0ZSk6IFZhbGlkYXRvclJlc3VsdCB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmlzV29ya05vdy5nZXQobWVtb3J5S2V5KTtcclxuICAgIGlmIChjaGVja01lbW9yeSkge1xyXG4gICAgICByZXR1cm4gY2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5pc1dvcmtOb3cocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmlzV29ya05vdy5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICog0JzQtdGC0L7QtCDQstC+0LfQstGA0LDRidCw0LXRgiDQsdC70LjQttCw0LnRiNGD0Y4g0LLQvtC30LzQvtC20L3Rg9GOINC00LDRgtGDLdCy0YDQtdC80Y8g0LfQsNC60LDQt9CwINC00LvRjyDRgdC/0L7RgdC+0LHQsCDQtNC+0YHRgtCw0LLQutC4IFwi0JTQvtGB0YLQsNCy0LrQsCDQutGD0YDRjNC10YDQvtC8XCIuXHJcbiAgICogQHBhcmFtIHJlc3RyaWN0aW9uIC0g0L7QsdGK0LXQutGCLCDRgdC+0LTQtdGA0LbQsNGJ0LjQuSDQuNC90YTQvtGA0LzQsNGG0LjRjiDQviDRgNCw0LHQvtGH0LXQvCDQstGA0LXQvNC10L3QuCDQv9GA0LXQtNC/0YDQuNGP0YLQuNGPINC4INC+0LPRgNCw0L3QuNGH0LXQvdC40Y/RhSDQtNCw0YLRiy/QstGA0LXQvNC10L3QuCDQtNC+0YHRgtCw0LLQutC4LlxyXG4gICAqIEBwYXJhbSBjdXJyZW50ZGF0ZSAtINC+0LHRitC10LrRgiBEYXRlLCDQv9GA0LXQtNGB0YLQsNCy0LvRj9GO0YnQuNC5INGC0LXQutGD0YnQuNC1INC70L7QutCw0LvRjNC90YvQtSDQtNCw0YLRgyDQuCDQstGA0LXQvNGPINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRj1xyXG4gICAqL1xyXG4gIGdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zT3JkZXIsIGN1cnJlbnRkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlRGVsaWV2ZXJ5T3JkZXJEYXRlVGltZShyZXN0cmljdGlvbiwgY3VycmVudGRhdGUpO1xyXG4gICAgICB0aGlzLl9tZW1vcnkuZ2V0UG9zc2libGVEZWxpZXZlcnlPcmRlckRhdGVUaW1lLnNldChtZW1vcnlLZXksIHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCx0LvQuNC20LDQudGI0YPRjiDQstC+0LfQvNC+0LbQvdGD0Y4g0LTQsNGC0YMt0LLRgNC10LzRjyDQt9Cw0LrQsNC30LAg0LTQu9GPINGB0L/QvtGB0L7QsdCwINC00L7RgdGC0LDQstC60LggXCLQodCw0LzQvtCy0YvQstC+0LdcIi5cclxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgICogQHBhcmFtIGN1cnJlbnRkYXRlIC0g0L7QsdGK0LXQutGCIERhdGUsINC/0YDQtdC00YHRgtCw0LLQu9GP0Y7RidC40Lkg0YLQtdC60YPRidC40LUg0LvQvtC60LDQu9GM0L3Ri9C1INC00LDRgtGDINC4INCy0YDQtdC80Y8g0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GPXHJcbiAgICovXHJcbiAgZ2V0UG9zc2libGVTZWxmU2VydmljZU9yZGVyRGF0ZVRpbWUocmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uc09yZGVyLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBtZW1vcnlLZXkgPSBKU09OLnN0cmluZ2lmeSh7IHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSB9KTtcclxuICAgIGNvbnN0IGNoZWNrTWVtb3J5ID0gdGhpcy5fbWVtb3J5LmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiBjaGVja01lbW9yeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFdvcmtUaW1lVmFsaWRhdG9yLmdldFBvc3NpYmxlU2VsZlNlcnZpY2VPcmRlckRhdGVUaW1lKHJlc3RyaWN0aW9uLCBjdXJyZW50ZGF0ZSk7XHJcbiAgICAgIHRoaXMuX21lbW9yeS5nZXRQb3NzaWJsZVNlbGZTZXJ2aWNlT3JkZXJEYXRlVGltZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgKiDQnNC10YLQvtC0INCy0L7Qt9Cy0YDQsNGJ0LDQtdGCINCw0LrRgtGD0LDQu9GM0L3Ri9C1INC00LDQvdC90YvQtSDQviDQstGA0LXQvNC10L3QuCDRgNCw0LHQvtGC0Ysg0LjQtyDQvNCw0YHRgdC40LLQsCDQstGB0LXRhSDQstCw0YDQuNCw0L3RgtC+0LIg0L7QsdGM0LXQutGC0LAgcmVzdHJpY3Rpb24uXHJcbiAgKiBAcGFyYW0gcmVzdHJpY3Rpb24gLSDQvtCx0YrQtdC60YIsINGB0L7QtNC10YDQttCw0YnQuNC5INC40L3RhNC+0YDQvNCw0YbQuNGOINC+INGA0LDQsdC+0YfQtdC8INCy0YDQtdC80LXQvdC4INC/0YDQtdC00L/RgNC40Y/RgtC40Y8g0Lgg0L7Qs9GA0LDQvdC40YfQtdC90LjRj9GFINC00LDRgtGLL9Cy0YDQtdC80LXQvdC4INC00L7RgdGC0LDQstC60LguXHJcbiAgKiBAcGFyYW0gY3VycmVudGRhdGUgLSDQvtCx0YrQtdC60YIgRGF0ZSwg0L/RgNC10LTRgdGC0LDQstC70Y/RjtGJ0LjQuSDRgtC10LrRg9GJ0LjQtSDQu9C+0LrQsNC70YzQvdGL0LUg0LTQsNGC0YMg0Lgg0LLRgNC10LzRjyDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuICAqL1xyXG4gIGdldEN1cnJlbnRXb3JrVGltZShyZXN0cmljdGlvbjogUmVzdHJpY3Rpb25zLCBjdXJyZW50ZGF0ZTogRGF0ZSk6IFdvcmtUaW1lIHtcclxuICAgIGNvbnN0IG1lbW9yeUtleSA9IEpTT04uc3RyaW5naWZ5KHsgcmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlIH0pO1xyXG4gICAgY29uc3QgY2hlY2tNZW1vcnkgPSB0aGlzLl9tZW1vcnkuZ2V0Q3VycmVudFdvcmtUaW1lLmdldChtZW1vcnlLZXkpO1xyXG4gICAgaWYgKGNoZWNrTWVtb3J5KSB7XHJcbiAgICAgIHJldHVybiA8V29ya1RpbWU+Y2hlY2tNZW1vcnk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBXb3JrVGltZVZhbGlkYXRvci5nZXRDdXJyZW50V29ya1RpbWUocmVzdHJpY3Rpb24sIGN1cnJlbnRkYXRlKTtcclxuICAgICAgdGhpcy5fbWVtb3J5LmdldEN1cnJlbnRXb3JrVGltZS5zZXQobWVtb3J5S2V5LCByZXN1bHQpO1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG59XHJcbiJdfQ==