# NgWorktime
 Библиотека для работы с ограничениями рабочего времени предприятия

## Установка

npm i @webresto/worktime

## Пример
Импорт

~~~ typescript
import { WorkTimeValidator,TimeZoneIdentifier } from '@webresto/worktime'
~~~

В вашем коде:

~~~ typescript

const currentDate = new Date(); //текущие локальные дата/время пользователя
const restriction:Restrictions = .... ; // объект restriction, полученный от API

const maxOrderDate = WorkTimeValidator.getMaxOrderDate(restriction,currentdate); //максимальная доступная дата доставки
if (WorkTimeValidator.isWorkNow(restriction, currentdate).workNow) {
  ... // сейчас рабочее время предприятия, доставка на ближайшее время доступна
} else {
  ... // Доставка на ближайшее время не доступна.
      // Для доставки курьером:
  const buffer = WorkTimeValidator.getPossibleDelieveryOrderDateTime(restriction, currentdate);
  const [date,time] = buffer.split(' ');

      // Для самовывоза:
  const buffer = WorkTimeValidator.getPossibleSelfServiceOrderDateTime(restriction, currentdate);
  const [date,time] = buffer.split(' ');
}
~~~

## API

Интерфейсы:

~~~ typescript
/**
 * Базовые данные о времени работы - служебный интерфейс.
 */
interface WorkTimeBase {
    /** время начала рабочего дня*/
    start: string;
    /** время окончания рабочего дня*/
    stop: string;
    /** перерыв на обед*/
    break: string;
}
/**
 * Информация о времени работы предприятия - служебный интерфейс.
 */
interface WorkTime extends WorkTimeBase {
    /** день недели, к которому применяется это время доставки   */
    dayOfWeek: string | string[];
    /** ограничения по времени работы для самовывоза */
    selfService: WorkTimeBase;
}
/**
 * Интерфейс объекта, получаемого от API @webresto/core и содержащего текущие данные о рабочем времени предприятия
 */
interface Restrictions {
    /** минимальное время доставки*/
    minDeliveryTime: string;
    /**установлено ли на текущий момент ограничение доставки на определенное время */
    deliveryToTimeEnabled?: boolean;
    /** ограничение максимальной даты заказа в будущем (в минутах)*/
    periodPossibleForOrder: number;
    /** временная зона предприятия */
    timezone: string;
    /**  массив ограничений по времени работы предприятия для разных дней недели. */
    workTime: WorkTime[];
}
~~~

Классы:

~~~ typescript
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
    static getMaxOrderDate(restriction: Restrictions, currentdate: Date): string;

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
     *    isWorkNow:boolean - Возможна ли доставка в ближайшее время
     *    isNewDay:boolean - Служебный параметр для внутреннего использования.
     *      Представляет признак, что из-за разницы часовых поясов расчет даты "перепрыгнул" на новый день.
     *    currentTime:number - Служебный параметр для внутреннего использования.
     *      Представляет проверяемое методом время в минутах от 00:00 в часовом поясе предприятия.
     *    curentDayStartTime:number - Служебный параметр для внутреннего использования.
     *      Представляет время начала рабочего дня в минутах от 00:00 в часовом поясе предприятия.
     *    curentDayStopTime:number - Служебный параметр для внутреннего использования.
     *     Представляет время окончания рабочего дня в минутах от 00:00 в часовом поясе предприятия.
        }
     */
    static isWorkNow(restriction: Restrictions, currentdate: Date): {
        workNow: boolean;
        isNewDay: boolean;
        currentTime: number;
        curentDayStartTime: number;
        curentDayStopTime: number;
    };

    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Доставка курьером".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    static getPossibleDelieveryOrderDateTime(restriction: Restrictions, currentdate: Date): string;

    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    static getPossibleSelfServiceOrderDateTime(restriction: Restrictions, currentdate: Date): string;

    /**
    * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
    * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
    * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
    */
    static getCurrentWorkTime(restriction: Restrictions, currentdate: Date): WorkTime;
}

/**
 * Класс, содержащий статический метод, определяющий смещение часового пояса относительно GMT (+00:00) по переданной строке с названием таймзоны.
 * Создавать новый объект этого класса для использования метода не требуется.
 */
class TimeZoneIdentifier {
  /**
 *  Метод определяет смещение часового пояса относительно GMT (+00:00) по переданной строке с названием таймзоны.
 *  @param zone - Строка с названием таймзоны ( например 'America/New_York').
 *  @return  - Строка, представляющая смещение относительно GMT.
 *
 *  Пример :
 *   const offset = TimeZoneIdentifier.getTimeZoneGMTOffsetfromNameZone('Europe/Moscow');
 *   console.log(offset) /// "+03:00"
 */
  static getTimeZoneGMTOffsetfromNameZone(zone: string): string;
}

~~~

Пример, как выбрать таймзону:
~~~typescript
const d = new Date("2020-04-13T00:00:00.000+08:00");
console.log(
    d.toLocaleString('en-US', { timeZone: 'America/New_York' })
); /// 4/12/2020, 12:00:00 PM
