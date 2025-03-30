import { readFile } from 'fs/promises';
import path from 'path';
import { TaxTarif, TaxTarifGroup, TaxTarifGroupWithFallback } from './types';
import { dataParsedBasePath } from '../constants';
import { TaxType } from '../types';

const taxTarifsByYearAndCanton = new Map<number, Map<number, Map<TaxType, TaxTarif[]>>>();

const loadTarifsIfRequired = async (cantonId: number, year: number) => {
  if (taxTarifsByYearAndCanton.get(year)?.has(cantonId)) return;

  // Load tarifs from file
  const resolvedPath = path.resolve(`${dataParsedBasePath}${year}/tarifs/${cantonId}.json`);
  const tarifs: TaxTarif[] = JSON.parse(
    (await readFile(new URL(resolvedPath, import.meta.url))).toString()
  );

  let taxTarifsByCanton = taxTarifsByYearAndCanton.get(year);

  if (!taxTarifsByCanton) {
    taxTarifsByCanton = new Map();
    taxTarifsByYearAndCanton.set(year, taxTarifsByCanton);
  }

  tarifs.forEach((tarifRaw) => {
    if (!taxTarifsByCanton) throw new Error('taxTarifsByCanton is undefined');

    let tarifsByTaxType = taxTarifsByCanton.get(cantonId);

    if (!tarifsByTaxType) {
      tarifsByTaxType = new Map();
      taxTarifsByCanton.set(cantonId, tarifsByTaxType);
    }

    let tarifs = tarifsByTaxType.get(tarifRaw.taxType);

    if (!tarifs) {
      tarifs = [];
      tarifsByTaxType.set(tarifRaw.taxType, tarifs);
    }
    tarifs.push(tarifRaw);
  });
};

export const getTaxTarifTable = async (
  cantonId: number,
  year: number,
  taxType: TaxType,
  tarifGroup: TaxTarifGroupWithFallback
): Promise<[TaxTarif, TaxTarifGroup]> => {
  await loadTarifsIfRequired(cantonId, year);

  const tarifTables = taxTarifsByYearAndCanton.get(year)?.get(cantonId)?.get(taxType);
  if (!tarifTables)
    throw new Error(`No tarifs found for cantonId: ${cantonId}, tarifType: ${taxType}`);

  for (const group of tarifGroup) {
    const tarifTable = tarifTables.find(
      (tarif) => tarif.group === 'ALLE' || tarif.group.includes(group)
    );

    if (tarifTable) return [tarifTable, group];
  }

  throw new Error(
    `Tarif not found for cantonId: ${cantonId}, tarifType: ${taxType}, tarifGroup: ${tarifGroup}`
  );
};
