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
  workNow: boolean,
  isNewDay?: boolean,
  currentTime?: number,
  curentDayStartTime?: number,
  curentDayStopTime?: number
}

/**
 * Функция валидации переданного объекта restriction на соответствие интерфейсу Restrictions
 * @param restriction - проверяемый объект, содержащий информацию о рабочем времени и временной зоне.
 */
function isValidRestriction(restriction: any): restriction is Restrictions {
  return 'timezone' in restriction && 'workTime' in restriction;
}

/**
 * Функция валидации переданного объекта restriction на соответствие минимальным данным для заказа
 * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
 */
function isValidRestrictionOrder(restriction: RestrictionsOrder): restriction is RestrictionsOrder {
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
   * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
   * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
   * @return :string - Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
   */
  static getMaxOrderDate(restriction: RestrictionsOrder, currentdate: Date): string {
    if (restriction && isValidRestrictionOrder(restriction) && isDate(currentdate)) {
      return formatDate(currentdate.getTime() + restriction.periodPossibleForOrder * 60000, 'yyyy-MM-dd', 'en');
    } else {
      throw new Error(
        isDate(currentdate) ?
          'Не передан корректный объект даты' :
          !restriction ? 'Не передан объект restrictions' :
            'Передан невалидный обьект restrictions'
      );
    }
  }

  /**
   * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
   * @param time - строка в формате HH:mm - время.
   * @return :number - кол-во минут.
   */
  static getTimeFromString(time: string): number {
    if (!time) {
      throw new Error('Не передана строка с преобразуемым временем в формате HH:mm');
    } else {
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
  static isWorkNow(restriction: Restrictions | RestrictionsOrder, currentdate: Date = new Date()): ValidatorResult {

    if (!restriction.workTime || !Object.keys(restriction.workTime).length) {

      return {
        workNow: true
      }
    };

    // Если испольняется в NodeJS
    if (typeof process !== 'undefined' && !restriction.timezone) {
      restriction.timezone = process.env.TZ ? process.env.TZ : Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    if (!restriction || !isValidRestriction(restriction)) {
      throw new Error(
        !isDate(currentdate) ? 'Не передан корректный объект даты' :
          !restriction ? 'Не передан объект restrictions'
            : 'Передан невалидный обьект restrictions');
    } else {
      const companyLocalTimeZone = TimeZoneIdentifier.getTimeZoneGMTOffsetfromNameZone(restriction.timezone).split(':');
      const companyLocalTimeZoneDelta = +companyLocalTimeZone[0] * 60 + (+(companyLocalTimeZone[1]));
      const lokalTimeDelta = companyLocalTimeZoneDelta + currentdate.getTimezoneOffset(); // смещение времени пользователя относительно времени торговой точки
      const currentTimeInMinutesWithLocalDelta = WorkTimeValidator.getTimeFromString(formatDate(currentdate, 'HH:mm', 'en')) + lokalTimeDelta;
      const currentTime = currentTimeInMinutesWithLocalDelta > 1440 ? currentTimeInMinutesWithLocalDelta - 1440 : currentTimeInMinutesWithLocalDelta;
      /**
       * текущее время в минутах с начала дня (600 = 10:00. 1200 = 20:00)
       * если из-за разницы поясов расчет перепрыгнул на новый день, то приводим время к правильному значению в диапазоне 24 часов
       * */
      const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(
        restriction,
        currentTimeInMinutesWithLocalDelta > 1440 ? new Date(currentdate.getTime() + 86400000) : currentdate
      ); // текущее рабочее время
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
  static getPossibleDelieveryOrderDateTime(restriction: RestrictionsOrder, currentdate: Date): string {
    const checkTime = WorkTimeValidator.isWorkNow(restriction, currentdate);

    if (checkTime.workNow) {

      console.log('Сейчас рабочее время. Расчет не требуется.');
      const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(
        restriction,
        checkTime.isNewDay ? new Date(currentdate.getTime() + 86400000) : currentdate
      );

      return formatDate(currentdate, `yyyy-MM-dd ${currentDayWorkTime.start}`, 'en')
    } else {

      if (checkTime.currentTime && checkTime.curentDayStopTime) {

        const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(
          restriction,
          checkTime.isNewDay ? new Date(currentdate.getTime() + 86400000) : currentdate
        );
        const time = this.getTimeFromString(currentDayWorkTime.start) + (+restriction.minDeliveryTime) + 1;
        const hour = Math.floor(time / 60);
        const minutes = time - (hour * 60);

        return formatDate(
          checkTime.isNewDay || checkTime.currentTime > checkTime.curentDayStopTime ? (currentdate.getTime() + 86400000) : currentdate,
          `yyyy-MM-dd ${hour <= 9 ? '0' + hour : hour}:${minutes <= 9 ? '0' + minutes : minutes}`,
          'en');
      } else {
        throw 'Не удалось рассчитать currentTime и curentDayStopTime.';
      };
    }
  }

  /**
   * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
   * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
   * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
   */
  static getPossibleSelfServiceOrderDateTime(restriction: RestrictionsOrder, currentdate: Date): string {
    /**
     * Для обеспечения иммутабельности данных создается новый обьект restrictions, идентичный полученному в параметрах, но с измененным массивом workTime.
     * В массиве workTime обновляются ограничения времени работы с обычных на актуальные для самовывоза.
     * */
    const newRestriction = {
      ...restriction, workTime: (<WorkTime[]>restriction.workTime).map(workTime => workTime.selfService ? ({ ...workTime, ...workTime.selfService }) : workTime)
    };
    return WorkTimeValidator.getPossibleDelieveryOrderDateTime(newRestriction, currentdate);
  }

  /**
  * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
  * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
  * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
  */
  static getCurrentWorkTime(restriction: Restrictions, currentdate: Date): WorkTime {
    let i = 0;
    let result = null;
    while (i < restriction.workTime.length && !result) {
      if (restriction.workTime[i].dayOfWeek === 'all' || (
        typeof restriction.workTime[i].dayOfWeek === 'string' ?
          (<string>restriction.workTime[i].dayOfWeek).toLowerCase() :
          (<string[]>restriction.workTime[i].dayOfWeek).map(day => day.toLowerCase())
      ).includes(formatDate(currentdate, 'EEEE', 'en').toLowerCase())) {
        result = restriction.workTime[i];
      }
      i += 1;
    }
    if (!result) {
      throw new Error('Нет актуального расписания работы для текущего дня');
    } else {
      return result;
    }
  }

  /**
  * Логика ниже предназначена для использования экземпляра класса WorkTimeValidator 
  */

  /**
   * 
   * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
   */

  constructor(public restriction: Restrictions) { }

  private _memory: {
    getMaxOrderDate: Map<string, string>;
    getTimeFromString: Map<string, number>;
    isWorkNow: Map<string, ValidatorResult>;
    getPossibleDelieveryOrderDateTime: Map<string, string>;
    getPossibleSelfServiceOrderDateTime: Map<string, string>;
    getCurrentWorkTime: Map<string, WorkTime>;
  } = {
      getMaxOrderDate: new Map<string, string>(),
      getTimeFromString: new Map<string, number>(),
      isWorkNow: new Map<string, ValidatorResult>(),
      getPossibleDelieveryOrderDateTime: new Map<string, string>(),
      getPossibleSelfServiceOrderDateTime: new Map<string, string>(),
      getCurrentWorkTime: new Map<string, WorkTime>()
    };

  /**
    * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
    * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
    * @return :string - Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
    */
  getMaxOrderDate(restriction: RestrictionsOrder, currentdate: Date): string {
    const memoryKey = JSON.stringify({ restriction, currentdate });
    const checkMemory = this._memory.getMaxOrderDate.get(memoryKey);
    if (checkMemory) {
      return checkMemory;
    } else {
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
  getTimeFromString(time: string): number {
    const memoryKey = JSON.stringify({ time });
    const checkMemory = this._memory.getTimeFromString.get(memoryKey);
    if (checkMemory) {
      return checkMemory;
    } else {
      const result = WorkTimeValidator.getTimeFromString(time);
      this._memory.getTimeFromString.set(memoryKey, result);
      return result;
    }
  };
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
  isWorkNow(restriction: Restrictions | RestrictionsOrder, currentdate?: Date): ValidatorResult {
    const memoryKey = JSON.stringify({ restriction, currentdate });
    const checkMemory = this._memory.isWorkNow.get(memoryKey);
    if (checkMemory) {
      return checkMemory;
    } else {
      const result = WorkTimeValidator.isWorkNow(restriction, currentdate);
      this._memory.isWorkNow.set(memoryKey, result);
      return result;
    }
  };
  /**
   * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Доставка курьером".
   * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
   * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
   */
  getPossibleDelieveryOrderDateTime(restriction: RestrictionsOrder, currentdate: Date): string {
    const memoryKey = JSON.stringify({ restriction, currentdate });
    const checkMemory = this._memory.getPossibleDelieveryOrderDateTime.get(memoryKey);
    if (checkMemory) {
      return checkMemory;
    } else {
      const result = WorkTimeValidator.getPossibleDelieveryOrderDateTime(restriction, currentdate);
      this._memory.getPossibleDelieveryOrderDateTime.set(memoryKey, result);
      return result;
    }
  };
  /**
   * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
   * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
   * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
   */
  getPossibleSelfServiceOrderDateTime(restriction: RestrictionsOrder, currentdate: Date): string {
    const memoryKey = JSON.stringify({ restriction, currentdate });
    const checkMemory = this._memory.getPossibleSelfServiceOrderDateTime.get(memoryKey);
    if (checkMemory) {
      return checkMemory;
    } else {
      const result = WorkTimeValidator.getPossibleSelfServiceOrderDateTime(restriction, currentdate);
      this._memory.getPossibleSelfServiceOrderDateTime.set(memoryKey, result);
      return result;
    }
  };
  /**
  * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
  * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
  * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
  */
  getCurrentWorkTime(restriction: Restrictions, currentdate: Date): WorkTime {
    const memoryKey = JSON.stringify({ restriction, currentdate });
    const checkMemory = this._memory.getCurrentWorkTime.get(memoryKey);
    if (checkMemory) {
      return <WorkTime>checkMemory;
    } else {
      const result = WorkTimeValidator.getCurrentWorkTime(restriction, currentdate);
      this._memory.getCurrentWorkTime.set(memoryKey, result);
      return result;
    }
  };

}
