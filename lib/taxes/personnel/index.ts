import { multiply } from 'dinero.js';
import { dineroChf, dineroRound } from '~/lib/utils/dinero';
import { getPersonnelTax } from './provider';
import { TaxInput } from '../types';

export const calculateTaxesPersonnel = (taxInput: TaxInput) => {
  const taxes = getPersonnelTax(taxInput.cantonId);
  const amount = dineroChf(taxes.amount);
  return dineroRound(multiply(amount, taxes.marriedBoth ? taxInput.persons.length : 1));
};
