import { taxDeductionsGeneral, taxDeductionsPerson } from './deduction/constants';
import {
  TaxCalculationTypeList,
  TaxConfessionList,
  TaxIncomeTypeList,
  TaxInputData,
  TaxRelationshipList
} from './typesClient';

export const dataParsedRelativePath = 'data/parsed/';
export const dataParsedBasePath = `./${dataParsedRelativePath}`;
export const dataRawBasePath = './data/raw/';

const taxCalculationTypes: TaxCalculationTypeList = [
  { value: 'incomeAndWealth', label: { de: 'Einkommens- und Vermögensstauer' } },
  { value: 'capital', label: { de: 'Vorsorge Kapitalsteuer' } }
] as const;

const taxRelationships: TaxRelationshipList = [
  { value: 's', label: { de: 'Alleinstehend' } },
  { value: 'm', label: { de: 'Verheiratet' } },
  { value: 'rp', label: { de: 'Eingetragene Partnerschaft' } },
  { value: 'c', label: { de: 'Konkubinat' } }
] as const;

const taxConfessions: TaxConfessionList = [
  { value: 'christ', label: { de: 'Christkatholisch' } },
  { value: 'roman', label: { de: 'Römisch-katholisch' } },
  { value: 'protestant', label: { de: 'Reformiert' } },
  { value: 'other', label: { de: 'Andere / Keine' } }
] as const;

const taxIncomeTypes: TaxIncomeTypeList = [
  { value: 'gross', label: { de: 'Brutto' } },
  { value: 'net', label: { de: 'Netto' } },
  { value: 'taxable', label: { de: 'Steuerpflichtig' } }
] as const;

export const taxInputData: TaxInputData = {
  calculationTypes: taxCalculationTypes,
  years: [2022, 2024],
  relationships: taxRelationships,
  confessions: taxConfessions,
  incomeTypes: taxIncomeTypes,
  deductionsGeneral: taxDeductionsGeneral,
  deductionsPerson: taxDeductionsPerson
};
