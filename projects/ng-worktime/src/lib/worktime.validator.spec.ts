import { WorkTimeValidator } from './worktime.validator';
import { formatDate } from '@angular/common';

const caseOne = {
  workTime: [{
    dayOfWeek: "all",
    start: "10:00",
    stop: "20:00",
    break: "00:00-00:00",
    timezone: "Asia/Yekaterinburg",
    selfService: {
      start: "10:00",
      stop: "20:00",
      break: "00:00-00:00"
    }
  }],
  periodPossibleForOrder: 20160,
  timezone: "Asia/Yekaterinburg",
  minDeliveryTime: "60"
}

const dateForExpect = [
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 12:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 14:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 20:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 22:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 23:59:59', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00Z', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00Z', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 12:00:00Z', 'en', "+0000")), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 14:00:00Z', 'en', "+0000")), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 20:00:00Z', 'en', "+0000")), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 22:00:00Z', 'en', "+0000")), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 23:59:59Z', 'en', "+0000")), result: false }
]

describe('WorkTimeValidator', () => {
  it('Объект создается', () => {
    expect(
      new WorkTimeValidator()
    ).toBeTruthy();
  });

  dateForExpect.forEach(element => {
    it(`Проверяем рабочее время в ${element.dt.toLocaleString()} - ${element.result} `, () =>
      expect(WorkTimeValidator.isWorkNow(caseOne, element.dt).workNow).toEqual(element.result)
    );
  });

})
