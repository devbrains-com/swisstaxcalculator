import { DineroChf } from '~/lib/utils/dinero';
import { TaxTarifGroupWithFallback } from '../tarif/types';
import { TaxType } from '../types';

export type PensionCreditTaxType =
  | 'IncomeTaxFactor'
  | 'RentIncomeFactor'
  | 'RentIncomeFactorOwn'
  | 'Flattax'
  | 'Tarif';

export interface CalculateTarifAndFlattaxTaxParams {
  tarifGroup: TaxTarifGroupWithFallback;
  capital: DineroChf;
  cantonId: number;
  year: number;
}

export interface CalculateIncomeTaxParams {
  tarifGroup: TaxTarifGroupWithFallback;
  capital: DineroChf;
  cantonId: number;
  year: number;
  incomeTaxFactor: number;
}

export interface CalculateRentIncomeTaxesBaseParams {
  tarifGroup: TaxTarifGroupWithFallback;
  tarifType: TaxType;
  capital: DineroChf;
  cantonId: number;
  year: number;
  rentIncomeFactor: number;
}

export interface PensionCreditTaxDefinition {
  type: PensionCreditTaxType;
  cantonId: number;
  incomeTaxFactor?: number;
  rentIncomeFactor?: number;
  minTaxFactor?: number;
  maxTaxFactor?: number;
  deductionMarried?: number;
  amountFree?: number;
  taxFactorChurch?: number;
}
