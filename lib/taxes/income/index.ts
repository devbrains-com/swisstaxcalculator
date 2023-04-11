import { subtract, add } from 'dinero.js';
import {
  dineroAddMany,
  dineroToNumber,
  dineroRoundMin0,
  dineroChf,
  DineroChf,
  dineroRound
} from '~/lib/utils/dinero';
import {
  calculateGrossNetDetails,
  taxDeductionDefinitions,
  calculateDeductionByDefinition
} from '../deduction';
import { getTaxDecutionTable } from '../deduction/provider';
import { calculateTaxesCantonAndCity } from '../factor';
import { validateTaxInput } from '../helpers';
import { calculateTaxesPersonnel } from '../personnel';
import { getTaxTarifGroup, calculateTaxesForTarif } from '../tarif';
import {
  TaxInput,
  TaxResult,
  TaxDeductionResultItem,
  TaxDeductionResultItemDisplay
} from '../types';

export const calculateTaxesIncomeAndFortune = async (taxInput: TaxInput): Promise<TaxResult> => {
  validateTaxInput(taxInput);

  const {
    taxableIncomeBund,
    taxableIncomeCanton,
    taxableFortuneCanton,
    grossNetDetails,
    deductionsFortune,
    deductionsIncome
  } = await calculateTaxableAmount(taxInput);

  const { taxesIncomeBund } = await calculateTaxesBund(taxInput, taxableIncomeBund, true);

  const { taxesIncomeBase, taxesFortuneBase } = await calculateTaxesBase(
    taxInput,
    taxableIncomeCanton,
    taxableFortuneCanton
  );

  const {
    taxesIncomeCanton,
    taxesIncomeCity,
    taxesIncomeChurch,
    taxesFortuneCanton,
    taxesFortuneCity,
    taxesFortuneChurch
  } = await calculateTaxesCantonAndCity(
    taxInput,
    taxesIncomeBase,
    taxesIncomeBase,
    taxesFortuneBase
  );

  const taxesPersonnel = calculateTaxesPersonnel(taxInput);

  const taxesTotal = dineroAddMany(
    taxesIncomeCanton,
    taxesIncomeCity,
    taxesIncomeChurch,
    taxesFortuneCanton,
    taxesFortuneCity,
    taxesFortuneChurch,
    taxesIncomeBund,
    taxesPersonnel
  );

  const result: TaxResult = {
    input: taxInput,
    taxesIncomeCanton: dineroToNumber(taxesIncomeCanton),
    taxesIncomeCity: dineroToNumber(taxesIncomeCity),
    taxesIncomeChurch: dineroToNumber(taxesIncomeChurch),
    taxesFortuneCanton: dineroToNumber(taxesFortuneCanton),
    taxesFortuneCity: dineroToNumber(taxesFortuneCity),
    taxesFortuneChurch: dineroToNumber(taxesFortuneChurch),
    taxesIncomeBund: dineroToNumber(taxesIncomeBund),
    taxesPersonnel: dineroToNumber(taxesPersonnel),
    taxesTotal: dineroToNumber(taxesTotal),
    details: {
      netIncomeCanton: grossNetDetails.reduce((acc, item) => acc + item.netIncome, 0),
      netIncomeBund: grossNetDetails.reduce((acc, item) => acc + item.netIncome, 0),
      grossNetDetails,
      deductionsIncome,
      deductionsFortune,
      taxableFortuneCanton: dineroToNumber(taxableFortuneCanton),
      taxableIncomeCanton: dineroToNumber(taxableIncomeCanton),
      taxableIncomeBund: dineroToNumber(taxableIncomeBund)
    }
  };

  return result;
};

const calculateTaxableAmount = async (taxInput: TaxInput) => {
  const deductionsIncomeCanton = await getTaxDecutionTable(
    taxInput.cantonId,
    taxInput.year,
    'EINKOMMENSSTEUER'
  );
  const deductionsFortuneCanton = await getTaxDecutionTable(
    taxInput.cantonId,
    taxInput.year,
    'VERMOEGENSSTEUER'
  );
  const deductionsIncomeBund = await getTaxDecutionTable(0, taxInput.year, 'EINKOMMENSSTEUER');

  const grossNetDetails = calculateGrossNetDetails(taxInput);

  const deductionsIncome: TaxDeductionResultItem[] = [];
  const deductionsFortune: TaxDeductionResultItem[] = [];

  if (!taxInput.persons.find((p) => p.incomeType === 'TAXABLE')) {
    taxDeductionDefinitions.forEach((definition) => {
      const deductionResultIncome = calculateDeductionByDefinition(
        definition,
        taxInput,
        grossNetDetails,
        deductionsIncomeCanton,
        deductionsIncomeBund
      );
      deductionsIncome.push(...deductionResultIncome);

      const deductionResultFortune = calculateDeductionByDefinition(
        definition,
        taxInput,
        grossNetDetails,
        deductionsFortuneCanton
      );

      deductionsFortune.push(...deductionResultFortune);
    });
  }

  const taxableFortuneCanton = dineroRoundMin0(
    subtract(
      dineroChf(taxInput.fortune),
      deductionsFortune.reduce((acc, item) => add(acc, item.amountCanton), dineroChf(0))
    )
  );

  const taxableIncomeCanton = dineroRoundMin0(
    subtract(
      grossNetDetails.reduce(
        (acc, item) => dineroAddMany(acc, dineroChf(item.netIncome)),
        dineroChf(0)
      ),
      deductionsIncome.reduce((acc, item) => dineroAddMany(acc, item.amountCanton), dineroChf(0))
    )
  );

  const taxableIncomeBund = dineroRoundMin0(
    subtract(
      grossNetDetails.reduce(
        (acc, item) => dineroAddMany(acc, dineroChf(item.netIncome)),
        dineroChf(0)
      ),
      deductionsIncome.reduce((acc, item) => dineroAddMany(acc, item.amountBund), dineroChf(0))
    )
  );
  return {
    grossNetDetails,
    deductionsIncome: deductionsIncome.map(
      (item): TaxDeductionResultItemDisplay => ({
        id: item.id,
        amountCanton: dineroToNumber(item.amountCanton),
        amountBund: dineroToNumber(item.amountBund),
        name: item.name,
        target: item.target
      })
    ),
    deductionsFortune: deductionsFortune.map(
      (item): TaxDeductionResultItemDisplay => ({
        id: item.id,
        amountCanton: dineroToNumber(item.amountCanton),
        amountBund: dineroToNumber(item.amountBund),
        name: item.name,
        target: item.target
      })
    ),
    taxableFortuneCanton,
    taxableIncomeCanton,
    taxableIncomeBund
  };
};

const calculateTaxesBase = async (
  taxInput: TaxInput,
  taxableIncomeCanton: DineroChf,
  taxableFortuneCanton: DineroChf
) => {
  const tarifGroup = getTaxTarifGroup(taxInput.relationship, taxInput.children);
  const taxesIncomeBase = await calculateTaxesForTarif(
    taxInput.cantonId,
    taxInput.year,
    tarifGroup,
    'EINKOMMENSSTEUER',
    taxableIncomeCanton
  );
  const taxesFortuneBase = await calculateTaxesForTarif(
    taxInput.cantonId,
    taxInput.year,
    tarifGroup,
    'VERMOEGENSSTEUER',
    taxableFortuneCanton
  );

  return { taxesIncomeBase, taxesFortuneBase };
};

const calculateTaxesBund = async (
  taxInput: TaxInput,
  taxableIncomeBund: DineroChf,
  includeChildrenDeduction: boolean
) => {
  const tarifGroup = getTaxTarifGroup(taxInput.relationship, taxInput.children);
  let taxesIncomeBund = dineroRound(
    await calculateTaxesForTarif(
      0,
      taxInput.year,
      tarifGroup,
      'EINKOMMENSSTEUER',
      taxableIncomeBund
    )
  );

  if (includeChildrenDeduction) {
    // Deduct 251 CHF per Child
    taxesIncomeBund = subtract(taxesIncomeBund, dineroChf(251 * taxInput.children));
  }

  return { taxesIncomeBund };
};
