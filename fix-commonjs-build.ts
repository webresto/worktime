import { readFile, writeFile } from 'fs/promises';

export async function main() {
  const packageJSONstring = await readFile('./dist/package.json', {
    encoding: 'utf-8',
  });
  try {
    const packageJson = JSON.parse(packageJSONstring);
    if (packageJson?.['exports']?.['.']?.['node'] !== undefined) {
      packageJson['exports']['.']['node'] = './bundles/index.js';
      await writeFile(
        './dist/package.json',
        JSON.stringify(packageJson, undefined, 2),
        {
          encoding: 'utf-8',
        }
      );
      console.log('./dist/package.json - Fixed!');
    } else {
      console.log(
        './dist/package.json - Error! Not found field ["exports"]["."]["node") in readed file.'
      );
    }
  } catch (error) {
    console.log('./dist/package.json - Error parse!');
  }
}

try {
  main();
} catch (error) {
  console.log(error);
};

