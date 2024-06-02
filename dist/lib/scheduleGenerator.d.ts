import { TimeZoneString } from "./tz";
import { WorkTime } from "./worktime.validator";
export type Schedule = [number, number][];
export declare class ScheduleGenerator {
    private days;
    private breaks;
    /**
     * Constructor for the ScheduleGenerator class.
     * Parses the given worktime array into days and breaks.
     * @param worktime An array of WorkTime objects representing the work schedule.
     */
    constructor(worktime: WorkTime[]);
    private timeToSeconds;
    private parseSchedule;
    private parseBreakTime;
    private getDatesInRange;
    private filterWorkingDates;
    private createTimeIntervals;
    private adjustTimezone;
    /**
     * Generates time intervals between the provided start and end dates.
     * @param startDate The start date of the interval.
     * @param endDate The end date of the interval.
     * @param timeZone Optional: The time zone to consider for the dates. If not provided, assumes "Etc/GMT+0". It is not necessary because new Date() for startDate and endDate will already be offset
     * @param compact Optional: Whether to output time intervals in a compact array format or an array of objects.
     * @returns An array of time intervals between the start and end dates.
     */
    generateTimeIntervals(startDate: Date, endDate: Date, timeZone?: TimeZoneString, compact?: true): [number, number][];
    generateTimeIntervals(startDate: Date, endDate: Date, timeZone?: TimeZoneString, compact?: false): {
        start: number;
        stop: number;
    }[];
    private compact;
}
export declare class ScheduleValidator {
    readonly schedule: Schedule | undefined;
    /**
     * Constructor for ScheduleValidator class.
     * @param schedule The schedule to be validated.
     */
    constructor(schedule: Schedule);
    /**
     * Checks if a given date falls within any of the intervals in the schedule.
     * @param date The date to check.
     * @returns A boolean indicating whether the date falls within the schedule.
     */
    doesTimeFallWithin(date: Date): boolean;
    /**
     * Checks if a given duration starting from a specific date falls within any of the intervals in the schedule.
     * @param startDateTime The start date and time.
     * @param durationInSeconds The duration in seconds.
     * @returns A boolean indicating whether the duration falls within the schedule.
     */
    doesDurationFallWithin(startDateTime: Date, durationInSeconds: number): boolean;
    /**
     * Finds the earliest or latest day limit in the schedule intervals.
     * @param mode Determines whether to find the earliest or latest day limit.
     * @returns The earliest or latest day limit within the schedule, or undefined if no such date exists.
     */
    findDayLimit(mode: "earliest" | "latest", timezone: TimeZoneString): string | undefined;
    /**
     * Finds the latest end date for a given duration that fits within the schedule intervals.
     * @param durationInSeconds The duration in seconds.
     * @returns The latest end date that fits within the schedule, or undefined if no such date exists.
     */
    findLatestEndDate(): Date | undefined;
}
