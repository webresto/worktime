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
export function ɵfindLocaleData(locale) {
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
export var ɵLocaleDataIndex;
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
//# sourceMappingURL=locale_data_core.js.map