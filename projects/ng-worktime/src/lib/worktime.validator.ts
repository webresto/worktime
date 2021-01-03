import { formatDate } from '@angular/common';

/**
 * Базовые данные о времени работы.
 */
export declare interface WorkTimeBase {
  /** время начала рабочего дня*/
  start: string;
  /** время окончания рабочего дня*/
  stop: string;
  /** перерыв на обед*/
  break: string;
}

/**
 * Информация о времени работы предприятия
 */
export declare interface WorkTime extends WorkTimeBase {
  /** день недели, к которому применяется это время доставки   */
  dayOfWeek: string;
  /** ограничения по времени работы для самовывоза */
  selfService: WorkTimeBase;
}

/**
 * Обьъект, получаемый от API и содержащий текущие данные о рабочем времени предприятия
 */
declare interface RestrictionsOrder {
  /** минимальное время доставки*/
  minDeliveryTime: string | undefined;
  /**установлено ли на текущий момент ограничение доставки на определенное время */
  deliveryToTimeEnabled: boolean;
  /** ограничение максимальной даты заказа в будущем (в минутах)*/
  periodPossibleForOrder: number;
  /** временная зона предприятия */
  timezone: string | undefined;
  /**  массив ограничений по времени работы предприятия для разных дней недели. */
  workTime: WorkTime[];
}

function isValidRestrictionOrder(restriction: any): boolean {
  return 'minDeliveryTime' in restriction && 'periodPossibleForOrder' in restriction && 'timezone' in restriction && 'workTime' in restriction
}

export class WorkTimeValidator {

  static getMaxOrderDate(restictions: RestrictionsOrder): string {
    if (restictions && isValidRestrictionOrder(restictions)) {
      return formatDate(Date.now() + restictions.periodPossibleForOrder * 60000, 'yyyy-MM-dd', 'en');
    } else {
      throw new Error(!restictions ? 'Not enough data.' : 'Data not valid');
    };
  }

  static getTimeFromString(time: string): number {
    if (!time) {
      throw new Error('Not enough data.');
    } else {
      return (+time.split(':')[0]) * 60 + (+time.split(':')[1]);
    };
  }

  static isWorkNow(restriction: RestrictionsOrder, currentdate: Date): boolean {
    const lokalTimeDelta = 300 + currentdate.getTimezoneOffset(); //смещение времени пользователя относительно GMT +5
    const unSafecurrentTime = this.getTimeFromString(formatDate(currentdate, "HH:mm", "en"));
    const currentTime = unSafecurrentTime + lokalTimeDelta > 1440 ? unSafecurrentTime + lokalTimeDelta - 1440 : unSafecurrentTime + lokalTimeDelta; //текущее время в минутах с начала дня (600 = 10:00. 1200 = 20:00)
    // если из-за разницы поясов расчет перепрыгнул на новый день, то приводим время к правильному значению в диапазоне 24 часов
    const currentDayWorkTime = restriction.workTime[0]; // текущее рабочее время
    const curentDayStartTime = this.getTimeFromString(currentDayWorkTime.start); //текущее время начала рабочего дня в минутах
    const curentDayStopTime = this.getTimeFromString(currentDayWorkTime.stop); //текущее время окончания рабочего дня в минутах
    return currentTime < curentDayStopTime && currentTime > curentDayStartTime;
  }

  static getPossibleDelieveryOrderDateTime(restriction: RestrictionsOrder, currentdate: Date): string {
    return ''
  }

  static getPossibleSelfServiceOrderDateTime(restriction: RestrictionsOrder, currentdate: Date): string {
    return ''
  }

  /*
        if (currentTime < curentDayStartTime) {

          (<FormGroup>this.orderForm.controls.deliveryTimeInfo).controls.deliveryType.setValue('date-time');
          // блокируем "как можно скорее"
          this.disableButtonVariableDelivery$.next({ fast: true, toTime: false });
          //если при расчете времени была корректировка значения засчет "прыжка" на следующий день, обновляем значения контрола и для валидаторов актуальной датой
          if (this.getTimeFromString(this.ui.formatDate(currentdate, "HH:mm", "en"))+lokalTimeDelta > 1440) {
            (<FormGroup>this.orderForm.controls.deliveryTimeInfo).controls.deliveryDate.setValue(
              this.ui.formatDate(Date.now() + 86400001, 'yyyy-MM-dd', 'en')
            );
            this.dateMin = this.ui.formatDate(Date.now(), 'yyyy-MM-dd', 'en');
            this.dateMax = this.ui.formatDate(Date.now()+86400001 + restictions.periodPossibleForOrder * 60000, 'yyyy-MM-dd', 'en')
          };
          const time = this.getTimeFromString(currentDayWorkTime.start) + (+restictions.minDeliveryTime) + 1;
          const hour = Math.floor(time / 60);
          const minutes = time - (hour * 60);
          const newTime = `${hour <= 9 ? '0' + hour : hour}:${minutes <= 9 ? '0' + minutes : minutes}`;
          (<FormGroup>this.orderForm.controls.deliveryTimeInfo).controls.deliveryTime.setValue(newTime);
        } else {
          if (currentTime > curentDayStopTime) {
            (<FormGroup>this.orderForm.controls.deliveryTimeInfo).controls.deliveryType.setValue('date-time');
            // блокируем "как можно скорее"
            this.disableButtonVariableDelivery$.next({ fast: true, toTime: false });
            (<FormGroup>this.orderForm.controls.deliveryTimeInfo).controls.deliveryDate.setValue(
              this.ui.formatDate(Date.now() + 86400001, 'yyyy-MM-dd', 'en')
            );
            const time = this.getTimeFromString(currentDayWorkTime.start) + (+restictions.minDeliveryTime) + 1;
            const hour = Math.floor(time / 60);
            const minutes = time - (hour * 60);
            const newTime = `${hour <= 9 ? '0' + hour : hour}:${minutes <= 9 ? '0' + minutes : minutes}`;
            (<FormGroup>this.orderForm.controls.deliveryTimeInfo).controls.deliveryTime.setValue(newTime);
          } else {
            if (!restictions?.deliveryToTimeEnabled) {
              (<FormGroup>this.orderForm.controls.deliveryTimeInfo).controls.deliveryType.setValue('fast');
              this.disableButtonVariableDelivery$.next({ fast: false, toTime: true }); // блок доставки ко времени
            };
          }
        };
      };
      */
}