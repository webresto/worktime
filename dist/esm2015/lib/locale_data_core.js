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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlX2RhdGFfY29yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvbG9jYWxlX2RhdGFfY29yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLE1BQU0sQ0FBQyxDQUFTO0lBQ3ZCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUN2RCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQUU7SUFDckMsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsTUFBYztJQUNyQyxPQUFPLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFFRCxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUM7QUFDcEIsTUFBTSxXQUFXLEdBQWdDLEVBQUUsQ0FBQztBQUVwRCxTQUFTLGFBQWEsQ0FBQyxnQkFBd0I7SUFDN0MsT0FBTyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBRUQsTUFBTSxRQUFRLEdBQUc7SUFDZixJQUFJO0lBQ0osQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDN0IsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BCO1FBQ0UsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxH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LENBQUE7SUFDaEIsdUZBQW9CLENBQUE7SUFDcEIsbUVBQVUsQ0FBQTtJQUNWLDJFQUFjLENBQUE7SUFDZCx1RUFBWSxDQUFBO0lBQ1osK0VBQWdCLENBQUE7SUFDaEIsdURBQUksQ0FBQTtJQUNKLDJFQUFjLENBQUE7SUFDZCx1RUFBWSxDQUFBO0lBQ1osb0VBQVUsQ0FBQTtJQUNWLG9FQUFVLENBQUE7SUFDViw0RUFBYyxDQUFBO0lBQ2QsMEVBQWEsQ0FBQTtJQUNiLDBFQUFhLENBQUE7SUFDYix3RUFBWSxDQUFBO0lBQ1osNEVBQWMsQ0FBQTtJQUNkLHdFQUFZLENBQUE7SUFDWixvRUFBVSxDQUFBO0lBQ1YsNEVBQWMsQ0FBQTtJQUNkLG9FQUFVLENBQUE7SUFDVixrRUFBUyxDQUFBO0FBQ1gsQ0FBQyxFQXZCVyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBdUIzQiIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIHBsdXJhbChuOiBudW1iZXIpOiBudW1iZXIge1xyXG4gIGNvbnN0IGkgPSBNYXRoLmZsb29yKE1hdGguYWJzKG4pKTtcclxuICBjb25zdCB2ID0gbi50b1N0cmluZygpLnJlcGxhY2UoL15bXi5dKlxcLj8vLCAnJykubGVuZ3RoO1xyXG4gIGlmIChpID09PSAxICYmIHYgPT09IDApIHsgcmV0dXJuIDE7IH1cclxuICByZXR1cm4gNTtcclxufVxyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplTG9jYWxlKGxvY2FsZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gbG9jYWxlLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXy9nLCAnLScpO1xyXG59XHJcblxyXG5jb25zdCB1ID0gdW5kZWZpbmVkO1xyXG5jb25zdCBMT0NBTEVfREFUQTogeyBbbG9jYWxlSWQ6IHN0cmluZ106IGFueSB9ID0ge307XHJcblxyXG5mdW5jdGlvbiBnZXRMb2NhbGVEYXRhKG5vcm1hbGl6ZWRMb2NhbGU6IHN0cmluZyk6IGFueSB7XHJcbiAgcmV0dXJuIExPQ0FMRV9EQVRBW25vcm1hbGl6ZWRMb2NhbGVdO1xyXG59XHJcblxyXG5jb25zdCBsb2NhbGVFbiA9IFtcclxuICAnZW4nLFxyXG4gIFtbJ2EnLCAncCddLCBbJ0FNJywgJ1BNJ10sIHVdLFxyXG4gIFtbJ0FNJywgJ1BNJ10sIHUsIHVdLFxyXG4gIFtcclxuICAgIFsnUycsICdNJywgJ1QnLCAnVycsICdUJywgJ0YnLCAnUyddLCBbJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCddLFxyXG4gICAgWydTdW5kYXknLCAnTW9uZGF5JywgJ1R1ZXNkYXknLCAnV2VkbmVzZGF5JywgJ1RodXJzZGF5JywgJ0ZyaWRheScsICdTYXR1cmRheSddLFxyXG4gICAgWydTdScsICdNbycsICdUdScsICdXZScsICdUaCcsICdGcicsICdTYSddXHJcbiAgXSxcclxuICB1LFxyXG4gIFtcclxuICAgIFsnSicsICdGJywgJ00nLCAnQScsICdNJywgJ0onLCAnSicsICdBJywgJ1MnLCAnTycsICdOJywgJ0QnXSxcclxuICAgIFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXSxcclxuICAgIFtcclxuICAgICAgJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJyxcclxuICAgICAgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXHJcbiAgICBdXHJcbiAgXSxcclxuICB1LFxyXG4gIFtbJ0InLCAnQSddLCBbJ0JDJywgJ0FEJ10sIFsnQmVmb3JlIENocmlzdCcsICdBbm5vIERvbWluaSddXSxcclxuICAwLFxyXG4gIFs2LCAwXSxcclxuICBbJ00vZC95eScsICdNTU0gZCwgeScsICdNTU1NIGQsIHknLCAnRUVFRSwgTU1NTSBkLCB5J10sXHJcbiAgWydoOm1tIGEnLCAnaDptbTpzcyBhJywgJ2g6bW06c3MgYSB6JywgJ2g6bW06c3MgYSB6enp6J10sXHJcbiAgWyd7MX0sIHswfScsIHUsICd7MX0gXFwnYXRcXCcgezB9JywgdV0sXHJcbiAgWycuJywgJywnLCAnOycsICclJywgJysnLCAnLScsICdFJywgJ8OXJywgJ+KAsCcsICfiiJ4nLCAnTmFOJywgJzonXSxcclxuICBbJyMsIyMwLiMjIycsICcjLCMjMCUnLCAnwqQjLCMjMC4wMCcsICcjRTAnXSxcclxuICAnVVNEJyxcclxuICAnJCcsXHJcbiAgJ1VTIERvbGxhcicsXHJcbiAge30sXHJcbiAgJ2x0cicsXHJcbiAgcGx1cmFsXHJcbl07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gybVmaW5kTG9jYWxlRGF0YShsb2NhbGU6IHN0cmluZyk6IGFueSB7XHJcbiAgY29uc3Qgbm9ybWFsaXplZExvY2FsZSA9IG5vcm1hbGl6ZUxvY2FsZShsb2NhbGUpO1xyXG5cclxuICBsZXQgbWF0Y2ggPSBnZXRMb2NhbGVEYXRhKG5vcm1hbGl6ZWRMb2NhbGUpO1xyXG4gIGlmIChtYXRjaCkge1xyXG4gICAgcmV0dXJuIG1hdGNoO1xyXG4gIH1cclxuXHJcbiAgLy8gbGV0J3MgdHJ5IHRvIGZpbmQgYSBwYXJlbnQgbG9jYWxlXHJcbiAgY29uc3QgcGFyZW50TG9jYWxlID0gbm9ybWFsaXplZExvY2FsZS5zcGxpdCgnLScpWzBdO1xyXG4gIG1hdGNoID0gZ2V0TG9jYWxlRGF0YShwYXJlbnRMb2NhbGUpO1xyXG4gIGlmIChtYXRjaCkge1xyXG4gICAgcmV0dXJuIG1hdGNoO1xyXG4gIH1cclxuXHJcbiAgaWYgKHBhcmVudExvY2FsZSA9PT0gJ2VuJykge1xyXG4gICAgcmV0dXJuIGxvY2FsZUVuO1xyXG4gIH1cclxuXHJcbiAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGxvY2FsZSBkYXRhIGZvciB0aGUgbG9jYWxlIFwiJHtsb2NhbGV9XCIuYCk7XHJcbn1cclxuXHJcbmV4cG9ydCBlbnVtIMm1TG9jYWxlRGF0YUluZGV4IHtcclxuICBMb2NhbGVJZCA9IDAsXHJcbiAgRGF5UGVyaW9kc0Zvcm1hdCxcclxuICBEYXlQZXJpb2RzU3RhbmRhbG9uZSxcclxuICBEYXlzRm9ybWF0LFxyXG4gIERheXNTdGFuZGFsb25lLFxyXG4gIE1vbnRoc0Zvcm1hdCxcclxuICBNb250aHNTdGFuZGFsb25lLFxyXG4gIEVyYXMsXHJcbiAgRmlyc3REYXlPZldlZWssXHJcbiAgV2Vla2VuZFJhbmdlLFxyXG4gIERhdGVGb3JtYXQsXHJcbiAgVGltZUZvcm1hdCxcclxuICBEYXRlVGltZUZvcm1hdCxcclxuICBOdW1iZXJTeW1ib2xzLFxyXG4gIE51bWJlckZvcm1hdHMsXHJcbiAgQ3VycmVuY3lDb2RlLFxyXG4gIEN1cnJlbmN5U3ltYm9sLFxyXG4gIEN1cnJlbmN5TmFtZSxcclxuICBDdXJyZW5jaWVzLFxyXG4gIERpcmVjdGlvbmFsaXR5LFxyXG4gIFBsdXJhbENhc2UsXHJcbiAgRXh0cmFEYXRhXHJcbn1cclxuIl19