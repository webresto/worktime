import { assert } from 'chai';
import { ScheduleGenerator } from '../lib/scheduleGenerator';
import { TimeZoneIdentifier } from '../lib/tz';

describe('ScheduleGenerator', function () {
  const jsonData = [
    {
      dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'sunday'],
      start: '10:00',
      stop: '21:45',
      break: '12:00-12:10',
    },
    {
      dayOfWeek: ['friday', 'saturday'],
      start: '10:00',
      stop: '21:45',
      break: '12:00-13:00',
    },
  ];
  const startDate = new Date('2024-04-01T00:00:00.000Z');
  const endDate = new Date('2024-04-08T00:00:00.000Z');
  const timeZone = 'Etc/GMT+5';
  const scheduleGenerator = new ScheduleGenerator(jsonData);

  it('should generate compact time intervals when compact parameter is true', function () {
    const compactIntervals = scheduleGenerator.generateTimeIntervals(startDate, endDate, timeZone, true);
    const fullIntervals = scheduleGenerator.generateTimeIntervals(startDate, endDate, timeZone, false);
    const normalizedFull = fullIntervals.map(i => [i.start, i.stop]);
    assert.deepStrictEqual(compactIntervals, normalizedFull);
  });

  it('should adjust time intervals according to the specified time zone', function () {
    const intervals = scheduleGenerator.generateTimeIntervals(startDate, endDate, timeZone, false);
    const utcIntervals = scheduleGenerator.generateTimeIntervals(startDate, endDate, 'Etc/GMT+0', false);
    const offset = TimeZoneIdentifier.getTimeZoneOffsetInSeconds(timeZone);
    intervals.forEach((interval, idx) => {
      assert.strictEqual(interval.start - utcIntervals[idx].start, offset);
      assert.strictEqual(interval.stop - utcIntervals[idx].stop, offset);
    });
  });
});
