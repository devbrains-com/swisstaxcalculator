import { DineroChf } from '../utils/dinero';

export type TaxType =
  | 'VERMOEGENSSTEUER'
  | 'EINKOMMENSSTEUER'
  | 'KAPITALSTEUER'
  | 'ERBSCHAFT'
  | 'VORSORGESTEUER';

export interface TaxDeductionResultItem {
  id: string;
  name: string;
  target: string;
  amountCanton: DineroChf;
  amountBund: DineroChf;
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

export interface TaxLocationRaw {
  TaxLocationID: number;
  ZipCode: string;
  BfsID: number;
  CantonID: number;
  BfsName: string;
  City: string;
  Canton: string;
}
