# NgWorktime

## Установка

npm i @webresto/ng-worktime

## Использование
Импортируйте необходимый функционал

~~~ typescript
import { WorkTimeValidator, RestrictionsOrder } from '@webresto/ng-worktime'
~~~

В вашем коде:
~~~ typescript

const currentDate = new Date(); //текущие локальные дата/время пользователя
const restriction:RestrictionsOrder = .... ; // объект restriction, полученный от API

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