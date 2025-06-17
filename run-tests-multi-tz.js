const { execSync } = require('child_process');

const timezones = process.env.TEST_TZS
  ? process.env.TEST_TZS.split(',')
  : ['UTC', 'Europe/Moscow', 'America/New_York', 'Asia/Tokyo'];

for (const tz of timezones) {
  console.log(`\nRunning tests in timezone ${tz}`);
  execSync(`TZ=${tz} npx ts-mocha -p ./tsconfig.test.json src/test/*.spec.ts`, {
    stdio: 'inherit'
  });
}
