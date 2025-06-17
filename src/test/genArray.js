function generateTimeIntervals(jsonData, startDate, endDate, timeZoneOffset) {
  // Шаг 1: Разбор входных данных
  const { days, breaks } = parseSchedule(jsonData);

  // Шаг 3: Генерация всех дат в указанном диапазоне
  const datesInRange = getDatesInRange(startDate, endDate);

  // Шаг 4: Фильтрация рабочих дней с учетом расписания
  const workingDates = filterWorkingDates(datesInRange, days);

  // Шаг 5: Создание интервалов времени в секундах для каждого рабочего дня
  const timeIntervals = createTimeIntervals(workingDates, days, breaks);

  // Шаг 6: Учет временного сдвига
  const adjustedIntervals = adjustTimezone(timeIntervals, timeZoneOffset);

  // Шаг 7: Возврат результата
  return adjustedIntervals;
}

// Шаг 2: Преобразование времени в секунды
function timeToSeconds(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60;
}

// Шаг 1: Разбор входных данных
function parseSchedule(jsonData) {
  const days = new Map();
  const breaks = new Map();

  for (const rule of jsonData) {
      const { dayOfWeek, start, stop, break: breakTime } = rule;
      const startSeconds = timeToSeconds(start);
      const stopSeconds = timeToSeconds(stop);
      const breakSeconds = breakTime !== "00:00-00:00" ? parseBreakTime(breakTime) : null;

      for (const day of dayOfWeek) {
          days.set(day.toLowerCase(), { start: startSeconds, stop: stopSeconds });
          if (breakSeconds) breaks.set(day.toLowerCase(), breakSeconds);
      }
  }

  return { days, breaks };
}

// Шаг 2: Преобразование перерыва в секунды
function parseBreakTime(breakTime) {
  const [start, stop] = breakTime.split('-').map(timeToSeconds);
  return { start, stop };
}

// Шаг 3: Генерация всех дат в указанном диапазоне
function getDatesInRange(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// Шаг 4: Фильтрация рабочих дней с учетом расписания
function filterWorkingDates(dates, days) {
  return dates.filter(date => {
      const dayOfWeek = date.toLocaleString('en', { weekday: 'long' }).toLowerCase();
      return days.has(dayOfWeek);
  });
}

// Шаг 5: Создание интервалов времени в секундах для каждого рабочего дня
function createTimeIntervals(dates, days, breaks) {
  const intervals = [];

  for (const date of dates) {
      const dayOfWeek = date.toLocaleString('en', { weekday: 'long' }).toLowerCase();
      const { start, stop } = days.get(dayOfWeek);

      if (start !== null && stop !== null) {
          const intervalStart = new Date(date);
          intervalStart.setHours(0, 0, start);
          const intervalStop = new Date(date);
          intervalStop.setHours(0, 0, stop);

          const breakTime = breaks.get(dayOfWeek);
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

// Шаг 6: Учет временного сдвига
function adjustTimezone(intervals, timeZoneOffset) {
  return intervals.map(interval => ({
      start: interval.start + timeZoneOffset,
      stop: interval.stop + timeZoneOffset
  }));
}



// Пример использования
const jsonData = [
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


const jsonData2 = [
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

const startDate = new Date("2024-04-28T00:00:00Z"); // Начальная дата
const endDate = new Date("2024-05-11T23:59:59Z");   // Конечная дата (две недели после начальной даты)
const timeZoneOffset = 3 * 60 * 60;                // Сдвиг временной зоны (3 часа в секундах)

const result = generateTimeIntervals(jsonData, startDate, endDate, timeZoneOffset);
console.log(result);


function convertTimestampsToReadableDate(array) {
return array.map(item => {
  const startDate = new Date(item.start * 1000); // умножаем на 1000, чтобы перевести из секунд в миллисекунды
  const stopDate = new Date(item.stop * 1000);
  
  const startDateStr = startDate.toLocaleString('en-US', { timeZone: 'UTC' }); // или вашу желаемую локаль
  const stopDateStr = stopDate.toLocaleString('en-US', { timeZone: 'UTC' });
  
  return { start: startDateStr, stop: stopDateStr };
});
}

console.log(convertTimestampsToReadableDate(result))
