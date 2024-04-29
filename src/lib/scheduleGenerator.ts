import { WorkTime } from "./worktime.validator";

class ScheduleGenerator {
  private days: Map<string, { start: number, stop: number }>;
  private breaks: Map<string, { start: number, stop: number }>;

  constructor(jsonData: any) {
      const { days, breaks } = this.parseSchedule(jsonData);
      this.days = days;
      this.breaks = breaks;
  }

  private timeToSeconds(time: string): number {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 3600 + minutes * 60;
  }

  private parseSchedule(jsonData: any): { days: Map<string, { start: number, stop: number }>, breaks: Map<string, { start: number, stop: number }> } {
      const days = new Map<string, { start: number, stop: number }>();
      const breaks = new Map<string, { start: number, stop: number }>();

      for (const rule of jsonData) {
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

  generateTimeIntervals(startDate: Date, endDate: Date, timeZoneOffset: number): { start: number, stop: number }[] {
      const datesInRange = this.getDatesInRange(startDate, endDate);
      const workingDates = this.filterWorkingDates(datesInRange);
      const timeIntervals = this.createTimeIntervals(workingDates);
      return this.adjustTimezone(timeIntervals, timeZoneOffset);
  }
}

// Пример использования
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

const startDate = new Date("1970-01-01T00:00:00.000Z"); // Начальная дата
const endDate = new Date("1970-01-15T00:00:00.000Z");   // Конечная дата (две недели после начальной даты)
const timeZoneOffset = 3 * 60 * 60;                // Сдвиг временной зоны (3 часа в секундах)

const scheduleGenerator = new ScheduleGenerator(jsonData);
const result = scheduleGenerator.generateTimeIntervals(startDate, endDate, timeZoneOffset);
console.log(result);

function convertTimestampsToReadableDate(array: { start: number, stop: number }[]) {
  return array.map(item => {
      const startDate = new Date(item.start * 1000);
      const stopDate = new Date(item.stop * 1000);

      const startDateStr = startDate.toLocaleString('en-US', { timeZone: 'UTC' });
      const stopDateStr = stopDate.toLocaleString('en-US', { timeZone: 'UTC' });

      return { start: startDateStr, stop: stopDateStr };
  });
}

console.log(convertTimestampsToReadableDate(result));
