import { formatDate } from '@angular/common';

export declare interface WorkTimeBase {
  start: string;
  stop: string;
  break: string;
}
export declare interface WorkTime extends WorkTimeBase {
  dayOfWeek: string;
  selfService: WorkTimeBase;
}

declare interface IRestrictionsOrder {
  minDeliveryTime: string | undefined;
  deliveryToTimeEnabled: boolean;
  periodPossibleForOrder: number;
  timezone: string | undefined;
  workTime: WorkTime[] | undefined;
}

export class RestrictionsOrder implements IRestrictionsOrder {
  constructor() { };
  minDeliveryTime = undefined;
  deliveryToTimeEnabled = false;
  periodPossibleForOrder: number = 0;
  timezone = undefined;
  workTime = undefined;
}

export class WorkTimeValidator {

  static getMaxOrderDate(restictions: RestrictionsOrder): string {
    if (restictions && restictions instanceof RestrictionsOrder) {
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

  /*this.restriction = restictions; // сохраняем объект с ограничениями
       else {
        const currentdate = new Date(); //текущая дата
        const lokalTimeDelta = 300 + currentdate.getTimezoneOffset(); //смещение времени пользователя относительно GMT +5
        const currentTime = this.getTimeFromString(this.ui.formatDate(currentdate, "HH:mm", "en"))+lokalTimeDelta > 1440 ?
          this.getTimeFromString(this.ui.formatDate(currentdate, "HH:mm", "en"))+lokalTimeDelta-1440:
          this.getTimeFromString(this.ui.formatDate(currentdate, "HH:mm", "en"))+lokalTimeDelta;
        ; //текущее время в минутах с начала дня (600 = 10:00. 1200 = 20:00)
        // если из-за разницы поясов расчет перепрыгнул на новый день, то приводим время к правильному значению в диапазоне 24 часов
        const currentDayWorkTime = this.restriction.workTime[0]; // текущее рабочее время
        const curentDayStartTime = this.getTimeFromString(currentDayWorkTime.start); //текущее время начала рабочего дня в минутах
        const curentDayStopTime = this.getTimeFromString(currentDayWorkTime.stop); //текущее время окончания рабочего дня в минутах
        console.log(
          '\n//текущая дата', currentdate,
          '\n//смещение времени пользователя относительно GMT +5', lokalTimeDelta,
          '\n//текущее время в минутах с начала дня (600 = 10:00. 1200 = 20:00)', currentTime,
          '\n// текущее рабочее время', currentDayWorkTime,
          ' \n//текущее время начала рабочего дня в минутах', curentDayStartTime,
          ' \n//текущее время окончания рабочего дня в минутах', curentDayStopTime,
          '\ncurrentTime < curentDayStartTime', currentTime < curentDayStartTime,
          '\ncurrentTime > curentDayStopTime', currentTime > curentDayStopTime,
          '\n!restictions?.deliveryToTimeEnabled', !restictions?.deliveryToTimeEnabled
        )

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