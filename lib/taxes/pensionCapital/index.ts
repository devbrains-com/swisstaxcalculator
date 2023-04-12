import { isZero } from 'dinero.js';
import {
  dineroRound,
  dineroChf,
  dineroAddMany,
  dineroToNumber,
  dineroMax,
  dineroMin,
  dineroRound100Down,
  DineroChf,
  multiplyDineroFactor
} from '~/lib/utils/dinero';
import { getPensionCreditDefinition } from './provider';
import {
  PensionCreditTaxDefinition,
  CalculateRentIncomeTaxesBaseParams,
  CalculateIncomeTaxParams,
  CalculateTarifAndFlattaxTaxParams
} from './types';
import { calculateTaxesCantonAndCity } from '../factor';
import { calculateTaxesForTarif, getTaxTarifGroup } from '../tarif';
import { TaxInput, TaxResult } from '../types';

export const calculatePensionCapitalTaxes = async (taxInput: TaxInput) => {
  const definitionCanton = getPensionCreditDefinition(taxInput.cantonId);
  const definitionBund = getPensionCreditDefinition(0);

  const taxesBund = dineroRound(
    await calculateTaxesPensionCapitalByDefinition(taxInput, definitionBund)
  );

  const taxesBaseCanton = await calculateTaxesPensionCapitalByDefinition(
    taxInput,
    definitionCanton
  );
  const taxesBaseChurch = calculateTaxesBaseChurchByDefinition(
    taxInput,
    definitionCanton,
    taxesBaseCanton
  );
  const { taxesIncomeCanton, taxesIncomeCity, taxesIncomeChurch } =
    await calculateTaxesCantonAndCity(taxInput, taxesBaseCanton, taxesBaseChurch, dineroChf(0));

  const taxesTotal = dineroAddMany(
    taxesBund,
    taxesIncomeCanton,
    taxesIncomeCity,
    taxesIncomeChurch
  );

  const result: TaxResult = {
    input: taxInput,
    taxesIncomeCanton: dineroToNumber(taxesIncomeCanton),
    taxesIncomeCity: dineroToNumber(taxesIncomeCity),
    taxesIncomeChurch: dineroToNumber(taxesIncomeChurch),
    taxesFortuneCanton: 0,
    taxesFortuneCity: 0,
    taxesFortuneChurch: 0,
    taxesIncomeBund: dineroToNumber(taxesBund),
    taxesPersonnel: 0,
    taxesTotal: dineroToNumber(taxesTotal),
    details: {
      netIncomeBund: taxInput.fortune,
      netIncomeCanton: taxInput.fortune,
      deductionsIncome: [],
      deductionsFortune: [],
      taxableFortuneCanton: 0,
      taxableIncomeCanton: taxInput.fortune,
      taxableIncomeBund: taxInput.fortune
    }
  };

  return result;
};

export const calculateTaxesBaseChurchByDefinition = (
  taxInput: TaxInput,
  definition: PensionCreditTaxDefinition,
  taxesBaseCanton: DineroChf
) => {
  const capital = dineroChf(taxInput.fortune);
  if (definition.taxFactorChurch) {
    return multiplyDineroFactor(capital, definition.taxFactorChurch, 7);
  }

  return taxesBaseCanton;
};

export const calculateTaxesPensionCapitalByDefinition = async (
  taxInput: TaxInput,
  definition: PensionCreditTaxDefinition
) => {
  const taxes = await calculateTaxesPensionCapitalByType(taxInput, definition);
  return calculateMinMaxTaxes(taxInput, taxes, definition);
};

export const calculateTaxesPensionCapitalByType = async (
  taxInput: TaxInput,
  definition: PensionCreditTaxDefinition
) => {
  const tarifGroup = getTaxTarifGroup(taxInput.relationship, taxInput.children);
  const capital = dineroChf(taxInput.fortune);

  switch (definition.type) {
    case 'IncomeTaxFactor':
      if (!definition.incomeTaxFactor) throw new Error('IncomeTaxFactor must be defined');
      return await calculatePensionCapitalIncomeTaxes({
        tarifGroup,
        cantonId: definition.cantonId,
        year: taxInput.year,
        capital,
        incomeTaxFactor: definition.incomeTaxFactor
      });
    case 'RentIncomeFactor':
      if (!definition.rentIncomeFactor) throw new Error('RentIncomeFactor must be defined');
      return await calculatePensionCapitalRentIncomeTaxes({
        tarifGroup,
        tarifType: 'EINKOMMENSSTEUER',
        cantonId: definition.cantonId,
        year: taxInput.year,
        capital,
        rentIncomeFactor: definition.rentIncomeFactor
      });
    case 'RentIncomeFactorOwn':
      if (!definition.rentIncomeFactor) throw new Error('RentIncomeFactor must be defined');
      return await calculatePensionCapitalRentIncomeTaxes({
        tarifGroup,
        tarifType: 'VORSORGESTEUER',
        cantonId: definition.cantonId,
        year: taxInput.year,
        capital,
        rentIncomeFactor: definition.rentIncomeFactor
      });
    case 'Flattax':
    case 'Tarif':
      return await calculatePensionCapitalTarifOrFlatTaxes({
        tarifGroup,
        cantonId: definition.cantonId,
        year: taxInput.year,
        capital
      });
  }
};

export const calculateMinMaxTaxes = (
  taxInput: TaxInput,
  taxes: DineroChf,
  definition: PensionCreditTaxDefinition
) => {
  if (definition.minTaxFactor) {
    taxes = dineroMax(
      taxes,
      multiplyDineroFactor(dineroChf(taxInput.fortune), definition.minTaxFactor, 7)
    );
  }

  if (definition.maxTaxFactor) {
    taxes = dineroMin(
      taxes,
      multiplyDineroFactor(dineroChf(taxInput.fortune), definition.maxTaxFactor, 7)
    );
  }

  return taxes;
};

const calculatePensionCapitalRentIncomeTaxes = async ({
  tarifGroup,
  tarifType,
  cantonId,
  year,
  capital,
  rentIncomeFactor
}: CalculateRentIncomeTaxesBaseParams) => {
  // Round down to 100 CHF already here to have get the correct percentage
  const capitalReduced = dineroRound100Down(multiplyDineroFactor(capital, rentIncomeFactor, 7));

  if (isZero(capitalReduced)) {
    return dineroChf(0);
  }

  const taxesReduced = await calculateTaxesForTarif(
    cantonId,
    year,
    tarifGroup,
    tarifType,
    capitalReduced
  );

  const percentFactor = dineroToNumber(taxesReduced) / dineroToNumber(capitalReduced);
  const taxes = multiplyDineroFactor(capital, percentFactor, 7);

  // console.log(
  //   'rent income own',
  //   tarifGroup,
  //   dineroToNumber(capital),
  //   dineroToNumber(capitalReduced),
  //   dineroToNumber(taxesReduced),
  //   percentFactor,
  //   dineroToNumber(taxes)
  // );

  return taxes;
};

export const calculatePensionCapitalIncomeTaxes = async ({
  tarifGroup,
  cantonId,
  year,
  capital,
  incomeTaxFactor
}: CalculateIncomeTaxParams) => {
  const taxesIncomeBase = await calculateTaxesForTarif(
    cantonId,
    year,
    tarifGroup,
    'EINKOMMENSSTEUER',
    capital
  );
  const taxesIncome = multiplyDineroFactor(taxesIncomeBase, incomeTaxFactor, 7);
  return taxesIncome;
};

const calculatePensionCapitalTarifOrFlatTaxes = async ({
  tarifGroup,
  cantonId,
  year,
  capital
}: CalculateTarifAndFlattaxTaxParams) => {
  const taxes = await calculateTaxesForTarif(cantonId, year, tarifGroup, 'VORSORGESTEUER', capital);
  return taxes;
};
