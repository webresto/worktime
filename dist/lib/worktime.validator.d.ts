/**
 * Базовые данные о времени работы - служебный интерфейс.
 */
export interface WorkTimeBase {
    /** время начала рабочего дня*/
    start: string;
    /** время окончания рабочего дня*/
    stop: string;
    /** перерыв на обед*/
    break?: string;
}
/**
 * Информация о времени работы предприятия - служебный интерфейс.
 */
export interface WorkTime extends WorkTimeBase {
    /** день недели, к которому применяется это время доставки   */
    dayOfWeek: string | string[];
    /** ограничения по времени работы для самовывоза */
    selfService?: WorkTimeBase;
}
/**
 * Интерфейс объекта, получаемого от API @webresto/core и содержащего текущие данные о рабочем времени предприятия
 */
export interface Restrictions {
    /** временная зона предприятия */
    timezone?: string;
    /**  массив ограничений по времени работы предприятия для разных дней недели. */
    workTime: WorkTime[];
}
export interface RestrictionsOrder extends Restrictions {
    /** минимальное время доставки*/
    minDeliveryTime: string;
    /**установлено ли на текущий момент ограничение доставки на определенное время */
    deliveryToTimeEnabled: boolean;
    /** ограничение максимальной даты заказа в будущем (в минутах)*/
    periodPossibleForOrder: number;
}
interface ValidatorResult {
    workNow: boolean;
    isNewDay?: boolean;
    currentTime?: number;
    curentDayStartTime?: number;
    curentDayStopTime?: number;
}
/**
 * Класс, содержащий статические методы, необходимые для работы с ограничениями рабочего времени предприятия.
 * Создавать новый объект этого класса для использования методов не требуется.
 */
export declare class WorkTimeValidator {
    /**
     * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @return :string - Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
     */
    static getMaxOrderDate(restriction: RestrictionsOrder, currentdate: Date): string;
    /**
     * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
     * @param time - строка в формате HH:mm - время.
     * @return :number - кол-во минут.
     */
    static getTimeFromString(time: string): number;
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
    static isWorkNow(restriction: Restrictions | RestrictionsOrder, currentdate?: Date): ValidatorResult;
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Доставка курьером".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    static getPossibleDelieveryOrderDateTime(restriction: RestrictionsOrder, currentdate: Date): string;
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    static getPossibleSelfServiceOrderDateTime(restriction: RestrictionsOrder, currentdate: Date): string;
    /**
    * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
    * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
    * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
    */
    static getCurrentWorkTime(restriction: Restrictions, currentdate: Date): WorkTime;
}
export {};
