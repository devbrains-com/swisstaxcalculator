import { TaxLocationRaw } from '../types';

export interface TaxFactors {
  FortuneRateProtestant: number;
  ProfitTaxRateCanton: number;
  FortuneRateRoman: number;
  CapitalTaxRateChurch: number;
  IncomeRateCanton: number;
  ProfitTaxRateCity: number;
  CapitalTaxRateCity: number;
  FortuneRateCanton: number;
  IncomeRateChrist: number;
  CapitalTaxRateCanton: number;
  FortuneRateChrist: number;
  IncomeRateProtestant: number;
  IncomeRateCity: number;
  IncomeRateRoman: number;
  FortuneRateCity: number;
  ProfitTaxRateChurch: number;
  Location: {
    BfsID: number;
  };
}

export interface TaxFactorsRaw {
  FortuneRateProtestant: number;
  ProfitTaxRateCanton: number;
  FortuneRateRoman: number;
  CapitalTaxRateChurch: number;
  IncomeRateCanton: number;
  ProfitTaxRateCity: number;
  CapitalTaxRateCity: number;
  FortuneRateCanton: number;
  IncomeRateChrist: number;
  CapitalTaxRateCanton: number;
  FortuneRateChrist: number;
  IncomeRateProtestant: number;
  IncomeRateCity: number;
  IncomeRateRoman: number;
  FortuneRateCity: number;
  ProfitTaxRateChurch: number;
  Location: TaxLocationRaw;
}
