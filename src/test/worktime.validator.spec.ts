
import {
  Restrictions,
  RestrictionsOrder,
  WorkTimeValidator,
} from '../lib/worktime.validator';
import { formatDate } from '../lib/formatDate';
import { expect } from 'chai';
import { TimeZoneIdentifier } from '../lib/tz';
const envOffset = TimeZoneIdentifier.getTimeZoneGMTOffset().replace(':', '');
const all = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


const caseOne: RestrictionsOrder = {
  worktime: [
    {
      dayOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      start: '10:00',
      stop: '20:00',
      break: '00:00-00:00'
    },
  ],
  deliveryToTimeEnabled: true,
  possibleToOrderInMinutes: 20160,
  timezone: 'Asia/Yekaterinburg',
  minDeliveryTimeInMinutes: '60',
  graphqlSchemaBackwardCompatibilityVersion: 0
};

const caseTwo: Restrictions = {
  worktime: [
    {
      dayOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      start: '10:00',
      stop: '20:00',
    },
  ],
  //@ts-ignore !TODO
  deliveryToTimeEnabled: true,
  possibleToOrderInMinutes: 20160,
  timezone: 'Asia/Yekaterinburg',
  minDeliveryTimeInMinutes: '60',
};

const dateForExpect = [
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 07:00:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 08:01:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 10:00:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 12:00:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 14:00:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 17:00:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 19:00:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 20:00:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 22:00:00', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 23:59:59', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00Z', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00Z', 'en', '+0300')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 04:45:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 05:45:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 07:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 08:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 10:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 12:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 14:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 15:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 17:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 19:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 20:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 22:00:00Z', 'en', '+0000')),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 23:59:59Z', 'en', '+0000')),
];

const dateForExpectLocal = [
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 07:00:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 08:01:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 10:01:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 12:00:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 14:00:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 17:00:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 17:59:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 18:00:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 20:00:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 22:00:00', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 23:59:59', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 01:00:00Z', 'en', envOffset)),
  new Date(formatDate(Date.now(), 'yyyy-MM-dd 11:00:00Z', 'en', envOffset)),
];

describe('WorkTimeValidator', () => {
  dateForExpect.forEach((dt) => {
    const expected = WorkTimeValidator.isWorkNow(caseOne, dt).workNow;
    it(`Проверяем рабочее время заказа в ${dt.toLocaleString()} - ${expected} `, () => {
      expect(WorkTimeValidator.isWorkNow(caseOne, dt).workNow).equal(expected);
    });
  });

  dateForExpectLocal.forEach((dt) => {
    const expected = WorkTimeValidator.isWorkNow(caseTwo, dt).workNow;
    it(`Проверяем "только" рабочее время в ${dt.toLocaleString()} - ${expected} `, () => {
      expect(WorkTimeValidator.isWorkNow(caseTwo, dt).workNow).equal(expected);
    });
  });

  it('Проверяем на ошибку, не передадим restriction', () =>
    expect(() =>
      WorkTimeValidator.isWorkNow(
        undefined as unknown as RestrictionsOrder,
        dateForExpect[0]
      )
    ).to.throw('Не передан объект restriction'));

  const dateEarlyOneHour = new Date('2021-02-17 09:00+0500');
  const dateAfterStopOneHour = new Date('2021-02-17 21:00+0500');
  const caseLongDelivery: RestrictionsOrder = {
    ...caseOne,
    minDeliveryTimeInMinutes: '60',
  };
  const dateLongDelivery = new Date('2021-02-17 10:00+0500');
  ///тесты getPossibleDelieveryOrderDateTime

  it(`Проверяем ближайшее время для 09:00 `, () =>
    expect(
      WorkTimeValidator.getPossibleDelieveryOrderDateTime(
        caseOne,
        dateEarlyOneHour
      )
    ).contain('2021-02-17 11:00'));
  it(`Проверяем ближайшее время для 21:00 `, () =>
    expect(
      WorkTimeValidator.getPossibleDelieveryOrderDateTime(
        caseOne,
        dateAfterStopOneHour
      )
    ).to.satisfy((v: string) => v.includes('2021-02-18 11:00') || v.includes('2021-02-19 11:00')));
  it('Проверяем переход на следующий день при MinCoockingTime=900', () =>
    expect(
      WorkTimeValidator.getPossibleMinDelieveryOrderDateTime(
        caseLongDelivery,
        900,
        dateLongDelivery
      )
    ).contain('2021-02-18 11:00'));

  ///тесты getPossibleSelfServiceOrderDateTime

  it(`Проверяем ближайшее время для 09:00 `, () =>
    expect(
      WorkTimeValidator.getPossibleSelfServiceOrderDateTime(
        caseOne,
        dateEarlyOneHour
      )
    ).contain('2021-02-17 11:00'));
  it(`Проверяем ближайшее время для 21:00 `, () =>
    expect(
      WorkTimeValidator.getPossibleSelfServiceOrderDateTime(
        caseOne,
        dateAfterStopOneHour
      )
    ).to.satisfy((v: string) => v.includes('2021-02-18 11:00') || v.includes('2021-02-19 11:00')));

  const oneVariableWorkTimeCase: Restrictions = {
    worktime: [
      {
        dayOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        start: '10:00',
        stop: '20:00',
        break: '00:00-00:00'
      },
    ],
    timezone: 'Asia/Yekaterinburg'
  };

  const dateMonday = new Date('2021-02-15 11:00');
  const dateTuesday = new Date('2021-02-16 11:00');
  const dateWednesday = new Date('2021-02-17 11:00');
  const dateThursday = new Date('2021-02-18 11:00');
  const dateFriday = new Date('2021-02-19 11:00');
  const dateSaturday = new Date('2021-02-20 11:00');
  const dateSunday = new Date('2021-02-21 11:00');
  const week = [
    dateMonday,
    dateTuesday,
    dateWednesday,
    dateThursday,
    dateFriday,
    dateSaturday,
    dateSunday,
  ];

  week.forEach((element) =>
    it(`Проверяем расписание для restriction из одного элемента с dayOfWeek=all для дня недели ${formatDate(
      element,
      'EEEE',
      'en'
    )}`, () => {
      assertArraysEqual(WorkTimeValidator.getCurrentWorkTime(oneVariableWorkTimeCase, element).dayOfWeek, all)
    })
  );

  const twoVariableWorkTimeCase: Restrictions = {
    worktime: [
      {
        dayOfWeek: ['friday'],
        start: '10:00',
        stop: '20:00',
        break: '00:00-00:00'
      },
      {
        dayOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        start: '10:00',
        stop: '20:00',
        break: '00:00-00:00'
      },
    ],
    //@ts-ignore
    possibleToOrderInMinutes: 20160,
    timezone: 'Asia/Yekaterinburg'
  };

  week.forEach((element: Date, index: number) =>
    it(`Проверяем расписание для restriction с двумя элементами WorkTime - Friday и all. Проверка для дня недели ${formatDate(
      element,
      'EEEE',
      'en'
    ).toLowerCase()}`, () => 
      {
        const curDays = WorkTimeValidator.getCurrentWorkTime(twoVariableWorkTimeCase, element).dayOfWeek
        if (index === 4) {
          return expect(curDays).to.includes('friday');
        } else {
          return assertArraysEqual(curDays, all)
        }
      })
  );

  const trioVariableWorkTimeCase: Restrictions = {
    worktime: [
      {
        dayOfWeek: ['friday'],
        start: '10:00',
        stop: '21:30',
        break: '11:00-12:00'
      },
      {
        dayOfWeek: ['saturday', 'sunday'],
        start: '12:00',
        stop: '18:30',
        break: '14:00-18:00'
      },
      {
        dayOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        start: '10:00',
        stop: '21:00',
        break: '00:00-00:00'
      },
    ],
    //@ts-ignore
    possibleToOrderInMinutes: 20160,
    timezone: 'Asia/Yekaterinburg'
  };

  week.forEach((element: Date, index: number) =>
    it(`Проверяем расписание для restriction с тремя элементами WorkTime -  ['saturday', 'sunday'] , Friday и all. Проверка для дня недели ${formatDate(
      element,
      'EEEE',
      'en'
    ).toLowerCase()}`, () => {
      let curDays = WorkTimeValidator.getCurrentWorkTime(trioVariableWorkTimeCase, element).dayOfWeek

      const expected = expect(curDays);
      if (index > 4) {
        return expected.to.includes('saturday');
      } else {
        if (index === 4) {
          return expected.to.includes('friday');
        } else {
          return assertArraysEqual(curDays, all)
        }
      }
    })
  );
});


function assertArraysEqual(actualArray, expectedArray) {
  expect(actualArray).to.have.lengthOf(expectedArray.length);
  for (let i = 0; i < actualArray.length; i++) {
    expect(actualArray[i]).to.equal(expectedArray[i]);
  }
}