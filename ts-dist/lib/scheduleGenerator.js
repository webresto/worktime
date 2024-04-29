import { TimeZoneIdentifier } from "./tz";
export class ScheduleGenerator {
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
                    intervals.push({ start: intervalStart.getTime() / 1000, stop: breakStart.getTime() / 1000 });
                    intervals.push({ start: breakStop.getTime() / 1000, stop: intervalStop.getTime() / 1000 });
                }
                else {
                    intervals.push({ start: intervalStart.getTime() / 1000, stop: intervalStop.getTime() / 1000 });
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
        const timeZoneOffsetSeconds = TimeZoneIdentifier.getTimeZoneOffsetInSeconds(timeZone);
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
function convertTimestampsToReadableDate(array) {
    return array.map(item => {
        const startDate = new Date(item.start * 1000);
        const stopDate = new Date(item.stop * 1000);
        const startDateStr = startDate.toLocaleString('en-US', { timeZone: 'UTC' });
        const stopDateStr = stopDate.toLocaleString('en-US', { timeZone: 'UTC' });
        return { start: startDateStr, stop: stopDateStr };
    });
}
