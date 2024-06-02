"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleValidator = exports.ScheduleGenerator = void 0;
const tz_1 = require("./tz");
class ScheduleGenerator {
    /**
     * Constructor for the ScheduleGenerator class.
     * Parses the given worktime array into days and breaks.
     * @param worktime An array of WorkTime objects representing the work schedule.
     */
    constructor(worktime) {
        const { days, breaks } = this.parseSchedule(worktime);
        this.days = days;
        this.breaks = breaks;
    }
    timeToSeconds(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60;
    }
    parseSchedule(worktime) {
        const days = new Map();
        const breaks = new Map();
        for (const rule of worktime) {
            const { dayOfWeek, start, stop, break: breakTime } = rule;
            const startSeconds = this.timeToSeconds(start);
            const stopSeconds = this.timeToSeconds(stop);
            const breakSeconds = breakTime !== "00:00-00:00" ? this.parseBreakTime(breakTime) : null;
            for (const day of dayOfWeek) {
                days.set(day.toLowerCase(), { start: startSeconds, stop: stopSeconds });
                if (breakSeconds)
                    breaks.set(day.toLowerCase(), breakSeconds);
            }
        }
        return { days, breaks };
    }
    parseBreakTime(breakTime) {
        const [start, stop] = breakTime.split('-').map(time => this.timeToSeconds(time));
        return { start, stop };
    }
    getDatesInRange(startDate, endDate) {
        const dates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }
    filterWorkingDates(dates) {
        return dates.filter(date => {
            const dayOfWeek = date.toLocaleString('en', { weekday: 'long' }).toLowerCase();
            return this.days.has(dayOfWeek);
        });
    }
    createTimeIntervals(dates) {
        const intervals = [];
        for (const date of dates) {
            const dayOfWeek = date.toLocaleString('en', { weekday: 'long' }).toLowerCase();
            const workingDay = this.days.get(dayOfWeek);
            if (workingDay && workingDay.start !== null && workingDay.stop !== null) {
                const { start, stop } = workingDay;
                const intervalStart = new Date(date);
                intervalStart.setHours(0, 0, start);
                const intervalStop = new Date(date);
                intervalStop.setHours(0, 0, stop);
                const breakTime = this.breaks.get(dayOfWeek);
                if (breakTime && breakTime.start < breakTime.stop) {
                    const breakStart = new Date(date);
                    breakStart.setHours(0, 0, breakTime.start);
                    const breakStop = new Date(date);
                    breakStop.setHours(0, 0, breakTime.stop);
                    intervals.push({ start: Math.round(intervalStart.getTime() / 1000), stop: Math.round(breakStart.getTime() / 1000) });
                    intervals.push({ start: Math.round(breakStop.getTime() / 1000), stop: Math.round(intervalStop.getTime() / 1000) });
                }
                else {
                    intervals.push({ start: Math.round(intervalStart.getTime() / 1000), stop: Math.round(intervalStop.getTime() / 1000) });
                }
            }
        }
        return intervals;
    }
    adjustTimezone(intervals, timeZoneOffset) {
        return intervals.map(interval => ({
            start: interval.start + timeZoneOffset,
            stop: interval.stop + timeZoneOffset
        }));
    }
    generateTimeIntervals(startDate, endDate, timeZone, compact) {
        const datesInRange = this.getDatesInRange(startDate, endDate);
        const workingDates = this.filterWorkingDates(datesInRange);
        const timeIntervals = this.createTimeIntervals(workingDates);
        if (!timeZone) {
            timeZone = "Etc/GMT+0";
        }
        const timeZoneOffsetSeconds = tz_1.TimeZoneIdentifier.getTimeZoneOffsetInSeconds(timeZone);
        if (compact) {
            return this.compact(this.adjustTimezone(timeIntervals, timeZoneOffsetSeconds));
        }
        else {
            return this.adjustTimezone(timeIntervals, timeZoneOffsetSeconds);
        }
    }
    compact(timeIntervals) {
        return timeIntervals.map(interval => [interval.start, interval.stop]);
    }
}
exports.ScheduleGenerator = ScheduleGenerator;
class ScheduleValidator {
    /**
     * Constructor for ScheduleValidator class.
     * @param schedule The schedule to be validated.
     */
    constructor(schedule) {
        this.schedule = schedule;
    }
    /**
     * Checks if a given date falls within any of the intervals in the schedule.
     * @param date The date to check.
     * @returns A boolean indicating whether the date falls within the schedule.
     */
    doesTimeFallWithin(date) {
        if (!this.schedule)
            return false;
        const time = Math.round(date.getTime() / 1000); // Convert date to Unix timestamp
        for (const interval of this.schedule) {
            const [start, stop] = interval;
            if (start <= time && time <= stop) {
                return true;
            }
        }
        return false;
    }
    /**
     * Checks if a given duration starting from a specific date falls within any of the intervals in the schedule.
     * @param startDateTime The start date and time.
     * @param durationInSeconds The duration in seconds.
     * @returns A boolean indicating whether the duration falls within the schedule.
     */
    doesDurationFallWithin(startDateTime, durationInSeconds) {
        if (!this.schedule)
            return false;
        const startTime = Math.round(startDateTime.getTime() / 1000);
        const endTime = startTime + durationInSeconds;
        for (const interval of this.schedule) {
            const [start, stop] = interval;
            if (start <= startTime && stop >= endTime) {
                return true;
            }
        }
        return false;
    }
    /**
     * Finds the earliest or latest day limit in the schedule intervals.
     * @param mode Determines whether to find the earliest or latest day limit.
     * @returns The earliest or latest day limit within the schedule, or undefined if no such date exists.
     */
    findDayLimit(mode, timezone) {
        if (!this.schedule || this.schedule.length === 0)
            return undefined;
        let _day = this.schedule[0][0];
        for (const interval of this.schedule) {
            const [_start, _] = interval;
            if (mode = "earliest") {
                if (_start < _day) {
                    _day = _start;
                }
            }
            else /** latest */ {
                if (_start > _day) {
                    _day = _start;
                }
            }
        }
        return new Date(_day * 1000).toLocaleDateString(undefined, {
            timeZone: timezone,
        });
    }
    /**
     * Finds the latest end date for a given duration that fits within the schedule intervals.
     * @param durationInSeconds The duration in seconds.
     * @returns The latest end date that fits within the schedule, or undefined if no such date exists.
     */
    findLatestEndDate() {
        return undefined;
    }
}
exports.ScheduleValidator = ScheduleValidator;
// function convertTimestampsToReadableDate(array: { start: number, stop: number }[]) {
//     return array.map(item => {
//         const startDate = new Date(item.start * 1000);
//         const stopDate = new Date(item.stop * 1000);
//         const startDateStr = startDate.toLocaleString('en-US', { timeZone: 'UTC' });
//         const stopDateStr = stopDate.toLocaleString('en-US', { timeZone: 'UTC' });
//         return { start: startDateStr, stop: stopDateStr };
//     });
// }
