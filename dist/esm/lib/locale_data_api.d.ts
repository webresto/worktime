declare type Time = {
    hours: number;
    minutes: number;
};
export declare enum FormatWidth {
    /**
     * For `en-US`, 'M/d/yy, h:mm a'`
     * (Example: `6/15/15, 9:03 AM`)
     */
    Short = 0,
    /**
     * For `en-US`, `'MMM d, y, h:mm:ss a'`
     * (Example: `Jun 15, 2015, 9:03:01 AM`)
     */
    Medium = 1,
    /**
     * For `en-US`, `'MMMM d, y, h:mm:ss a z'`
     * (Example: `June 15, 2015 at 9:03:01 AM GMT+1`)
     */
    Long = 2,
    /**
     * For `en-US`, `'EEEE, MMMM d, y, h:mm:ss a zzzz'`
     * (Example: `Monday, June 15, 2015 at 9:03:01 AM GMT+01:00`)
     */
    Full = 3
}
export declare enum FormStyle {
    Format = 0,
    Standalone = 1
}
export declare function getLocaleId(locale: string): string;
export declare function getLocaleDateFormat(locale: string, width: FormatWidth): string;
export declare function getLocaleTimeFormat(locale: string, width: FormatWidth): string;
export declare function getLocaleDateTimeFormat(locale: string, width: FormatWidth): string;
export declare function getLocaleMonthNames(locale: string, formStyle: FormStyle, width: TranslationWidth): ReadonlyArray<string>;
export declare function getLocaleDayNames(locale: string, formStyle: FormStyle, width: TranslationWidth): ReadonlyArray<string>;
export declare function getLocaleEraNames(locale: string, width: TranslationWidth): Readonly<[string, string]>;
export declare function getLocaleDayPeriods(locale: string, formStyle: FormStyle, width: TranslationWidth): Readonly<[string, string]>;
export declare function getLocaleExtraDayPeriods(locale: string, formStyle: FormStyle, width: TranslationWidth): string[];
export declare function getLocaleExtraDayPeriodRules(locale: string): (Time | [Time, Time])[];
export declare function getLocaleNumberSymbol(locale: string, symbol: NumberSymbol): string;
export declare enum TranslationWidth {
    /** 1 character for `en-US`. For example: 'S' */
    Narrow = 0,
    /** 3 characters for `en-US`. For example: 'Sun' */
    Abbreviated = 1,
    /** Full length for `en-US`. For example: "Sunday" */
    Wide = 2,
    /** 2 characters for `en-US`, For example: "Su" */
    Short = 3
}
export declare enum NumberSymbol {
    /**
     * Decimal separator.
     * For `en-US`, the dot character.
     * Example : 2,345`.`67
     */
    Decimal = 0,
    /**
     * Grouping separator, typically for thousands.
     * For `en-US`, the comma character.
     * Example: 2`,`345.67
     */
    Group = 1,
    /**
     * List-item separator.
     * Example: "one, two, and three"
     */
    List = 2,
    /**
     * Sign for percentage (out of 100).
     * Example: 23.4%
     */
    PercentSign = 3,
    /**
     * Sign for positive numbers.
     * Example: +23
     */
    PlusSign = 4,
    /**
     * Sign for negative numbers.
     * Example: -23
     */
    MinusSign = 5,
    /**
     * Computer notation for exponential value (n times a power of 10).
     * Example: 1.2E3
     */
    Exponential = 6,
    /**
     * Human-readable format of exponential.
     * Example: 1.2x103
     */
    SuperscriptingExponent = 7,
    /**
     * Sign for permille (out of 1000).
     * Example: 23.4‰
     */
    PerMille = 8,
    /**
     * Infinity, can be used with plus and minus.
     * Example: ∞, +∞, -∞
     */
    Infinity = 9,
    /**
     * Not a number.
     * Example: NaN
     */
    NaN = 10,
    /**
     * Symbol used between time units.
     * Example: 10:52
     */
    TimeSeparator = 11,
    /**
     * Decimal separator for currency values (fallback to `Decimal`).
     * Example: $2,345.67
     */
    CurrencyDecimal = 12,
    /**
     * Group separator for currency values (fallback to `Group`).
     * Example: $2,345.67
     */
    CurrencyGroup = 13
}
export {};
