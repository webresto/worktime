import { TimeZoneIdentifier, TimeZoneString } from "./tz";
import { WorkTime } from "./worktime.validator";
export type Schedule =  [number, number][]
export class ScheduleGenerator {
    private days: Map<string, { start: number, stop: number }>;
    private breaks: Map<string, { start: number, stop: number }>;

    constructor(worktime: WorkTime[]) {
        const { days, breaks } = this.parseSchedule(worktime);
        this.days = days;
        this.breaks = breaks;
    }

    private timeToSeconds(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60;
    }

    private parseSchedule(worktime: any): { days: Map<string, { start: number, stop: number }>, breaks: Map<string, { start: number, stop: number }> } {
        const days = new Map<string, { start: number, stop: number }>();
        const breaks = new Map<string, { start: number, stop: number }>();

        for (const rule of worktime) {
            const { dayOfWeek, start, stop, break: breakTime } = rule;
            const startSeconds = this.timeToSeconds(start);
            const stopSeconds = this.timeToSeconds(stop);
            const breakSeconds = breakTime !== "00:00-00:00" ? this.parseBreakTime(breakTime) : null;

            for (const day of dayOfWeek) {
                days.set(day.toLowerCase(), { start: startSeconds, stop: stopSeconds });
                if (breakSeconds) breaks.set(day.toLowerCase(), breakSeconds);
            }
        }

        return { days, breaks };
    }

    private parseBreakTime(breakTime: string): { start: number, stop: number } {
        const [start, stop] = breakTime.split('-').map(time => this.timeToSeconds(time));
        return { start, stop };
    }

    private getDatesInRange(startDate: Date, endDate: Date): Date[] {
        const dates = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    }

    private filterWorkingDates(dates: Date[]): Date[] {
        return dates.filter(date => {
            const dayOfWeek = date.toLocaleString('en', { weekday: 'long' }).toLowerCase();
            return this.days.has(dayOfWeek);
        });
    }

    private createTimeIntervals(dates: Date[]): { start: number, stop: number }[] {
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
                } else {
                    intervals.push({ start: intervalStart.getTime() / 1000, stop: intervalStop.getTime() / 1000 });
                }
            }
        }

        return intervals;
    }

    private adjustTimezone(intervals: { start: number, stop: number }[], timeZoneOffset: number): { start: number, stop: number }[] {
        return intervals.map(interval => ({
            start: interval.start + timeZoneOffset,
            stop: interval.stop + timeZoneOffset
        }));
    }

    /**
     * 
     * @param startDate Дата начала
     * @param endDate Дата окончания
     * @param timeZone можно расчитать таймзону но она не обязательная потомучто new Date() для startDate и endDate будет уже смещена
     * @param compact Выдать массивом
     */
    public generateTimeIntervals(startDate: Date, endDate: Date, timeZone?: TimeZoneString, compact?: true): [number, number][];
    public generateTimeIntervals(startDate: Date, endDate: Date, timeZone?: TimeZoneString, compact?: false): { start: number, stop: number }[];
    public generateTimeIntervals(startDate: Date, endDate: Date, timeZone?: TimeZoneString, compact?: true | false): { start: number, stop: number }[] | [number, number][] {
        const datesInRange = this.getDatesInRange(startDate, endDate);
        const workingDates = this.filterWorkingDates(datesInRange);
        const timeIntervals = this.createTimeIntervals(workingDates);
        
        if(!timeZone) {
            timeZone = "Etc/GMT+0"
        }
        
        const timeZoneOffsetSeconds = TimeZoneIdentifier.getTimeZoneOffsetInSeconds(timeZone)
        if(compact){
            return this.compact(this.adjustTimezone(timeIntervals, timeZoneOffsetSeconds));
        } else {
            return this.adjustTimezone(timeIntervals, timeZoneOffsetSeconds);
        }
    }
    

    private compact(timeIntervals: { start: number, stop: number }[]): [number, number][] {
        return timeIntervals.map(interval => [interval.start, interval.stop]);
    }
}

function convertTimestampsToReadableDate(array: { start: number, stop: number }[]) {
    return array.map(item => {
        const startDate = new Date(item.start * 1000);
        const stopDate = new Date(item.stop * 1000);

        const startDateStr = startDate.toLocaleString('en-US', { timeZone: 'UTC' });
        const stopDateStr = stopDate.toLocaleString('en-US', { timeZone: 'UTC' });

        return { start: startDateStr, stop: stopDateStr };
    });
}
