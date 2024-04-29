import { TimeZoneString } from "./tz";
import { WorkTime } from "./worktime.validator";
export type Schedule = [number, number][];
export declare class ScheduleGenerator {
    private days;
    private breaks;
    constructor(worktime: WorkTime[]);
    private timeToSeconds;
    private parseSchedule;
    private parseBreakTime;
    private getDatesInRange;
    private filterWorkingDates;
    private createTimeIntervals;
    private adjustTimezone;
    generateTimeIntervals(startDate: Date, endDate: Date, timeZone: TimeZoneString, compact: true): [number, number][];
    generateTimeIntervals(startDate: Date, endDate: Date, timeZone: TimeZoneString, compact?: false): {
        start: number;
        stop: number;
    }[];
    private compact;
}
