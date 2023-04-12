/* eslint-disable no-console */
import { importAndParseDeductions } from './deduction/dataImporter';
import { importAndParseFactors } from './factor/dataImporter';
import { importAndParseTarifs } from './tarif/dataImporter';

const yearInput = Number.parseInt(process.argv[2]);

if (!yearInput) {
  console.log('Please provide a year as first argument');
} else {
  importAndParseTarifs(yearInput);
  importAndParseFactors(yearInput);
  importAndParseDeductions(yearInput);
}
export {};
