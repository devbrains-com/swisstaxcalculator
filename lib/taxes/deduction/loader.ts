import fs from 'fs';
import path from 'path';
import {
  TaxDeductionTable,
  TaxDeductionTableItemFormat,
  TaxDeductionTableRaw,
  TaxDeductionTableTarget,
  TaxDeductionTableType
} from './types';
import { dataParsedBasePath, dataRawBasePath } from '../constants';

const getCantonId = (deduction: TaxDeductionTableRaw) => {
  if (deduction.Target === 'BUND') {
    return 0;
  }

  if (deduction.Target === 'KANTON') {
    return deduction.Location.CantonID;
  }

  console.log('Canton not found', deduction.Target, deduction.Location);
  return -1;
};

// - Load the raw tarifs from the tarifs.json file in the data folder by the year of the tarif
// - export a json per item into the data folder with a subfolder by year
export const loadDeductions = (year: number) => {
  const deductions = loadDeudctionsJson(year);
  const deductionsByCanton = deductions.reduce((acc, deductionRaw) => {
    const cantonId = getCantonId(deductionRaw);
    if (cantonId === -1) return acc;

    const deduction: TaxDeductionTable = {
      type: deductionRaw.TaxType as TaxDeductionTableType,
      target: deductionRaw.Target as TaxDeductionTableTarget,
      items: deductionRaw.Table.map((item) => ({
        id: item.Name.ID,
        minimum: item.Minimum,
        maximum: item.Maximum,
        format: item.Format as TaxDeductionTableItemFormat,
        amount: item.Amount,
        percent: item.Percent,
        name: {
          de: item.Name.DE,
          fr: item.Name.FR,
          it: item.Name.IT,
          en: item.Name.EN
        }
      })).filter((item) => item.format !== '')
    };

    if (!acc[cantonId]) acc[cantonId] = [];

    if (!acc[cantonId].find((d) => d.type === deduction.type)) {
      acc[cantonId].push(deduction);
    }

    return acc;
  }, {} as Record<number, TaxDeductionTable[]>);
  for (const canton in deductionsByCanton) {
    const deduction = deductionsByCanton[canton];
    saveDeductionsJson(year, canton, deduction);
  }
};

const loadDeudctionsJson = (year: number) => {
  const resolvedPath = path.resolve(`${dataRawBasePath}${year}/deductions.json`);
  const data = fs.readFileSync(resolvedPath);
  const tarifs = JSON.parse(data.toString()) as { response: TaxDeductionTableRaw[] };
  return tarifs.response;
};

const saveDeductionsJson = (year: number, filename: string, payload: any) => {
  const filePath = path.resolve(`${dataParsedBasePath}${year}/deductions/`);
  fs.mkdir(filePath, { recursive: true }, (err) => {
    if (err) throw err;
  });
  const data = JSON.stringify(payload, null);
  fs.writeFileSync(`${filePath}/${filename}.json`, data);
};
