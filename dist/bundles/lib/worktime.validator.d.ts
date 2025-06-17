import { TimeZoneString } from './tz';
/**
 * Базовые данные о времени работы - служебный интерфейс.
 */
export interface WorkTimeBase {
    /** время начала рабочего дня*/
    start: TimeString;
    /** время окончания рабочего дня*/
    stop: TimeString;
    /** перерыв на обед*/
    break?: `${number}${number}:${number}${number}-${number}${number}:${number}${number}`;
}
type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
/**
 * Информация о времени работы предприятия - служебный интерфейс.
 */
export interface WorkTime extends WorkTimeBase {
    /** день недели, к которому применяется это время */
    dayOfWeek: Day[];
    /**
     * @deprecated
     * ограничения по времени работы для самовывоза
    */
    selfService?: WorkTimeBase;
}
/**
 * Интерфейс объекта, получаемого от API @webresto/core и содержащего текущие данные о рабочем времени предприятия
 */
export interface Restrictions {
    /** temporary zone of the enterprise */
    timezone: TimeZoneString;
    /**  массив ограничений по времени работы предприятия для разных дней недели. */
    worktime: WorkTime[];
}
export interface HtmlFormField {
    id: string;
    type: string;
    label: string;
    description: string;
    required: boolean;
    regex: string;
}
export interface Country {
    phoneCode: string;
    iso: string;
    name: string;
    nativeCountryName: string;
    language: string[];
    currency: string;
    currencySymbol: string;
    currencyISO: string;
    currencyUnit: string;
    currencyDenomination: number;
    phoneMask: string[];
    flag: string;
}
/** Данные о модели авторизации пользователей на сайте предприятия */
/**
 * @deprecated нужно вынести из либы работы с расписаниями
 */
export type UserRestrictions<T extends {} = {}> = {
    /** Показывает, какой вид данных используется пользователем для авторизации */
    loginField: string;
    /**
     * Zodiac sign, Human desing type, Best Friend, referal link etc
     */
    customFields?: HtmlFormField[] | null;
    /**
     * possible 3 variants ['required', 'from_otp', 'disabled'] by default: `from_otp` it means what need only OTP, for next logins  passwordRequired, disabled is means password forbidden and you need all time get OTP password
     */
    passwordPolicy: 'required' | 'from_otp' | 'disabled';
    /**
     * by default = false
     */
    loginOTPRequired: boolean;
    /**
     * Список стран, телефонные коды которых доступны для указания в номере телефона пользователя
     */
    allowedPhoneCountries: Country[];
    /**
     * Ссылка на политику обработки персональных данных
     */
    linkToProcessingPersonalData: string;
    /**
     * Ссылка на пользовательское соглашение
     */
    linkToUserAgreement: string;
    /**
     * Длина кода подтверждения OTP
     */
    OTPlength: number;
    /**
     * Allow spending bonuses
     */
    allowBonusSpending: boolean;
} & T;
/**
 * @deprecated Это нужно перенести из либы worktime в ngGQL потомучто тут очень много всего что не относится к ворктайму
 */
export interface RestrictionsOrder<T extends {} = {}> extends Restrictions {
    /**
     * GraphQL schema backward compatibility version
     */
    graphqlSchemaBackwardCompatibilityVersion: number;
    /** минимальное время доставки*/
    minDeliveryTimeInMinutes: string;
    /** ограничение максимальной даты заказа в будущем (в минутах)*/
    possibleToOrderInMinutes: number;
    /**  установлено ли на текущий момент ограничение доставки на определенное время */
    deliveryToTimeEnabled?: boolean;
    /** Дополнительный комментарий по доставке */
    deliveryDescription?: string;
    /** Разновидность вводимой капчи */
    captchaType?: string | null;
    /** Данные о модели авторизации пользователей на сайте предприятия */
    user?: UserRestrictions<T> | null;
}
export interface ValidatorResult {
    workNow: boolean;
    isNewDay?: boolean;
    currentTime?: number;
    curentDayStartTime?: number;
    curentDayStopTime?: number;
}
type HoursDigits = `${number}${number}`;
type MinuteDigits = `${number}${number}`;
export type TimeString = `${HoursDigits}:${MinuteDigits}`;
/**
 * Класс, содержащий статические методы, необходимые для работы с ограничениями рабочего времени предприятия.
 * Создавать новый экземпляр этого класса для использования статических методов не требуется.
 *
 * При этом при создании экземпляра класса у объекта также будут доступны собственные реализации
 * всех статических методов.
 * Эти реализации отличаются от вызовов статических методов только мемоизацией выполненных расчетов.
 *
 */
export declare class WorkTimeValidator {
    /**
     * @deprecated Будет перемещена из либы
     * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @return Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
     */
    static getMaxOrderDate(restriction: RestrictionsOrder, currentdate: Date): string;
    /**
     * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
     * @param time - строка в формате HH:mm -`(00-24 часа):(0-59 минут)` - время.
     * @return кол-во минут.
     */
    static getTimeFromString(time: TimeString): number;
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
    static convertMinutesToTime(time: number): TimeString;
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
    /**
     * Логика ниже предназначена для использования экземпляра класса WorkTimeValidator
     */
    constructor();
    private _memory;
    /**
     * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @return :string - Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
     */
    getMaxOrderDate(restriction: RestrictionsOrder, currentdate: Date): string;
    /**
     * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
     * @param time - строка в формате HH:mm - время.
     * @return :number - кол-во минут.
     */
    getTimeFromString(time: string): number;
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
    isWorkNow(restriction: Restrictions | RestrictionsOrder, currentdate?: Date): ValidatorResult;
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Доставка курьером".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    getPossibleDelieveryOrderDateTime(restriction: RestrictionsOrder, currentdate: Date): string;
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    getPossibleSelfServiceOrderDateTime(restriction: RestrictionsOrder, currentdate: Date): string;
    /**
     * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    getCurrentWorkTime(restriction: Restrictions, currentdate: Date): WorkTime;
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
    convertMinutesToTime(time: number): TimeString;
}
export {};
