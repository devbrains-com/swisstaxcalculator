import { importAndParseDeductions } from './deduction/dataImporter';
import { importAndParseFactors } from './factor/dataImporter';
import { importAndParseTarifs } from './tarif/dataImporter';

const year = 2022;

importAndParseTarifs(year);
importAndParseFactors(year);
importAndParseDeductions(year);

export {};
