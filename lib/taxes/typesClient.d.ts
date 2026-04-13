export type TaxCalculationType = 'incomeAndWealth' | 'capital';
export type TaxRelationship = 's' | 'm' | 'rp' | 'c'; // Alleinstehend, Verheiratet, Eingetragene Partnerschaft, Konkubinat
export type TaxConfession = 'christ' | 'roman' | 'protestant' | 'other'; // Christkatholisch, Römisch-katholisch, Reformiert, Sonstige/Keine
export type TaxIncomeType = 'gross' | 'net' | 'taxable'; // Brutto, Netto, Steuerpflichtig

export interface ValueLabelItem<T extends string> {
  value: T;
  label: { de: string };
}
const;

export type TaxCalculationTypeList = readonly ValueLabelItem<TaxCalculationType>[];
export type TaxRelationshipList = readonly ValueLabelItem<TaxRelationship>[];
export type TaxConfessionList = readonly ValueLabelItem<TaxConfession>[];
export type TaxIncomeTypeList = readonly ValueLabelItem<TaxIncomeType>[];

export interface TaxInputPerson {
  age: number;
  confession: TaxConfession;
  incomeType: TaxIncomeType;
  income: number;
  pkDeduction?: number;
  deductions?: TaxDeductionPerPersonInput;
}

export interface TaxInput {
  calculationType: TaxCalculationType;
  relationship: TaxRelationship;
  locationId: number;
  cantonId: number;
  year: number;
  children: number;
  fortune: number;
  persons: TaxInputPerson[];
  deductions?: TaxDeductionGeneralInput;
  includeProgression?: boolean;
}

export interface ProgressionBracket {
  lowerBound: number;
  upperBound: number;
  percent: number;
  amountInBracket: number;
  taxInBracket: number;
}

export interface ProgressionResult {
  taxableIncome: number;
  brackets: ProgressionBracket[];
  currentBracketIndex: number;
  amountIntoCurrentBracket: number;
  amountToNextBracket: number | null;
  nextBracketPercent: number | null;
  previousBracketPercent: number | null;
}

export interface TaxProgressionResult {
  bund?: ProgressionResult;
  cantonIncome?: ProgressionResult;
  cantonFortune?: ProgressionResult;
  overall?: ProgressionResult;
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
  progression?: TaxProgressionResult;
}

export interface TaxLocation {
  TaxLocationID: number;
  BfsID: number;
  CantonID: number;
  BfsName: string;
  Canton: string;
}

export interface TaxDeductionPerPersonInput {
  insurancePremiums?: number;
  pillar3a?: number;
  mealCosts?: number;
  travelExpenses?: number;
  otherProfessionalExpenses?: number;
  professionalExpensesSideline?: number;
  otherDeductions?: number;
}

export interface TaxDeductionGeneralInput {
  insurancePremiumsKids?: number;
  childcareCosts?: number;
  // rentExpenses?: number;
  debtInterest?: number;
  maintenanceCostsRealEstate?: number;
  otherDeductions?: number;
}

interface TaxDeductionFieldConfig {
  label: { de: string };
  hint?: { de: string };
  default?: number;
  suggestion?: number;
  defaultPerson?: number;
  withChildrenOnly?: boolean;
  defaultPerChild?: number;
  dependsOnWorkloadFactor?: boolean;
  defaultFlatRate?: boolean;
  defaultFactor?: number;
}

export type TaxDeductionFieldConfigs = Record<string, TaxDeductionFieldConfig>;

export type TaxDeductionPersonFieldConfigs = Record<
  keyof TaxDeductionPerPersonInput,
  TaxDeductionFieldConfig
>;

export type TaxDeductionGeneralFieldConfigs = Record<
  keyof TaxDeductionGeneralInput,
  TaxDeductionFieldConfig
>;

export interface TaxInputData {
  calculationTypes: TaxCalculationTypeList;
  years: number[];
  relationships: TaxRelationshipList;
  confessions: TaxConfessionList;
  incomeTypes: TaxIncomeTypeList;
  deductionsGeneral: TaxDeductionGeneralFieldConfigs;
  deductionsPerson: TaxDeductionPersonFieldConfigs;
}
