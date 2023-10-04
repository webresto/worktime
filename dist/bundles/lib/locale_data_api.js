"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberSymbol = exports.TranslationWidth = exports.getLocaleNumberSymbol = exports.getLocaleExtraDayPeriodRules = exports.getLocaleExtraDayPeriods = exports.getLocaleDayPeriods = exports.getLocaleEraNames = exports.getLocaleDayNames = exports.getLocaleMonthNames = exports.getLocaleDateTimeFormat = exports.getLocaleTimeFormat = exports.getLocaleDateFormat = exports.getLocaleId = exports.FormStyle = exports.FormatWidth = void 0;
const locale_data_core_1 = require("./locale_data_core");
function getLastDefinedValue(data, index) {
    for (let i = index; i > -1; i--) {
        if (typeof data[i] !== 'undefined') {
            return data[i];
        }
    }
    throw new Error('Locale data API: locale data undefined');
}
function checkFullData(data) {
    if (!data[locale_data_core_1.ɵLocaleDataIndex.ExtraData]) {
        throw new Error(`Missing extra locale data for the locale "${data[locale_data_core_1.ɵLocaleDataIndex
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
})(FormatWidth = exports.FormatWidth || (exports.FormatWidth = {}));
var FormStyle;
(function (FormStyle) {
    FormStyle[FormStyle["Format"] = 0] = "Format";
    FormStyle[FormStyle["Standalone"] = 1] = "Standalone";
})(FormStyle = exports.FormStyle || (exports.FormStyle = {}));
function getLocaleId(locale) {
    return (0, locale_data_core_1.ɵfindLocaleData)(locale)[locale_data_core_1.ɵLocaleDataIndex.LocaleId];
}
exports.getLocaleId = getLocaleId;
function getLocaleDateFormat(locale, width) {
    const data = (0, locale_data_core_1.ɵfindLocaleData)(locale);
    return getLastDefinedValue(data[locale_data_core_1.ɵLocaleDataIndex.DateFormat], width);
}
exports.getLocaleDateFormat = getLocaleDateFormat;
function getLocaleTimeFormat(locale, width) {
    const data = (0, locale_data_core_1.ɵfindLocaleData)(locale);
    return getLastDefinedValue(data[locale_data_core_1.ɵLocaleDataIndex.TimeFormat], width);
}
exports.getLocaleTimeFormat = getLocaleTimeFormat;
function getLocaleDateTimeFormat(locale, width) {
    const data = (0, locale_data_core_1.ɵfindLocaleData)(locale);
    const dateTimeFormatData = data[locale_data_core_1.ɵLocaleDataIndex.DateTimeFormat];
    return getLastDefinedValue(dateTimeFormatData, width);
}
exports.getLocaleDateTimeFormat = getLocaleDateTimeFormat;
function getLocaleMonthNames(locale, formStyle, width) {
    const data = (0, locale_data_core_1.ɵfindLocaleData)(locale);
    const monthsData = [data[locale_data_core_1.ɵLocaleDataIndex.MonthsFormat], data[locale_data_core_1.ɵLocaleDataIndex.MonthsStandalone]];
    const months = getLastDefinedValue(monthsData, formStyle);
    return getLastDefinedValue(months, width);
}
exports.getLocaleMonthNames = getLocaleMonthNames;
function getLocaleDayNames(locale, formStyle, width) {
    const data = (0, locale_data_core_1.ɵfindLocaleData)(locale);
    const daysData = [data[locale_data_core_1.ɵLocaleDataIndex.DaysFormat], data[locale_data_core_1.ɵLocaleDataIndex.DaysStandalone]];
    const days = getLastDefinedValue(daysData, formStyle);
    return getLastDefinedValue(days, width);
}
exports.getLocaleDayNames = getLocaleDayNames;
function getLocaleEraNames(locale, width) {
    const data = (0, locale_data_core_1.ɵfindLocaleData)(locale);
    const erasData = data[locale_data_core_1.ɵLocaleDataIndex.Eras];
    return getLastDefinedValue(erasData, width);
}
exports.getLocaleEraNames = getLocaleEraNames;
function getLocaleDayPeriods(locale, formStyle, width) {
    const data = (0, locale_data_core_1.ɵfindLocaleData)(locale);
    const amPmData = [
        data[locale_data_core_1.ɵLocaleDataIndex.DayPeriodsFormat], data[locale_data_core_1.ɵLocaleDataIndex.DayPeriodsStandalone]
    ];
    const amPm = getLastDefinedValue(amPmData, formStyle);
    return getLastDefinedValue(amPm, width);
}
exports.getLocaleDayPeriods = getLocaleDayPeriods;
function getLocaleExtraDayPeriods(locale, formStyle, width) {
    const data = (0, locale_data_core_1.ɵfindLocaleData)(locale);
    checkFullData(data);
    const dayPeriodsData = [
        data[locale_data_core_1.ɵLocaleDataIndex.ExtraData][0 /* ɵExtraLocaleDataIndex.ExtraDayPeriodFormats */],
        data[locale_data_core_1.ɵLocaleDataIndex.ExtraData][1 /* ɵExtraLocaleDataIndex.ExtraDayPeriodStandalone */]
    ];
    const dayPeriods = getLastDefinedValue(dayPeriodsData, formStyle) || [];
    return getLastDefinedValue(dayPeriods, width) || [];
}
exports.getLocaleExtraDayPeriods = getLocaleExtraDayPeriods;
function getLocaleExtraDayPeriodRules(locale) {
    const data = (0, locale_data_core_1.ɵfindLocaleData)(locale);
    checkFullData(data);
    const rules = data[locale_data_core_1.ɵLocaleDataIndex.ExtraData][2 /* ɵExtraLocaleDataIndex.ExtraDayPeriodsRules */] || [];
    return rules.map((rule) => {
        if (typeof rule === 'string') {
            return extractTime(rule);
        }
        return [extractTime(rule[0]), extractTime(rule[1])];
    });
}
exports.getLocaleExtraDayPeriodRules = getLocaleExtraDayPeriodRules;
function getLocaleNumberSymbol(locale, symbol) {
    const data = (0, locale_data_core_1.ɵfindLocaleData)(locale);
    const res = data[locale_data_core_1.ɵLocaleDataIndex.NumberSymbols][symbol];
    if (typeof res === 'undefined') {
        if (symbol === NumberSymbol.CurrencyDecimal) {
            return data[locale_data_core_1.ɵLocaleDataIndex.NumberSymbols][NumberSymbol.Decimal];
        }
        else if (symbol === NumberSymbol.CurrencyGroup) {
            return data[locale_data_core_1.ɵLocaleDataIndex.NumberSymbols][NumberSymbol.Group];
        }
    }
    return res;
}
exports.getLocaleNumberSymbol = getLocaleNumberSymbol;
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
})(TranslationWidth = exports.TranslationWidth || (exports.TranslationWidth = {}));
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
})(NumberSymbol = exports.NumberSymbol || (exports.NumberSymbol = {}));
