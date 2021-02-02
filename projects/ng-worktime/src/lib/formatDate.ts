export const ISO8601_DATE_REGEX =
  /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
//    1        2       3         4          5          6          7          8  9     10      11
const NAMED_FORMATS: { [localeId: string]: { [format: string]: string } } = {};
const DATE_FORMATS_SPLIT =
  /((?:[^GyYMLwWdEabBhHmsSzZO']+)|(?:'(?:[^']|'')*')|(?:G{1,5}|y{1,4}|Y{1,4}|M{1,5}|L{1,5}|w{1,2}|W{1}|d{1,2}|E{1,6}|a{1,5}|b{1,5}|B{1,5}|h{1,2}|H{1,2}|m{1,2}|s{1,2}|S{1,3}|z{1,4}|Z{1,5}|O{1,4}))([\s\S]*)/;

export enum FormatWidth {
  /**
   * For `en-US`, 'M/d/yy, h:mm a'`
   * (Example: `6/15/15, 9:03 AM`)
   */
  Short,
  /**
   * For `en-US`, `'MMM d, y, h:mm:ss a'`
   * (Example: `Jun 15, 2015, 9:03:01 AM`)
   */
  Medium,
  /**
   * For `en-US`, `'MMMM d, y, h:mm:ss a z'`
   * (Example: `June 15, 2015 at 9:03:01 AM GMT+1`)
   */
  Long,
  /**
   * For `en-US`, `'EEEE, MMMM d, y, h:mm:ss a zzzz'`
   * (Example: `Monday, June 15, 2015 at 9:03:01 AM GMT+01:00`)
   */
  Full
}

export enum FormStyle {
  Format,
  Standalone
}

enum TranslationType {
  DayPeriods,
  Days,
  Months,
  Eras
}

enum ZoneWidth {
  Short,
  ShortGMT,
  Long,
  Extended
}

export enum ɵLocaleDataIndex {
  LocaleId = 0,
  DayPeriodsFormat,
  DayPeriodsStandalone,
  DaysFormat,
  DaysStandalone,
  MonthsFormat,
  MonthsStandalone,
  Eras,
  FirstDayOfWeek,
  WeekendRange,
  DateFormat,
  TimeFormat,
  DateTimeFormat,
  NumberSymbols,
  NumberFormats,
  CurrencyCode,
  CurrencySymbol,
  CurrencyName,
  Currencies,
  Directionality,
  PluralCase,
  ExtraData
}

enum DateType {
  FullYear,
  Month,
  Date,
  Hours,
  Minutes,
  Seconds,
  FractionalSeconds,
  Day
}

type DateFormatter = (date: Date, locale: string, offset: number) => string;

export enum NumberSymbol {
  /**
   * Decimal separator.
   * For `en-US`, the dot character.
   * Example : 2,345`.`67
   */
  Decimal,
  /**
   * Grouping separator, typically for thousands.
   * For `en-US`, the comma character.
   * Example: 2`,`345.67
   */
  Group,
  /**
   * List-item separator.
   * Example: "one, two, and three"
   */
  List,
  /**
   * Sign for percentage (out of 100).
   * Example: 23.4%
   */
  PercentSign,
  /**
   * Sign for positive numbers.
   * Example: +23
   */
  PlusSign,
  /**
   * Sign for negative numbers.
   * Example: -23
   */
  MinusSign,
  /**
   * Computer notation for exponential value (n times a power of 10).
   * Example: 1.2E3
   */
  Exponential,
  /**
   * Human-readable format of exponential.
   * Example: 1.2x103
   */
  SuperscriptingExponent,
  /**
   * Sign for permille (out of 1000).
   * Example: 23.4‰
   */
  PerMille,
  /**
   * Infinity, can be used with plus and minus.
   * Example: ∞, +∞, -∞
   */
  Infinity,
  /**
   * Not a number.
   * Example: NaN
   */
  NaN,
  /**
   * Symbol used between time units.
   * Example: 10:52
   */
  TimeSeparator,
  /**
   * Decimal separator for currency values (fallback to `Decimal`).
   * Example: $2,345.67
   */
  CurrencyDecimal,
  /**
   * Group separator for currency values (fallback to `Group`).
   * Example: $2,345.67
   */
  CurrencyGroup
}

export const enum ɵExtraLocaleDataIndex {
  ExtraDayPeriodFormats = 0,
  ExtraDayPeriodStandalone,
  ExtraDayPeriodsRules
}

export type Time = {
  hours: number,
  minutes: number
};

let LOCALE_DATA: {[localeId: string]: any} = {};

export function formatDate(
  value: string | number | Date, format: string, locale: string, timezone?: string): string {
  let date = toDate(value);
  const namedFormat = getNamedFormat(locale, format);
  format = namedFormat || format;

  let parts: string[] = [];
  let match;
  while (format) {
    match = DATE_FORMATS_SPLIT.exec(format);
    if (match) {
      parts = parts.concat(match.slice(1));
      const part = parts.pop();
      if (!part) {
        break;
      }
      format = part;
    } else {
      parts.push(format);
      break;
    }
  }

  let dateTimezoneOffset = date.getTimezoneOffset();
  if (timezone) {
    dateTimezoneOffset = timezoneToOffset(timezone, dateTimezoneOffset);
    date = convertTimezoneToLocal(date, timezone, true);
  }

  let text = '';
  parts.forEach(value => {
    const dateFormatter = getDateFormatter(value);
    text += dateFormatter ?
      dateFormatter(date, locale, dateTimezoneOffset) :
      value === '\'\'' ? '\'' : value.replace(/(^'|'$)/g, '').replace(/''/g, '\'');
  });

  return text;
}

export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.valueOf());
}

export function toDate(value: string | number | Date): Date {
  if (isDate(value)) {
    return value;
  }

  if (typeof value === 'number' && !isNaN(value)) {
    return new Date(value);
  }

  if (typeof value === 'string') {
    value = value.trim();

    if (/^(\d{4}(-\d{1,2}(-\d{1,2})?)?)$/.test(value)) {
      /* For ISO Strings without time the day, month and year must be extracted from the ISO String
      before Date creation to avoid time offset and errors in the new Date.
      If we only replace '-' with ',' in the ISO String ("2015,01,01"), and try to create a new
      date, some browsers (e.g. IE 9) will throw an invalid Date error.
      If we leave the '-' ("2015-01-01") and try to create a new Date("2015-01-01") the timeoffset
      is applied.
      Note: ISO months are 0 for January, 1 for February, ... */
      const [y, m = 1, d = 1] = value.split('-').map((val: string) => +val);
      return new Date(y, m - 1, d);
    }

    const parsedNb = parseFloat(value);

    // any string that only contains numbers, like "1234" but not like "1234hello"
    if (!isNaN(value as any - parsedNb)) {
      return new Date(parsedNb);
    }

    let match: RegExpMatchArray | null;
    if (match = value.match(ISO8601_DATE_REGEX)) {
      return isoStringToDate(match);
    }
  }

  const date = new Date(value as any);
  if (!isDate(date)) {
    throw new Error(`Unable to convert "${value}" into a date`);
  }
  return date;
}

function getNamedFormat(locale: string, format: string): string {
  const localeId = getLocaleId(locale);
  NAMED_FORMATS[localeId] = NAMED_FORMATS[localeId] || {};

  if (NAMED_FORMATS[localeId][format]) {
    return NAMED_FORMATS[localeId][format];
  }

  let formatValue = '';
  switch (format) {
    case 'shortDate':
      formatValue = getLocaleDateFormat(locale, FormatWidth.Short);
      break;
    case 'mediumDate':
      formatValue = getLocaleDateFormat(locale, FormatWidth.Medium);
      break;
    case 'longDate':
      formatValue = getLocaleDateFormat(locale, FormatWidth.Long);
      break;
    case 'fullDate':
      formatValue = getLocaleDateFormat(locale, FormatWidth.Full);
      break;
    case 'shortTime':
      formatValue = getLocaleTimeFormat(locale, FormatWidth.Short);
      break;
    case 'mediumTime':
      formatValue = getLocaleTimeFormat(locale, FormatWidth.Medium);
      break;
    case 'longTime':
      formatValue = getLocaleTimeFormat(locale, FormatWidth.Long);
      break;
    case 'fullTime':
      formatValue = getLocaleTimeFormat(locale, FormatWidth.Full);
      break;
    case 'short':
      const shortTime = getNamedFormat(locale, 'shortTime');
      const shortDate = getNamedFormat(locale, 'shortDate');
      formatValue = formatDateTime(
        getLocaleDateTimeFormat(locale, FormatWidth.Short), [shortTime, shortDate]);
      break;
    case 'medium':
      const mediumTime = getNamedFormat(locale, 'mediumTime');
      const mediumDate = getNamedFormat(locale, 'mediumDate');
      formatValue = formatDateTime(
        getLocaleDateTimeFormat(locale, FormatWidth.Medium), [mediumTime, mediumDate]);
      break;
    case 'long':
      const longTime = getNamedFormat(locale, 'longTime');
      const longDate = getNamedFormat(locale, 'longDate');
      formatValue =
        formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Long), [longTime, longDate]);
      break;
    case 'full':
      const fullTime = getNamedFormat(locale, 'fullTime');
      const fullDate = getNamedFormat(locale, 'fullDate');
      formatValue =
        formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Full), [fullTime, fullDate]);
      break;
  }
  if (formatValue) {
    NAMED_FORMATS[localeId][format] = formatValue;
  }
  return formatValue;
}

const DATE_FORMATS: { [format: string]: DateFormatter } = {};


function getDateFormatter(format: string): DateFormatter | null {
  if (DATE_FORMATS[format]) {
    return DATE_FORMATS[format];
  }
  let formatter;
  switch (format) {
    // Era name (AD/BC)
    case 'G':
    case 'GG':
    case 'GGG':
      formatter = dateStrGetter(TranslationType.Eras, TranslationWidth.Abbreviated);
      break;
    case 'GGGG':
      formatter = dateStrGetter(TranslationType.Eras, TranslationWidth.Wide);
      break;
    case 'GGGGG':
      formatter = dateStrGetter(TranslationType.Eras, TranslationWidth.Narrow);
      break;

    // 1 digit representation of the year, e.g. (AD 1 => 1, AD 199 => 199)
    case 'y':
      formatter = dateGetter(DateType.FullYear, 1, 0, false, true);
      break;
    // 2 digit representation of the year, padded (00-99). (e.g. AD 2001 => 01, AD 2010 => 10)
    case 'yy':
      formatter = dateGetter(DateType.FullYear, 2, 0, true, true);
      break;
    // 3 digit representation of the year, padded (000-999). (e.g. AD 2001 => 01, AD 2010 => 10)
    case 'yyy':
      formatter = dateGetter(DateType.FullYear, 3, 0, false, true);
      break;
    // 4 digit representation of the year (e.g. AD 1 => 0001, AD 2010 => 2010)
    case 'yyyy':
      formatter = dateGetter(DateType.FullYear, 4, 0, false, true);
      break;

    // 1 digit representation of the week-numbering year, e.g. (AD 1 => 1, AD 199 => 199)
    case 'Y':
      formatter = weekNumberingYearGetter(1);
      break;
    // 2 digit representation of the week-numbering year, padded (00-99). (e.g. AD 2001 => 01, AD
    // 2010 => 10)
    case 'YY':
      formatter = weekNumberingYearGetter(2, true);
      break;
    // 3 digit representation of the week-numbering year, padded (000-999). (e.g. AD 1 => 001, AD
    // 2010 => 2010)
    case 'YYY':
      formatter = weekNumberingYearGetter(3);
      break;
    // 4 digit representation of the week-numbering year (e.g. AD 1 => 0001, AD 2010 => 2010)
    case 'YYYY':
      formatter = weekNumberingYearGetter(4);
      break;

    // Month of the year (1-12), numeric
    case 'M':
    case 'L':
      formatter = dateGetter(DateType.Month, 1, 1);
      break;
    case 'MM':
    case 'LL':
      formatter = dateGetter(DateType.Month, 2, 1);
      break;

    // Month of the year (January, ...), string, format
    case 'MMM':
      formatter = dateStrGetter(TranslationType.Months, TranslationWidth.Abbreviated);
      break;
    case 'MMMM':
      formatter = dateStrGetter(TranslationType.Months, TranslationWidth.Wide);
      break;
    case 'MMMMM':
      formatter = dateStrGetter(TranslationType.Months, TranslationWidth.Narrow);
      break;

    // Month of the year (January, ...), string, standalone
    case 'LLL':
      formatter =
        dateStrGetter(TranslationType.Months, TranslationWidth.Abbreviated, FormStyle.Standalone);
      break;
    case 'LLLL':
      formatter =
        dateStrGetter(TranslationType.Months, TranslationWidth.Wide, FormStyle.Standalone);
      break;
    case 'LLLLL':
      formatter =
        dateStrGetter(TranslationType.Months, TranslationWidth.Narrow, FormStyle.Standalone);
      break;

    // Week of the year (1, ... 52)
    case 'w':
      formatter = weekGetter(1);
      break;
    case 'ww':
      formatter = weekGetter(2);
      break;

    // Week of the month (1, ...)
    case 'W':
      formatter = weekGetter(1, true);
      break;

    // Day of the month (1-31)
    case 'd':
      formatter = dateGetter(DateType.Date, 1);
      break;
    case 'dd':
      formatter = dateGetter(DateType.Date, 2);
      break;

    // Day of the Week
    case 'E':
    case 'EE':
    case 'EEE':
      formatter = dateStrGetter(TranslationType.Days, TranslationWidth.Abbreviated);
      break;
    case 'EEEE':
      formatter = dateStrGetter(TranslationType.Days, TranslationWidth.Wide);
      break;
    case 'EEEEE':
      formatter = dateStrGetter(TranslationType.Days, TranslationWidth.Narrow);
      break;
    case 'EEEEEE':
      formatter = dateStrGetter(TranslationType.Days, TranslationWidth.Short);
      break;

    // Generic period of the day (am-pm)
    case 'a':
    case 'aa':
    case 'aaa':
      formatter = dateStrGetter(TranslationType.DayPeriods, TranslationWidth.Abbreviated);
      break;
    case 'aaaa':
      formatter = dateStrGetter(TranslationType.DayPeriods, TranslationWidth.Wide);
      break;
    case 'aaaaa':
      formatter = dateStrGetter(TranslationType.DayPeriods, TranslationWidth.Narrow);
      break;

    // Extended period of the day (midnight, at night, ...), standalone
    case 'b':
    case 'bb':
    case 'bbb':
      formatter = dateStrGetter(
        TranslationType.DayPeriods, TranslationWidth.Abbreviated, FormStyle.Standalone, true);
      break;
    case 'bbbb':
      formatter = dateStrGetter(
        TranslationType.DayPeriods, TranslationWidth.Wide, FormStyle.Standalone, true);
      break;
    case 'bbbbb':
      formatter = dateStrGetter(
        TranslationType.DayPeriods, TranslationWidth.Narrow, FormStyle.Standalone, true);
      break;

    // Extended period of the day (midnight, night, ...), standalone
    case 'B':
    case 'BB':
    case 'BBB':
      formatter = dateStrGetter(
        TranslationType.DayPeriods, TranslationWidth.Abbreviated, FormStyle.Format, true);
      break;
    case 'BBBB':
      formatter =
        dateStrGetter(TranslationType.DayPeriods, TranslationWidth.Wide, FormStyle.Format, true);
      break;
    case 'BBBBB':
      formatter = dateStrGetter(
        TranslationType.DayPeriods, TranslationWidth.Narrow, FormStyle.Format, true);
      break;

    // Hour in AM/PM, (1-12)
    case 'h':
      formatter = dateGetter(DateType.Hours, 1, -12);
      break;
    case 'hh':
      formatter = dateGetter(DateType.Hours, 2, -12);
      break;

    // Hour of the day (0-23)
    case 'H':
      formatter = dateGetter(DateType.Hours, 1);
      break;
    // Hour in day, padded (00-23)
    case 'HH':
      formatter = dateGetter(DateType.Hours, 2);
      break;

    // Minute of the hour (0-59)
    case 'm':
      formatter = dateGetter(DateType.Minutes, 1);
      break;
    case 'mm':
      formatter = dateGetter(DateType.Minutes, 2);
      break;

    // Second of the minute (0-59)
    case 's':
      formatter = dateGetter(DateType.Seconds, 1);
      break;
    case 'ss':
      formatter = dateGetter(DateType.Seconds, 2);
      break;

    // Fractional second
    case 'S':
      formatter = dateGetter(DateType.FractionalSeconds, 1);
      break;
    case 'SS':
      formatter = dateGetter(DateType.FractionalSeconds, 2);
      break;
    case 'SSS':
      formatter = dateGetter(DateType.FractionalSeconds, 3);
      break;


    // Timezone ISO8601 short format (-0430)
    case 'Z':
    case 'ZZ':
    case 'ZZZ':
      formatter = timeZoneGetter(ZoneWidth.Short);
      break;
    // Timezone ISO8601 extended format (-04:30)
    case 'ZZZZZ':
      formatter = timeZoneGetter(ZoneWidth.Extended);
      break;

    // Timezone GMT short format (GMT+4)
    case 'O':
    case 'OO':
    case 'OOO':
    // Should be location, but fallback to format O instead because we don't have the data yet
    case 'z':
    case 'zz':
    case 'zzz':
      formatter = timeZoneGetter(ZoneWidth.ShortGMT);
      break;
    // Timezone GMT long format (GMT+0430)
    case 'OOOO':
    case 'ZZZZ':
    // Should be location, but fallback to format O instead because we don't have the data yet
    case 'zzzz':
      formatter = timeZoneGetter(ZoneWidth.Long);
      break;
    default:
      return null;
  }
  DATE_FORMATS[format] = formatter;
  return formatter;
}

function dateStrGetter(
  name: TranslationType, width: TranslationWidth, form: FormStyle = FormStyle.Format,
  extended = false): DateFormatter {
  return function (date: Date, locale: string): string {
    return getDateTranslation(date, locale, name, width, form, extended);
  };
}

function dateGetter(
  name: DateType, size: number, offset: number = 0, trim = false,
  negWrap = false): DateFormatter {
return function(date: Date, locale: string): string {
  let part = getDatePart(name, date);
  if (offset > 0 || part > -offset) {
    part += offset;
  }

  if (name === DateType.Hours) {
    if (part === 0 && offset === -12) {
      part = 12;
    }
  } else if (name === DateType.FractionalSeconds) {
    return formatFractionalSeconds(part, size);
  }

  const localeMinus = getLocaleNumberSymbol(locale, NumberSymbol.MinusSign);
  return padNumber(part, size, localeMinus, trim, negWrap);
};
}

function getDateTranslation(
  date: Date, locale: string, name: TranslationType, width: TranslationWidth, form: FormStyle,
  extended: boolean) {
  switch (name) {
    case TranslationType.Months:
      return getLocaleMonthNames(locale, form, width)[date.getMonth()];
    case TranslationType.Days:
      return getLocaleDayNames(locale, form, width)[date.getDay()];
    case TranslationType.DayPeriods:
      const currentHours = date.getHours();
      const currentMinutes = date.getMinutes();
      if (extended) {
        const rules = getLocaleExtraDayPeriodRules(locale);
        const dayPeriods = getLocaleExtraDayPeriods(locale, form, width);
        const index = rules.findIndex(rule => {
          if (Array.isArray(rule)) {
            // morning, afternoon, evening, night
            const [from, to] = rule;
            const afterFrom = currentHours >= from.hours && currentMinutes >= from.minutes;
            const beforeTo =
              (currentHours < to.hours ||
                (currentHours === to.hours && currentMinutes < to.minutes));
            // We must account for normal rules that span a period during the day (e.g. 6am-9am)
            // where `from` is less (earlier) than `to`. But also rules that span midnight (e.g.
            // 10pm - 5am) where `from` is greater (later!) than `to`.
            //
            // In the first case the current time must be BOTH after `from` AND before `to`
            // (e.g. 8am is after 6am AND before 10am).
            //
            // In the second case the current time must be EITHER after `from` OR before `to`
            // (e.g. 4am is before 5am but not after 10pm; and 11pm is not before 5am but it is
            // after 10pm).
            if (from.hours < to.hours) {
              if (afterFrom && beforeTo) {
                return true;
              }
            } else if (afterFrom || beforeTo) {
              return true;
            }
          } else {  // noon or midnight
            if (rule.hours === currentHours && rule.minutes === currentMinutes) {
              return true;
            }
          }
          return false;
        });
        if (index !== -1) {
          return dayPeriods[index];
        }
      }
      // if no rules for the day periods, we use am/pm by default
      return getLocaleDayPeriods(locale, form, <TranslationWidth>width)[currentHours < 12 ? 0 : 1];
    case TranslationType.Eras:
      return getLocaleEraNames(locale, <TranslationWidth>width)[date.getFullYear() <= 0 ? 0 : 1];
    default:
      // This default case is not needed by TypeScript compiler, as the switch is exhaustive.
      // However Closure Compiler does not understand that and reports an error in typed mode.
      // The `throw new Error` below works around the problem, and the unexpected: never variable
      // makes sure tsc still checks this code is unreachable.
      const unexpected: never = name;
      throw new Error(`unexpected translation type ${unexpected}`);
  }
}

function timezoneToOffset(timezone: string, fallback: number): number {
  // Support: IE 11 only, Edge 13-15+
  // IE/Edge do not "understand" colon (`:`) in timezone
  timezone = timezone.replace(/:/g, '');
  const requestedTimezoneOffset = Date.parse('Jan 01, 1970 00:00:00 ' + timezone) / 60000;
  return isNaN(requestedTimezoneOffset) ? fallback : requestedTimezoneOffset;
}

function addDateMinutes(date: Date, minutes: number) {
  date = new Date(date.getTime());
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

function convertTimezoneToLocal(date: Date, timezone: string, reverse: boolean): Date {
  const reverseValue = reverse ? -1 : 1;
  const dateTimezoneOffset = date.getTimezoneOffset();
  const timezoneOffset = timezoneToOffset(timezone, dateTimezoneOffset);
  return addDateMinutes(date, reverseValue * (timezoneOffset - dateTimezoneOffset));
}

export function isoStringToDate(match: RegExpMatchArray): Date {
  const date = new Date(0);
  let tzHour = 0;
  let tzMin = 0;

  // match[8] means that the string contains "Z" (UTC) or a timezone like "+01:00" or "+0100"
  const dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear;
  const timeSetter = match[8] ? date.setUTCHours : date.setHours;

  // if there is a timezone defined like "+01:00" or "+0100"
  if (match[9]) {
    tzHour = Number(match[9] + match[10]);
    tzMin = Number(match[9] + match[11]);
  }
  dateSetter.call(date, Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const h = Number(match[4] || 0) - tzHour;
  const m = Number(match[5] || 0) - tzMin;
  const s = Number(match[6] || 0);
  // The ECMAScript specification (https://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.11)
  // defines that `DateTime` milliseconds should always be rounded down, so that `999.9ms`
  // becomes `999ms`.
  const ms = Math.floor(parseFloat('0.' + (match[7] || 0)) * 1000);
  timeSetter.call(date, h, m, s, ms);
  return date;
}

function formatDateTime(str: string, opt_values: string[]) {
  if (opt_values) {
    str = str.replace(/\{([^}]+)}/g, function (match, key) {
      return (opt_values != null && key in opt_values) ? opt_values[key] : match;
    });
  }
  return str;
}

export function getLocaleDateTimeFormat(locale: string, width: FormatWidth): string {
  const data = ɵfindLocaleData(locale);
  const dateTimeFormatData = <string[]>data[ɵLocaleDataIndex.DateTimeFormat];
  return getLastDefinedValue(dateTimeFormatData, width);
}

function getLastDefinedValue<T>(data: T[], index: number): T {
  for (let i = index; i > -1; i--) {
    if (typeof data[i] !== 'undefined') {
      return data[i];
    }
  }
  throw new Error('Locale data API: locale data undefined');
}

export function ɵfindLocaleData(locale: string): any {
  const normalizedLocale = normalizeLocale(locale);

  let match = getLocaleData(normalizedLocale);
  if (match) {
    return match;
  }

  // let's try to find a parent locale
  const parentLocale = normalizedLocale.split('-')[0];
  match = getLocaleData(parentLocale);
  if (match) {
    return match;
  }

  if (parentLocale === 'en') {
    return localeEn;
  }

  throw new Error(`Missing locale data for the locale "${locale}".`);
}

export function getLocaleId(locale: string): string {
  return ɵfindLocaleData(locale)[ɵLocaleDataIndex.LocaleId];
}

export function getLocaleDateFormat(locale: string, width: FormatWidth): string {
  const data = ɵfindLocaleData(locale);
  return getLastDefinedValue(data[ɵLocaleDataIndex.DateFormat], width);
}

export function getLocaleTimeFormat(locale: string, width: FormatWidth): string {
  const data = ɵfindLocaleData(locale);
  return getLastDefinedValue(data[ɵLocaleDataIndex.TimeFormat], width);
}

export enum TranslationWidth {
  /** 1 character for `en-US`. For example: 'S' */
  Narrow,
  /** 3 characters for `en-US`. For example: 'Sun' */
  Abbreviated,
  /** Full length for `en-US`. For example: "Sunday" */
  Wide,
  /** 2 characters for `en-US`, For example: "Su" */
  Short
}

const JANUARY = 0;
const THURSDAY = 4;

function weekNumberingYearGetter(size: number, trim = false): DateFormatter {
  return function(date: Date, locale: string) {
    const thisThurs = getThursdayThisWeek(date);
    const weekNumberingYear = thisThurs.getFullYear();
    return padNumber(
        weekNumberingYear, size, getLocaleNumberSymbol(locale, NumberSymbol.MinusSign), trim);
  };
}

function weekGetter(size: number, monthBased = false): DateFormatter {
  return function(date: Date, locale: string) {
    let result;
    if (monthBased) {
      const nbDaysBefore1stDayOfMonth =
          new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1;
      const today = date.getDate();
      result = 1 + Math.floor((today + nbDaysBefore1stDayOfMonth) / 7);
    } else {
      const thisThurs = getThursdayThisWeek(date);
      // Some days of a year are part of next year according to ISO 8601.
      // Compute the firstThurs from the year of this week's Thursday
      const firstThurs = getFirstThursdayOfYear(thisThurs.getFullYear());
      const diff = thisThurs.getTime() - firstThurs.getTime();
      result = 1 + Math.round(diff / 6.048e8);  // 6.048e8 ms per week
    }

    return padNumber(result, size, getLocaleNumberSymbol(locale, NumberSymbol.MinusSign));
  };
}

function timeZoneGetter(width: ZoneWidth): DateFormatter {
  return function(date: Date, locale: string, offset: number) {
    const zone = -1 * offset;
    const minusSign = getLocaleNumberSymbol(locale, NumberSymbol.MinusSign);
    const hours = zone > 0 ? Math.floor(zone / 60) : Math.ceil(zone / 60);
    switch (width) {
      case ZoneWidth.Short:
        return ((zone >= 0) ? '+' : '') + padNumber(hours, 2, minusSign) +
            padNumber(Math.abs(zone % 60), 2, minusSign);
      case ZoneWidth.ShortGMT:
        return 'GMT' + ((zone >= 0) ? '+' : '') + padNumber(hours, 1, minusSign);
      case ZoneWidth.Long:
        return 'GMT' + ((zone >= 0) ? '+' : '') + padNumber(hours, 2, minusSign) + ':' +
            padNumber(Math.abs(zone % 60), 2, minusSign);
      case ZoneWidth.Extended:
        if (offset === 0) {
          return 'Z';
        } else {
          return ((zone >= 0) ? '+' : '') + padNumber(hours, 2, minusSign) + ':' +
              padNumber(Math.abs(zone % 60), 2, minusSign);
        }
      default:
        throw new Error(`Unknown zone width "${width}"`);
    }
  };
}

function padNumber(
  num: number, digits: number, minusSign = '-', trim?: boolean, negWrap?: boolean): string {
let neg = '';
if (num < 0 || (negWrap && num <= 0)) {
  if (negWrap) {
    num = -num + 1;
  } else {
    num = -num;
    neg = minusSign;
  }
}
let strNum = String(num);
while (strNum.length < digits) {
  strNum = '0' + strNum;
}
if (trim) {
  strNum = strNum.substr(strNum.length - digits);
}
return neg + strNum;
}

function getDatePart(part: DateType, date: Date): number {
  switch (part) {
    case DateType.FullYear:
      return date.getFullYear();
    case DateType.Month:
      return date.getMonth();
    case DateType.Date:
      return date.getDate();
    case DateType.Hours:
      return date.getHours();
    case DateType.Minutes:
      return date.getMinutes();
    case DateType.Seconds:
      return date.getSeconds();
    case DateType.FractionalSeconds:
      return date.getMilliseconds();
    case DateType.Day:
      return date.getDay();
    default:
      throw new Error(`Unknown DateType value "${part}".`);
  }
}

function formatFractionalSeconds(milliseconds: number, digits: number): string {
  const strMs = padNumber(milliseconds, 3);
  return strMs.substr(0, digits);
}

export function getLocaleNumberSymbol(locale: string, symbol: NumberSymbol): string {
  const data = ɵfindLocaleData(locale);
  const res = data[ɵLocaleDataIndex.NumberSymbols][symbol];
  if (typeof res === 'undefined') {
    if (symbol === NumberSymbol.CurrencyDecimal) {
      return data[ɵLocaleDataIndex.NumberSymbols][NumberSymbol.Decimal];
    } else if (symbol === NumberSymbol.CurrencyGroup) {
      return data[ɵLocaleDataIndex.NumberSymbols][NumberSymbol.Group];
    }
  }
  return res;
}

export function getLocaleMonthNames(
  locale: string, formStyle: FormStyle, width: TranslationWidth): ReadonlyArray<string> {
const data = ɵfindLocaleData(locale);
const monthsData =
    <string[][][]>[data[ɵLocaleDataIndex.MonthsFormat], data[ɵLocaleDataIndex.MonthsStandalone]];
const months = getLastDefinedValue(monthsData, formStyle);
return getLastDefinedValue(months, width);
}

export function getLocaleDayNames(
  locale: string, formStyle: FormStyle, width: TranslationWidth): ReadonlyArray<string> {
const data = ɵfindLocaleData(locale);
const daysData =
    <string[][][]>[data[ɵLocaleDataIndex.DaysFormat], data[ɵLocaleDataIndex.DaysStandalone]];
const days = getLastDefinedValue(daysData, formStyle);
return getLastDefinedValue(days, width);
}

export function getLocaleEraNames(
  locale: string, width: TranslationWidth): Readonly<[string, string]> {
const data = ɵfindLocaleData(locale);
const erasData = <[string, string][]>data[ɵLocaleDataIndex.Eras];
return getLastDefinedValue(erasData, width);
}

export function getLocaleDayPeriods(
  locale: string, formStyle: FormStyle, width: TranslationWidth): Readonly<[string, string]> {
const data = ɵfindLocaleData(locale);
const amPmData = <[string, string][][]>[
  data[ɵLocaleDataIndex.DayPeriodsFormat], data[ɵLocaleDataIndex.DayPeriodsStandalone]
];
const amPm = getLastDefinedValue(amPmData, formStyle);
return getLastDefinedValue(amPm, width);
}

export function getLocaleExtraDayPeriods(
  locale: string, formStyle: FormStyle, width: TranslationWidth): string[] {
const data = ɵfindLocaleData(locale);
checkFullData(data);
const dayPeriodsData = <string[][][]>[
  data[ɵLocaleDataIndex.ExtraData][ɵExtraLocaleDataIndex.ExtraDayPeriodFormats],
  data[ɵLocaleDataIndex.ExtraData][ɵExtraLocaleDataIndex.ExtraDayPeriodStandalone]
];
const dayPeriods = getLastDefinedValue(dayPeriodsData, formStyle) || [];
return getLastDefinedValue(dayPeriods, width) || [];
}

export function getLocaleExtraDayPeriodRules(locale: string): (Time|[Time, Time])[] {
  const data = ɵfindLocaleData(locale);
  checkFullData(data);
  const rules = data[ɵLocaleDataIndex.ExtraData][ɵExtraLocaleDataIndex.ExtraDayPeriodsRules] || [];
  return rules.map((rule: string|[string, string]) => {
    if (typeof rule === 'string') {
      return extractTime(rule);
    }
    return [extractTime(rule[0]), extractTime(rule[1])];
  });
}

function checkFullData(data: any) {
  if (!data[ɵLocaleDataIndex.ExtraData]) {
    throw new Error(`Missing extra locale data for the locale "${
        data[ɵLocaleDataIndex
                 .LocaleId]}". Use "registerLocaleData" to load new data. See the "I18n guide" on angular.io to know more.`);
  }
}

function extractTime(time: string): Time {
  const [h, m] = time.split(':');
  return {hours: +h, minutes: +m};
}

function normalizeLocale(locale: string): string {
  return locale.toLowerCase().replace(/_/g, '-');
}


export function getLocaleData(normalizedLocale: string): any {
  return LOCALE_DATA[normalizedLocale];
}

function getFirstThursdayOfYear(year: number) {
  const firstDayOfYear = (new Date(year, JANUARY, 1)).getDay();
  return new Date(
      year, 0, 1 + ((firstDayOfYear <= THURSDAY) ? THURSDAY : THURSDAY + 7) - firstDayOfYear);
}

function getThursdayThisWeek(datetime: Date) {
  return new Date(
      datetime.getFullYear(), datetime.getMonth(),
      datetime.getDate() + (THURSDAY - datetime.getDay()));
}

const u = undefined;

function plural(n: number): number {
  let i = Math.floor(Math.abs(n)), v = n.toString().replace(/^[^.]*\.?/, '').length;
  if (i === 1 && v === 0) return 1;
  return 5;
}

const localeEn = [
  'en',
  [['a', 'p'], ['AM', 'PM'], u],
  [['AM', 'PM'], u, u],
  [
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'], ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  ],
  u,
  [
    ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    [
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
      'October', 'November', 'December'
    ]
  ],
  u,
  [['B', 'A'], ['BC', 'AD'], ['Before Christ', 'Anno Domini']],
  0,
  [6, 0],
  ['M/d/yy', 'MMM d, y', 'MMMM d, y', 'EEEE, MMMM d, y'],
  ['h:mm a', 'h:mm:ss a', 'h:mm:ss a z', 'h:mm:ss a zzzz'],
  ['{1}, {0}', u, '{1} \'at\' {0}', u],
  ['.', ',', ';', '%', '+', '-', 'E', '×', '‰', '∞', 'NaN', ':'],
  ['#,##0.###', '#,##0%', '¤#,##0.00', '#E0'],
  'USD',
  '$',
  'US Dollar',
  {},
  'ltr',
  plural
];