import { multiply } from 'dinero.js';
import {
  DineroChf,
  dineroRound,
  multiplyDineroPercent,
  dineroAddMany,
  dineroScaled
} from '~/lib/utils/dinero';
import { getTaxFactors } from './provider';
import { TaxFactors } from './types';
import { TaxConfession, TaxInput } from '../types';

export const getChurchIncomeFactor = (confession: TaxConfession, factors: TaxFactors) => {
  switch (confession) {
    case 'christ':
      return factors.IncomeRateChrist;
    case 'roman':
      return factors.IncomeRateRoman;
    case 'protestant':
      return factors.IncomeRateProtestant;
    default:
      return 0;
  }
};

export const getChurchFortuneFactor = (confession: TaxConfession, factors: TaxFactors) => {
  switch (confession) {
    case 'christ':
      return factors.FortuneRateChrist;
    case 'roman':
      return factors.FortuneRateRoman;
    case 'protestant':
      return factors.FortuneRateProtestant;
    default:
      return 0;
  }
};

export const calculateTaxesCantonAndCity = async (
  taxInput: TaxInput,
  taxesIncomeBase: DineroChf,
  taxesIncomeBaseChurch: DineroChf,
  taxesFortuneBase: DineroChf
) => {
  const factor = await getTaxFactors(taxInput);

  const taxesIncomeCanton = dineroRound(
    multiplyDineroPercent(taxesIncomeBase, factor.IncomeRateCanton, 5)
  );
  const taxesIncomeCity = dineroRound(
    multiplyDineroPercent(taxesIncomeBase, factor.IncomeRateCity, 5)
  );

  const taxesIncomeChurch = dineroRound(
    dineroAddMany(
      ...taxInput.persons.map((person) =>
        multiplyDineroPercent(
          taxesIncomeBaseChurch,
          getChurchIncomeFactor(person.confession, factor) / taxInput.persons.length,
          2
        )
      )
    )
  );
  const taxesFortuneCanton = dineroRound(
    multiply(taxesFortuneBase, dineroScaled(factor.FortuneRateCanton, 2))
  );
  const taxesFortuneCity = dineroRound(
    multiply(taxesFortuneBase, dineroScaled(factor.FortuneRateCity, 2))
  );
  const taxesFortuneChurch = dineroRound(
    dineroAddMany(
      ...taxInput.persons.map((person) =>
        multiply(
          taxesFortuneBase,
          dineroScaled(
            getChurchFortuneFactor(person.confession, factor) / taxInput.persons.length,
            2
          )
        )
      )
    )
  );
  return {
    taxesIncomeCanton,
    taxesIncomeCity,
    taxesIncomeChurch,
    taxesFortuneCanton,
    taxesFortuneCity,
    taxesFortuneChurch
  };
};
