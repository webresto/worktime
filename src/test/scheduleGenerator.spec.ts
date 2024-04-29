import { assert } from 'chai';
import { ScheduleGenerator } from '../lib/scheduleGenerator';
import { WorkTime } from '../lib/worktime.validator';
import { TimeZoneString } from '../lib/tz';

describe('ScheduleGenerator', function () {
    const jsonData: WorkTime[] = [
        {
            "dayOfWeek": ["monday", "tuesday", "wednesday", "thursday", "sunday"],
            "start": "10:00",
            "stop": "21:45",
            "break": "12:00-12:10"
        },
        {
            "dayOfWeek": ["friday", "saturday"],
            "start": "10:00",
            "stop": "21:45",
            "break": "12:00-13:00"
        }
    ];

    const startDate: Date = new Date("1970-01-01T00:00:00.000Z");
    const endDate: Date = new Date("1970-01-15T00:00:00.000Z");
    const timeZone: TimeZoneString = "Etc/GMT+5";

    const scheduleGenerator: ScheduleGenerator = new ScheduleGenerator(jsonData);

    describe('#generateTimeIntervals()', function () {
        it('should generate time intervals correctly', function () {
            const result = scheduleGenerator.generateTimeIntervals(startDate, endDate, timeZone);
            // Example assertions, customize based on your needs
            assert.strictEqual(result.length, 24); // Example assertion, customize based on your expected output
        });

        // Add more test cases for different scenarios if needed
    });

    describe('#adjustTimezone()', function () {
        it('should adjust time zones correctly', function () {
            const intervals = [{ start: 0, stop: 3600 }];
            const adjustedIntervals = scheduleGenerator.adjustTimezone(intervals, timeZone);
            assert.deepStrictEqual(adjustedIntervals, [{ start: 10800, stop: 14400 }]);
        });

        // Add more test cases for different scenarios if needed
    });

    // Add more describe blocks for other methods if needed
});
