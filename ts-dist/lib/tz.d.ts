/**
 *Класс, содержащий статический метод, определяющий смещение часового пояса относительно GMT (+00:00) по переданной строке с названием таймзоны.
 *Создавать новый объект этого класса для использования метода не требуется.
 */
export declare class TimeZoneIdentifier {
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
    static getTimeZoneGMTOffsetfromNameZone(zone?: string): string;
}
