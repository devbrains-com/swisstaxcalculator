import { describe, test, expect } from 'vitest';
import { dineroToNumber, dineroChf } from '~/lib/utils/dinero';
import { getTaxTarifGroup, calculateTaxesAmount } from '..';
import { TaxRelationship } from '../../typesClient';
import { getTaxTarifTable } from '../provider';
import { TaxTarif, TaxTarifGroup } from '../types';

describe('tarif', () => {
  test('get tarif table by canton returns tarif', async () => {
    expect(await getTaxTarifTable(0, 2022, 'EINKOMMENSSTEUER', 'LEDIG_ALLEINE')).toBeTruthy();
  });

  test('get tarif by canton throws if not found', () => {
    expect(getTaxTarifTable(-1, 2022, 'EINKOMMENSSTEUER', 'LEDIG_ALLEINE')).rejects.toThrowError();
  });

  test.each<{ relationship: TaxRelationship; children: number; exprected: TaxTarifGroup }>([
    { relationship: 's', children: 0, exprected: 'LEDIG_ALLEINE' },
    { relationship: 's', children: 1, exprected: 'LEDIG_MIT_KINDER' },
    { relationship: 'c', children: 0, exprected: 'LEDIG_KONKUBINAT' },
    { relationship: 'c', children: 1, exprected: 'LEDIG_MIT_KINDER' },
    { relationship: 'm', children: 0, exprected: 'VERHEIRATET' },
    { relationship: 'm', children: 1, exprected: 'VERHEIRATET' }
  ])('get tarif group throws if not found', ({ relationship, children, exprected }) => {
    expect(getTaxTarifGroup(relationship, children)).toBe(exprected);
  });

  test.each<{ amount: number; percent: number; expected: number }>([
    { amount: 100, percent: 5, expected: 5 },
    { amount: 1000, percent: 0.1, expected: 1 },
    { amount: 100, percent: 0.12345, expected: 0.12345 },
    { amount: 10000000, percent: 0.12345, expected: 12345 },
    { amount: 10000000, percent: 0.123456, expected: 12346 },
    { amount: 10000000, percent: 0.123455, expected: 12346 },
    { amount: 10000000, percent: 0.123454, expected: 12345 },
    { amount: 100, percent: 100, expected: 100 },
    { amount: 100, percent: 200, expected: 200 },
    { amount: 0.1, percent: 1, expected: 0.001 },
    { amount: 0.1, percent: 0.00001, expected: 0.00000001 },
    { amount: 1000000000, percent: 10, expected: 100000000 }
  ])('calculate taxes amount type flattax', ({ amount, percent, expected }) => {
    const tarif: TaxTarif = {
      group: 'LEDIG_ALLEINE',
      taxType: 'EINKOMMENSSTEUER',
      tableType: 'FLATTAX',
      splitting: 0,
      table: [{ percent, amount: 0, formula: '', taxes: 0 }]
    };
    expect(dineroToNumber(calculateTaxesAmount(dineroChf(amount), tarif))).toBe(expected);
  });

  test.each<{ amount: number; expected: number }>([
    { amount: 0, expected: 0 },
    { amount: 4999, expected: 49.99 },
    { amount: 5000, expected: 50 },
    { amount: 5001, expected: 50.02 },
    { amount: 9999, expected: 149.98 },
    { amount: 10000, expected: 150 },
    { amount: 11000, expected: 150 } // Amount over last tarif item
  ])('calculate taxes amount type zürich', ({ amount, expected }) => {
    const tarif: TaxTarif = {
      group: 'LEDIG_ALLEINE',
      taxType: 'EINKOMMENSSTEUER',
      tableType: 'ZUERICH',
      splitting: 0,
      table: [
        { percent: 0, amount: 0, formula: '', taxes: 0 },
        { percent: 1, amount: 5000, formula: '', taxes: 0 },
        { percent: 2, amount: 5000, formula: '', taxes: 0 }
      ]
    };
    expect(dineroToNumber(calculateTaxesAmount(dineroChf(amount), tarif))).toBe(expected);
  });

  test.each<{ amount: number; expected: number }>([
    { amount: 0, expected: 0 },
    { amount: 4999, expected: 0 },
    { amount: 5000, expected: 5 },
    { amount: 5001, expected: 5.01 },
    { amount: 9999, expected: 54.99 },
    { amount: 10000, expected: 100 },
    { amount: 11000, expected: 120 },
    { amount: 20000, expected: 300 },
    { amount: 20000.1234, expected: 200 } // Amount in table and input is rounded to max 2 decimals
  ])('calculate taxes amount type bund', ({ amount, expected }) => {
    const tarif: TaxTarif = {
      group: 'LEDIG_ALLEINE',
      taxType: 'EINKOMMENSSTEUER',
      tableType: 'BUND',
      splitting: 0,
      table: [
        { percent: 0, amount: 0, formula: '', taxes: 0 },
        { percent: 1, amount: 5000, formula: '', taxes: 5 },
        { percent: 2, amount: 10000, formula: '', taxes: 100 },
        { percent: 3, amount: 20000.123, formula: '', taxes: 200 }
      ]
    };
    expect(dineroToNumber(calculateTaxesAmount(dineroChf(amount), tarif))).toBe(expected);
  });

  test.each<{ amount: number; expected: number }>([
    { amount: 0, expected: 0 },
    { amount: 4999, expected: 0 },
    { amount: 5000, expected: 0 },
    { amount: 5001, expected: 100.0280016 },
    { amount: 5999, expected: 129.5688016 },
    { amount: 6000, expected: 129.6 },
    { amount: 6999, expected: 162.3656016 },
    { amount: 7000, expected: 162.4 }
  ])('calculate taxes amount type freiburg', ({ amount, expected }) => {
    const tarif: TaxTarif = {
      group: 'LEDIG_ALLEINE',
      taxType: 'EINKOMMENSSTEUER',
      tableType: 'FREIBURG',
      splitting: 0,
      table: [
        {
          formula: '',
          taxes: 0,
          percent: 2,
          amount: 0
        },
        {
          formula: '',
          taxes: 0,
          percent: 2,
          amount: 5000
        },
        {
          formula: '',
          taxes: 0,
          percent: 2.8,
          amount: 10000
        }
      ]
    };
    expect(dineroToNumber(calculateTaxesAmount(dineroChf(amount), tarif))).toBe(expected);
  });
});
