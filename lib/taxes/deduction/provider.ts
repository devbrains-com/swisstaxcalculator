import { readFile } from 'fs/promises';
import path from 'path';
import { TaxDeductionTableExtended, TaxDeductionTable } from './types';
import { dataParsedBasePath } from '../constants';
import { TaxType } from '../types';

const taxDeductionsByYearAndCanton = new Map<
  number,
  Map<number, Map<TaxType, TaxDeductionTableExtended>>
>();

const loadDeductionsIfRequired = async (cantonId: number, year: number) => {
  if (taxDeductionsByYearAndCanton.get(year)?.has(cantonId)) return;

  const resolvedPath = path.resolve(`${dataParsedBasePath}${year}/deductions/${cantonId}.json`);
  const deductionsRaw: TaxDeductionTable[] = JSON.parse(
    (await readFile(new URL(resolvedPath, import.meta.url))).toString()
  );

  let taxDeductionsByCanton = taxDeductionsByYearAndCanton.get(year);

  if (!taxDeductionsByCanton) {
    taxDeductionsByCanton = new Map();
    taxDeductionsByYearAndCanton.set(year, taxDeductionsByCanton);
  }

  deductionsRaw.forEach((deductionRaw) => {
    if (!taxDeductionsByCanton) throw new Error('taxDeductionsByCanton is undefined');

    let deductionsByTaxType = taxDeductionsByCanton.get(cantonId);

    if (!deductionsByTaxType) {
      deductionsByTaxType = new Map();
      taxDeductionsByCanton.set(cantonId, deductionsByTaxType);
    }

    const deductions = deductionsByTaxType.get(deductionRaw.type);

    if (!deductions) {
      deductionsByTaxType.set(deductionRaw.type, {
        ...deductionRaw,
        itemsById: new Map(deductionRaw.items.map((item) => [item.id, item]))
      });
    }
  });
};

export const getTaxDecutionTable = async (cantonId: number, year: number, taxType: TaxType) => {
  await loadDeductionsIfRequired(cantonId, year);
  const deductionTable = taxDeductionsByYearAndCanton.get(year)?.get(cantonId)?.get(taxType);
  if (!deductionTable)
    throw new Error(`Deduction table not found for canton ${cantonId}, tax type ${taxType}`);

  return deductionTable;
};
