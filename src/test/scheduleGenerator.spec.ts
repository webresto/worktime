import { assert } from 'chai';
import { ScheduleGenerator } from '../lib/scheduleGenerator';

describe('ScheduleGenerator', function () {
    const jsonData = [
        {
            "dayOfWeek": ["monday", "tuesday", "wednesday", "thursday", "sunday"],
            "start": "10:00",
            "stop": "21:45",
            "break": "12:00-12:10"
        },
        {
            "dayOfWeek": ["friday", "saturday"],
            "start": "10:00",
            "stop": "21:45",
            "break": "12:00-13:00"
        }
    ];
    const startDate = new Date("2024-04-01T00:00:00.000Z");
    const endDate = new Date("2024-04-08T00:00:00.000Z");
    const timeZone = "Etc/GMT+5";

    const scheduleGenerator = new ScheduleGenerator(jsonData);

    it('should generate compact time intervals when compact parameter is true', function () {
        const expectedCompactIntervals = 
            [
               [
                 1711936800,
                 1711944000
               ],
               [
                 1711944600,
                 1711979100
               ],
               [
                 1712023200,
                 1712030400
               ],
               [
                 1712031000,
                 1712065500
               ],
               [
                 1712109600,
                 1712116800
               ],
               [
                 1712117400,
                 1712151900
               ],
               [
                 1712196000,
                 1712203200
               ],
               [
                 1712203800,
                 1712238300
               ],
               [
                 1712282400,
                 1712289600
               ],
               [
                 1712293200,
                 1712324700
               ],
               [
                 1712368800,
                 1712376000
               ],
               [
                 1712379600,
                 1712411100
               ],
               [
                 1712455200,
                 1712462400
               ],
               [
                 1712463000,
                 1712497500
               ],
               [
                 1712541600,
                 1712548800
               ],
               [
                 1712549400,
                 1712583900
               ]
            ]
          
        

        const generatedCompactIntervals = scheduleGenerator.generateTimeIntervals(startDate, endDate, timeZone, true);
        console.log(generatedCompactIntervals)
        assert.deepStrictEqual(generatedCompactIntervals, expectedCompactIntervals);
    });

    it('should adjust time intervals according to the specified time zone', function () {
        // Define expected intervals adjusted for the time zone
        const expectedAdjustedIntervals =  [
           {
             "start": 1711936800,
             "stop": 1711944000
           },
           {
             "start": 1711944600,
             "stop": 1711979100
           },
           {
             "start": 1712023200,
             "stop": 1712030400
           },
           {
             "start": 1712031000,
             "stop": 1712065500
           },
           {
             "start": 1712109600,
             "stop": 1712116800
           },
           {
             "start": 1712117400,
             "stop": 1712151900
           },
           {
             "start": 1712196000,
             "stop": 1712203200
           },
           {
             "start": 1712203800,
             "stop": 1712238300
           },
           {
             "start": 1712282400,
             "stop": 1712289600
           },
           {
             "start": 1712293200,
             "stop": 1712324700
           },
           {
             "start": 1712368800,
             "stop": 1712376000
           },
           {
             "start": 1712379600,
             "stop": 1712411100
           },
           {
             "start": 1712455200,
             "stop": 1712462400
           },
           {
             "start": 1712463000,
             "stop": 1712497500
           },
           {
             "start": 1712541600,
             "stop": 1712548800
           },
           {
             "start": 1712549400,
             "stop": 1712583900
           }
        ]
      ;

        const generatedAdjustedIntervals = scheduleGenerator.generateTimeIntervals(startDate, endDate, timeZone);
        assert.deepStrictEqual(generatedAdjustedIntervals, expectedAdjustedIntervals);
    });
});
