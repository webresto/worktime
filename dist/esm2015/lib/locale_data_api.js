import { ɵfindLocaleData, ɵLocaleDataIndex } from './locale_data_core';
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
export var FormatWidth;
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
export var FormStyle;
(function (FormStyle) {
    FormStyle[FormStyle["Format"] = 0] = "Format";
    FormStyle[FormStyle["Standalone"] = 1] = "Standalone";
})(FormStyle || (FormStyle = {}));
export function getLocaleId(locale) {
    return ɵfindLocaleData(locale)[ɵLocaleDataIndex.LocaleId];
}
export function getLocaleDateFormat(locale, width) {
    const data = ɵfindLocaleData(locale);
    return getLastDefinedValue(data[ɵLocaleDataIndex.DateFormat], width);
}
export function getLocaleTimeFormat(locale, width) {
    const data = ɵfindLocaleData(locale);
    return getLastDefinedValue(data[ɵLocaleDataIndex.TimeFormat], width);
}
export function getLocaleDateTimeFormat(locale, width) {
    const data = ɵfindLocaleData(locale);
    const dateTimeFormatData = data[ɵLocaleDataIndex.DateTimeFormat];
    return getLastDefinedValue(dateTimeFormatData, width);
}
export function getLocaleMonthNames(locale, formStyle, width) {
    const data = ɵfindLocaleData(locale);
    const monthsData = [data[ɵLocaleDataIndex.MonthsFormat], data[ɵLocaleDataIndex.MonthsStandalone]];
    const months = getLastDefinedValue(monthsData, formStyle);
    return getLastDefinedValue(months, width);
}
export function getLocaleDayNames(locale, formStyle, width) {
    const data = ɵfindLocaleData(locale);
    const daysData = [data[ɵLocaleDataIndex.DaysFormat], data[ɵLocaleDataIndex.DaysStandalone]];
    const days = getLastDefinedValue(daysData, formStyle);
    return getLastDefinedValue(days, width);
}
export function getLocaleEraNames(locale, width) {
    const data = ɵfindLocaleData(locale);
    const erasData = data[ɵLocaleDataIndex.Eras];
    return getLastDefinedValue(erasData, width);
}
export function getLocaleDayPeriods(locale, formStyle, width) {
    const data = ɵfindLocaleData(locale);
    const amPmData = [
        data[ɵLocaleDataIndex.DayPeriodsFormat], data[ɵLocaleDataIndex.DayPeriodsStandalone]
    ];
    const amPm = getLastDefinedValue(amPmData, formStyle);
    return getLastDefinedValue(amPm, width);
}
export function getLocaleExtraDayPeriods(locale, formStyle, width) {
    const data = ɵfindLocaleData(locale);
    checkFullData(data);
    const dayPeriodsData = [
        data[ɵLocaleDataIndex.ExtraData][0 /* ExtraDayPeriodFormats */],
        data[ɵLocaleDataIndex.ExtraData][1 /* ExtraDayPeriodStandalone */]
    ];
    const dayPeriods = getLastDefinedValue(dayPeriodsData, formStyle) || [];
    return getLastDefinedValue(dayPeriods, width) || [];
}
export function getLocaleExtraDayPeriodRules(locale) {
    const data = ɵfindLocaleData(locale);
    checkFullData(data);
    const rules = data[ɵLocaleDataIndex.ExtraData][2 /* ExtraDayPeriodsRules */] || [];
    return rules.map((rule) => {
        if (typeof rule === 'string') {
            return extractTime(rule);
        }
        return [extractTime(rule[0]), extractTime(rule[1])];
    });
}
export function getLocaleNumberSymbol(locale, symbol) {
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
export var TranslationWidth;
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
export var NumberSymbol;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlX2RhdGFfYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9sb2NhbGVfZGF0YV9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGVBQWUsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBYXZFLFNBQVMsbUJBQW1CLENBQUksSUFBUyxFQUFFLEtBQWE7SUFDdEQsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQy9CLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssV0FBVyxFQUFFO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2hCO0tBQ0Y7SUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLElBQVM7SUFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUNyQyxNQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxJQUFJLENBQUMsZ0JBQWdCO2FBQy9FLFFBQVEsQ0FBQyxnR0FBZ0csQ0FBQyxDQUFDO0tBQy9HO0FBQ0gsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLElBQVk7SUFDL0IsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDcEMsQ0FBQztBQUVELE1BQU0sQ0FBTixJQUFZLFdBcUJYO0FBckJELFdBQVksV0FBVztJQUNyQjs7O09BR0c7SUFDSCwrQ0FBSyxDQUFBO0lBQ0w7OztPQUdHO0lBQ0gsaURB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RCxXQUFZLFlBQVk7SUFDdEI7Ozs7T0FJRztJQUNILHFEQUFPLENBQUE7SUFDUDs7OztPQUlHO0lBQ0gsaURBQUssQ0FBQTtJQUNMOzs7T0FHRztJQUNILCtDQUFJLENBQUE7SUFDSjs7O09BR0c7SUFDSCw2REFBVyxDQUFBO0lBQ1g7OztPQUdHO0lBQ0gsdURBQVEsQ0FBQTtJQUNSOzs7T0FHRztJQUNILHlEQUFTLENBQUE7SUFDVDs7O09BR0c7SUFDSCw2REFBVyxDQUFBO0lBQ1g7OztPQUdHO0lBQ0gsbUZBQXNCLENBQUE7SUFDdEI7OztPQUdHO0lBQ0gsdURBQVEsQ0FBQTtJQUNSOzs7T0FHRztJQUNILHVEQUFRLENBQUE7SUFDUjs7O09BR0c7SUFDSCw4Q0FBRyxDQUFBO0lBQ0g7OztPQUdHO0lBQ0gsa0VBQWEsQ0FBQTtJQUNiOzs7T0FHRztJQUNILHNFQUFlLENBQUE7SUFDZjs7O09BR0c7SUFDSCxrRUFBYSxDQUFBO0FBQ2YsQ0FBQyxFQXpFVyxZQUFZLEtBQVosWUFBWSxRQXlFdkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyDJtWZpbmRMb2NhbGVEYXRhLCDJtUxvY2FsZURhdGFJbmRleCB9IGZyb20gJy4vbG9jYWxlX2RhdGFfY29yZSc7XHJcblxyXG50eXBlIFRpbWUgPSB7XHJcbiAgaG91cnM6IG51bWJlcixcclxuICBtaW51dGVzOiBudW1iZXJcclxufTtcclxuXHJcbmNvbnN0IGVudW0gybVFeHRyYUxvY2FsZURhdGFJbmRleCB7XHJcbiAgRXh0cmFEYXlQZXJpb2RGb3JtYXRzID0gMCxcclxuICBFeHRyYURheVBlcmlvZFN0YW5kYWxvbmUsXHJcbiAgRXh0cmFEYXlQZXJpb2RzUnVsZXNcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TGFzdERlZmluZWRWYWx1ZTxUPihkYXRhOiBUW10sIGluZGV4OiBudW1iZXIpOiBUIHtcclxuICBmb3IgKGxldCBpID0gaW5kZXg7IGkgPiAtMTsgaS0tKSB7XHJcbiAgICBpZiAodHlwZW9mIGRhdGFbaV0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIHJldHVybiBkYXRhW2ldO1xyXG4gICAgfVxyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoJ0xvY2FsZSBkYXRhIEFQSTogbG9jYWxlIGRhdGEgdW5kZWZpbmVkJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrRnVsbERhdGEoZGF0YTogYW55KTogdm9pZCB7XHJcbiAgaWYgKCFkYXRhW8m1TG9jYWxlRGF0YUluZGV4LkV4dHJhRGF0YV0pIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBleHRyYSBsb2NhbGUgZGF0YSBmb3IgdGhlIGxvY2FsZSBcIiR7ZGF0YVvJtUxvY2FsZURhdGFJbmRleFxyXG4gICAgICAuTG9jYWxlSWRdfVwiLiBVc2UgXCJyZWdpc3RlckxvY2FsZURhdGFcIiB0byBsb2FkIG5ldyBkYXRhLiBTZWUgdGhlIFwiSTE4biBndWlkZVwiIG9uIGFuZ3VsYXIuaW8gdG8ga25vdyBtb3JlLmApO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZXh0cmFjdFRpbWUodGltZTogc3RyaW5nKTogVGltZSB7XHJcbiAgY29uc3QgW2gsIG1dID0gdGltZS5zcGxpdCgnOicpO1xyXG4gIHJldHVybiB7IGhvdXJzOiAraCwgbWludXRlczogK20gfTtcclxufVxyXG5cclxuZXhwb3J0IGVudW0gRm9ybWF0V2lkdGgge1xyXG4gIC8qKlxyXG4gICAqIEZvciBgZW4tVVNgLCAnTS9kL3l5LCBoOm1tIGEnYFxyXG4gICAqIChFeGFtcGxlOiBgNi8xNS8xNSwgOTowMyBBTWApXHJcbiAgICovXHJcbiAgU2hvcnQsXHJcbiAgLyoqXHJcbiAgICogRm9yIGBlbi1VU2AsIGAnTU1NIGQsIHksIGg6bW06c3MgYSdgXHJcbiAgICogKEV4YW1wbGU6IGBKdW4gMTUsIDIwMTUsIDk6MDM6MDEgQU1gKVxyXG4gICAqL1xyXG4gIE1lZGl1bSxcclxuICAvKipcclxuICAgKiBGb3IgYGVuLVVTYCwgYCdNTU1NIGQsIHksIGg6bW06c3MgYSB6J2BcclxuICAgKiAoRXhhbXBsZTogYEp1bmUgMTUsIDIwMTUgYXQgOTowMzowMSBBTSBHTVQrMWApXHJcbiAgICovXHJcbiAgTG9uZyxcclxuICAvKipcclxuICAgKiBGb3IgYGVuLVVTYCwgYCdFRUVFLCBNTU1NIGQsIHksIGg6bW06c3MgYSB6enp6J2BcclxuICAgKiAoRXhhbXBsZTogYE1vbmRheSwgSnVuZSAxNSwgMjAxNSBhdCA5OjAzOjAxIEFNIEdNVCswMTowMGApXHJcbiAgICovXHJcbiAgRnVsbFxyXG59XHJcblxyXG5leHBvcnQgZW51bSBGb3JtU3R5bGUge1xyXG4gIEZvcm1hdCxcclxuICBTdGFuZGFsb25lXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVJZChsb2NhbGU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIMm1ZmluZExvY2FsZURhdGEobG9jYWxlKVvJtUxvY2FsZURhdGFJbmRleC5Mb2NhbGVJZF07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVEYXRlRm9ybWF0KGxvY2FsZTogc3RyaW5nLCB3aWR0aDogRm9ybWF0V2lkdGgpOiBzdHJpbmcge1xyXG4gIGNvbnN0IGRhdGEgPSDJtWZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XHJcbiAgcmV0dXJuIGdldExhc3REZWZpbmVkVmFsdWUoZGF0YVvJtUxvY2FsZURhdGFJbmRleC5EYXRlRm9ybWF0XSwgd2lkdGgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlVGltZUZvcm1hdChsb2NhbGU6IHN0cmluZywgd2lkdGg6IEZvcm1hdFdpZHRoKTogc3RyaW5nIHtcclxuICBjb25zdCBkYXRhID0gybVmaW5kTG9jYWxlRGF0YShsb2NhbGUpO1xyXG4gIHJldHVybiBnZXRMYXN0RGVmaW5lZFZhbHVlKGRhdGFbybVMb2NhbGVEYXRhSW5kZXguVGltZUZvcm1hdF0sIHdpZHRoKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZURhdGVUaW1lRm9ybWF0KGxvY2FsZTogc3RyaW5nLCB3aWR0aDogRm9ybWF0V2lkdGgpOiBzdHJpbmcge1xyXG4gIGNvbnN0IGRhdGEgPSDJtWZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XHJcbiAgY29uc3QgZGF0ZVRpbWVGb3JtYXREYXRhID0gZGF0YVvJtUxvY2FsZURhdGFJbmRleC5EYXRlVGltZUZvcm1hdF0gYXMgc3RyaW5nW107XHJcbiAgcmV0dXJuIGdldExhc3REZWZpbmVkVmFsdWUoZGF0ZVRpbWVGb3JtYXREYXRhLCB3aWR0aCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVNb250aE5hbWVzKFxyXG4gIGxvY2FsZTogc3RyaW5nLCBmb3JtU3R5bGU6IEZvcm1TdHlsZSwgd2lkdGg6IFRyYW5zbGF0aW9uV2lkdGgpOiBSZWFkb25seUFycmF5PHN0cmluZz4ge1xyXG4gIGNvbnN0IGRhdGEgPSDJtWZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XHJcbiAgY29uc3QgbW9udGhzRGF0YSA9XHJcbiAgICBbZGF0YVvJtUxvY2FsZURhdGFJbmRleC5Nb250aHNGb3JtYXRdLCBkYXRhW8m1TG9jYWxlRGF0YUluZGV4Lk1vbnRoc1N0YW5kYWxvbmVdXSBhcyBzdHJpbmdbXVtdW107XHJcbiAgY29uc3QgbW9udGhzID0gZ2V0TGFzdERlZmluZWRWYWx1ZShtb250aHNEYXRhLCBmb3JtU3R5bGUpO1xyXG4gIHJldHVybiBnZXRMYXN0RGVmaW5lZFZhbHVlKG1vbnRocywgd2lkdGgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlRGF5TmFtZXMoXHJcbiAgbG9jYWxlOiBzdHJpbmcsIGZvcm1TdHlsZTogRm9ybVN0eWxlLCB3aWR0aDogVHJhbnNsYXRpb25XaWR0aCk6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPiB7XHJcbiAgY29uc3QgZGF0YSA9IMm1ZmluZExvY2FsZURhdGEobG9jYWxlKTtcclxuICBjb25zdCBkYXlzRGF0YSA9XHJcbiAgICBbZGF0YVvJtUxvY2FsZURhdGFJbmRleC5EYXlzRm9ybWF0XSwgZGF0YVvJtUxvY2FsZURhdGFJbmRleC5EYXlzU3RhbmRhbG9uZV1dIGFzIHN0cmluZ1tdW11bXTtcclxuICBjb25zdCBkYXlzID0gZ2V0TGFzdERlZmluZWRWYWx1ZShkYXlzRGF0YSwgZm9ybVN0eWxlKTtcclxuICByZXR1cm4gZ2V0TGFzdERlZmluZWRWYWx1ZShkYXlzLCB3aWR0aCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVFcmFOYW1lcyhcclxuICBsb2NhbGU6IHN0cmluZywgd2lkdGg6IFRyYW5zbGF0aW9uV2lkdGgpOiBSZWFkb25seTxbc3RyaW5nLCBzdHJpbmddPiB7XHJcbiAgY29uc3QgZGF0YSA9IMm1ZmluZExvY2FsZURhdGEobG9jYWxlKTtcclxuICBjb25zdCBlcmFzRGF0YSA9IGRhdGFbybVMb2NhbGVEYXRhSW5kZXguRXJhc10gYXMgW3N0cmluZywgc3RyaW5nXVtdO1xyXG4gIHJldHVybiBnZXRMYXN0RGVmaW5lZFZhbHVlKGVyYXNEYXRhLCB3aWR0aCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVEYXlQZXJpb2RzKFxyXG4gIGxvY2FsZTogc3RyaW5nLCBmb3JtU3R5bGU6IEZvcm1TdHlsZSwgd2lkdGg6IFRyYW5zbGF0aW9uV2lkdGgpOiBSZWFkb25seTxbc3RyaW5nLCBzdHJpbmddPiB7XHJcbiAgY29uc3QgZGF0YSA9IMm1ZmluZExvY2FsZURhdGEobG9jYWxlKTtcclxuICBjb25zdCBhbVBtRGF0YSA9IFtcclxuICAgIGRhdGFbybVMb2NhbGVEYXRhSW5kZXguRGF5UGVyaW9kc0Zvcm1hdF0sIGRhdGFbybVMb2NhbGVEYXRhSW5kZXguRGF5UGVyaW9kc1N0YW5kYWxvbmVdXHJcbiAgXSBhcyBbc3RyaW5nLCBzdHJpbmddW11bXTtcclxuICBjb25zdCBhbVBtID0gZ2V0TGFzdERlZmluZWRWYWx1ZShhbVBtRGF0YSwgZm9ybVN0eWxlKTtcclxuICByZXR1cm4gZ2V0TGFzdERlZmluZWRWYWx1ZShhbVBtLCB3aWR0aCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVFeHRyYURheVBlcmlvZHMoXHJcbiAgbG9jYWxlOiBzdHJpbmcsIGZvcm1TdHlsZTogRm9ybVN0eWxlLCB3aWR0aDogVHJhbnNsYXRpb25XaWR0aCk6IHN0cmluZ1tdIHtcclxuICBjb25zdCBkYXRhID0gybVmaW5kTG9jYWxlRGF0YShsb2NhbGUpO1xyXG4gIGNoZWNrRnVsbERhdGEoZGF0YSk7XHJcbiAgY29uc3QgZGF5UGVyaW9kc0RhdGEgPSBbXHJcbiAgICBkYXRhW8m1TG9jYWxlRGF0YUluZGV4LkV4dHJhRGF0YV1bybVFeHRyYUxvY2FsZURhdGFJbmRleC5FeHRyYURheVBlcmlvZEZvcm1hdHNdLFxyXG4gICAgZGF0YVvJtUxvY2FsZURhdGFJbmRleC5FeHRyYURhdGFdW8m1RXh0cmFMb2NhbGVEYXRhSW5kZXguRXh0cmFEYXlQZXJpb2RTdGFuZGFsb25lXVxyXG4gIF0gYXMgc3RyaW5nW11bXVtdO1xyXG4gIGNvbnN0IGRheVBlcmlvZHMgPSBnZXRMYXN0RGVmaW5lZFZhbHVlKGRheVBlcmlvZHNEYXRhLCBmb3JtU3R5bGUpIHx8IFtdO1xyXG4gIHJldHVybiBnZXRMYXN0RGVmaW5lZFZhbHVlKGRheVBlcmlvZHMsIHdpZHRoKSB8fCBbXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUV4dHJhRGF5UGVyaW9kUnVsZXMobG9jYWxlOiBzdHJpbmcpOiAoVGltZSB8IFtUaW1lLCBUaW1lXSlbXSB7XHJcbiAgY29uc3QgZGF0YSA9IMm1ZmluZExvY2FsZURhdGEobG9jYWxlKTtcclxuICBjaGVja0Z1bGxEYXRhKGRhdGEpO1xyXG4gIGNvbnN0IHJ1bGVzID0gZGF0YVvJtUxvY2FsZURhdGFJbmRleC5FeHRyYURhdGFdW8m1RXh0cmFMb2NhbGVEYXRhSW5kZXguRXh0cmFEYXlQZXJpb2RzUnVsZXNdIHx8IFtdO1xyXG4gIHJldHVybiBydWxlcy5tYXAoKHJ1bGU6IHN0cmluZyB8IFtzdHJpbmcsIHN0cmluZ10pID0+IHtcclxuICAgIGlmICh0eXBlb2YgcnVsZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgcmV0dXJuIGV4dHJhY3RUaW1lKHJ1bGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFtleHRyYWN0VGltZShydWxlWzBdKSwgZXh0cmFjdFRpbWUocnVsZVsxXSldO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlTnVtYmVyU3ltYm9sKGxvY2FsZTogc3RyaW5nLCBzeW1ib2w6IE51bWJlclN5bWJvbCk6IHN0cmluZyB7XHJcbiAgY29uc3QgZGF0YSA9IMm1ZmluZExvY2FsZURhdGEobG9jYWxlKTtcclxuICBjb25zdCByZXMgPSBkYXRhW8m1TG9jYWxlRGF0YUluZGV4Lk51bWJlclN5bWJvbHNdW3N5bWJvbF07XHJcbiAgaWYgKHR5cGVvZiByZXMgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBpZiAoc3ltYm9sID09PSBOdW1iZXJTeW1ib2wuQ3VycmVuY3lEZWNpbWFsKSB7XHJcbiAgICAgIHJldHVybiBkYXRhW8m1TG9jYWxlRGF0YUluZGV4Lk51bWJlclN5bWJvbHNdW051bWJlclN5bWJvbC5EZWNpbWFsXTtcclxuICAgIH0gZWxzZSBpZiAoc3ltYm9sID09PSBOdW1iZXJTeW1ib2wuQ3VycmVuY3lHcm91cCkge1xyXG4gICAgICByZXR1cm4gZGF0YVvJtUxvY2FsZURhdGFJbmRleC5OdW1iZXJTeW1ib2xzXVtOdW1iZXJTeW1ib2wuR3JvdXBdO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZW51bSBUcmFuc2xhdGlvbldpZHRoIHtcclxuICAvKiogMSBjaGFyYWN0ZXIgZm9yIGBlbi1VU2AuIEZvciBleGFtcGxlOiAnUycgKi9cclxuICBOYXJyb3csXHJcbiAgLyoqIDMgY2hhcmFjdGVycyBmb3IgYGVuLVVTYC4gRm9yIGV4YW1wbGU6ICdTdW4nICovXHJcbiAgQWJicmV2aWF0ZWQsXHJcbiAgLyoqIEZ1bGwgbGVuZ3RoIGZvciBgZW4tVVNgLiBGb3IgZXhhbXBsZTogXCJTdW5kYXlcIiAqL1xyXG4gIFdpZGUsXHJcbiAgLyoqIDIgY2hhcmFjdGVycyBmb3IgYGVuLVVTYCwgRm9yIGV4YW1wbGU6IFwiU3VcIiAqL1xyXG4gIFNob3J0XHJcbn1cclxuXHJcbmV4cG9ydCBlbnVtIE51bWJlclN5bWJvbCB7XHJcbiAgLyoqXHJcbiAgICogRGVjaW1hbCBzZXBhcmF0b3IuXHJcbiAgICogRm9yIGBlbi1VU2AsIHRoZSBkb3QgY2hhcmFjdGVyLlxyXG4gICAqIEV4YW1wbGUgOiAyLDM0NWAuYDY3XHJcbiAgICovXHJcbiAgRGVjaW1hbCxcclxuICAvKipcclxuICAgKiBHcm91cGluZyBzZXBhcmF0b3IsIHR5cGljYWxseSBmb3IgdGhvdXNhbmRzLlxyXG4gICAqIEZvciBgZW4tVVNgLCB0aGUgY29tbWEgY2hhcmFjdGVyLlxyXG4gICAqIEV4YW1wbGU6IDJgLGAzNDUuNjdcclxuICAgKi9cclxuICBHcm91cCxcclxuICAvKipcclxuICAgKiBMaXN0LWl0ZW0gc2VwYXJhdG9yLlxyXG4gICAqIEV4YW1wbGU6IFwib25lLCB0d28sIGFuZCB0aHJlZVwiXHJcbiAgICovXHJcbiAgTGlzdCxcclxuICAvKipcclxuICAgKiBTaWduIGZvciBwZXJjZW50YWdlIChvdXQgb2YgMTAwKS5cclxuICAgKiBFeGFtcGxlOiAyMy40JVxyXG4gICAqL1xyXG4gIFBlcmNlbnRTaWduLFxyXG4gIC8qKlxyXG4gICAqIFNpZ24gZm9yIHBvc2l0aXZlIG51bWJlcnMuXHJcbiAgICogRXhhbXBsZTogKzIzXHJcbiAgICovXHJcbiAgUGx1c1NpZ24sXHJcbiAgLyoqXHJcbiAgICogU2lnbiBmb3IgbmVnYXRpdmUgbnVtYmVycy5cclxuICAgKiBFeGFtcGxlOiAtMjNcclxuICAgKi9cclxuICBNaW51c1NpZ24sXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZXIgbm90YXRpb24gZm9yIGV4cG9uZW50aWFsIHZhbHVlIChuIHRpbWVzIGEgcG93ZXIgb2YgMTApLlxyXG4gICAqIEV4YW1wbGU6IDEuMkUzXHJcbiAgICovXHJcbiAgRXhwb25lbnRpYWwsXHJcbiAgLyoqXHJcbiAgICogSHVtYW4tcmVhZGFibGUgZm9ybWF0IG9mIGV4cG9uZW50aWFsLlxyXG4gICAqIEV4YW1wbGU6IDEuMngxMDNcclxuICAgKi9cclxuICBTdXBlcnNjcmlwdGluZ0V4cG9uZW50LFxyXG4gIC8qKlxyXG4gICAqIFNpZ24gZm9yIHBlcm1pbGxlIChvdXQgb2YgMTAwMCkuXHJcbiAgICogRXhhbXBsZTogMjMuNOKAsFxyXG4gICAqL1xyXG4gIFBlck1pbGxlLFxyXG4gIC8qKlxyXG4gICAqIEluZmluaXR5LCBjYW4gYmUgdXNlZCB3aXRoIHBsdXMgYW5kIG1pbnVzLlxyXG4gICAqIEV4YW1wbGU6IOKIniwgK+KIniwgLeKInlxyXG4gICAqL1xyXG4gIEluZmluaXR5LFxyXG4gIC8qKlxyXG4gICAqIE5vdCBhIG51bWJlci5cclxuICAgKiBFeGFtcGxlOiBOYU5cclxuICAgKi9cclxuICBOYU4sXHJcbiAgLyoqXHJcbiAgICogU3ltYm9sIHVzZWQgYmV0d2VlbiB0aW1lIHVuaXRzLlxyXG4gICAqIEV4YW1wbGU6IDEwOjUyXHJcbiAgICovXHJcbiAgVGltZVNlcGFyYXRvcixcclxuICAvKipcclxuICAgKiBEZWNpbWFsIHNlcGFyYXRvciBmb3IgY3VycmVuY3kgdmFsdWVzIChmYWxsYmFjayB0byBgRGVjaW1hbGApLlxyXG4gICAqIEV4YW1wbGU6ICQyLDM0NS42N1xyXG4gICAqL1xyXG4gIEN1cnJlbmN5RGVjaW1hbCxcclxuICAvKipcclxuICAgKiBHcm91cCBzZXBhcmF0b3IgZm9yIGN1cnJlbmN5IHZhbHVlcyAoZmFsbGJhY2sgdG8gYEdyb3VwYCkuXHJcbiAgICogRXhhbXBsZTogJDIsMzQ1LjY3XHJcbiAgICovXHJcbiAgQ3VycmVuY3lHcm91cFxyXG59XHJcbiJdfQ==