(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define('@webresto/worktime', ['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.webresto = global.webresto || {}, global.webresto.worktime = {})));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b)
                if (Object.prototype.hasOwnProperty.call(b, p))
                    d[p] = b[p]; };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function () {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p))
                        t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __rest(s, e) {
        var t = {};
        for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if (d = decorators[i])
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); };
    }
    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
            return Reflect.metadata(metadataKey, metadataValue);
    }
    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            } }
            function rejected(value) { try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }
    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function () { if (t[0] & 1)
                throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f)
                throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                        return t;
                    if (y = 0, t)
                        op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2])
                                _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                }
                catch (e) {
                    op = [6, e];
                    y = 0;
                }
                finally {
                    f = t = 0;
                }
            if (op[0] & 5)
                throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    }
    var __createBinding = Object.create ? (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function () { return m[k]; } });
    }) : (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        o[k2] = m[k];
    });
    function __exportStar(m, o) {
        for (var p in m)
            if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p))
                __createBinding(o, m, p);
    }
    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m)
            return m.call(o);
        if (o && typeof o.length === "number")
            return {
                next: function () {
                    if (o && i >= o.length)
                        o = void 0;
                    return { value: o && o[i++], done: !o };
                }
            };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m)
            return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
                ar.push(r.value);
        }
        catch (error) {
            e = { error: error };
        }
        finally {
            try {
                if (r && !r.done && (m = i["return"]))
                    m.call(i);
            }
            finally {
                if (e)
                    throw e.error;
            }
        }
        return ar;
    }
    /** @deprecated */
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }
    /** @deprecated */
    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++)
            s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }
    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2)
            for (var i = 0, l = from.length, ar; i < l; i++) {
                if (ar || !(i in from)) {
                    if (!ar)
                        ar = Array.prototype.slice.call(from, 0, i);
                    ar[i] = from[i];
                }
            }
        return to.concat(ar || Array.prototype.slice.call(from));
    }
    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }
    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n])
            i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try {
            step(g[n](v));
        }
        catch (e) {
            settle(q[0][3], e);
        } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length)
            resume(q[0][0], q[0][1]); }
    }
    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }
    function __asyncValues(o) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function (v) { resolve({ value: v, done: d }); }, reject); }
    }
    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) {
            Object.defineProperty(cooked, "raw", { value: raw });
        }
        else {
            cooked.raw = raw;
        }
        return cooked;
    }
    ;
    var __setModuleDefault = Object.create ? (function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function (o, v) {
        o["default"] = v;
    };
    function __importStar(mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                    __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    }
    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }
    function __classPrivateFieldGet(receiver, state, kind, f) {
        if (kind === "a" && !f)
            throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }
    function __classPrivateFieldSet(receiver, state, value, kind, f) {
        if (kind === "m")
            throw new TypeError("Private method is not writable");
        if (kind === "a" && !f)
            throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    }

    function plural(n) {
        var i = Math.floor(Math.abs(n));
        var v = n.toString().replace(/^[^.]*\.?/, '').length;
        if (i === 1 && v === 0) {
            return 1;
        }
        return 5;
    }
    function normalizeLocale(locale) {
        return locale.toLowerCase().replace(/_/g, '-');
    }
    var u = undefined;
    var LOCALE_DATA = {};
    function getLocaleData(normalizedLocale) {
        return LOCALE_DATA[normalizedLocale];
    }
    var localeEn = [
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
        var normalizedLocale = normalizeLocale(locale);
        var match = getLocaleData(normalizedLocale);
        if (match) {
            return match;
        }
        // let's try to find a parent locale
        var parentLocale = normalizedLocale.split('-')[0];
        match = getLocaleData(parentLocale);
        if (match) {
            return match;
        }
        if (parentLocale === 'en') {
            return localeEn;
        }
        throw new Error("Missing locale data for the locale \"" + locale + "\".");
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
        for (var i = index; i > -1; i--) {
            if (typeof data[i] !== 'undefined') {
                return data[i];
            }
        }
        throw new Error('Locale data API: locale data undefined');
    }
    function checkFullData(data) {
        if (!data[ɵLocaleDataIndex.ExtraData]) {
            throw new Error("Missing extra locale data for the locale \"" + data[ɵLocaleDataIndex
                .LocaleId] + "\". Use \"registerLocaleData\" to load new data. See the \"I18n guide\" on angular.io to know more.");
        }
    }
    function extractTime(time) {
        var _a = __read(time.split(':'), 2), h = _a[0], m = _a[1];
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
        var data = ɵfindLocaleData(locale);
        return getLastDefinedValue(data[ɵLocaleDataIndex.DateFormat], width);
    }
    function getLocaleTimeFormat(locale, width) {
        var data = ɵfindLocaleData(locale);
        return getLastDefinedValue(data[ɵLocaleDataIndex.TimeFormat], width);
    }
    function getLocaleDateTimeFormat(locale, width) {
        var data = ɵfindLocaleData(locale);
        var dateTimeFormatData = data[ɵLocaleDataIndex.DateTimeFormat];
        return getLastDefinedValue(dateTimeFormatData, width);
    }
    function getLocaleMonthNames(locale, formStyle, width) {
        var data = ɵfindLocaleData(locale);
        var monthsData = [data[ɵLocaleDataIndex.MonthsFormat], data[ɵLocaleDataIndex.MonthsStandalone]];
        var months = getLastDefinedValue(monthsData, formStyle);
        return getLastDefinedValue(months, width);
    }
    function getLocaleDayNames(locale, formStyle, width) {
        var data = ɵfindLocaleData(locale);
        var daysData = [data[ɵLocaleDataIndex.DaysFormat], data[ɵLocaleDataIndex.DaysStandalone]];
        var days = getLastDefinedValue(daysData, formStyle);
        return getLastDefinedValue(days, width);
    }
    function getLocaleEraNames(locale, width) {
        var data = ɵfindLocaleData(locale);
        var erasData = data[ɵLocaleDataIndex.Eras];
        return getLastDefinedValue(erasData, width);
    }
    function getLocaleDayPeriods(locale, formStyle, width) {
        var data = ɵfindLocaleData(locale);
        var amPmData = [
            data[ɵLocaleDataIndex.DayPeriodsFormat], data[ɵLocaleDataIndex.DayPeriodsStandalone]
        ];
        var amPm = getLastDefinedValue(amPmData, formStyle);
        return getLastDefinedValue(amPm, width);
    }
    function getLocaleExtraDayPeriods(locale, formStyle, width) {
        var data = ɵfindLocaleData(locale);
        checkFullData(data);
        var dayPeriodsData = [
            data[ɵLocaleDataIndex.ExtraData][0 /* ExtraDayPeriodFormats */],
            data[ɵLocaleDataIndex.ExtraData][1 /* ExtraDayPeriodStandalone */]
        ];
        var dayPeriods = getLastDefinedValue(dayPeriodsData, formStyle) || [];
        return getLastDefinedValue(dayPeriods, width) || [];
    }
    function getLocaleExtraDayPeriodRules(locale) {
        var data = ɵfindLocaleData(locale);
        checkFullData(data);
        var rules = data[ɵLocaleDataIndex.ExtraData][2 /* ExtraDayPeriodsRules */] || [];
        return rules.map(function (rule) {
            if (typeof rule === 'string') {
                return extractTime(rule);
            }
            return [extractTime(rule[0]), extractTime(rule[1])];
        });
    }
    function getLocaleNumberSymbol(locale, symbol) {
        var data = ɵfindLocaleData(locale);
        var res = data[ɵLocaleDataIndex.NumberSymbols][symbol];
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

    var ISO8601_DATE_REGEX = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
    var NAMED_FORMATS = {};
    var DATE_FORMATS_SPLIT = /((?:[^GyYMLwWdEabBhHmsSzZO']+)|(?:'(?:[^']|'')*')|(?:G{1,5}|y{1,4}|Y{1,4}|M{1,5}|L{1,5}|w{1,2}|W{1}|d{1,2}|E{1,6}|a{1,5}|b{1,5}|B{1,5}|h{1,2}|H{1,2}|m{1,2}|s{1,2}|S{1,3}|z{1,4}|Z{1,5}|O{1,4}))([\s\S]*)/;
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
        var date = toDate(value);
        var namedFormat = getNamedFormat(locale, format);
        format = namedFormat || format;
        var parts = [];
        var match;
        while (format) {
            match = DATE_FORMATS_SPLIT.exec(format);
            if (match) {
                parts = parts.concat(match.slice(1));
                var part = parts.pop();
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
        var dateTimezoneOffset = date.getTimezoneOffset();
        if (timezone) {
            dateTimezoneOffset = timezoneToOffset(timezone, dateTimezoneOffset);
            date = convertTimezoneToLocal(date, timezone, true);
        }
        var text = '';
        parts.forEach(function (partValue) {
            var dateFormatter = getDateFormatter(partValue);
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
                var _a = __read(value.split('-').map(function (val) { return +val; }), 3), y = _a[0], _b = _a[1], m = _b === void 0 ? 1 : _b, _c = _a[2], d = _c === void 0 ? 1 : _c;
                return new Date(y, m - 1, d);
            }
            var parsedNb = parseFloat(value);
            // any string that only contains numbers, like "1234" but not like "1234hello"
            if (!isNaN(value - parsedNb)) {
                return new Date(parsedNb);
            }
            var match = value.match(ISO8601_DATE_REGEX);
            if (match) {
                return isoStringToDate(match);
            }
        }
        var date = new Date(value);
        if (!isDate(date)) {
            throw new Error("Unable to convert \"" + value + "\" into a date");
        }
        return date;
    }
    function getNamedFormat(locale, format) {
        var localeId = getLocaleId(locale);
        NAMED_FORMATS[localeId] = NAMED_FORMATS[localeId] || {};
        if (NAMED_FORMATS[localeId][format]) {
            return NAMED_FORMATS[localeId][format];
        }
        var formatValue = '';
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
                var shortTime = getNamedFormat(locale, 'shortTime');
                var shortDate = getNamedFormat(locale, 'shortDate');
                formatValue = formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Short), [shortTime, shortDate]);
                break;
            case 'medium':
                var mediumTime = getNamedFormat(locale, 'mediumTime');
                var mediumDate = getNamedFormat(locale, 'mediumDate');
                formatValue = formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Medium), [mediumTime, mediumDate]);
                break;
            case 'long':
                var longTime = getNamedFormat(locale, 'longTime');
                var longDate = getNamedFormat(locale, 'longDate');
                formatValue =
                    formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Long), [longTime, longDate]);
                break;
            case 'full':
                var fullTime = getNamedFormat(locale, 'fullTime');
                var fullDate = getNamedFormat(locale, 'fullDate');
                formatValue =
                    formatDateTime(getLocaleDateTimeFormat(locale, FormatWidth.Full), [fullTime, fullDate]);
                break;
        }
        if (formatValue) {
            NAMED_FORMATS[localeId][format] = formatValue;
        }
        return formatValue;
    }
    var DATE_FORMATS = {};
    function getDateFormatter(format) {
        if (DATE_FORMATS[format]) {
            return DATE_FORMATS[format];
        }
        var formatter;
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
    function dateStrGetter(name, width, form, extended) {
        if (form === void 0) { form = FormStyle.Format; }
        if (extended === void 0) { extended = false; }
        return function (date, locale) {
            return getDateTranslation(date, locale, name, width, form, extended);
        };
    }
    function dateGetter(name, size, offset, trim, negWrap) {
        if (offset === void 0) { offset = 0; }
        if (trim === void 0) { trim = false; }
        if (negWrap === void 0) { negWrap = false; }
        return function (date, locale) {
            var part = getDatePart(name, date);
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
            var localeMinus = getLocaleNumberSymbol(locale, NumberSymbol.MinusSign);
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
                var currentHours_1 = date.getHours();
                var currentMinutes_1 = date.getMinutes();
                if (extended) {
                    var rules = getLocaleExtraDayPeriodRules(locale);
                    var dayPeriods = getLocaleExtraDayPeriods(locale, form, width);
                    var index = rules.findIndex(function (rule) {
                        if (Array.isArray(rule)) {
                            // morning, afternoon, evening, night
                            var _a = __read(rule, 2), from = _a[0], to = _a[1];
                            var afterFrom = currentHours_1 >= from.hours && currentMinutes_1 >= from.minutes;
                            var beforeTo = (currentHours_1 < to.hours ||
                                (currentHours_1 === to.hours && currentMinutes_1 < to.minutes));
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
                            if (rule.hours === currentHours_1 && rule.minutes === currentMinutes_1) {
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
                return getLocaleDayPeriods(locale, form, width)[currentHours_1 < 12 ? 0 : 1];
            case TranslationType.Eras:
                return getLocaleEraNames(locale, width)[date.getFullYear() <= 0 ? 0 : 1];
            default:
                // This default case is not needed by TypeScript compiler, as the switch is exhaustive.
                // However Closure Compiler does not understand that and reports an error in typed mode.
                // The `throw new Error` below works around the problem, and the unexpected: never variable
                // makes sure tsc still checks this code is unreachable.
                var unexpected = name;
                throw new Error("unexpected translation type " + unexpected);
        }
    }
    function timezoneToOffset(timezone, fallback) {
        // Support: IE 11 only, Edge 13-15+
        // IE/Edge do not "understand" colon (`:`) in timezone
        timezone = timezone.replace(/:/g, '');
        var requestedTimezoneOffset = Date.parse('Jan 01, 1970 00:00:00 ' + timezone) / 60000;
        return isNaN(requestedTimezoneOffset) ? fallback : requestedTimezoneOffset;
    }
    function addDateMinutes(date, minutes) {
        date = new Date(date.getTime());
        date.setMinutes(date.getMinutes() + minutes);
        return date;
    }
    function convertTimezoneToLocal(date, timezone, reverse) {
        var reverseValue = reverse ? -1 : 1;
        var dateTimezoneOffset = date.getTimezoneOffset();
        var timezoneOffset = timezoneToOffset(timezone, dateTimezoneOffset);
        return addDateMinutes(date, reverseValue * (timezoneOffset - dateTimezoneOffset));
    }
    function isoStringToDate(match) {
        var date = new Date(0);
        var tzHour = 0;
        var tzMin = 0;
        // match[8] means that the string contains "Z" (UTC) or a timezone like "+01:00" or "+0100"
        var dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear;
        var timeSetter = match[8] ? date.setUTCHours : date.setHours;
        // if there is a timezone defined like "+01:00" or "+0100"
        if (match[9]) {
            tzHour = Number(match[9] + match[10]);
            tzMin = Number(match[9] + match[11]);
        }
        dateSetter.call(date, Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        var h = Number(match[4] || 0) - tzHour;
        var m = Number(match[5] || 0) - tzMin;
        var s = Number(match[6] || 0);
        // The ECMAScript specification (https://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.11)
        // defines that `DateTime` milliseconds should always be rounded down, so that `999.9ms`
        // becomes `999ms`.
        var ms = Math.floor(parseFloat('0.' + (match[7] || 0)) * 1000);
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
    var JANUARY = 0;
    var THURSDAY = 4;
    function weekNumberingYearGetter(size, trim) {
        if (trim === void 0) { trim = false; }
        return function (date, locale) {
            var thisThurs = getThursdayThisWeek(date);
            var weekNumberingYear = thisThurs.getFullYear();
            return padNumber(weekNumberingYear, size, getLocaleNumberSymbol(locale, NumberSymbol.MinusSign), trim);
        };
    }
    function weekGetter(size, monthBased) {
        if (monthBased === void 0) { monthBased = false; }
        return function (date, locale) {
            var result;
            if (monthBased) {
                var nbDaysBefore1stDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1;
                var today = date.getDate();
                result = 1 + Math.floor((today + nbDaysBefore1stDayOfMonth) / 7);
            }
            else {
                var thisThurs = getThursdayThisWeek(date);
                // Some days of a year are part of next year according to ISO 8601.
                // Compute the firstThurs from the year of this week's Thursday
                var firstThurs = getFirstThursdayOfYear(thisThurs.getFullYear());
                var diff = thisThurs.getTime() - firstThurs.getTime();
                result = 1 + Math.round(diff / 6.048e8); // 6.048e8 ms per week
            }
            return padNumber(result, size, getLocaleNumberSymbol(locale, NumberSymbol.MinusSign));
        };
    }
    function timeZoneGetter(width) {
        return function (date, locale, offset) {
            var zone = -1 * offset;
            var minusSign = getLocaleNumberSymbol(locale, NumberSymbol.MinusSign);
            var hours = zone > 0 ? Math.floor(zone / 60) : Math.ceil(zone / 60);
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
                    throw new Error("Unknown zone width \"" + width + "\"");
            }
        };
    }
    function padNumber(num, digits, minusSign, trim, negWrap) {
        if (minusSign === void 0) { minusSign = '-'; }
        var neg = '';
        if (num < 0 || (negWrap && num <= 0)) {
            if (negWrap) {
                num = -num + 1;
            }
            else {
                num = -num;
                neg = minusSign;
            }
        }
        var strNum = String(num);
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
                throw new Error("Unknown DateType value \"" + part + "\".");
        }
    }
    function formatFractionalSeconds(milliseconds, digits) {
        var strMs = padNumber(milliseconds, 3);
        return strMs.substr(0, digits);
    }
    function getFirstThursdayOfYear(year) {
        var firstDayOfYear = (new Date(year, JANUARY, 1)).getDay();
        return new Date(year, 0, 1 + ((firstDayOfYear <= THURSDAY) ? THURSDAY : THURSDAY + 7) - firstDayOfYear);
    }
    function getThursdayThisWeek(datetime) {
        return new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate() + (THURSDAY - datetime.getDay()));
    }

    /**
     *Класс, содержащий статический метод, определяющий смещение часового пояса относительно GMT (+00:00) по переданной строке с названием таймзоны.
     *Создавать новый объект этого класса для использования метода не требуется.
     */
    var TimeZoneIdentifier = /** @class */ (function () {
        function TimeZoneIdentifier() {
        }
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
        TimeZoneIdentifier.getTimeZoneGMTOffsetfromNameZone = function (zone) {
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
        };
        return TimeZoneIdentifier;
    }());

    /**
     * Функция валидации переданного объекта restriction на соответствие интерфейсу Restrictions
     * @param restriction - объект, содержащий информацию о рабочем времени и временной зоне.
     */
    function isValidRestriction(restriction) {
        return 'timezone' in restriction && 'workTime' in restriction;
    }
    /**
     * Функция валидации переданного объекта restriction на соответствие минимальным данным для заказа
     * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
     */
    function isValidRestrictionOrder(restriction) {
        return 'minDeliveryTime' in restriction && 'periodPossibleForOrder' in restriction && 'timezone' in restriction && 'workTime' in restriction;
    }
    /**
     * Класс, содержащий статические методы, необходимые для работы с ограничениями рабочего времени предприятия.
     * Создавать новый объект этого класса для использования методов не требуется.
     */
    var WorkTimeValidator = /** @class */ (function () {
        function WorkTimeValidator() {
        }
        /**
         * Метод возвращает максимальную возможную дату, на которую можно заказать доставку.
         * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
         * @return :string - Строка, представляющая максимальную доступную дату доставки в формате yyyy-MM-dd.
         */
        WorkTimeValidator.getMaxOrderDate = function (restriction, currentdate) {
            if (restriction && isValidRestrictionOrder(restriction) && isDate(currentdate)) {
                return formatDate(currentdate.getTime() + restriction.periodPossibleForOrder * 60000, 'yyyy-MM-dd', 'en');
            }
            else {
                throw new Error(isDate(currentdate) ?
                    'Не передан корректный объект даты' :
                    !restriction ? 'Не передан объект restrictions' :
                        'Передан невалидный обьект restrictions');
            }
        };
        /**
         * Метод считает, сколько минут от начала дня (00:00) прошло для переданного времени.
         * @param time - строка в формате HH:mm - время.
         * @return :number - кол-во минут.
         */
        WorkTimeValidator.getTimeFromString = function (time) {
            if (!time) {
                throw new Error('Не передана строка с преобразуемым временем в формате HH:mm');
            }
            else {
                var checkedTime = time.trim();
                if (checkedTime.includes(' ') || checkedTime.includes('T')) {
                    checkedTime = checkedTime.split(checkedTime.includes(' ') ? ' ' : 'T')[1];
                }
                return (+checkedTime.split(':')[0]) * 60 + (+checkedTime.split(':')[1]);
            }
        };
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
        WorkTimeValidator.isWorkNow = function (restriction, currentdate) {
            if (currentdate === void 0) { currentdate = new Date(); }
            if (!restriction.workTime || !Object.keys(restriction.workTime).length) {
                return {
                    workNow: true
                };
            }
            ;
            // Если испольняется в NodeJS
            if (typeof process !== 'undefined' && !restriction.timezone) {
                restriction.timezone = process.env.TZ ? process.env.TZ : Intl.DateTimeFormat().resolvedOptions().timeZone;
            }
            ;
            if (!restriction || !isValidRestriction(restriction)) {
                throw new Error(!isDate(currentdate) ? 'Не передан корректный объект даты' :
                    !restriction ? 'Не передан объект restrictions'
                        : 'Передан невалидный обьект restrictions');
            }
            else {
                var companyLocalTimeZone = TimeZoneIdentifier.getTimeZoneGMTOffsetfromNameZone(restriction.timezone).split(':');
                var companyLocalTimeZoneDelta = +companyLocalTimeZone[0] * 60 + (+(companyLocalTimeZone[1]));
                var lokalTimeDelta = companyLocalTimeZoneDelta + currentdate.getTimezoneOffset(); // смещение времени пользователя относительно времени торговой точки
                var currentTimeInMinutesWithLocalDelta = WorkTimeValidator.getTimeFromString(formatDate(currentdate, 'HH:mm', 'en')) + lokalTimeDelta;
                var currentTime = currentTimeInMinutesWithLocalDelta > 1440 ? currentTimeInMinutesWithLocalDelta - 1440 : currentTimeInMinutesWithLocalDelta;
                /**
                 * текущее время в минутах с начала дня (600 = 10:00. 1200 = 20:00)
                 * если из-за разницы поясов расчет перепрыгнул на новый день, то приводим время к правильному значению в диапазоне 24 часов
                 * */
                var currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, currentTimeInMinutesWithLocalDelta > 1440 ? new Date(currentdate.getTime() + 86400000) : currentdate); // текущее рабочее время
                var curentDayStartTime = WorkTimeValidator.getTimeFromString(currentDayWorkTime.start); // текущее время начала рабочего дня в минутах
                var curentDayStopTime = WorkTimeValidator.getTimeFromString(currentDayWorkTime.stop); // текущее время окончания рабочего дня в минутах
                return {
                    workNow: currentTime < curentDayStopTime && currentTime > curentDayStartTime,
                    isNewDay: currentTimeInMinutesWithLocalDelta > 1440,
                    currentTime: currentTime,
                    curentDayStartTime: curentDayStartTime,
                    curentDayStopTime: curentDayStopTime
                };
            }
        };
        /**
         * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Доставка курьером".
         * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
         * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
         */
        WorkTimeValidator.getPossibleDelieveryOrderDateTime = function (restriction, currentdate) {
            var checkTime = WorkTimeValidator.isWorkNow(restriction, currentdate);
            if (checkTime.workNow) {
                throw new Error('Сейчас рабочее время. Расчет не требуется.');
            }
            else {
                if (checkTime.currentTime && checkTime.curentDayStopTime) {
                    var currentDayWorkTime = WorkTimeValidator.getCurrentWorkTime(restriction, checkTime.isNewDay ? new Date(currentdate.getTime() + 86400000) : currentdate);
                    var time = this.getTimeFromString(currentDayWorkTime.start) + (+restriction.minDeliveryTime) + 1;
                    var hour = Math.floor(time / 60);
                    var minutes = time - (hour * 60);
                    return formatDate(checkTime.isNewDay || checkTime.currentTime > checkTime.curentDayStopTime ? (currentdate.getTime() + 86400000) : currentdate, "yyyy-MM-dd " + (hour <= 9 ? '0' + hour : hour) + ":" + (minutes <= 9 ? '0' + minutes : minutes), 'en');
                }
                else {
                    throw 'Не удалось рассчитать currentTime и curentDayStopTime.';
                }
            }
        };
        /**
         * Метод возвращает ближайшую возможную дату-время заказа для способа доставки "Самовывоз".
         * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
         * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
         */
        WorkTimeValidator.getPossibleSelfServiceOrderDateTime = function (restriction, currentdate) {
            /**
             * Для обеспечения иммутабельности данных создается новый обьект restrictions, идентичный полученному в параметрах, но с измененным массивом workTime.
             * В массиве workTime обновляются ограничения времени работы с обычных на актуальные для самовывоза.
             * */
            var newRestriction = Object.assign(Object.assign({}, restriction), { workTime: restriction.workTime.map(function (workTime) { return workTime.selfService ? (Object.assign(Object.assign({}, workTime), workTime.selfService)) : workTime; }) });
            return WorkTimeValidator.getPossibleDelieveryOrderDateTime(newRestriction, currentdate);
        };
        /**
        * Метод возвращает актуальные данные о времени работы из массива всех вариантов обьекта restriction.
        * @param restriction - объект, содержащий информацию о рабочем времени предприятия и ограничениях даты/времени доставки.
        * @param currentdate - объект Date, представляющий текущие локальные дату и время пользователя
        */
        WorkTimeValidator.getCurrentWorkTime = function (restriction, currentdate) {
            var i = 0;
            var result = null;
            while (i < restriction.workTime.length && !result) {
                if (restriction.workTime[i].dayOfWeek === 'all' || (typeof restriction.workTime[i].dayOfWeek === 'string' ?
                    restriction.workTime[i].dayOfWeek.toLowerCase() :
                    restriction.workTime[i].dayOfWeek.map(function (day) { return day.toLowerCase(); })).includes(formatDate(currentdate, 'EEEE', 'en').toLowerCase())) {
                    result = restriction.workTime[i];
                }
                i += 1;
            }
            if (!result) {
                throw new Error('Нет актуального расписания работы для текущего дня');
            }
            else {
                return result;
            }
        };
        return WorkTimeValidator;
    }());

    /**
     * Generated bundle index. Do not edit.
     */

    exports.TimeZoneIdentifier = TimeZoneIdentifier;
    exports.WorkTimeValidator = WorkTimeValidator;
    exports.formatDate = formatDate;
    exports.isDate = isDate;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=webresto-worktime.umd.js.map
