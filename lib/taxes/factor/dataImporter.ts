/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { TaxFactors, TaxFactorsRaw } from './types';
import { dataParsedBasePath, dataRawBasePath } from '../constants';
import { TaxLocation } from '../types';

// - Load the raw tarifs from the tarifs.json file in the data folder by the year of the tarif
// - export a json per item into the data folder with a subfolder by year
export const importAndParseFactors = (year: number) => {
  console.log('Start loading factors');
  const factors = loadFactorsJson(year);
  console.log(`Loaded ${factors.length} factors`);

  const locations = factors.reduce((acc, factorRaw) => {
    const location: TaxLocation = {
      TaxLocationID: factorRaw.Location.TaxLocationID,
      BfsID: factorRaw.Location.BfsID,
      BfsName: factorRaw.Location.BfsName,
      CantonID: factorRaw.Location.CantonID,

      Canton: factorRaw.Location.Canton
    };

    acc.push(location);
    return acc;
  }, [] as TaxLocation[]);
  saveLocationsJson(year, 'locations', locations);
  console.log(`Saved ${locations.length} locations`);

  const factorsByCanton = factors.reduce((acc, factorRaw) => {
    const cantonId = factorRaw.Location.CantonID;

    if (!acc[cantonId]) {
      acc[cantonId] = [];
    }

    // copy the raw data into a new object
    const factors: TaxFactors = {
      FortuneRateProtestant: factorRaw.FortuneRateProtestant,
      ProfitTaxRateCanton: factorRaw.ProfitTaxRateCanton,
      FortuneRateRoman: factorRaw.FortuneRateRoman,
      CapitalTaxRateChurch: factorRaw.CapitalTaxRateChurch,
      IncomeRateCanton: factorRaw.IncomeRateCanton,
      ProfitTaxRateCity: factorRaw.ProfitTaxRateCity,
      CapitalTaxRateCity: factorRaw.CapitalTaxRateCity,
      FortuneRateCanton: factorRaw.FortuneRateCanton,
      IncomeRateChrist: factorRaw.IncomeRateChrist,
      CapitalTaxRateCanton: factorRaw.CapitalTaxRateCanton,
      FortuneRateChrist: factorRaw.FortuneRateChrist,
      IncomeRateProtestant: factorRaw.IncomeRateProtestant,
      IncomeRateCity: factorRaw.IncomeRateCity,
      IncomeRateRoman: factorRaw.IncomeRateRoman,
      FortuneRateCity: factorRaw.FortuneRateCity,
      ProfitTaxRateChurch: factorRaw.ProfitTaxRateChurch,
      Location: {
        BfsID: factorRaw.Location.BfsID
      }
    };

    acc[cantonId].push(factors);

    return acc;
  }, {} as Record<number, TaxFactors[]>);
  for (const canton in factorsByCanton) {
    saveFactorsJson(year, canton, factorsByCanton[canton]);
  }

  console.log('Finished loading factors');
};

const loadFactorsJson = (year: number) => {
  const data = fs.readFileSync(path.resolve(`${dataRawBasePath}${year}/factors.json`));
  const tarifs = JSON.parse(data.toString()) as { response: TaxFactorsRaw[] };
  return tarifs.response;
};

const saveLocationsJson = (year: number, filename: string, payload: any) => {
  const filePath = path.resolve(`${dataParsedBasePath}${year}/`);
  fs.mkdir(filePath, { recursive: true }, (err) => {
    if (err) throw err;
  });
  const data = JSON.stringify(payload, null);
  fs.writeFileSync(`${filePath}/${filename}.json`, data);
};

const saveFactorsJson = (year: number, filename: string, payload: any) => {
  const filePath = path.resolve(`${dataParsedBasePath}${year}/factors/`);
  fs.mkdir(filePath, { recursive: true }, (err) => {
    if (err) throw err;
  });
  const data = JSON.stringify(payload, null);
  fs.writeFileSync(`${filePath}/${filename}.json`, data);
};
