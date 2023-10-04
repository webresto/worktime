function plural(n) {
    const i = Math.floor(Math.abs(n));
    const v = n.toString().replace(/^[^.]*\.?/, '').length;
    if (i === 1 && v === 0) {
        return 1;
    }
    return 5;
}
function normalizeLocale(locale) {
    return locale.toLowerCase().replace(/_/g, '-');
}
const u = undefined;
const LOCALE_DATA = {};
function getLocaleData(normalizedLocale) {
    return LOCALE_DATA[normalizedLocale];
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
function ɵfindLocaleData(locale) {
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
var ɵLocaleDataIndex;
(function (ɵLocaleDataIndex) {
    ɵLocaleDataIndex[ɵLocaleDataIndex["LocaleId"] = 0] = "LocaleId";
    ɵLocaleDataIndex[ɵLocaleDataIndex["DayPeriodsFormat"] = 1] = "DayPeriodsFormat";
    ɵLocaleDataIndex[ɵLocaleDataIndex["DayPeriodsStandalone"] = 2] = "DayPeriodsStandalone";
    ɵLocaleDataIndex[ɵLocaleDataIndex["DaysFormat"] = 3] = "DaysFormat";
    ɵLocaleDataIndex[ɵLocaleDataIndex["DaysStandalone"] = 4] = "DaysStandalone";
    ɵLocaleDataIndex[ɵLocaleDataIndex["MonthsFormat"] = 5] = "MonthsFormat";
    ɵLocaleDataIndex[ɵLocaleDataIndex["MonthsStandalone"] = 6] = "MonthsStandalone";
    ɵLocaleDataIndex[ɵLocaleDataIndex["Eras"] = 7] = "Eras";
    ɵLocaleDataIndex[ɵLocaleDataIndex["FirstDayOfWeek"] = 8] = "FirstDayOfWeek";
    ɵLocaleDataIndex[ɵLocaleDataIndex["WeekendRange"] = 9] = "WeekendRange";
    ɵLocaleDataIndex[ɵLocaleDataIndex["DateFormat"] = 10] = "DateFormat";
    ɵLocaleDataIndex[ɵLocaleDataIndex["TimeFormat"] = 11] = "TimeFormat";
    ɵLocaleDataIndex[ɵLocaleDataIndex["DateTimeFormat"] = 12] = "DateTimeFormat";
    ɵLocaleDataIndex[ɵLocaleDataIndex["NumberSymbols"] = 13] = "NumberSymbols";
    ɵLocaleDataIndex[ɵLocaleDataIndex["NumberFormats"] = 14] = "NumberFormats";
    ɵLocaleDataIndex[ɵLocaleDataIndex["CurrencyCode"] = 15] = "CurrencyCode";
    ɵLocaleDataIndex[ɵLocaleDataIndex["CurrencySymbol"] = 16] = "CurrencySymbol";
    ɵLocaleDataIndex[ɵLocaleDataIndex["CurrencyName"] = 17] = "CurrencyName";
    ɵLocaleDataIndex[ɵLocaleDataIndex["Currencies"] = 18] = "Currencies";
    ɵLocaleDataIndex[ɵLocaleDataIndex["Directionality"] = 19] = "Directionality";
    ɵLocaleDataIndex[ɵLocaleDataIndex["PluralCase"] = 20] = "PluralCase";
    ɵLocaleDataIndex[ɵLocaleDataIndex["ExtraData"] = 21] = "ExtraData";
})(ɵLocaleDataIndex || (ɵLocaleDataIndex = {}));

function getLastDefinedValue(data, index) {
    for (let i = index; i > -1; i--) {
        if (typeof data[i] !== 'undefined') {
            return data[i];
        }
    }
    throw new Error('Locale data API: locale data undefined');
}
function checkFullData(data) {
    if (!data[ɵLocaleDataIndex.ExtraData]) {
        throw new Error(`Missing extra locale data for the locale "${data[ɵLocaleDataIndex
            .LocaleId]}". Use "registerLocaleData" to load new data. See the "I18n guide" on angular.io to know more.`);
    }
}
function extractTime(time) {
    const [h, m] = time.split(':');
    return { hours: +h, minutes: +m };
}
var FormatWidth;
(function (FormatWidth) {
    /**
     * For `en-US`, 'M/d/yy, h:mm a'`
     * (Example: `6/15/15, 9:03 AM`)
     */
    FormatWidth[FormatWidth["Short"] = 0] = "Short";
    /**
     * For `en-US`, `'MMM d, y, h:mm:ss a'`
     * (Example: `Jun 15, 2015, 9:03:01 AM`)
     */
    FormatWidth[FormatWidth["Medium"] = 1] = "Medium";
    /**
     * For `en-US`, `'MMMM d, y, h:mm:ss a z'`
     * (Example: `June 15, 2015 at 9:03:01 AM GMT+1`)
     */
    FormatWidth[FormatWidth["Long"] = 2] = "Long";
    /**
     * For `en-US`, `'EEEE, MMMM d, y, h:mm:ss a zzzz'`
     * (Example: `Monday, June 15, 2015 at 9:03:01 AM GMT+01:00`)
     */
    FormatWidth[FormatWidth["Full"] = 3] = "Full";
})(FormatWidth || (FormatWidth = {}));
var FormStyle;
(function (FormStyle) {
    FormStyle[FormStyle["Format"] = 0] = "Format";
    FormStyle[FormStyle["Standalone"] = 1] = "Standalone";
})(FormStyle || (FormStyle = {}));
function getLocaleId(locale) {
    return ɵfindLocaleData(locale)[ɵLocaleDataIndex.LocaleId];
}
function getLocaleDateFormat(locale, width) {
    const data = ɵfindLocaleData(locale);
    return getLastDefinedValue(data[ɵLocaleDataIndex.DateFormat], width);
}
function getLocaleTimeFormat(locale, width) {
    const data = ɵfindLocaleData(locale);
    return getLastDefinedValue(data[ɵLocaleDataIndex.TimeFormat], width);
}
function getLocaleDateTimeFormat(locale, width) {
    const data = ɵfindLocaleData(locale);
    const dateTimeFormatData = data[ɵLocaleDataIndex.DateTimeFormat];
    return getLastDefinedValue(dateTimeFormatData, width);
}
function getLocaleMonthNames(locale, formStyle, width) {
    const data = ɵfindLocaleData(locale);
    const monthsData = [data[ɵLocaleDataIndex.MonthsFormat], data[ɵLocaleDataIndex.MonthsStandalone]];
    const months = getLastDefinedValue(monthsData, formStyle);
    return getLastDefinedValue(months, width);
}
function getLocaleDayNames(locale, formStyle, width) {
    const data = ɵfindLocaleData(locale);
    const daysData = [data[ɵLocaleDataIndex.DaysFormat], data[ɵLocaleDataIndex.DaysStandalone]];
    const days = getLastDefinedValue(daysData, formStyle);
    return getLastDefinedValue(days, width);
}
function getLocaleEraNames(locale, width) {
    const data = ɵfindLocaleData(locale);
    const erasData = data[ɵLocaleDataIndex.Eras];
    return getLastDefinedValue(erasData, width);
}
function getLocaleDayPeriods(locale, formStyle, width) {
    const data = ɵfindLocaleData(locale);
    const amPmData = [
        data[ɵLocaleDataIndex.DayPeriodsFormat], data[ɵLocaleDataIndex.DayPeriodsStandalone]
    ];
    const amPm = getLastDefinedValue(amPmData, formStyle);
    return getLastDefinedValue(amPm, width);
}
function getLocaleExtraDayPeriods(locale, formStyle, width) {
    const data = ɵfindLocaleData(locale);
    checkFullData(data);
    const dayPeriodsData = [
        data[ɵLocaleDataIndex.ExtraData][0 /* ɵExtraLocaleDataIndex.ExtraDayPeriodFormats */],
        data[ɵLocaleDataIndex.ExtraData][1 /* ɵExtraLocaleDataIndex.ExtraDayPeriodStandalone */]
    ];
    const dayPeriods = getLastDefinedValue(dayPeriodsData, formStyle) || [];
    return getLastDefinedValue(dayPeriods, width) || [];
}
function getLocaleExtraDayPeriodRules(locale) {
    const data = ɵfindLocaleData(locale);
    checkFullData(data);
    const rules = data[ɵLocaleDataIndex.ExtraData][2 /* ɵExtraLocaleDataIndex.ExtraDayPeriodsRules */] || [];
    return rules.map((rule) => {
        if (typeof rule === 'string') {
            return extractTime(rule);
        }
        return [extractTime(rule[0]), extractTime(rule[1])];
    });
}
function getLocaleNumberSymbol(locale, symbol) {
    const data = ɵfindLocaleData(locale);
    const res = data[ɵLocaleDataIndex.NumberSymbols][symbol];
    if (typeof res === 'undefined') {
        if (symbol === NumberSymbol.CurrencyDecimal) {
            return data[ɵLocaleDataIndex.NumberSymbols][NumberSymbol.Decimal];
        }
        else if (symbol === NumberSymbol.CurrencyGroup) {
            return data[ɵLocaleDataIndex.NumberSymbols][NumberSymbol.Group];
        }
    }
    return res;
}
var TranslationWidth;
(function (TranslationWidth) {
    /** 1 character for `en-US`. For example: 'S' */
    TranslationWidth[TranslationWidth["Narrow"] = 0] = "Narrow";
    /** 3 characters for `en-US`. For example: 'Sun' */
    TranslationWidth[TranslationWidth["Abbreviated"] = 1] = "Abbreviated";
    /** Full length for `en-US`. For example: "Sunday" */
    TranslationWidth[TranslationWidth["Wide"] = 2] = "Wide";
    /** 2 characters for `en-US`, For example: "Su" */
    TranslationWidth[TranslationWidth["Short"] = 3] = "Short";
})(TranslationWidth || (TranslationWidth = {}));
var NumberSymbol;
(function (NumberSymbol) {
    /**
     * Decimal separator.
     * For `en-US`, the dot character.
     * Example : 2,345`.`67
     */
    NumberSymbol[NumberSymbol["Decimal"] = 0] = "Decimal";
    /**
     * Grouping separator, typically for thousands.
     * For `en-US`, the comma character.
     * Example: 2`,`345.67
     */
    NumberSymbol[NumberSymbol["Group"] = 1] = "Group";
    /**
     * List-item separator.
     * Example: "one, two, and three"
     */
    NumberSymbol[NumberSymbol["List"] = 2] = "List";
    /**
     * Sign for percentage (out of 100).
     * Example: 23.4%
     */
    NumberSymbol[NumberSymbol["PercentSign"] = 3] = "PercentSign";
    /**
     * Sign for positive numbers.
     * Example: +23
     */
    NumberSymbol[NumberSymbol["PlusSign"] = 4] = "PlusSign";
    /**
     * Sign for negative numbers.
     * Example: -23
     */
    NumberSymbol[NumberSymbol["MinusSign"] = 5] = "MinusSign";
    /**
     * Computer notation for exponential value (n times a power of 10).
     * Example: 1.2E3
     */
    NumberSymbol[NumberSymbol["Exponential"] = 6] = "Exponential";
    /**
     * Human-readable format of exponential.
     * Example: 1.2x103
     */
    NumberSymbol[NumberSymbol["SuperscriptingExponent"] = 7] = "SuperscriptingExponent";
    /**
     * Sign for permille (out of 1000).
     * Example: 23.4‰
     */
    NumberSymbol[NumberSymbol["PerMille"] = 8] = "PerMille";
    /**
     * Infinity, can be used with plus and minus.
     * Example: ∞, +∞, -∞
     */
    NumberSymbol[NumberSymbol["Infinity"] = 9] = "Infinity";
    /**
     * Not a number.
     * Example: NaN
     */
    NumberSymbol[NumberSymbol["NaN"] = 10] = "NaN";
    /**
     * Symbol used between time units.
     * Example: 10:52
     */
    NumberSymbol[NumberSymbol["TimeSeparator"] = 11] = "TimeSeparator";
    /**
     * Decimal separator for currency values (fallback to `Decimal`).
     * Example: $2,345.67
     */
    NumberSymbol[NumberSymbol["CurrencyDecimal"] = 12] = "CurrencyDecimal";
    /**
     * Group separator for currency values (fallback to `Group`).
     * Example: $2,345.67
     */
    NumberSymbol[NumberSymbol["CurrencyGroup"] = 13] = "CurrencyGroup";
})(NumberSymbol || (NumberSymbol = {}));

const ISO8601_DATE_REGEX = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
const NAMED_FORMATS = {};
const DATE_FORMATS_SPLIT = /((?:[^GyYMLwWdEabBhHmsSzZO']+)|(?:'(?:[^']|'')*')|(?:G{1,5}|y{1,4}|Y{1,4}|M{1,5}|L{1,5}|w{1,2}|W{1}|d{1,2}|E{1,6}|a{1,5}|b{1,5}|B{1,5}|h{1,2}|H{1,2}|m{1,2}|s{1,2}|S{1,3}|z{1,4}|Z{1,5}|O{1,4}))([\s\S]*)/;
var TranslationType;
(function (TranslationType) {
    TranslationType[TranslationType["DayPeriods"] = 0] = "DayPeriods";
    TranslationType[TranslationType["Days"] = 1] = "Days";
    TranslationType[TranslationType["Months"] = 2] = "Months";
    TranslationType[TranslationType["Eras"] = 3] = "Eras";
})(TranslationType || (TranslationType = {}));
var ZoneWidth;
(function (ZoneWidth) {
    ZoneWidth[ZoneWidth["Short"] = 0] = "Short";
    ZoneWidth[ZoneWidth["ShortGMT"] = 1] = "ShortGMT";
    ZoneWidth[ZoneWidth["Long"] = 2] = "Long";
    ZoneWidth[ZoneWidth["Extended"] = 3] = "Extended";
})(ZoneWidth || (ZoneWidth = {}));
var DateType;
(function (DateType) {
    DateType[DateType["FullYear"] = 0] = "FullYear";
    DateType[DateType["Month"] = 1] = "Month";
    DateType[DateType["Date"] = 2] = "Date";
    DateType[DateType["Hours"] = 3] = "Hours";
    DateType[DateType["Minutes"] = 4] = "Minutes";
    DateType[DateType["Seconds"] = 5] = "Seconds";
    DateType[DateType["FractionalSeconds"] = 6] = "FractionalSeconds";
    DateType[DateType["Day"] = 7] = "Day";
})(DateType || (DateType = {}));
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
function formatDate(value, format, locale, timezone) {
    let date = toDate(value);
    const namedFormat = getNamedFormat(locale, format);
    format = namedFormat || format;
    let parts = [];
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
        }
        else {
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
    parts.forEach(partValue => {
        const dateFormatter = getDateFormatter(partValue);
        text += dateFormatter ?
            dateFormatter(date, locale, dateTimezoneOffset) :
            value === '\'\'' ? '\'' : partValue.replace(/(^'|'$)/g, '').replace(/''/g, '\'');
    });
    return text;
}
/**
 * Функция проверяет корректность переданного объекта Date.
 * @param value
 */
function isDate(value) {
    return value instanceof Date && !isNaN(value.valueOf());
}
function toDate(value) {
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
            const [y, m = 1, d = 1] = value.split('-').map((val) => +val);
            return new Date(y, m - 1, d);
        }
        const parsedNb = parseFloat(value);
        // any string that only contains numbers, like "1234" but not like "1234hello"
        if (!isNaN(value - parsedNb)) {
            return new Date(parsedNb);
        }
        const match = value.match(ISO8601_DATE_REGEX);
        if (match) {
            return isoStringToDate(match);
        }
    }
    const date = new Date(value);
    if (!isDate(date)) {
        throw new Error(`Unable to convert "${value}" into a date`);
    }
    return date;
}
function getNamedFormat(locale, format) {
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
            formatValue = formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Short), [shortTime, shortDate]);
            break;
        case 'medium':
            const mediumTime = getNamedFormat(locale, 'mediumTime');
            const mediumDate = getNamedFormat(locale, 'mediumDate');
            formatValue = formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Medium), [mediumTime, mediumDate]);
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
const DATE_FORMATS = {};
function getDateFormatter(format) {
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
            formatter = dateStrGetter(TranslationType.DayPeriods, TranslationWidth.Abbreviated, FormStyle.Standalone, true);
            break;
        case 'bbbb':
            formatter = dateStrGetter(TranslationType.DayPeriods, TranslationWidth.Wide, FormStyle.Standalone, true);
            break;
        case 'bbbbb':
            formatter = dateStrGetter(TranslationType.DayPeriods, TranslationWidth.Narrow, FormStyle.Standalone, true);
            break;
        // Extended period of the day (midnight, night, ...), standalone
        case 'B':
        case 'BB':
        case 'BBB':
            formatter = dateStrGetter(TranslationType.DayPeriods, TranslationWidth.Abbreviated, FormStyle.Format, true);
            break;
        case 'BBBB':
            formatter =
                dateStrGetter(TranslationType.DayPeriods, TranslationWidth.Wide, FormStyle.Format, true);
            break;
        case 'BBBBB':
            formatter = dateStrGetter(TranslationType.DayPeriods, TranslationWidth.Narrow, FormStyle.Format, true);
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
function dateStrGetter(name, width, form = FormStyle.Format, extended = false) {
    return function (date, locale) {
        return getDateTranslation(date, locale, name, width, form, extended);
    };
}
function dateGetter(name, size, offset = 0, trim = false, negWrap = false) {
    return function (date, locale) {
        let part = getDatePart(name, date);
        if (offset > 0 || part > -offset) {
            part += offset;
        }
        if (name === DateType.Hours) {
            if (part === 0 && offset === -12) {
                part = 12;
            }
        }
        else if (name === DateType.FractionalSeconds) {
            return formatFractionalSeconds(part, size);
        }
        const localeMinus = getLocaleNumberSymbol(locale, NumberSymbol.MinusSign);
        return padNumber(part, size, localeMinus, trim, negWrap);
    };
}
function getDateTranslation(date, locale, name, width, form, extended) {
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
                        const beforeTo = (currentHours < to.hours ||
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
                        }
                        else if (afterFrom || beforeTo) {
                            return true;
                        }
                    }
                    else { // noon or midnight
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
            return getLocaleDayPeriods(locale, form, width)[currentHours < 12 ? 0 : 1];
        case TranslationType.Eras:
            return getLocaleEraNames(locale, width)[date.getFullYear() <= 0 ? 0 : 1];
        default:
            // This default case is not needed by TypeScript compiler, as the switch is exhaustive.
            // However Closure Compiler does not understand that and reports an error in typed mode.
            // The `throw new Error` below works around the problem, and the unexpected: never variable
            // makes sure tsc still checks this code is unreachable.
            const unexpected = name;
            throw new Error(`unexpected translation type ${unexpected}`);
    }
}
function timezoneToOffset(timezone, fallback) {
    // Support: IE 11 only, Edge 13-15+
    // IE/Edge do not "understand" colon (`:`) in timezone
    timezone = timezone.replace(/:/g, '');
    const requestedTimezoneOffset = Date.parse('Jan 01, 1970 00:00:00 ' + timezone) / 60000;
    return isNaN(requestedTimezoneOffset) ? fallback : requestedTimezoneOffset;
}
function addDateMinutes(date, minutes) {
    date = new Date(date.getTime());
    date.setMinutes(date.getMinutes() + minutes);
    return date;
}
function convertTimezoneToLocal(date, timezone, reverse) {
    const reverseValue = reverse ? -1 : 1;
    const dateTimezoneOffset = date.getTimezoneOffset();
    const timezoneOffset = timezoneToOffset(timezone, dateTimezoneOffset);
    return addDateMinutes(date, reverseValue * (timezoneOffset - dateTimezoneOffset));
}
function isoStringToDate(match) {
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
function formatDateTime(str, optValues) {
    if (optValues) {
        str = str.replace(/\{([^}]+)}/g, function (match, key) {
            return (optValues != null && key in optValues) ? optValues[key] : match;
        });
    }
    return str;
}
const JANUARY = 0;
const THURSDAY = 4;
function weekNumberingYearGetter(size, trim = false) {
    return function (date, locale) {
        const thisThurs = getThursdayThisWeek(date);
        const weekNumberingYear = thisThurs.getFullYear();
        return padNumber(weekNumberingYear, size, getLocaleNumberSymbol(locale, NumberSymbol.MinusSign), trim);
    };
}
function weekGetter(size, monthBased = false) {
    return function (date, locale) {
        let result;
        if (monthBased) {
            const nbDaysBefore1stDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1;
            const today = date.getDate();
            result = 1 + Math.floor((today + nbDaysBefore1stDayOfMonth) / 7);
        }
        else {
            const thisThurs = getThursdayThisWeek(date);
            // Some days of a year are part of next year according to ISO 8601.
            // Compute the firstThurs from the year of this week's Thursday
            const firstThurs = getFirstThursdayOfYear(thisThurs.getFullYear());
            const diff = thisThurs.getTime() - firstThurs.getTime();
            result = 1 + Math.round(diff / 6.048e8); // 6.048e8 ms per week
        }
        return padNumber(result, size, getLocaleNumberSymbol(locale, NumberSymbol.MinusSign));
    };
}
function timeZoneGetter(width) {
    return function (date, locale, offset) {
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
                }
                else {
                    return ((zone >= 0) ? '+' : '') + padNumber(hours, 2, minusSign) + ':' +
                        padNumber(Math.abs(zone % 60), 2, minusSign);
                }
            default:
                throw new Error(`Unknown zone width "${width}"`);
        }
    };
}
function padNumber(num, digits, minusSign = '-', trim, negWrap) {
    let neg = '';
    if (num < 0 || (negWrap && num <= 0)) {
        if (negWrap) {
            num = -num + 1;
        }
        else {
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
function getDatePart(part, date) {
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
function formatFractionalSeconds(milliseconds, digits) {
    const strMs = padNumber(milliseconds, 3);
    return strMs.substr(0, digits);
}
function getFirstThursdayOfYear(year) {
    const firstDayOfYear = (new Date(year, JANUARY, 1)).getDay();
    return new Date(year, 0, 1 + ((firstDayOfYear <= THURSDAY) ? THURSDAY : THURSDAY + 7) - firstDayOfYear);
}
function getThursdayThisWeek(datetime) {
    return new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate() + (THURSDAY - datetime.getDay()));
}

/**
 *Класс, содержащий статический метод, определяющий смещение часового пояса относительно GMT (+00:00) по переданной строке с названием таймзоны.
 *Создавать новый объект этого класса для использования метода не требуется.
 */
class TimeZoneIdentifier {
    /**
     *Метод определяет смещение часового пояса относительно GMT (+00:00) по переданной строке с названием таймзоны.
     *@param zone - Строка с названием таймзоны ( например 'America/New_York').
     *@return  - Строка, представляющая смещение относительно GMT.
     *
     *Пример :
     *const offset = TimeZoneIdentifier.getTimeZoneGMTOffsetfromNameZone('Europe/Moscow');
     *console.log(offset) /// "+03:00"
     *
     * */
    static getTimeZoneGMTOffsetfromNameZone(zone) {
        if (!zone) {
            zone = process.env.TZ ? process.env.TZ : Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        ;
        switch (zone) {
            case 'Etc/GMT+12': return '-12:00';
            case 'Etc/GMT+11': return '-11:00';
            case 'Pacific/Midway': return '-11:00';
            case 'Pacific/Niue': return '-11:00';
            case 'Pacific/Pago_Pago': return '-11:00';
            case 'America/Adak': return '-10:00';
            case 'Etc/GMT+10': return '-10:00';
            case 'Pacific/Honolulu': return '-10:00';
            case 'Pacific/Rarotonga': return '-10:00';
            case 'Pacific/Tahiti': return '-10:00';
            case 'Pacific/Marquesas': return '-09:30';
            case 'America/Anchorage': return '-09:00';
            case 'America/Juneau': return '-09:00';
            case 'America/Metlakatla': return '-09:00';
            case 'America/Nome': return '-09:00';
            case 'America/Sitka': return '-09:00';
            case 'America/Yakutat': return '-09:00';
            case 'Etc/GMT+9': return '-09:00';
            case 'Pacific/Gambier': return '-09:00';
            case 'America/Los_Angeles': return '-08:00';
            case 'America/Tijuana': return '-08:00';
            case 'America/Vancouver': return '-08:00';
            case 'Etc/GMT+8': return '-08:00';
            case 'Pacific/Pitcairn': return '-08:00';
            case 'America/Boise': return '-07:00';
            case 'America/Cambridge_Bay': return '-07:00';
            case 'America/Chihuahua': return '-07:00';
            case 'America/Creston': return '-07:00';
            case 'America/Dawson': return '-07:00';
            case 'America/Dawson_Creek': return '-07:00';
            case 'America/Denver': return '-07:00';
            case 'America/Edmonton': return '-07:00';
            case 'America/Fort_Nelson': return '-07:00';
            case 'America/Hermosillo': return '-07:00';
            case 'America/Inuvik': return '-07:00';
            case 'America/Mazatlan': return '-07:00';
            case 'America/Ojinaga': return '-07:00';
            case 'America/Phoenix': return '-07:00';
            case 'America/Whitehorse': return '-07:00';
            case 'America/Yellowknife': return '-07:00';
            case 'Etc/GMT+7': return '-07:00';
            case 'America/Bahia_Banderas': return '-06:00';
            case 'America/Belize': return '-06:00';
            case 'America/Chicago': return '-06:00';
            case 'America/Costa_Rica': return '-06:00';
            case 'America/El_Salvador': return '-06:00';
            case 'America/Guatemala': return '-06:00';
            case 'America/Indiana/Knox': return '-06:00';
            case 'America/Indiana/Tell_City': return '-06:00';
            case 'America/Managua': return '-06:00';
            case 'America/Matamoros': return '-06:00';
            case 'America/Menominee': return '-06:00';
            case 'America/Merida': return '-06:00';
            case 'America/Mexico_City': return '-06:00';
            case 'America/Monterrey': return '-06:00';
            case 'America/North_Dakota/Beulah': return '-06:00';
            case 'America/North_Dakota/Center': return '-06:00';
            case 'America/North_Dakota/New_Salem': return '-06:00';
            case 'America/Rainy_River': return '-06:00';
            case 'America/Rankin_Inlet': return '-06:00';
            case 'America/Regina': return '-06:00';
            case 'America/Resolute': return '-06:00';
            case 'America/Swift_Current': return '-06:00';
            case 'America/Tegucigalpa': return '-06:00';
            case 'America/Winnipeg': return '-06:00';
            case 'Etc/GMT+6': return '-06:00';
            case 'Pacific/Easter': return '-06:00';
            case 'Pacific/Galapagos': return '-06:00';
            case 'America/Atikokan': return '-05:00';
            case 'America/Bogota': return '-05:00';
            case 'America/Cancun': return '-05:00';
            case 'America/Cayman': return '-05:00';
            case 'America/Detroit': return '-05:00';
            case 'America/Eirunepe': return '-05:00';
            case 'America/Grand_Turk': return '-05:00';
            case 'America/Guayaquil': return '-05:00';
            case 'America/Havana': return '-05:00';
            case 'America/Indiana/Indianapolis': return '-05:00';
            case 'America/Indiana/Marengo': return '-05:00';
            case 'America/Indiana/Petersburg': return '-05:00';
            case 'America/Indiana/Vevay': return '-05:00';
            case 'America/Indiana/Vincennes': return '-05:00';
            case 'America/Indiana/Winamac': return '-05:00';
            case 'America/Iqaluit': return '-05:00';
            case 'America/Jamaica': return '-05:00';
            case 'America/Kentucky/Louisville': return '-05:00';
            case 'America/Kentucky/Monticello': return '-05:00';
            case 'America/Lima': return '-05:00';
            case 'America/Nassau': return '-05:00';
            case 'America/New_York': return '-05:00';
            case 'America/Nipigon': return '-05:00';
            case 'America/Panama': return '-05:00';
            case 'America/Pangnirtung': return '-05:00';
            case 'America/Port-au-Prince': return '-05:00';
            case 'America/Rio_Branco': return '-05:00';
            case 'America/Thunder_Bay': return '-05:00';
            case 'America/Toronto': return '-05:00';
            case 'Etc/GMT+5': return '-05:00';
            case 'America/Anguilla': return '-04:00';
            case 'America/Antigua': return '-04:00';
            case 'America/Aruba': return '-04:00';
            case 'America/Asuncion': return '-04:00';
            case 'America/Barbados': return '-04:00';
            case 'America/Blanc-Sablon': return '-04:00';
            case 'America/Boa_Vista': return '-04:00';
            case 'America/Campo_Grande': return '-04:00';
            case 'America/Caracas': return '-04:00';
            case 'America/Cuiaba': return '-04:00';
            case 'America/Curacao': return '-04:00';
            case 'America/Dominica': return '-04:00';
            case 'America/Glace_Bay': return '-04:00';
            case 'America/Goose_Bay': return '-04:00';
            case 'America/Grenada': return '-04:00';
            case 'America/Guadeloupe': return '-04:00';
            case 'America/Guyana': return '-04:00';
            case 'America/Halifax': return '-04:00';
            case 'America/Kralendijk': return '-04:00';
            case 'America/La_Paz': return '-04:00';
            case 'America/Lower_Princes': return '-04:00';
            case 'America/Manaus': return '-04:00';
            case 'America/Marigot': return '-04:00';
            case 'America/Martinique': return '-04:00';
            case 'America/Moncton': return '-04:00';
            case 'America/Montserrat': return '-04:00';
            case 'America/Port_of_Spain': return '-04:00';
            case 'America/Porto_Velho': return '-04:00';
            case 'America/Puerto_Rico': return '-04:00';
            case 'America/Santiago': return '-04:00';
            case 'America/Santo_Domingo': return '-04:00';
            case 'America/St_Barthelemy': return '-04:00';
            case 'America/St_Kitts': return '-04:00';
            case 'America/St_Lucia': return '-04:00';
            case 'America/St_Thomas': return '-04:00';
            case 'America/St_Vincent': return '-04:00';
            case 'America/Thule': return '-04:00';
            case 'America/Tortola': return '-04:00';
            case 'Atlantic/Bermuda': return '-04:00';
            case 'Etc/GMT+4': return '-04:00';
            case 'America/St_Johns': return '-03:30';
            case 'America/Araguaina': return '-03:00';
            case 'America/Argentina/Buenos_Aires': return '-03:00';
            case 'America/Argentina/Catamarca': return '-03:00';
            case 'America/Argentina/Cordoba': return '-03:00';
            case 'America/Argentina/Jujuy': return '-03:00';
            case 'America/Argentina/La_Rioja': return '-03:00';
            case 'America/Argentina/Mendoza': return '-03:00';
            case 'America/Argentina/Rio_Gallegos': return '-03:00';
            case 'America/Argentina/Salta': return '-03:00';
            case 'America/Argentina/San_Juan': return '-03:00';
            case 'America/Argentina/San_Luis': return '-03:00';
            case 'America/Argentina/Tucuman': return '-03:00';
            case 'America/Argentina/Ushuaia': return '-03:00';
            case 'America/Bahia': return '-03:00';
            case 'America/Belem': return '-03:00';
            case 'America/Cayenne': return '-03:00';
            case 'America/Fortaleza': return '-03:00';
            case 'America/Maceio': return '-03:00';
            case 'America/Miquelon': return '-03:00';
            case 'America/Montevideo': return '-03:00';
            case 'America/Nuuk': return '-03:00';
            case 'America/Paramaribo': return '-03:00';
            case 'America/Punta_Arenas': return '-03:00';
            case 'America/Recife': return '-03:00';
            case 'America/Santarem': return '-03:00';
            case 'America/Sao_Paulo': return '-03:00';
            case 'Antarctica/Palmer': return '-03:00';
            case 'Antarctica/Rothera': return '-03:00';
            case 'Atlantic/Stanley': return '-03:00';
            case 'Etc/GMT+3': return '-03:00';
            case 'America/Noronha': return '-02:00';
            case 'Atlantic/South_Georgia': return '-02:00';
            case 'Etc/GMT+2': return '-02:00';
            case 'America/Scoresbysund': return '-01:00';
            case 'Atlantic/Azores': return '-01:00';
            case 'Atlantic/Cape_Verde': return '-01:00';
            case 'Etc/GMT+1': return '-01:00';
            case 'Africa/Abidjan': return '+00:00';
            case 'Africa/Accra': return '+00:00';
            case 'Africa/Bamako': return '+00:00';
            case 'Africa/Banjul': return '+00:00';
            case 'Africa/Bissau': return '+00:00';
            case 'Africa/Conakry': return '+00:00';
            case 'Africa/Dakar': return '+00:00';
            case 'Africa/Freetown': return '+00:00';
            case 'Africa/Lome': return '+00:00';
            case 'Africa/Monrovia': return '+00:00';
            case 'Africa/Nouakchott': return '+00:00';
            case 'Africa/Ouagadougou': return '+00:00';
            case 'Africa/Sao_Tome': return '+00:00';
            case 'America/Danmarkshavn': return '+00:00';
            case 'Antarctica/Troll': return '+00:00';
            case 'Atlantic/Canary': return '+00:00';
            case 'Atlantic/Faroe': return '+00:00';
            case 'Atlantic/Madeira': return '+00:00';
            case 'Atlantic/Reykjavik': return '+00:00';
            case 'Atlantic/St_Helena': return '+00:00';
            case 'Etc/GMT': return '+00:00';
            case 'Etc/GMT+0': return '+00:00';
            case 'Etc/GMT-0': return '+00:00';
            case 'Etc/GMT0': return '+00:00';
            case 'Etc/UTC': return '+00:00';
            case 'Europe/Guernsey': return '+00:00';
            case 'Europe/Isle_of_Man': return '+00:00';
            case 'Europe/Jersey': return '+00:00';
            case 'Europe/Lisbon': return '+00:00';
            case 'Europe/London': return '+00:00';
            case 'Factory': return '+00:00';
            case 'GMT': return '+00:00';
            case 'UTC': return '+00:00';
            case 'Africa/Algiers': return '+01:00';
            case 'Africa/Bangui': return '+01:00';
            case 'Africa/Brazzaville': return '+01:00';
            case 'Africa/Casablanca': return '+01:00';
            case 'Africa/Ceuta': return '+01:00';
            case 'Africa/Douala': return '+01:00';
            case 'Africa/El_Aaiun': return '+01:00';
            case 'Africa/Kinshasa': return '+01:00';
            case 'Africa/Lagos': return '+01:00';
            case 'Africa/Libreville': return '+01:00';
            case 'Africa/Luanda': return '+01:00';
            case 'Africa/Malabo': return '+01:00';
            case 'Africa/Ndjamena': return '+01:00';
            case 'Africa/Niamey': return '+01:00';
            case 'Africa/Porto-Novo': return '+01:00';
            case 'Africa/Tunis': return '+01:00';
            case 'Arctic/Longyearbyen': return '+01:00';
            case 'Etc/GMT-1': return '+01:00';
            case 'Europe/Amsterdam': return '+01:00';
            case 'Europe/Andorra': return '+01:00';
            case 'Europe/Belgrade': return '+01:00';
            case 'Europe/Berlin': return '+01:00';
            case 'Europe/Bratislava': return '+01:00';
            case 'Europe/Brussels': return '+01:00';
            case 'Europe/Budapest': return '+01:00';
            case 'Europe/Busingen': return '+01:00';
            case 'Europe/Copenhagen': return '+01:00';
            case 'Europe/Dublin': return '+01:00';
            case 'Europe/Gibraltar': return '+01:00';
            case 'Europe/Ljubljana': return '+01:00';
            case 'Europe/Luxembourg': return '+01:00';
            case 'Europe/Madrid': return '+01:00';
            case 'Europe/Malta': return '+01:00';
            case 'Europe/Monaco': return '+01:00';
            case 'Europe/Oslo': return '+01:00';
            case 'Europe/Paris': return '+01:00';
            case 'Europe/Podgorica': return '+01:00';
            case 'Europe/Prague': return '+01:00';
            case 'Europe/Rome': return '+01:00';
            case 'Europe/San_Marino': return '+01:00';
            case 'Europe/Sarajevo': return '+01:00';
            case 'Europe/Skopje': return '+01:00';
            case 'Europe/Stockholm': return '+01:00';
            case 'Europe/Tirane': return '+01:00';
            case 'Europe/Vaduz': return '+01:00';
            case 'Europe/Vatican': return '+01:00';
            case 'Europe/Vienna': return '+01:00';
            case 'Europe/Warsaw': return '+01:00';
            case 'Europe/Zagreb': return '+01:00';
            case 'Europe/Zurich': return '+01:00';
            case 'Africa/Blantyre': return '+02:00';
            case 'Africa/Bujumbura': return '+02:00';
            case 'Africa/Cairo': return '+02:00';
            case 'Africa/Gaborone': return '+02:00';
            case 'Africa/Harare': return '+02:00';
            case 'Africa/Johannesburg': return '+02:00';
            case 'Africa/Khartoum': return '+02:00';
            case 'Africa/Kigali': return '+02:00';
            case 'Africa/Lubumbashi': return '+02:00';
            case 'Africa/Lusaka': return '+02:00';
            case 'Africa/Maputo': return '+02:00';
            case 'Africa/Maseru': return '+02:00';
            case 'Africa/Mbabane': return '+02:00';
            case 'Africa/Tripoli': return '+02:00';
            case 'Africa/Windhoek': return '+02:00';
            case 'Asia/Amman': return '+02:00';
            case 'Asia/Beirut': return '+02:00';
            case 'Asia/Damascus': return '+02:00';
            case 'Asia/Famagusta': return '+02:00';
            case 'Asia/Gaza': return '+02:00';
            case 'Asia/Hebron': return '+02:00';
            case 'Asia/Jerusalem': return '+02:00';
            case 'Asia/Nicosia': return '+02:00';
            case 'Etc/GMT-2': return '+02:00';
            case 'Europe/Athens': return '+02:00';
            case 'Europe/Bucharest': return '+02:00';
            case 'Europe/Chisinau': return '+02:00';
            case 'Europe/Helsinki': return '+02:00';
            case 'Europe/Kaliningrad': return '+02:00';
            case 'Europe/Kiev': return '+02:00';
            case 'Europe/Mariehamn': return '+02:00';
            case 'Europe/Nicosia': return '+02:00';
            case 'Europe/Riga': return '+02:00';
            case 'Europe/Sofia': return '+02:00';
            case 'Europe/Tallinn': return '+02:00';
            case 'Europe/Uzhgorod': return '+02:00';
            case 'Europe/Vilnius': return '+02:00';
            case 'Europe/Zaporozhye': return '+02:00';
            case 'Africa/Addis_Ababa': return '+03:00';
            case 'Africa/Asmara': return '+03:00';
            case 'Africa/Dar_es_Salaam': return '+03:00';
            case 'Africa/Djibouti': return '+03:00';
            case 'Africa/Juba': return '+03:00';
            case 'Africa/Kampala': return '+03:00';
            case 'Africa/Mogadishu': return '+03:00';
            case 'Africa/Nairobi': return '+03:00';
            case 'Antarctica/Syowa': return '+03:00';
            case 'Asia/Aden': return '+03:00';
            case 'Asia/Baghdad': return '+03:00';
            case 'Asia/Bahrain': return '+03:00';
            case 'Asia/Istanbul': return '+03:00';
            case 'Asia/Kuwait': return '+03:00';
            case 'Asia/Qatar': return '+03:00';
            case 'Asia/Riyadh': return '+03:00';
            case 'Etc/GMT-3': return '+03:00';
            case 'Europe/Istanbul': return '+03:00';
            case 'Europe/Kirov': return '+03:00';
            case 'Europe/Minsk': return '+03:00';
            case 'Europe/Moscow': return '+03:00';
            case 'Europe/Simferopol': return '+03:00';
            case 'Europe/Volgograd': return '+03:00';
            case 'Indian/Antananarivo': return '+03:00';
            case 'Indian/Comoro': return '+03:00';
            case 'Indian/Mayotte': return '+03:00';
            case 'Asia/Tehran': return '+03:30';
            case 'Asia/Baku': return '+04:00';
            case 'Asia/Dubai': return '+04:00';
            case 'Asia/Muscat': return '+04:00';
            case 'Asia/Tbilisi': return '+04:00';
            case 'Asia/Yerevan': return '+04:00';
            case 'Etc/GMT-4': return '+04:00';
            case 'Europe/Astrakhan': return '+04:00';
            case 'Europe/Samara': return '+04:00';
            case 'Europe/Saratov': return '+04:00';
            case 'Europe/Ulyanovsk': return '+04:00';
            case 'Indian/Mahe': return '+04:00';
            case 'Indian/Mauritius': return '+04:00';
            case 'Indian/Reunion': return '+04:00';
            case 'Asia/Kabul': return '+04:30';
            case 'Antarctica/Mawson': return '+05:00';
            case 'Asia/Aqtau': return '+05:00';
            case 'Asia/Aqtobe': return '+05:00';
            case 'Asia/Ashgabat': return '+05:00';
            case 'Asia/Atyrau': return '+05:00';
            case 'Asia/Dushanbe': return '+05:00';
            case 'Asia/Karachi': return '+05:00';
            case 'Asia/Oral': return '+05:00';
            case 'Asia/Qyzylorda': return '+05:00';
            case 'Asia/Samarkand': return '+05:00';
            case 'Asia/Tashkent': return '+05:00';
            case 'Asia/Yekaterinburg': return '+05:00';
            case 'Etc/GMT-5': return '+05:00';
            case 'Indian/Kerguelen': return '+05:00';
            case 'Indian/Maldives': return '+05:00';
            case 'Asia/Colombo': return '+05:30';
            case 'Asia/Kolkata': return '+05:30';
            case 'Asia/Kathmandu': return '+05:45';
            case 'Antarctica/Vostok': return '+06:00';
            case 'Asia/Almaty': return '+06:00';
            case 'Asia/Bishkek': return '+06:00';
            case 'Asia/Dhaka': return '+06:00';
            case 'Asia/Omsk': return '+06:00';
            case 'Asia/Qostanay': return '+06:00';
            case 'Asia/Thimphu': return '+06:00';
            case 'Asia/Urumqi': return '+06:00';
            case 'Etc/GMT-6': return '+06:00';
            case 'Indian/Chagos': return '+06:00';
            case 'Asia/Yangon': return '+06:30';
            case 'Indian/Cocos': return '+06:30';
            case 'Antarctica/Davis': return '+07:00';
            case 'Asia/Bangkok': return '+07:00';
            case 'Asia/Barnaul': return '+07:00';
            case 'Asia/Ho_Chi_Minh': return '+07:00';
            case 'Asia/Hovd': return '+07:00';
            case 'Asia/Jakarta': return '+07:00';
            case 'Asia/Krasnoyarsk': return '+07:00';
            case 'Asia/Novokuznetsk': return '+07:00';
            case 'Asia/Novosibirsk': return '+07:00';
            case 'Asia/Phnom_Penh': return '+07:00';
            case 'Asia/Pontianak': return '+07:00';
            case 'Asia/Tomsk': return '+07:00';
            case 'Asia/Vientiane': return '+07:00';
            case 'Etc/GMT-7': return '+07:00';
            case 'Indian/Christmas': return '+07:00';
            case 'Asia/Brunei': return '+08:00';
            case 'Asia/Choibalsan': return '+08:00';
            case 'Asia/Hong_Kong': return '+08:00';
            case 'Asia/Irkutsk': return '+08:00';
            case 'Asia/Kuala_Lumpur': return '+08:00';
            case 'Asia/Kuching': return '+08:00';
            case 'Asia/Macau': return '+08:00';
            case 'Asia/Makassar': return '+08:00';
            case 'Asia/Manila': return '+08:00';
            case 'Asia/Shanghai': return '+08:00';
            case 'Asia/Singapore': return '+08:00';
            case 'Asia/Taipei': return '+08:00';
            case 'Asia/Ulaanbaatar': return '+08:00';
            case 'Australia/Perth': return '+08:00';
            case 'Etc/GMT-8': return '+08:00';
            case 'Australia/Eucla': return '+08:45';
            case 'Asia/Chita': return '+09:00';
            case 'Asia/Dili': return '+09:00';
            case 'Asia/Jayapura': return '+09:00';
            case 'Asia/Khandyga': return '+09:00';
            case 'Asia/Pyongyang': return '+09:00';
            case 'Asia/Seoul': return '+09:00';
            case 'Asia/Tokyo': return '+09:00';
            case 'Asia/Yakutsk': return '+09:00';
            case 'Etc/GMT-9': return '+09:00';
            case 'Pacific/Palau': return '+09:00';
            case 'Australia/Adelaide': return '+09:30';
            case 'Australia/Broken_Hill': return '+09:30';
            case 'Australia/Darwin': return '+09:30';
            case 'Antarctica/DumontDUrville': return '+10:00';
            case 'Antarctica/Macquarie': return '+10:00';
            case 'Asia/Ust-Nera': return '+10:00';
            case 'Asia/Vladivostok': return '+10:00';
            case 'Australia/Brisbane': return '+10:00';
            case 'Australia/Hobart': return '+10:00';
            case 'Australia/Lindeman': return '+10:00';
            case 'Australia/Melbourne': return '+10:00';
            case 'Australia/Sydney': return '+10:00';
            case 'Etc/GMT-10': return '+10:00';
            case 'Pacific/Chuuk': return '+10:00';
            case 'Pacific/Guam': return '+10:00';
            case 'Pacific/Port_Moresby': return '+10:00';
            case 'Pacific/Saipan': return '+10:00';
            case 'Australia/Lord_Howe': return '+10:30';
            case 'Antarctica/Casey': return '+11:00';
            case 'Asia/Magadan': return '+11:00';
            case 'Asia/Sakhalin': return '+11:00';
            case 'Asia/Srednekolymsk': return '+11:00';
            case 'Etc/GMT-11': return '+11:00';
            case 'Pacific/Bougainville': return '+11:00';
            case 'Pacific/Efate': return '+11:00';
            case 'Pacific/Guadalcanal': return '+11:00';
            case 'Pacific/Kosrae': return '+11:00';
            case 'Pacific/Norfolk': return '+11:00';
            case 'Pacific/Noumea': return '+11:00';
            case 'Pacific/Pohnpei': return '+11:00';
            case 'Antarctica/McMurdo': return '+12:00';
            case 'Asia/Anadyr': return '+12:00';
            case 'Asia/Kamchatka': return '+12:00';
            case 'Etc/GMT-12': return '+12:00';
            case 'Pacific/Auckland': return '+12:00';
            case 'Pacific/Fiji': return '+12:00';
            case 'Pacific/Funafuti': return '+12:00';
            case 'Pacific/Kwajalein': return '+12:00';
            case 'Pacific/Majuro': return '+12:00';
            case 'Pacific/Nauru': return '+12:00';
            case 'Pacific/Tarawa': return '+12:00';
            case 'Pacific/Wake': return '+12:00';
            case 'Pacific/Wallis': return '+12:00';
            case 'Pacific/Chatham': return '+12:45';
            case 'Etc/GMT-13': return '+13:00';
            case 'Pacific/Apia': return '+13:00';
            case 'Pacific/Enderbury': return '+13:00';
            case 'Pacific/Fakaofo': return '+13:00';
            case 'Pacific/Tongatapu': return '+13:00';
            case 'Etc/GMT-14': return '+14:00';
            case 'Pacific/Kiritimati': return '+14:00';
            default: throw Error('Неизвестная таймзона');
        }
    }
}

/** Функция-хелпер для проверки, что переданное значение не является null или undefined */
function isValue(value) {
    return value !== null && value !== undefined;
}
/**
 * Функция валидации переданного объекта restriction на соответствие интерфейсу Restrictions
 * @param restriction - проверяемый объект, содержащий информацию о рабочем времени и временной зоне.
 */
function isValidRestriction(restriction) {
    return (typeof restriction === 'object' &&
        isValue(restriction) &&
        'timezone' in restriction &&
        'worktime' in restriction &&
        isValue(restriction.timezone) &&
        isValue(restriction.worktime));
}
/**
 * Функция валидации переданного объекта restriction на соответствие минимальным данным для заказа
 * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
 */
function isValidRestrictionOrder(restriction) {
    return (isValidRestriction(restriction) &&
        'minDeliveryTimeInMinutes' in restriction &&
        'possibleToOrderInMinutes' in restriction &&
        isValue(restriction.minDeliveryTimeInMinutes) &&
        isValue(restriction.possibleToOrderInMinutes));
}
/**
 * Класс, содержащий статические методы, необходимые для работы с ограничениями рабочего времени предприятия.
 * Создавать новый экземпляр этого класса для использования статических методов не требуется.
 *
 * При этом при создании экземпляра класса у объекта также будут доступны собственные реализации
 * всех статических методов.
 * Эти реализации отличаются от вызовов статических методов только мемоизацией выполненных расчетов.
 *
 */
class WorkTimeValidator {
    /**
     * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @return Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
     */
    static getMaxOrderDate(restriction, currentdate) {
        if (isValue(restriction) &&
            isValidRestrictionOrder(restriction) &&
            isDate(currentdate)) {
            return formatDate(currentdate.getTime() + restriction.possibleToOrderInMinutes * 60000, 'yyyy-MM-dd', 'en');
        }
        else {
            throw new Error(isDate(currentdate)
                ? 'Не передан корректный объект даты'
                : !isValue(restriction)
                    ? 'Не передан объект restrictions'
                    : 'Передан невалидный обьект restrictions');
        }
    }
    /**
     * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
     * @param time - строка в формате HH:mm -`(00-24 часа):(0-59 минут)` - время.
     * @return кол-во минут.
     */
    static getTimeFromString(time) {
        if (!isValue(time)) {
            throw 'Не передана строка с преобразуемым временем в формате HH:mm';
        }
        else {
            const regExp = new RegExp(/^(00|01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23)+:([0-5]\d)+/);
            let checkedTime = time.trim();
            if (checkedTime.includes(' ') || checkedTime.includes('T')) {
                checkedTime = checkedTime.split(checkedTime.includes(' ') ? ' ' : 'T')[1];
            }
            if (regExp.test(checkedTime)) {
                return +checkedTime.split(':')[0] * 60 + +checkedTime.split(':')[1];
            }
            else {
                throw 'Переданная строка не соответствует формату HH:mm -`(00-24 часа):(0-59 минут)`';
            }
        }
    }
    /**
     * Метод конвертирует переданное кол-во минут в строкове представление времени в формате HH:mm - `(00-24 часа):(0-59 минут)`.
     * Например:
     *
     * const a = convertMinutesToTime(50) // a = '00:50'
     * const b = convertMinutesToTime(1200) // b = '20:00'
     *
     * @param time - Число в диапазоне от 0 до 1440 (так как максимум в 1 сутках = 1440 минут).
     * При передаче в time отрицательного значения, знак будет "отобршен", а для метод вернет результат, рассчитанный для полученного положительного значения.
     * Если в time будет передано значение больше 1440 - метод вернет результат для значения без учета "превышающих суток" (т.е. с кратным вычетом 1440 минут)
     *
     * Например:
     *
     * const a = convertMinutesToTime(60) // a = '01:00'
     * const b = convertMinutesToTime(1500) // b = '01:00' (1440 минут "целых" суток были "отброшены")
     *
     * @returns
     */
    static convertMinutesToTime(time) {
        if (time < 1441) {
            const hour = Math.floor(time / 60);
            const hourStr = ((hour <= 9 ? `0${String(hour)}` : String(hour)));
            const minutes = String(time - hour * 60);
            const minutesStr = (`${minutes.length == 1 ? '0' : ''}${minutes}`);
            return `${hourStr}:${minutesStr}`;
        }
        else {
            return WorkTimeValidator.convertMinutesToTime(time - 1440);
        }
    }
    /**
     * Метод проверяет, доступна ли возможность доставки на ближайшее время.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий локальные дату и время пользователя, для которых и проверяется возможность доставки
     * @return Обьект, содержащий информацию:
     * {
          isWorkNow:boolean - Возможна ли доставка в ближайшее время
          isNewDay:boolean - Служебный параметр для внутреннего использования.
            Представляет признак, что из-за разницы часовых поясов расчет даты "перепрыгнул" на новый день.
          currentTime:number - Служебный параметр для внутреннего использования.
            Представляет проверяемое методом время в минутах от 00:00 в часовом поясе предприятия.
          curentDayStartTime:number - Служебный параметр для внутреннего использования.
            Представляет время начала рабочего дня в минутах от 00:00 в часовом поясе предприятия.
          curentDayStopTime:number - Служебный параметр для внутреннего использования.
            Представляет время окончания рабочего дня в минутах от 00:00 в часовом поясе предприятия.
        }
     */
    static isWorkNow(restriction, currentdate = new Date()) {
        // Если испольняется в NodeJS
        if (isValue(restriction) &&
            !isValue(restriction.timezone) &&
            typeof process !== 'undefined') {
            restriction.timezone =
                process?.env?.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        if (!isValue(restriction) || !isValidRestriction(restriction)) {
            throw new Error(!isDate(currentdate)
                ? 'Не передан корректный объект даты'
                : !isValue(restriction)
                    ? 'Не передан объект restrictions'
                    : 'Передан невалидный обьект restrictions');
        }
        else {
            if (!isValue(restriction.worktime) ||
                !Object.keys(restriction.worktime).length) {
                return {
                    workNow: true,
                };
            }
            const companyLocalTimeZone = TimeZoneIdentifier.getTimeZoneGMTOffsetfromNameZone(restriction.timezone).split(':');
            const companyLocalTimeZoneDelta = +companyLocalTimeZone[0] * 60 + +companyLocalTimeZone[1];
            const lokalTimeDelta = companyLocalTimeZoneDelta + currentdate.getTimezoneOffset(); // смещение времени пользователя относительно времени торговой точки
            const currentTimeInMinutesWithLocalDelta = WorkTimeValidator.getTimeFromString(formatDate(currentdate, 'HH:mm', 'en')) + lokalTimeDelta;
            /**
             * текущее время в минутах с начала дня (600 = 10:00. 1200 = 20:00)
             * если из-за разницы поясов расчет перепрыгнул на новый день, то приводим время к правильному значению в диапазоне 24 часов
             * */
            const currentTime = currentTimeInMinutesWithLocalDelta > 1440
                ? currentTimeInMinutesWithLocalDelta - 1440
                : currentTimeInMinutesWithLocalDelta;
            const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, currentTimeInMinutesWithLocalDelta > 1440
                ? new Date(currentdate.getTime() + 86400000)
                : currentdate); // текущее рабочее время
            const curentDayStartTime = WorkTimeValidator.getTimeFromString(currentDayWorkTime.start); // текущее время начала рабочего дня в минутах
            const curentDayStopTime = WorkTimeValidator.getTimeFromString(currentDayWorkTime.stop); // текущее время окончания рабочего дня в минутах
            return {
                workNow: currentTime < curentDayStopTime && currentTime > curentDayStartTime,
                isNewDay: currentTimeInMinutesWithLocalDelta > 1440,
                currentTime,
                curentDayStartTime,
                curentDayStopTime,
            };
        }
    }
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Доставка курьером".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    static getPossibleDelieveryOrderDateTime(restriction, currentdate) {
        if (!isValidRestrictionOrder(restriction)) {
            throw new Error('Не передан или передан невалидный объект restrictions');
        }
        const checkTime = WorkTimeValidator.isWorkNow(restriction, currentdate);
        if (checkTime.workNow && isValue(checkTime.currentTime)) {
            console.log('Сейчас рабочее время. Расчет не требуется.');
            const possibleTime = checkTime.currentTime + (+restriction.minDeliveryTimeInMinutes || 0);
            const possibleTimeStr = WorkTimeValidator.convertMinutesToTime(possibleTime);
            return formatDate(currentdate, `yyyy-MM-dd ${possibleTimeStr}`, 'en');
        }
        else {
            if (isValue(checkTime.currentTime) &&
                isValue(checkTime.curentDayStopTime)) {
                const currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, checkTime.isNewDay
                    ? new Date(currentdate.getTime() + 86400000)
                    : currentdate);
                const time = this.getTimeFromString(currentDayWorkTime.start) +
                    +restriction.minDeliveryTimeInMinutes;
                const timeString = WorkTimeValidator.convertMinutesToTime(time);
                return formatDate(checkTime.isNewDay ||
                    checkTime.currentTime > checkTime.curentDayStopTime
                    ? currentdate.getTime() + 86400000
                    : currentdate, `yyyy-MM-dd ${timeString}`, 'en');
            }
            else {
                throw 'Не удалось рассчитать currentTime и curentDayStopTime.';
            }
        }
    }
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    static getPossibleSelfServiceOrderDateTime(restriction, currentdate) {
        if (!isValidRestrictionOrder(restriction)) {
            throw new Error('Не передан или передан невалидный объект restrictions');
        }
        /**
         * Для обеспечения иммутабельности данных создается новый обьект restrictions, идентичный полученному в параметрах, но с измененным массивом worktime.
         * В массиве worktime обновляются ограничения времени работы с обычных на актуальные для самовывоза.
         * */
        const newRestriction = {
            ...restriction,
            worktime: restriction.worktime.map((worktime) => worktime.selfService
                ? { ...worktime, ...worktime.selfService }
                : worktime),
        };
        return WorkTimeValidator.getPossibleDelieveryOrderDateTime(newRestriction, currentdate);
    }
    /**
     * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    static getCurrentWorkTime(restriction, currentdate) {
        if (!isValidRestriction(restriction)) {
            throw new Error('Не передан или передан невалидный объект restrictions');
        }
        let i = 0;
        let result = null;
        while (i < restriction.worktime.length && !isValue(result)) {
            if (restriction.worktime[i].dayOfWeek === 'all' ||
                (typeof restriction.worktime[i].dayOfWeek === 'string'
                    ? restriction.worktime[i].dayOfWeek.toLowerCase()
                    : restriction.worktime[i].dayOfWeek.map((day) => day.toLowerCase())).includes(formatDate(currentdate, 'EEEE', 'en').toLowerCase())) {
                result = restriction.worktime[i];
            }
            i += 1;
        }
        if (!isValue(result)) {
            throw new Error('Нет актуального расписания работы для текущего дня');
        }
        else {
            return result;
        }
    }
    /**
     * Логика ниже предназначена для использования экземпляра класса WorkTimeValidator
     */
    constructor() {
        this._memory = {
            getMaxOrderDate: new Map(),
            getTimeFromString: new Map(),
            isWorkNow: new Map(),
            getPossibleDelieveryOrderDateTime: new Map(),
            getPossibleSelfServiceOrderDateTime: new Map(),
            getCurrentWorkTime: new Map(),
            convertMinutesToTime: new Map(),
        };
    }
    /**
     * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @return :string - Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
     */
    getMaxOrderDate(restriction, currentdate) {
        const memoryKey = JSON.stringify({ restriction, currentdate });
        const checkMemory = this._memory.getMaxOrderDate.get(memoryKey);
        if (isValue(checkMemory)) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.getMaxOrderDate(restriction, currentdate);
            this._memory.getMaxOrderDate.set(memoryKey, result);
            return result;
        }
    }
    /**
     * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
     * @param time - строка в формате HH:mm - время.
     * @return :number - кол-во минут.
     */
    getTimeFromString(time) {
        const memoryKey = JSON.stringify({ time });
        const checkMemory = this._memory.getTimeFromString.get(memoryKey);
        if (isValue(checkMemory)) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.getTimeFromString(time);
            this._memory.getTimeFromString.set(memoryKey, result);
            return result;
        }
    }
    /**
     * Метод проверяет, доступна ли возможность доставки на ближайшее время.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий локальные дату и время пользователя, для которых и проверяется возможность доставки
     * @return Обьект, содержащий информацию:
     * {
          isWorkNow:boolean - Возможна ли доставка в ближайшее время
          isNewDay:boolean - Служебный параметр для внутреннего использования.
            Представляет признак, что из-за разницы часовых поясов расчет даты "перепрыгнул" на новый день.
          currentTime:number - Служебный параметр для внутреннего использования.
            Представляет проверяемое методом время в минутах от 00:00 в часовом поясе предприятия.
          curentDayStartTime:number - Служебный параметр для внутреннего использования.
            Представляет время начала рабочего дня в минутах от 00:00 в часовом поясе предприятия.
          curentDayStopTime:number - Служебный параметр для внутреннего использования.
            Представляет время окончания рабочего дня в минутах от 00:00 в часовом поясе предприятия.
        }
     */
    isWorkNow(restriction, currentdate) {
        const memoryKey = JSON.stringify({ restriction, currentdate });
        const checkMemory = this._memory.isWorkNow.get(memoryKey);
        if (isValue(checkMemory)) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.isWorkNow(restriction, currentdate);
            this._memory.isWorkNow.set(memoryKey, result);
            return result;
        }
    }
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Доставка курьером".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    getPossibleDelieveryOrderDateTime(restriction, currentdate) {
        const memoryKey = JSON.stringify({ restriction, currentdate });
        const checkMemory = this._memory.getPossibleDelieveryOrderDateTime.get(memoryKey);
        if (isValue(checkMemory)) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.getPossibleDelieveryOrderDateTime(restriction, currentdate);
            this._memory.getPossibleDelieveryOrderDateTime.set(memoryKey, result);
            return result;
        }
    }
    /**
     * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    getPossibleSelfServiceOrderDateTime(restriction, currentdate) {
        const memoryKey = JSON.stringify({ restriction, currentdate });
        const checkMemory = this._memory.getPossibleSelfServiceOrderDateTime.get(memoryKey);
        if (isValue(checkMemory)) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.getPossibleSelfServiceOrderDateTime(restriction, currentdate);
            this._memory.getPossibleSelfServiceOrderDateTime.set(memoryKey, result);
            return result;
        }
    }
    /**
     * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
     */
    getCurrentWorkTime(restriction, currentdate) {
        const memoryKey = JSON.stringify({ restriction, currentdate });
        const checkMemory = this._memory.getCurrentWorkTime.get(memoryKey);
        if (isValue(checkMemory)) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.getCurrentWorkTime(restriction, currentdate);
            this._memory.getCurrentWorkTime.set(memoryKey, result);
            return result;
        }
    }
    /**
     * Метод конвертирует переданное кол-во минут в строкове представление времени в формате HH:mm - `(00-24 часа):(0-59 минут)`.
     * Например:
     *
     * const a = convertMinutesToTime(50) // a = '00:50'
     * const b = convertMinutesToTime(1200) // b = '20:00'
     *
     * @param time - Число в диапазоне от 0 до 1440 (так как максимум в 1 сутках = 1440 минут).
     * При передаче в time отрицательного значения, знак будет "отобршен", а для метод вернет результат, рассчитанный для полученного положительного значения.
     * Если в time будет передано значение больше 1440 - метод вернет результат для значения без учета "превышающих суток" (т.е. с кратным вычетом 1440 минут)
     *
     * Например:
     *
     * const a = convertMinutesToTime(60) // a = '01:00'
     * const b = convertMinutesToTime(1500) // b = '01:00' (1440 минут "целых" суток были "отброшены")
     *
     * @returns
     */
    convertMinutesToTime(time) {
        const memoryKey = JSON.stringify({ time });
        const checkMemory = this._memory.convertMinutesToTime.get(memoryKey);
        if (isValue(checkMemory)) {
            return checkMemory;
        }
        else {
            const result = WorkTimeValidator.convertMinutesToTime(time);
            this._memory.convertMinutesToTime.set(memoryKey, result);
            return result;
        }
    }
}

/**
 * Generated bundle index. Do not edit.
 */

export { TimeZoneIdentifier, WorkTimeValidator, formatDate, isDate };
//# sourceMappingURL=webresto-worktime.mjs.map
