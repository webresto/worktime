/**
 * Formats a date according to locale rules.
 *
 * @param value The date to format, as a Date, or a number (milliseconds since UTC epoch)
 * or an [ISO date-time string](https://www.w3.org/TR/NOTE-datetime).
 * @param format The date-time components to include. See `DatePipe` for details.
 * @param locale A locale code for the locale format rules to use.
 * @param timezone The time zone. A time zone offset from GMT (such as `'+0430'`),
 * or a standard UTC/GMT or continental US time zone abbreviation.
 * If not specified, uses host system settings.
 *
 * @returns The formatted date string.
 *
 */
export declare function formatDate(value: string | number | Date, format: string, locale: string, timezone?: string): string;
/**
 * Функция проверяет корректность переданного объекта Date.
 * @param value
 */
export declare function isDate(value: any): value is Date;
//# sourceMappingURL=formatDate.d.ts.map