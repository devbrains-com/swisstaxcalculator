export type TaxRelationship = 's' | 'm' | 'rp' | 'c'; // Alleinstehend, Verheiratet, Eingetragene Partnerschaft, Konkubinat
export type TaxConfession = 'christ' | 'roman' | 'protestant' | 'other'; // Christkatholisch, Römisch-katholisch, Reformiert, Sonstige/Keine
export type TaxIncomeType = 'GROSS' | 'NET' | 'TAXABLE'; // Brutto, Netto, Steuerpflichtig

export interface TaxInputPerson {
  age: number;
  confession: TaxConfession;
  incomeType: TaxIncomeType;
  income: number;
  pkDeduction?: number;
  pillar3aDeduction?: number;
}

export interface TaxInput {
  taxType: string;
  relationship: TaxRelationship;
  locationId: number;
  cantonId: number;
  year: number;
  children: number;
  fortune: number;
  persons: TaxInputPerson[];
}

export interface TaxGrossNetDetail {
  person: TaxInputPerson;
  grossIncome: number;
  ahvIvEo: number;
  alv: number;
  nbu: number;
  pk: number;
  netIncome: number;
}

export interface TaxDeductionResultItemDisplay {
  id: string;
  name: string;
  target: string;
  amountCanton: number;
  amountBund: number;
}

export interface TaxDeductionResult {
  grossNetDetails?: TaxGrossNetDetail[];
  netIncomeCanton: number;
  netIncomeBund: number;
  deductionsIncome: TaxDeductionResultItemDisplay[];
  deductionsFortune: TaxDeductionResultItemDisplay[];
  taxableFortuneCanton: number;
  taxableIncomeCanton: number;
  taxableIncomeBund: number;
}

export interface TaxResult {
  input: TaxInput;
  taxesIncomeCanton: number;
  taxesIncomeCity: number;
  taxesIncomeChurch: number;
  taxesFortuneCanton: number;
  taxesFortuneCity: number;
  taxesFortuneChurch: number;
  taxesIncomeBund: number;
  taxesPersonnel: number;
  taxesTotal: number;
  details: TaxDeductionResult;
}

export interface TaxLocation {
  TaxLocationID: number;
  BfsID: number;
  CantonID: number;
  BfsName: string;
  Canton: string;
}
