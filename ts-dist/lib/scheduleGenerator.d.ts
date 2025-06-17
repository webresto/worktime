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
    /**
     *
     * @param startDate Дата начала
     * @param endDate Дата окончания
     * @param timeZone можно расчитать таймзону но она не обязательная потомучто new Date() для startDate и endDate будет уже смещена
     * @param compact Выдать массивом
     */
    generateTimeIntervals(startDate: Date, endDate: Date, timeZone?: TimeZoneString, compact?: true): [number, number][];
    generateTimeIntervals(startDate: Date, endDate: Date, timeZone?: TimeZoneString, compact?: false): {
        start: number;
        stop: number;
    }[];
    private compact;
}
