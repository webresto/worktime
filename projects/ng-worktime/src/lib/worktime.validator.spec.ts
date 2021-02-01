import { WorkTimeValidator } from './worktime.validator';
import { formatDate } from '@angular/common';
import { RestrictionsOrder } from 'dist/public-api';

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
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 07:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 08:01:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 10:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 12:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 14:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 17:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 19:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 20:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 22:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 23:59:59', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00Z', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00Z', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00Z', 'en', "+0000")), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 04:45:00Z', 'en', "+0000")), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 05:45:00Z', 'en', "+0000")), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 07:00:00Z', 'en', "+0000")), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 08:00:00Z', 'en', "+0000")), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 10:00:00Z', 'en', "+0000")), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 12:00:00Z', 'en', "+0000")), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 14:00:00Z', 'en', "+0000")), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 15:00:00Z', 'en', "+0000")), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 17:00:00Z', 'en', "+0000")), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 19:00:00Z', 'en', "+0000")), result: false },
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

  dateForExpect.forEach(element => {
    it(`Проверяем рабочее время в ${element.dt.toLocaleString()} - ${element.result} `, () =>
      expect(WorkTimeValidator.isWorkNow(caseOne, element.dt).workNow).toEqual(element.result)
    );
  });

  const cases = [{
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
  },
  {
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
  },
  {
    workTime: [
      {
        dayOfWeek: "Friday",
        start: "10:00",
        stop: "20:00",
        break: "00:00-00:00",
        timezone: "Asia/Yekaterinburg",
        selfService: {
          start: "10:00",
          stop: "20:00",
          break: "00:00-00:00"
        }
      }, {
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
  },
  {
    workTime: [{
      "dayOfWeek": "all",
      "start": "10:00",
      "stop": "21:00",
      "lastOrder": "21:30",
      "break": "00:00-00:00",
      "selfService": {
        "start": "10:00",
        "stop": "21:00",
        "lastOrder": "20:30",
        "break": "00:00-00:00"
      }
    },
    {
      "dayOfWeek": "friday",
      "start": "10:00",
      "stop": "21:30",
      "lastOrder": "21:30",
      "break": "11:00-12:00",
      "selfService": {
        "start": "08:00",
        "stop": "21:00",
        "lastOrder": "20:30",
        "break": "00:00-00:00"
      }
    },
    {
      "dayOfWeek": ["saturday", "sunday"],
      "start": "12:00",
      "stop": "18:30",
      "break": "14:00-18:00",
      "lastOrder": "21:30",
      "selfService": {
        "start": "08:00",
        "stop": "18:00",
        "break": "00:00-00:00",
        "lastOrder": "21:30"
      }
    }],
    periodPossibleForOrder: 20160,
    timezone: "Asia/Yekaterinburg",
    minDeliveryTime: "60"
  },
  ];


})
