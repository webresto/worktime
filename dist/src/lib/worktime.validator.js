"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkTimeValidator = void 0;
const formatDate_1 = require("./formatDate");
const tz_1 = require("./tz");
/**
 * Функция валидации переданного объекта restriction на соответствие интерфейсу RestrictionsOrder
 * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
 */
function isValidRestrictionOrder(restriction) {
    return 'minDeliveryTime' in restriction && 'periodPossibleForOrder' in restriction && 'timezone' in restriction && 'workTime' in restriction;
}
/**
 * Класс, содержащий статические методы, необходимые для работы с ограничениями рабочего времени предприятия.
 * Создавать новый объект этого класса для использования методов не требуется.
 */
class WorkTimeValidator {
    /**
     * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @return :string - Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
     */
    static getMaxOrderDate(restriction, currentdate) {
        if (restriction && isValidRestrictionOrder(restriction) && formatDate_1.isDate(currentdate)) {
            return formatDate_1.formatDate(currentdate.getTime() + restriction.periodPossibleForOrder * 60000, 'yyyy-MM-dd', 'en');
        }
        else {
            throw new Error(formatDate_1.isDate(currentdate) ?
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
    static isWorkNow(restriction, currentdate) {
        if (!restriction || !isValidRestrictionOrder(restriction) || !formatDate_1.isDate(currentdate)) {
            throw new Error(!formatDate_1.isDate(currentdate) ? 'Не передан корректный объект даты' :
                !restriction ? 'Не передан объект restrictions'
                    : 'Передан невалидный обьект restrictions');
        }
        else {
            const companyLocalTimeZone = tz_1.TimeZoneIdentifier.getTimeZoneGMTOffsetfromNameZone(restriction.timezone).split(':');
            const companyLocalTimeZoneDelta = +companyLocalTimeZone[0] * 60 + (+(companyLocalTimeZone[1]));
            const lokalTimeDelta = companyLocalTimeZoneDelta + currentdate.getTimezoneOffset(); // смещение времени пользователя относительно времени торговой точки
            const currentTimeInMinutesWithLocalDelta = WorkTimeValidator.getTimeFromString(formatDate_1.formatDate(currentdate, 'HH:mm', 'en')) + lokalTimeDelta;
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
        if (checkTime.workNow) {
            throw new Error('Сейчас рабочее время. Расчет не требуется.');
        }
        else {
            const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, checkTime.isNewDay ? new Date(currentdate.getTime() + 86400000) : currentdate);
            const time = this.getTimeFromString(currentDayWorkTime.start) + (+restriction.minDeliveryTime) + 1;
            const hour = Math.floor(time / 60);
            const minutes = time - (hour * 60);
            return formatDate_1.formatDate(checkTime.isNewDay || checkTime.currentTime > checkTime.curentDayStopTime ? (currentdate.getTime() + 86400000) : currentdate, `yyyy-MM-dd ${hour <= 9 ? '0' + hour : hour}:${minutes <= 9 ? '0' + minutes : minutes}`, 'en');
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
        const newRestriction = Object.assign(Object.assign({}, restriction), { workTime: restriction.workTime.map(workTime => workTime.selfService ? (Object.assign(Object.assign({}, workTime), workTime.selfService)) : workTime) });
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
                restriction.workTime[i].dayOfWeek.map(day => day.toLowerCase())).includes(formatDate_1.formatDate(currentdate, 'EEEE', 'en').toLowerCase())) {
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
}
exports.WorkTimeValidator = WorkTimeValidator;
