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
import {
  PensionCreditTaxDefinition,
  CalculateRentIncomeTaxesBaseParams,
  CalculateIncomeTaxParams,
  CalculateTarifAndFlattaxTaxParams
} from './types';
import { calculateTaxesCantonAndCity } from '../factor';
import { calculateTaxesForTarif, getTaxTarifGroup } from '../tarif';
import { TaxInput, TaxResult } from '../types';

export const getPensionCreditDefinition = (cantonId: number) => {
  const definition = pensionCreditTaxDefinitions[cantonId];
  if (!definition) throw new Error(`No pension credit definition found for canton ${cantonId}`);

  return definition;
};

const pensionCreditTaxDefinitions: Record<number, PensionCreditTaxDefinition> = {
  0: { type: 'IncomeTaxFactor', cantonId: 0, incomeTaxFactor: 0.2 }, // Bund
  26: { type: 'RentIncomeFactor', cantonId: 26, rentIncomeFactor: 0.05, minTaxFactor: 0.02 }, // Zürich
  4: { type: 'Tarif', cantonId: 4, amountFree: 5200 }, // Bern
  12: { type: 'IncomeTaxFactor', cantonId: 12, incomeTaxFactor: 1 / 3, minTaxFactor: 0.005 }, // Luzern
  22: { type: 'Flattax', cantonId: 22, taxFactorChurch: 0.005 }, // Uri
  19: { type: 'RentIncomeFactor', cantonId: 19, rentIncomeFactor: 0.04, maxTaxFactor: 0.025 }, // Schwyz
  15: { type: 'IncomeTaxFactor', cantonId: 15, incomeTaxFactor: 0.4 }, // Obwalden
  14: { type: 'IncomeTaxFactor', cantonId: 14, incomeTaxFactor: 0.4, minTaxFactor: 0.008 }, // Nidwalden
  9: { type: 'Flattax', cantonId: 9 }, // Glarus
  25: { type: 'IncomeTaxFactor', cantonId: 25, minTaxFactor: 0.01 }, // Zug - Eigner Tarif auch noch beachten
  7: { type: 'Tarif', cantonId: 7, deductionMarried: 5000, amountFree: 5000 }, // Freiburg
  18: { type: 'IncomeTaxFactor', cantonId: 18, incomeTaxFactor: 0.25 }, // Solothurn
  6: { type: 'Tarif', cantonId: 6 }, // Basel-Stadt
  5: { type: 'Tarif', cantonId: 5, maxTaxFactor: 0.045 }, // Basel-Landschaft
  17: { type: 'IncomeTaxFactor', cantonId: 17, incomeTaxFactor: 0.2 }, // Schaffhausen
  3: { type: 'Tarif', cantonId: 3 }, // Appenzell Ausserrhoden
  2: { type: 'IncomeTaxFactor', cantonId: 2, incomeTaxFactor: 0.25, minTaxFactor: 0.005 }, // Appenzell Innerrhoden
  16: { type: 'Flattax', cantonId: 16 }, // St. Gallen
  10: {
    type: 'RentIncomeFactorOwn',
    cantonId: 10,
    rentIncomeFactor: 1 / 15,
    minTaxFactor: 0.015,
    maxTaxFactor: 0.02
  }, // Graubünden
  1: { type: 'IncomeTaxFactor', cantonId: 1, incomeTaxFactor: 0.3, minTaxFactor: 0.01 }, // Aargau
  20: { type: 'Flattax', cantonId: 20 }, // Thurgau
  21: { type: 'RentIncomeFactor', cantonId: 21, rentIncomeFactor: 0.068, minTaxFactor: 0.02 }, // Tessin
  23: { type: 'IncomeTaxFactor', cantonId: 23, incomeTaxFactor: 0.33 }, // Waadt
  24: { type: 'RentIncomeFactor', cantonId: 24, rentIncomeFactor: 0.068, minTaxFactor: 0.02 }, // Wallis
  13: { type: 'IncomeTaxFactor', cantonId: 13, incomeTaxFactor: 0.25, minTaxFactor: 0.025 }, // Neuenburg
  8: { type: 'IncomeTaxFactor', cantonId: 8, incomeTaxFactor: 0.2 }, // Genf
  11: { type: 'Tarif', cantonId: 11 } // Jura
};

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
