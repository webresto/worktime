import { WorkTimeValidator } from '../lib/worktime.validator';
import { formatDate } from '../lib/formatDate';
import { expect } from 'chai';

const caseOne = {
  workTime: [{
    dayOfWeek: 'all',
    start: '10:00',
    stop: '20:00',
    break: '00:00-00:00',
    timezone: 'Asia/Yekaterinburg',
    selfService: {
      start: '10:00',
      stop: '20:00',
      break: '00:00-00:00'
    }
  }],
  periodPossibleForOrder: 20160,
  timezone: 'Asia/Yekaterinburg',
  minDeliveryTime: '60'
};

const caseTwo = {
  workTime: [{
    dayOfWeek: 'all',
    start: '10:00',
    stop: '20:00'
    }
  ]
};

const dateForExpect = [
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00', 'en', '+0300')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 07:00:00', 'en', '+0300')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 08:01:00', 'en', '+0300')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 10:00:00', 'en', '+0300')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00', 'en', '+0300')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 12:00:00', 'en', '+0300')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 14:00:00', 'en', '+0300')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 17:00:00', 'en', '+0300')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 19:00:00', 'en', '+0300')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 20:00:00', 'en', '+0300')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 22:00:00', 'en', '+0300')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 23:59:59', 'en', '+0300')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00Z', 'en', '+0300')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00Z', 'en', '+0300')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00Z', 'en', '+0000')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 04:45:00Z', 'en', '+0000')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 05:45:00Z', 'en', '+0000')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 07:00:00Z', 'en', '+0000')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 08:00:00Z', 'en', '+0000')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 10:00:00Z', 'en', '+0000')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 12:00:00Z', 'en', '+0000')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 14:00:00Z', 'en', '+0000')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 15:00:00Z', 'en', '+0000')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 17:00:00Z', 'en', '+0000')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 19:00:00Z', 'en', '+0000')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 20:00:00Z', 'en', '+0000')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 22:00:00Z', 'en', '+0000')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 23:59:59Z', 'en', '+0000')), result: false }
];


const dateForExpectLocal = [
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 07:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 08:01:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 10:01:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 12:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 14:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 17:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 19:00:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 19:59:00', 'en')), result: true },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 20:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 22:00:00', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 23:59:59', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00Z', 'en')), result: false },
  { dt: new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00Z', 'en')), result: true }
];

describe('WorkTimeValidator', () => {

  dateForExpect.forEach(element => {
    it(`Проверяем рабочее время заказа в ${element.dt.toLocaleString()} - ${element.result} `, () =>
    {
      console.log(element, WorkTimeValidator.isWorkNow(caseOne, element.dt));
      expect(WorkTimeValidator.isWorkNow(caseOne, element.dt).workNow).equal(element.result)
    }
    );
  });

  dateForExpectLocal.forEach(element => {
    it(`Проверяем "только" рабочее время в ${element.dt.toLocaleString()} - ${element.result} `, () => {
          console.log(WorkTimeValidator.isWorkNow(caseTwo, element.dt));
          expect(WorkTimeValidator.isWorkNow(caseTwo, element.dt).workNow).equal(element.result)
      }
    );
  });

  it('Проверяем на ошибку, не передадим restriction', () =>
    expect(() => WorkTimeValidator.isWorkNow(undefined, dateForExpect[0].dt)).to.throw('Не передан объект restriction'));
  it('Проверяем на ошибку, не передадим дату', () =>
    expect(() => WorkTimeValidator.isWorkNow(caseOne, undefined)).to.throw('Не передан корректный объект даты'));

  const dateWorkedNow = new Date('2021-02-17 11:00+0500');
  const dateEarlyOneHour = new Date('2021-02-17 09:00+0500');
  const dateAfterStopOneHour = new Date('2021-02-17 21:00+0500');
  ///тесты getPossibleDelieveryOrderDateTime
  it('Проверяем на ошибку, передадим рабочее время 11:00', () =>
    expect(() => WorkTimeValidator.getPossibleDelieveryOrderDateTime(caseOne, dateWorkedNow)).to.throw('Сейчас рабочее время. Расчет не требуется.'));

  it(`Проверяем ближайшее время для 09:00 `, () =>
    expect(WorkTimeValidator.getPossibleDelieveryOrderDateTime(caseOne, dateEarlyOneHour)).equal('2021-02-17 11:01')
  );
  it(`Проверяем ближайшее время для 21:00 `, () =>
    expect(WorkTimeValidator.getPossibleDelieveryOrderDateTime(caseOne, dateAfterStopOneHour)).equal('2021-02-18 11:01')
  );

  ///тесты getPossibleSelfServiceOrderDateTime
  it('Проверяем на ошибку, передадим рабочее время 11:00', () =>
    expect(() => WorkTimeValidator.getPossibleSelfServiceOrderDateTime(caseOne, dateWorkedNow)).to.throw('Сейчас рабочее время. Расчет не требуется.'));

  it(`Проверяем ближайшее время для 09:00 `, () =>
    expect(WorkTimeValidator.getPossibleSelfServiceOrderDateTime(caseOne, dateEarlyOneHour)).equal('2021-02-17 11:01')
  );
  it(`Проверяем ближайшее время для 21:00 `, () =>
    expect(WorkTimeValidator.getPossibleSelfServiceOrderDateTime(caseOne, dateAfterStopOneHour)).equal('2021-02-18 11:01')
  );

  const oneVariableWorkTimeCase = {
    workTime: [{
      dayOfWeek: 'all',
      start: '10:00',
      stop: '20:00',
      break: '00:00-00:00',
      timezone: 'Asia/Yekaterinburg',
      selfService: {
        start: '10:00',
        stop: '20:00',
        break: '00:00-00:00'
      }
    }],
    periodPossibleForOrder: 20160,
    timezone: 'Asia/Yekaterinburg',
    minDeliveryTime: '60'
  }

  const dateMonday = new Date('2021-02-15 11:00');
  const dateTuesday = new Date('2021-02-16 11:00');
  const dateWednesday = new Date('2021-02-17 11:00');
  const dateThursday = new Date('2021-02-18 11:00');
  const dateFriday = new Date('2021-02-19 11:00');
  const dateSaturday = new Date('2021-02-20 11:00');
  const dateSunday = new Date('2021-02-21 11:00');
  const week = [dateMonday, dateTuesday, dateWednesday, dateThursday, dateFriday, dateSaturday, dateSunday];

  week.forEach(
    element => it(
      `Проверяем расписание для restriction из одного элемента с dayOfWeek=all для дня недели ${formatDate(element, 'EEEE', 'en')}`, () =>
      expect(WorkTimeValidator.getCurrentWorkTime(oneVariableWorkTimeCase, element).dayOfWeek).equal('all')
    )
  );

  const twoVariableWorkTimeCase = {
    workTime: [{
      dayOfWeek: 'Friday',
      start: '10:00',
      stop: '20:00',
      break: '00:00-00:00',
      timezone: 'Asia/Yekaterinburg',
      selfService: {
        start: '10:00',
        stop: '20:00',
        break: '00:00-00:00'
      }
    }, {
      dayOfWeek: 'all',
      start: '10:00',
      stop: '20:00',
      break: '00:00-00:00',
      timezone: 'Asia/Yekaterinburg',
      selfService: {
        start: '10:00',
        stop: '20:00',
        break: '00:00-00:00'
      }
    }],
    periodPossibleForOrder: 20160,
    timezone: 'Asia/Yekaterinburg',
    minDeliveryTime: '60'
  };

  week.forEach(
    (element: Date, index: number) => it(
      `Проверяем расписание для restriction с двумя элементами WorkTime - Friday и all. Проверка для дня недели ${formatDate(element, 'EEEE', 'en').toLowerCase()}`, () =>
      expect(WorkTimeValidator.getCurrentWorkTime(twoVariableWorkTimeCase, element).dayOfWeek).equal(
        index === 4 ? 'Friday' : 'all'
      )
    )
  );

  const trioVariableWorkTimeCase = {
    workTime: [
      {
        dayOfWeek: 'friday',
        start: '10:00',
        stop: '21:30',
        lastOrder: '21:30',
        break: '11:00-12:00',
        selfService: {
          start: '08:00',
          stop: '21:00',
          lastOrder: '20:30',
          break: '00:00-00:00'
        }
      },
      {
        dayOfWeek: ['saturday', 'sunday'],
        start: '12:00',
        stop: '18:30',
        break: '14:00-18:00',
        lastOrder: '21:30',
        selfService: {
          start: '08:00',
          stop: '18:00',
          break: '00:00-00:00',
          lastOrder: '21:30'
        }
      },
      {
        dayOfWeek: 'all',
        start: '10:00',
        stop: '21:00',
        lastOrder: '21:30',
        break: '00:00-00:00',
        selfService: {
          start: '10:00',
          stop: '21:00',
          lastOrder: '20:30',
          break: '00:00-00:00'
        }
      }],
    periodPossibleForOrder: 20160,
    timezone: 'Asia/Yekaterinburg',
    minDeliveryTime: '60'
  };

  week.forEach(
    (element: Date, index: number) => it(
      `Проверяем расписание для restriction с тремя элементами WorkTime -  ['saturday', 'sunday'] , Friday и all. Проверка для дня недели ${formatDate(element, 'EEEE', 'en').toLowerCase()}`, () => {
        const expected = expect(WorkTimeValidator.getCurrentWorkTime(trioVariableWorkTimeCase, element).dayOfWeek);
        if (index > 4) {
          return expected.to.includes('saturday');
        } else {
          if (index === 4) {
            return expected.equal('friday');
          } else {
            return expected.equal('all');
          }
        };
      })
  );
});
