import { multiply, greaterThan } from 'dinero.js';
import { sortArray } from '~/lib/utils/array';
import {
  dineroChf,
  dineroRound,
  dineroToScaled,
  dineroToNumber,
  dineroSubtractMany,
  dineroMin,
  dineroScaled,
  dineroMax
} from '~/lib/utils/dinero';
import { maxSalaryNbuAlv } from './constants';
import { TaxDeductionDefinition, TaxDeductionTableExtended, TaxDeductionTableItem } from './types';
import { TaxInput, TaxGrossNetDetail, TaxDeductionResultItem } from '../types';

export const taxDeductionDefinitions: TaxDeductionDefinition[] = [
  {
    id: 'HauptErw_EK',
    rule: () => true,
    input: (_, grossDeductions) =>
      grossDeductions.map((grossDeduction, index) => ({
        target: `P${index + 1}`,
        amount: grossDeduction.netIncome
      }))
  },
  {
    id: 'S3a_EK',
    rule: () => true,
    input: (taxInput, _) =>
      taxInput.persons.map((person, index) => ({
        target: `P${index + 1}`,
        amount: person.pillar3aDeduction
      }))
  },
  {
    id: 'KKSparLedigMitBVGS3a_EK',
    rule: (taxInput) => taxInput.relationship === 's',
    input: (taxInput) => [{ amount: taxInput.persons.length * 4560 }]
  },
  {
    id: 'KKSparzVerhMitBVGS3a_EK',
    rule: (taxInput) => ['m', 'rp'].includes(taxInput.relationship),
    input: (taxInput) => [{ amount: taxInput.persons.length * 4560 }]
  },
  {
    id: 'SozVerheiratet_EK',
    rule: (taxInput) => ['m', 'rp'].includes(taxInput.relationship),
    input: () => [{}]
  },
  {
    id: 'ZweitVerdiener_EK',
    rule: (taxInput) => ['m', 'rp'].includes(taxInput.relationship),
    input: (taxInput) =>
      sortArray(taxInput.persons, (p) => p.income)
        .filter((_, index) => index === 0)
        .map((p) => ({ amount: p.income }))
  },
  {
    id: 'SozLedig_EK',
    rule: (taxInput) => taxInput.relationship === 's',
    input: (_, grossDeductions) => [{ amount: grossDeductions[0].netIncome }]
  },
  {
    id: 'SozAlleinerzieher_EK',
    rule: (taxInput) => taxInput.relationship === 's' && taxInput.children > 0,
    input: (_, grossDeductions) => [{ amount: grossDeductions[0].netIncome }]
  },
  {
    id: 'SozKindAlleinerzieher_EK',
    rule: (taxInput) => taxInput.relationship === 's' && taxInput.children > 0,
    input: (_, grossDeductions) => [{ amount: grossDeductions[0].netIncome }]
  },
  {
    id: 'KKSparProKind_EK',
    rule: (taxInput) => taxInput.children > 0,
    input: (taxInput) =>
      Array.from(Array(taxInput.children).keys()).map((_, index) => ({
        target: `K${index + 1}`,
        amount: 1400
      }))
  },
  {
    id: 'SozKind_EK',
    rule: (taxInput) => taxInput.children > 0,
    input: (taxInput) => [{ multiplier: taxInput.children }]
  },
  {
    id: 'EigenBetr_EK',
    rule: (taxInput) => taxInput.children > 0,
    input: () => [{}]
  },
  {
    id: 'SozKind_VM',
    rule: (taxInput) => taxInput.children > 0,
    input: (taxInput) => [{ multiplier: taxInput.children }]
  },
  {
    id: 'SozLedigMitOhneKinder_VM',
    rule: (taxInput) => ['s', 'c'].includes(taxInput.relationship),
    input: () => [{}]
  },
  {
    id: 'SozVerheiratet_VM',
    rule: (taxInput) => ['m', 'rp'].includes(taxInput.relationship),
    input: () => [{}]
  },
  {
    id: 'SozLedigOhneKinder_VM',
    rule: (taxInput) => ['s', 'c'].includes(taxInput.relationship) && taxInput.children === 0,
    input: () => [{}]
  },
  {
    id: 'SozAlleinerzieher_VM',
    rule: (taxInput) => ['s', 'c'].includes(taxInput.relationship) && taxInput.children > 0,
    input: () => [{}]
  }
];

export const calculateGrossNetDetails = (taxInput: TaxInput): TaxGrossNetDetail[] => {
  return taxInput.persons.map((person) => {
    if (person.incomeType !== 'GROSS') {
      return {
        netIncome: person.income,
        grossIncome: person.income,
        person,
        ahvIvEo: 0,
        alv: 0,
        nbu: 0,
        pk: 0
      };
    }

    const grossIncome = dineroChf(person.income);
    const ahvIvEoDeduction = dineroRound(multiply(grossIncome, { amount: 53, scale: 3 }));
    const alvDeduction = dineroRound(
      multiply(dineroChf(Math.min(person.income, maxSalaryNbuAlv)), {
        amount: 11,
        scale: 3
      })
    );
    const nbuDeduction = dineroRound(
      multiply(dineroChf(Math.min(person.income, maxSalaryNbuAlv)), dineroToScaled(0.004, 3))
    );
    const pkDeduction = dineroChf(person.pkDeduction ?? 0);

    const deducion: TaxGrossNetDetail = {
      person,
      grossIncome: person.income,
      ahvIvEo: dineroToNumber(ahvIvEoDeduction),
      alv: dineroToNumber(alvDeduction),
      nbu: dineroToNumber(nbuDeduction),
      pk: dineroToNumber(pkDeduction),
      netIncome: dineroToNumber(
        dineroSubtractMany(grossIncome, ahvIvEoDeduction, alvDeduction, nbuDeduction, pkDeduction)
      )
    };

    return deducion;
  });
};

export const calculateDeductionByDefinition = (
  deductionDefinition: TaxDeductionDefinition,
  taxInput: TaxInput,
  grossDeductions: TaxGrossNetDetail[],
  deductionTableCanton?: TaxDeductionTableExtended,
  deductionTableBund?: TaxDeductionTableExtended
): TaxDeductionResultItem[] => {
  if (!deductionDefinition.rule(taxInput)) return [];

  const deductionCanton = deductionTableCanton?.itemsById.get(deductionDefinition.id);
  const deductionBund = deductionTableBund?.itemsById.get(deductionDefinition.id);

  const deductions: TaxDeductionResultItem[] = [];

  if (deductionCanton || deductionBund) {
    deductionDefinition.input(taxInput, grossDeductions).forEach((deductionInput) => {
      const amountCanton = deductionCanton
        ? calculateDeductionByFormat(deductionCanton, deductionInput.amount)
        : dineroChf(0);
      const amountBund = deductionBund
        ? calculateDeductionByFormat(deductionBund, deductionInput.amount)
        : dineroChf(0);

      const deduction: TaxDeductionResultItem = {
        id: deductionDefinition.id,
        name: deductionCanton?.name.de ?? deductionBund?.name.de ?? 'Unbekannter Abzug',
        target: deductionInput.target ?? '',
        amountCanton: multiply(amountCanton, deductionInput.multiplier ?? 1),
        amountBund: multiply(amountBund, deductionInput.multiplier ?? 1)
      };

      if (
        greaterThan(deduction.amountCanton, dineroChf(0)) ||
        greaterThan(deduction.amountBund, dineroChf(0))
      ) {
        // console.log(deduction);
        deductions.push(deduction);
      }
    });
  }

  return deductions;
};

export const calculateDeductionByFormat = (deduction: TaxDeductionTableItem, amount = 0) => {
  // console.log(deduction);
  switch (deduction.format) {
    case 'MAXIMUM':
      return dineroMin(dineroChf(amount), dineroChf(deduction.maximum));
    case 'PERCENT':
      return dineroRound(multiply(dineroChf(amount), dineroScaled(deduction.percent, 2)));
    case 'PERCENT,MINIMUM,MAXIMUM':
      return dineroMin(
        dineroMax(
          dineroRound(multiply(dineroChf(amount), dineroScaled(deduction.percent, 2))),
          dineroChf(deduction.minimum)
        ),
        dineroChf(deduction.maximum)
      );
    case 'STANDARDIZED':
      return dineroChf(deduction.amount);
    default:
      return dineroChf(0);
  }
};
