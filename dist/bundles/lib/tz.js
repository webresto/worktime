"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeZoneIdentifier = void 0;
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
     *const offset = TimeZoneIdentifier.getTimeZoneGMTOffset('Europe/Moscow');
     *console.log(offset) /// "+03:00"
     *
     * */
    static getTimeZoneGMTOffset(zone) {
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
exports.TimeZoneIdentifier = TimeZoneIdentifier;
