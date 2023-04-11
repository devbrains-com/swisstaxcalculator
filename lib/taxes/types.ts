import { confessions, relationships } from './constants';
import { DineroChf } from '../utils/dinero';

export interface BfsCanton {
  name: string;
  id: number;
}
export interface BfsCity {
  name: string;
  id: number;
  cantonId: number;
}

export type TaxType =
  | 'VERMOEGENSSTEUER'
  | 'EINKOMMENSSTEUER'
  | 'KAPITALSTEUER'
  | 'ERBSCHAFT'
  | 'VORSORGESTEUER';

export type TaxIncomeType = 'GROSS' | 'NET' | 'TAXABLE';

export type TaxRelationship = (typeof relationships)[number];
export type TaxConfession = (typeof confessions)[number];

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
  ahvIvEo: number; // 10.6%, davon die Hälfte -> 5.3%
  alv: number; // Bis zu 148200 CHF -> 2.2%, davon die Hälfte -> 1.1%
  nbu: number; // Max. 148200 CHF -> Annahme 0.4%
  pk: number; // Gemäss Eingaben
  netIncome: number;
}

export interface TaxDeductionResultItem {
  id: string;
  name: string;
  target: string;
  amountCanton: DineroChf;
  amountBund: DineroChf;
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

// TODO Use groups and a list for that
export interface UnusedTaxDeductionInput {
  insurancePremiums: number; // Versicherungsprämien und Zinsen von Sparkapitalien, default: CHF 4'560 pro Erwachsenen (CHF 380 monatlich, auch bei Kindern über 18), CHF 1'200 pro Kind (CHF 100 monatlich, nur bei Kindern unter 18)
  individualPremiumDeuduction: number; // Individuelle Prämienverbilligung
  pillar3a: number; // Säule 3a
  mealCosts: number; // Verpflegungskosten Haupterwerb
  travelExprenses: number; // Fahrkosten Haupterwerb
  otherProfessionalExpenses: number; // Übrige Berufsauslagen Haupterwerb
  professionalExpensesSideline: number; // Berufsauslagen Nebenerwerb
  childcareCosts: number; // Kinder Drittbetreuungskosten
  rentExpenses: number; // Mietausgaben, default: 20% zug und vd
  debtInterest: number; // Schuldzinsen
  maintenanceCostsRealEstate: number; // Unterhaltskosten für Liegenschaften
  otherDeductions: number; // Übrige Abzüge
}

// TODO Use groups and a list for that
export interface UnusedTaxDeductionResult extends UnusedTaxDeductionInput {
  childDeduction: number; // Kinderabzug
}

export interface TaxLocation {
  TaxLocationID: number;
  BfsID: number;
  CantonID: number;
  BfsName: string;
  Canton: string;
}

export interface TaxLocationRaw {
  TaxLocationID: number;
  ZipCode: string;
  BfsID: number;
  CantonID: number;
  BfsName: string;
  City: string;
  Canton: string;
}
