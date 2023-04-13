import { DineroChf, dineroRound, multiplyDineroPercent, dineroAddMany } from '~/lib/utils/dinero';
import { getTaxFactors } from './provider';
import { TaxFactors } from './types';
import { TaxConfession, TaxInput } from '../typesClient';

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
    multiplyDineroPercent(taxesFortuneBase, factor.FortuneRateCanton, 5)
  );
  const taxesFortuneCity = dineroRound(
    multiplyDineroPercent(taxesFortuneBase, factor.FortuneRateCity, 5)
  );
  const taxesFortuneChurch = dineroRound(
    dineroAddMany(
      ...taxInput.persons.map((person) =>
        multiplyDineroPercent(
          taxesFortuneBase,
          getChurchFortuneFactor(person.confession, factor) / taxInput.persons.length,
          5
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
