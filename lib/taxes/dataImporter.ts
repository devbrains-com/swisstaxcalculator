/* eslint-disable no-console */
import { importAndParseDeductions } from './deduction/dataImporter';
import { importAndParseFactors } from './factor/dataImporter';
import { importAndParseTarifs } from './tarif/dataImporter';
import { downloadRawData } from './dataDownloader';

const args = process.argv.slice(2);
const download = args.includes('--download');
const yearArgs = args.filter((a) => !a.startsWith('--'));

// Support comma-separated years: "2015,2016" or space-separated: "2015 2016"
const years = yearArgs.flatMap((a) => a.split(',')).map((y) => Number.parseInt(y.trim())).filter((y) => !isNaN(y));

if (years.length === 0) {
  console.log('Usage: yarn importdata <year>[,<year>,...] [--download]');
  console.log('');
  console.log('Examples:');
  console.log('  yarn importdata 2025              Import from existing raw data');
  console.log('  yarn importdata 2025 --download    Download raw data first, then import');
  console.log('  yarn importdata 2024,2025 --download');
  process.exit(1);
}

const importYear = (year: number) => {
  console.log(`\n=== Importing ${year} ===`);
  importAndParseTarifs(year);
  importAndParseFactors(year);
  importAndParseDeductions(year);
  console.log(`=== Done importing ${year} ===\n`);
};

const run = async () => {
  for (const year of years) {
    if (download) {
      await downloadRawData(year);
    }
    importYear(year);
  }
};

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

export {};
