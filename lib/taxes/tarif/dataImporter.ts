/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { TaxTarif, TaxTarifRaw, TaxTarifTableType } from './types';
import { dataParsedBasePath, dataRawBasePath } from '../constants';
import { TaxType } from '../types';

const getCantonID = (tarif: TaxTarifRaw) => {
  if (tarif.Target === 'BUND') {
    return 0;
  }

  if (tarif.Target === 'KANTON') {
    return tarif.Location.CantonID;
  }

  console.log(
    'Unsupported target type',
    tarif.Target,
    tarif.Group,
    tarif.Splitting,
    tarif.Location
  );
  return -1;
};

// - Load the raw tarifs from the tarifs.json file in the data folder by the year of the tarif
// - export a json per item into the data folder with a subfolder by year
export const importAndParseTarifs = (year: number) => {
  console.log('Start loading tarif tables');
  const tarifs = loadTarifsJson(year);
  console.log(`Loaded ${tarifs.length} tarif tables`);

  const tarifsByCanton = tarifs.reduce((acc, tarifRaw) => {
    const canton = getCantonID(tarifRaw);
    if (canton === -1) return acc;

    if (!acc[canton]) {
      acc[canton] = [];
    }
    if (!acc[canton].find((t) => t.group === tarifRaw.Group && t.taxType === tarifRaw.TaxType)) {
      const tarif = {
        tableType: tarifRaw.TableType as TaxTarifTableType,
        taxType: tarifRaw.TaxType as TaxType,
        group: tarifRaw.Group,
        splitting: tarifRaw.Splitting,
        table: tarifRaw.Table.map((tableItem) => ({
          formula: tableItem.Formula,
          taxes: tableItem.Taxes,
          percent: tableItem.Percent,
          amount: tableItem.Amount
        }))
      };

      acc[canton].push(tarif);
    }

    return acc;
  }, {} as Record<number, TaxTarif[]>);
  for (const canton in tarifsByCanton) {
    const tarifs = tarifsByCanton[canton];
    saveTarifsJson(year, canton, tarifs);
  }

  console.log('Finished loading tarif tables');
};

const loadTarifsJson = (year: number) => {
  const data = fs.readFileSync(path.resolve(`${dataRawBasePath}${year}/tarifs.json`));
  const tarifs = JSON.parse(data.toString()) as { response: TaxTarifRaw[] };
  return tarifs.response;
};

const saveTarifsJson = (year: number, filename: string, payload: any) => {
  const filePath = path.resolve(`${dataParsedBasePath}${year}/tarifs/`);
  fs.mkdir(filePath, { recursive: true }, (err) => {
    if (err) throw err;
  });
  const data = JSON.stringify(payload, null);
  fs.writeFileSync(`${filePath}/${filename}.json`, data);
};
