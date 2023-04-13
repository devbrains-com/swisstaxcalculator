import { TaxInput } from './typesClient';

export const isMarried = (taxInput: TaxInput) =>
  taxInput.relationship === 'm' || taxInput.relationship === 'rp';
export const isMarriedOrHasChildren = (taxInput: TaxInput) =>
  taxInput.relationship === 'm' || taxInput.relationship === 'rp' || taxInput.children > 0;
export const isSingle = (taxInput: TaxInput) =>
  taxInput.relationship === 's' || taxInput.relationship === 'c';

export const validateTaxInput = (taxInput: TaxInput) => {
  const personsCount = taxInput.persons.length;
  if (personsCount < 1 || personsCount > 2) {
    throw new Error('Invalid number of persons');
  }

  if (personsCount === 1 && ['m', 'rp'].includes(taxInput.relationship)) {
    throw new Error('Invalid relationship for single person');
  }

  if (personsCount === 2 && ['s', 'c'].includes(taxInput.relationship)) {
    throw new Error('Invalid relationship for two persons');
  }
};
