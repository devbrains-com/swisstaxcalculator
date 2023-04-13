import { calculateTaxesIncomeAndFortune } from './income';
import { calculatePensionCapitalTaxes } from './pensionCapital';
import { TaxInput, TaxResult } from './typesClient';

export const calculateTaxes = async (taxInput: TaxInput): Promise<TaxResult> => {
  switch (taxInput.taxType) {
    case 'ev':
      return await calculateTaxesIncomeAndFortune(taxInput);
    case 'pc':
      return await calculatePensionCapitalTaxes(taxInput);
  }

  throw new Error('Tax type not supported');
};
