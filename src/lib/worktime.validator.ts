import { formatDate, isDate } from './formatDate';
import { TimeZoneIdentifier } from './tz';

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
  allowBonusSpending: boolean
} & T;

export interface RestrictionsOrder<T extends {} = {}> extends Restrictions {

  /**
   * GraphQL schema backward compatibility version
   */
  graphqlSchemaBackwardCompatibilityVersion: boolean

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

/** Тип, описывающий строковое представление всех цифр */
type Digits = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

/** Тип, описывающий строковое представление 24 часов одних суток */
export type HoursDigits =
  | '00'
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '18'
  | '19'
  | '20'
  | '21'
  | '22'
  | '23';

/** Тип, описывающий строковое представление 60 минут одного часа*/
export type MinuteDigits = `${'0' | '1' | '2' | '3' | '4' | '5'}${Digits}`;

/** Тип, описывающий строковое представление времени в формате HH:mm -`(00-24 часа):(0-59 минут)` */
export type TimeString = `${HoursDigits}:${MinuteDigits}`;

/** Функция-хелпер для проверки, что переданное значение не является null или undefined */
function isValue<T extends any>(
  value: T | null | undefined
): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/**
 * Функция валидации переданного объекта restriction на соответствие интерфейсу Restrictions
 * @param restriction - проверяемый объект, содержащий информацию о рабочем времени и временной зоне.
 */
function isValidRestriction(restriction: unknown): restriction is Restrictions {
  return (
    typeof restriction === 'object' &&
    isValue(restriction) &&
    'timezone' in restriction &&
    'worktime' in restriction &&
    isValue(restriction.timezone) &&
    isValue(restriction.worktime)
  );
}

/**
 * Функция валидации переданного объекта restriction на соответствие минимальным данным для заказа
 * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
 */
function isValidRestrictionOrder(
  restriction: RestrictionsOrder
): restriction is RestrictionsOrder {
  return (
    isValidRestriction(restriction) &&
    'minDeliveryTimeInMinutes' in restriction &&
    'possibleToOrderInMinutes' in restriction &&
    isValue(restriction.minDeliveryTimeInMinutes) &&
    isValue(restriction.possibleToOrderInMinutes)
  );
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
  static getMaxOrderDate(
    restriction: RestrictionsOrder,
    currentdate: Date
  ): string {
    if (
      isValue(restriction) &&
      isValidRestrictionOrder(restriction) &&
      isDate(currentdate)
    ) {
      return formatDate(
        currentdate.getTime() + restriction.possibleToOrderInMinutes * 60000,
        'yyyy-MM-dd',
        'en'
      );
    } else {
      throw new Error(
        isDate(currentdate)
          ? 'Не передан корректный объект даты'
          : !isValue(restriction)
            ? 'Не передан объект restrictions'
            : 'Передан невалидный обьект restrictions'
      );
    }
  }

  /**
   * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
   * @param time - строка в формате HH:mm -`(00-24 часа):(0-59 минут)` - время.
   * @return кол-во минут.
   */
  static getTimeFromString(time: TimeString): number {
    if (!isValue(time)) {
      throw 'Не передана строка с преобразуемым временем в формате HH:mm';
    } else {
      const regExp = new RegExp(
        /^(00|01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23)+:([0-5]\d)+/
      );
      let checkedTime = time.trim();

      if (checkedTime.includes(' ') || checkedTime.includes('T')) {
        checkedTime = checkedTime.split(
          checkedTime.includes(' ') ? ' ' : 'T'
        )[1];
      }

      if (regExp.test(checkedTime)) {
        return +checkedTime.split(':')[0] * 60 + +checkedTime.split(':')[1];
      } else {
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
  static convertMinutesToTime(time: number): TimeString {
    if (time < 1441) {
      const hour = Math.floor(time / 60);
      const hourStr: HoursDigits = <HoursDigits>(
        (hour <= 9 ? `0${String(hour)}` : String(hour))
      );
      const minutes = String(time - hour * 60);
      const minutesStr: MinuteDigits = <MinuteDigits>(
        `${minutes.length == 1 ? '0' : ''}${minutes}`
      );
      return `${hourStr}:${minutesStr}`;
    } else {
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
  static isWorkNow(
    restriction: Restrictions | RestrictionsOrder,
    currentdate: Date = new Date()
  ): ValidatorResult {
    // Если испольняется в NodeJS
    if (
      isValue(restriction) &&
      !isValue(restriction.timezone) &&
      typeof process !== 'undefined'
    ) {
      restriction.timezone =
        process?.env?.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    if (!isValue(restriction) || !isValidRestriction(restriction)) {
      throw new Error(
        !isDate(currentdate)
          ? 'Не передан корректный объект даты'
          : !isValue(restriction)
            ? 'Не передан объект restrictions'
            : 'Передан невалидный обьект restrictions'
      );
    } else {
      if (
        !isValue(restriction.worktime) ||
        !Object.keys(restriction.worktime).length
      ) {
        return {
          workNow: true,
        };
      }

      const companyLocalTimeZone =
        TimeZoneIdentifier.getTimeZoneGMTOffsetfromNameZone(
          restriction.timezone
        ).split(':');
      const companyLocalTimeZoneDelta =
        +companyLocalTimeZone[0] * 60 + +companyLocalTimeZone[1];
      const lokalTimeDelta =
        companyLocalTimeZoneDelta + currentdate.getTimezoneOffset(); // смещение времени пользователя относительно времени торговой точки
      const currentTimeInMinutesWithLocalDelta =
        WorkTimeValidator.getTimeFromString(
          <TimeString>formatDate(currentdate, 'HH:mm', 'en')
        ) + lokalTimeDelta;
      /**
       * текущее время в минутах с начала дня (600 = 10:00. 1200 = 20:00)
       * если из-за разницы поясов расчет перепрыгнул на новый день, то приводим время к правильному значению в диапазоне 24 часов
       * */
      const currentTime =
        currentTimeInMinutesWithLocalDelta > 1440
          ? currentTimeInMinutesWithLocalDelta - 1440
          : currentTimeInMinutesWithLocalDelta;

      const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(
        restriction,
        currentTimeInMinutesWithLocalDelta > 1440
          ? new Date(currentdate.getTime() + 86400000)
          : currentdate
      ); // текущее рабочее время
      const curentDayStartTime = WorkTimeValidator.getTimeFromString(
        <TimeString>currentDayWorkTime.start
      ); // текущее время начала рабочего дня в минутах
      const curentDayStopTime = WorkTimeValidator.getTimeFromString(
        <TimeString>currentDayWorkTime.stop
      ); // текущее время окончания рабочего дня в минутах
      return {
        workNow:
          currentTime < curentDayStopTime && currentTime > curentDayStartTime,
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
  static getPossibleDelieveryOrderDateTime(
    restriction: RestrictionsOrder,
    currentdate: Date
  ): string {
    if (!isValidRestrictionOrder(restriction)) {
      throw new Error('Не передан или передан невалидный объект restrictions');
    }

    const checkTime = WorkTimeValidator.isWorkNow(restriction, currentdate);

    if (checkTime.workNow && isValue(checkTime.currentTime)) {
      console.log('Сейчас рабочее время. Расчет не требуется.');
      const possibleTime =
        checkTime.currentTime + (+restriction.minDeliveryTimeInMinutes || 0);
      const possibleTimeStr =
        WorkTimeValidator.convertMinutesToTime(possibleTime);
      return formatDate(currentdate, `yyyy-MM-dd ${possibleTimeStr}`, 'en');
    } else {
      if (
        isValue(checkTime.currentTime) &&
        isValue(checkTime.curentDayStopTime)
      ) {
        const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(
          restriction,
          checkTime.isNewDay
            ? new Date(currentdate.getTime() + 86400000)
            : currentdate
        );
        const time =
          this.getTimeFromString(<TimeString>currentDayWorkTime.start) +
          +restriction.minDeliveryTimeInMinutes;
        const timeString = WorkTimeValidator.convertMinutesToTime(time);
        return formatDate(
          checkTime.isNewDay ||
            checkTime.currentTime > checkTime.curentDayStopTime
            ? currentdate.getTime() + 86400000
            : currentdate,
          `yyyy-MM-dd ${timeString}`,
          'en'
        );
      } else {
        throw 'Не удалось рассчитать currentTime и curentDayStopTime.';
      }
    }
  }

  /**
   * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
   * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
   * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
   */
  static getPossibleSelfServiceOrderDateTime(
    restriction: RestrictionsOrder,
    currentdate: Date
  ): string {
    if (!isValidRestrictionOrder(restriction)) {
      throw new Error('Не передан или передан невалидный объект restrictions');
    }

    /**
     * Для обеспечения иммутабельности данных создается новый обьект restrictions, идентичный полученному в параметрах, но с измененным массивом worktime.
     * В массиве worktime обновляются ограничения времени работы с обычных на актуальные для самовывоза.
     * */
    const newRestriction = {
      ...restriction,
      worktime: (<WorkTime[]>restriction.worktime).map((worktime) =>
        worktime.selfService
          ? { ...worktime, ...worktime.selfService }
          : worktime
      ),
    };
    return WorkTimeValidator.getPossibleDelieveryOrderDateTime(
      newRestriction,
      currentdate
    );
  }

  /**
   * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
   * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
   * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
   */
  static getCurrentWorkTime(
    restriction: Restrictions,
    currentdate: Date
  ): WorkTime {
    if (!isValidRestriction(restriction)) {
      throw new Error('Не передан или передан невалидный объект restrictions');
    }

    let i = 0;
    let result = null;

    while (i < restriction.worktime.length && !isValue(result)) {
      if (
        restriction.worktime[i].dayOfWeek === 'all' ||
        (typeof restriction.worktime[i].dayOfWeek === 'string'
          ? (<string>restriction.worktime[i].dayOfWeek).toLowerCase()
          : (<string[]>restriction.worktime[i].dayOfWeek).map((day) =>
            day.toLowerCase()
          )
        ).includes(formatDate(currentdate, 'EEEE', 'en').toLowerCase())
      ) {
        result = restriction.worktime[i];
      }
      i += 1;
    }

    if (!isValue(result)) {
      throw new Error('Нет актуального расписания работы для текущего дня');
    } else {
      return result;
    }
  }

  /**
   * Логика ниже предназначена для использования экземпляра класса WorkTimeValidator
   */

  constructor() { }

  private _memory: {
    getMaxOrderDate: Map<string, string>;
    getTimeFromString: Map<string, number>;
    isWorkNow: Map<string, ValidatorResult>;
    getPossibleDelieveryOrderDateTime: Map<string, string>;
    getPossibleSelfServiceOrderDateTime: Map<string, string>;
    getCurrentWorkTime: Map<string, WorkTime>;
    convertMinutesToTime: Map<string, TimeString>;
  } = {
      getMaxOrderDate: new Map<string, string>(),
      getTimeFromString: new Map<string, number>(),
      isWorkNow: new Map<string, ValidatorResult>(),
      getPossibleDelieveryOrderDateTime: new Map<string, string>(),
      getPossibleSelfServiceOrderDateTime: new Map<string, string>(),
      getCurrentWorkTime: new Map<string, WorkTime>(),
      convertMinutesToTime: new Map<string, TimeString>(),
    };

  /**
   * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
   * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
   * @return :string - Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
   */
  getMaxOrderDate(restriction: RestrictionsOrder, currentdate: Date): string {
    const memoryKey = JSON.stringify({ restriction, currentdate });
    const checkMemory = this._memory.getMaxOrderDate.get(memoryKey);
    if (isValue(checkMemory)) {
      return checkMemory;
    } else {
      const result = WorkTimeValidator.getMaxOrderDate(
        restriction,
        currentdate
      );
      this._memory.getMaxOrderDate.set(memoryKey, result);
      return result;
    }
  }

  /**
   * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
   * @param time - строка в формате HH:mm - время.
   * @return :number - кол-во минут.
   */
  getTimeFromString(time: string): number {
    const memoryKey = JSON.stringify({ time });
    const checkMemory = this._memory.getTimeFromString.get(memoryKey);
    if (isValue(checkMemory)) {
      return checkMemory;
    } else {
      const result = WorkTimeValidator.getTimeFromString(<TimeString>time);
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
  isWorkNow(
    restriction: Restrictions | RestrictionsOrder,
    currentdate?: Date
  ): ValidatorResult {
    const memoryKey = JSON.stringify({ restriction, currentdate });
    const checkMemory = this._memory.isWorkNow.get(memoryKey);
    if (isValue(checkMemory)) {
      return checkMemory;
    } else {
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
  getPossibleDelieveryOrderDateTime(
    restriction: RestrictionsOrder,
    currentdate: Date
  ): string {
    const memoryKey = JSON.stringify({ restriction, currentdate });
    const checkMemory =
      this._memory.getPossibleDelieveryOrderDateTime.get(memoryKey);
    if (isValue(checkMemory)) {
      return checkMemory;
    } else {
      const result = WorkTimeValidator.getPossibleDelieveryOrderDateTime(
        restriction,
        currentdate
      );
      this._memory.getPossibleDelieveryOrderDateTime.set(memoryKey, result);
      return result;
    }
  }
  /**
   * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
   * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
   * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
   */
  getPossibleSelfServiceOrderDateTime(
    restriction: RestrictionsOrder,
    currentdate: Date
  ): string {
    const memoryKey = JSON.stringify({ restriction, currentdate });
    const checkMemory =
      this._memory.getPossibleSelfServiceOrderDateTime.get(memoryKey);
    if (isValue(checkMemory)) {
      return checkMemory;
    } else {
      const result = WorkTimeValidator.getPossibleSelfServiceOrderDateTime(
        restriction,
        currentdate
      );
      this._memory.getPossibleSelfServiceOrderDateTime.set(memoryKey, result);
      return result;
    }
  }
  /**
   * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
   * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
   * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
   */
  getCurrentWorkTime(restriction: Restrictions, currentdate: Date): WorkTime {
    const memoryKey = JSON.stringify({ restriction, currentdate });
    const checkMemory = this._memory.getCurrentWorkTime.get(memoryKey);
    if (isValue(checkMemory)) {
      return <WorkTime>checkMemory;
    } else {
      const result = WorkTimeValidator.getCurrentWorkTime(
        restriction,
        currentdate
      );
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
  convertMinutesToTime(time: number): TimeString {
    const memoryKey = JSON.stringify({ time });
    const checkMemory = this._memory.convertMinutesToTime.get(memoryKey);
    if (isValue(checkMemory)) {
      return checkMemory;
    } else {
      const result = WorkTimeValidator.convertMinutesToTime(time);
      this._memory.convertMinutesToTime.set(memoryKey, result);
      return result;
    }
  }
}
