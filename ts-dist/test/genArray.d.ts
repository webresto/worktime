declare function generateTimeIntervals(jsonData: any, startDate: any, endDate: any, timeZoneOffset: any): any;
declare function timeToSeconds(time: any): number;
declare function parseSchedule(jsonData: any): {
    days: Map<any, any>;
    breaks: Map<any, any>;
};
declare function parseBreakTime(breakTime: any): {
    start: any;
    stop: any;
};
declare function getDatesInRange(startDate: any, endDate: any): Date[];
declare function filterWorkingDates(dates: any, days: any): any;
declare function createTimeIntervals(dates: any, days: any, breaks: any): {
    start: number;
    stop: number;
}[];
declare function adjustTimezone(intervals: any, timeZoneOffset: any): any;
declare const jsonData: {
    dayOfWeek: string[];
    start: string;
    stop: string;
    break: string;
}[];
declare const startDate: Date;
declare const endDate: Date;
declare const timeZoneOffset: number;
declare const result: any;
declare function convertTimestampsToReadableDate(array: any): any;
