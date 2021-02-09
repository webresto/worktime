import { ɵfindLocaleData, ɵLocaleDataIndex } from './locale_data_core';

type Time = {
  hours: number,
  minutes: number
};

const enum ɵExtraLocaleDataIndex {
  ExtraDayPeriodFormats = 0,
  ExtraDayPeriodStandalone,
  ExtraDayPeriodsRules
}

function getLastDefinedValue<T>(data: T[], index: number): T {
  for (let i = index; i > -1; i--) {
    if (typeof data[i] !== 'undefined') {
      return data[i];
    }
  }
  throw new Error('Locale data API: locale data undefined');
}

function checkFullData(data: any): void {
  if (!data[ɵLocaleDataIndex.ExtraData]) {
    throw new Error(`Missing extra locale data for the locale "${data[ɵLocaleDataIndex
      .LocaleId]}". Use "registerLocaleData" to load new data. See the "I18n guide" on angular.io to know more.`);
  }
}

function extractTime(time: string): Time {
  const [h, m] = time.split(':');
  return { hours: +h, minutes: +m };
}

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

export function getLocaleDateTimeFormat(locale: string, width: FormatWidth): string {
  const data = ɵfindLocaleData(locale);
  const dateTimeFormatData = data[ɵLocaleDataIndex.DateTimeFormat] as string[];
  return getLastDefinedValue(dateTimeFormatData, width);
}

export function getLocaleMonthNames(
  locale: string, formStyle: FormStyle, width: TranslationWidth): ReadonlyArray<string> {
  const data = ɵfindLocaleData(locale);
  const monthsData =
    [data[ɵLocaleDataIndex.MonthsFormat], data[ɵLocaleDataIndex.MonthsStandalone]] as string[][][];
  const months = getLastDefinedValue(monthsData, formStyle);
  return getLastDefinedValue(months, width);
}

export function getLocaleDayNames(
  locale: string, formStyle: FormStyle, width: TranslationWidth): ReadonlyArray<string> {
  const data = ɵfindLocaleData(locale);
  const daysData =
    [data[ɵLocaleDataIndex.DaysFormat], data[ɵLocaleDataIndex.DaysStandalone]] as string[][][];
  const days = getLastDefinedValue(daysData, formStyle);
  return getLastDefinedValue(days, width);
}

export function getLocaleEraNames(
  locale: string, width: TranslationWidth): Readonly<[string, string]> {
  const data = ɵfindLocaleData(locale);
  const erasData = data[ɵLocaleDataIndex.Eras] as [string, string][];
  return getLastDefinedValue(erasData, width);
}

export function getLocaleDayPeriods(
  locale: string, formStyle: FormStyle, width: TranslationWidth): Readonly<[string, string]> {
  const data = ɵfindLocaleData(locale);
  const amPmData = [
    data[ɵLocaleDataIndex.DayPeriodsFormat], data[ɵLocaleDataIndex.DayPeriodsStandalone]
  ] as [string, string][][];
  const amPm = getLastDefinedValue(amPmData, formStyle);
  return getLastDefinedValue(amPm, width);
}

export function getLocaleExtraDayPeriods(
  locale: string, formStyle: FormStyle, width: TranslationWidth): string[] {
  const data = ɵfindLocaleData(locale);
  checkFullData(data);
  const dayPeriodsData = [
    data[ɵLocaleDataIndex.ExtraData][ɵExtraLocaleDataIndex.ExtraDayPeriodFormats],
    data[ɵLocaleDataIndex.ExtraData][ɵExtraLocaleDataIndex.ExtraDayPeriodStandalone]
  ] as string[][][];
  const dayPeriods = getLastDefinedValue(dayPeriodsData, formStyle) || [];
  return getLastDefinedValue(dayPeriods, width) || [];
}

export function getLocaleExtraDayPeriodRules(locale: string): (Time | [Time, Time])[] {
  const data = ɵfindLocaleData(locale);
  checkFullData(data);
  const rules = data[ɵLocaleDataIndex.ExtraData][ɵExtraLocaleDataIndex.ExtraDayPeriodsRules] || [];
  return rules.map((rule: string | [string, string]) => {
    if (typeof rule === 'string') {
      return extractTime(rule);
    }
    return [extractTime(rule[0]), extractTime(rule[1])];
  });
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
