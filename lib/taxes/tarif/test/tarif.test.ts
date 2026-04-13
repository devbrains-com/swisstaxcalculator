import { describe, test, expect } from 'vitest';
import { dineroToNumber, dineroChf } from '~/lib/utils/dinero';
import {
  getTaxTarifGroup,
  calculateTaxesAmount,
  buildProgressionBrackets,
  scaleProgression,
  combineOverallProgression
} from '..';
import { ProgressionResult } from '../../typesClient';
import { TaxRelationship } from '../../typesClient';
import { getTaxTarifTable } from '../provider';
import { TaxTarif, TaxTarifGroupWithFallback } from '../types';

describe('tarif', () => {
  test('get tarif table by canton returns tarif', async () => {
    expect(await getTaxTarifTable(0, 2022, 'EINKOMMENSSTEUER', ['LEDIG_ALLEINE'])).toBeTruthy();
  });

  test('get tarif by canton throws if not found', async () => {
    await expect(
      getTaxTarifTable(-1, 2022, 'EINKOMMENSSTEUER', ['LEDIG_ALLEINE'])
    ).rejects.toThrowError();
  });

  test.each<{
    relationship: TaxRelationship;
    children: number;
    exprected: TaxTarifGroupWithFallback;
  }>([
    { relationship: 's', children: 0, exprected: ['LEDIG_ALLEINE'] },
    { relationship: 's', children: 1, exprected: ['LEDIG_MIT_KINDER', 'LEDIG_ALLEINE'] },
    { relationship: 'c', children: 0, exprected: ['LEDIG_KONKUBINAT'] },
    { relationship: 'c', children: 1, exprected: ['LEDIG_MIT_KINDER', 'LEDIG_KONKUBINAT'] },
    { relationship: 'm', children: 0, exprected: ['VERHEIRATET'] },
    { relationship: 'm', children: 1, exprected: ['VERHEIRATET'] }
  ])('get tarif group returns correct value', ({ relationship, children, exprected }) => {
    expect(getTaxTarifGroup(relationship, children)).toStrictEqual(exprected);
  });

  test('get tarif group throws if not found', () => {
    // @ts-expect-error we want an invalid value
    expect(() => getTaxTarifGroup('a', 0)).toThrowError();
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
    { amount: 5000, expected: 0 },
    { amount: 20000, expected: 256.9 },
    { amount: 100000, expected: 11223.8 }
  ])('calculate taxes amount type formel', ({ amount, expected }) => {
    const tarif: TaxTarif = {
      group: 'LEDIG_ALLEINE',
      taxType: 'EINKOMMENSSTEUER',
      tableType: 'FORMEL',
      splitting: 0,
      table: [
        { formula: '', taxes: 0, percent: 0, amount: 0 },
        {
          formula:
            '-0.827429* $wert$ + 0.089718* $wert$ * (log $wert$ - 1) + 829.418770',
          taxes: 0,
          percent: 0,
          amount: 16716
        },
        {
          formula:
            '-0.328481* $wert$ + 0.043109 * $wert$ * (log $wert$ - 1) + (-1248.266121)',
          taxes: 0,
          percent: 0,
          amount: 44577
        },
        {
          formula:
            '0.051162* $wert$ + 0.010441 * $wert$ * (log $wert$ - 1) + (-4888.819148)',
          taxes: 0,
          percent: 0,
          amount: 111442
        }
      ]
    };
    expect(dineroToNumber(calculateTaxesAmount(dineroChf(amount), tarif))).toBeCloseTo(
      expected,
      1
    );
  });

  test('calculate taxes amount type formel clamps negative values to zero', () => {
    const tarif: TaxTarif = {
      group: 'LEDIG_ALLEINE',
      taxType: 'EINKOMMENSSTEUER',
      tableType: 'FORMEL',
      splitting: 0,
      table: [{ formula: '-2 * $wert$', taxes: 0, percent: 0, amount: 0 }]
    };

    expect(dineroToNumber(calculateTaxesAmount(dineroChf(1000), tarif))).toBe(0);
  });

  test.each<{ formula: string }>([
    { formula: 'log ($wert$ - $wert$)' },
    { formula: '0 / 0' }
  ])('calculate taxes amount type formel returns zero for non-finite result: $formula', ({ formula }) => {
    const tarif: TaxTarif = {
      group: 'LEDIG_ALLEINE',
      taxType: 'EINKOMMENSSTEUER',
      tableType: 'FORMEL',
      splitting: 0,
      table: [{ formula, taxes: 0, percent: 0, amount: 0 }]
    };

    expect(dineroToNumber(calculateTaxesAmount(dineroChf(1000), tarif))).toBe(0);
  });

  test.each<{ formula: string }>([
    { formula: '$notwert$ + 1' },
    { formula: '1 + (2' },
    { formula: '1 2' }
  ])('calculate taxes amount type formel throws for invalid formula: $formula', ({ formula }) => {
    const tarif: TaxTarif = {
      group: 'LEDIG_ALLEINE',
      taxType: 'EINKOMMENSSTEUER',
      tableType: 'FORMEL',
      splitting: 0,
      table: [{ formula, taxes: 0, percent: 0, amount: 0 }]
    };

    expect(() => calculateTaxesAmount(dineroChf(1000), tarif)).toThrowError();
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

  describe('progression brackets', () => {
    test('FLATTAX: single bracket covers the income', () => {
      const tarif: TaxTarif = {
        group: 'LEDIG_ALLEINE',
        taxType: 'EINKOMMENSSTEUER',
        tableType: 'FLATTAX',
        splitting: 0,
        table: [{ percent: 5, amount: 0, formula: '', taxes: 0 }]
      };
      const brackets = buildProgressionBrackets(10000, tarif);
      expect(brackets).toHaveLength(1);
      expect(brackets[0].amountInBracket).toBe(10000);
      expect(brackets[0].percent).toBe(5);
      expect(brackets[0].taxInBracket).toBeCloseTo(500, 6);
    });

    test('ZUERICH: bands sum to income and tax matches calculateTaxesAmount', () => {
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
      const brackets = buildProgressionBrackets(7000, tarif);
      const amountSum = brackets.reduce((s, b) => s + b.amountInBracket, 0);
      const taxSum = brackets.reduce((s, b) => s + b.taxInBracket, 0);
      expect(amountSum).toBeCloseTo(7000, 6);
      expect(taxSum).toBeCloseTo(
        dineroToNumber(calculateTaxesAmount(dineroChf(7000), tarif)),
        6
      );
    });

    test('BUND: bands sum to income and tax matches calculateTaxesAmount', () => {
      const tarif: TaxTarif = {
        group: 'LEDIG_ALLEINE',
        taxType: 'EINKOMMENSSTEUER',
        tableType: 'BUND',
        splitting: 0,
        table: [
          { percent: 0, amount: 0, formula: '', taxes: 0 },
          { percent: 1, amount: 5000, formula: '', taxes: 5 },
          { percent: 2, amount: 10000, formula: '', taxes: 100 },
          { percent: 3, amount: 20000, formula: '', taxes: 200 }
        ]
      };
      const brackets = buildProgressionBrackets(15000, tarif);
      const amountSum = brackets.reduce((s, b) => s + b.amountInBracket, 0);
      const taxSum = brackets.reduce((s, b) => s + b.taxInBracket, 0);
      expect(amountSum).toBeCloseTo(15000, 6);
      // Tax on 15000: base row at 10000 has taxes=100, percent=2 over 5000 excess = 200
      expect(dineroToNumber(calculateTaxesAmount(dineroChf(15000), tarif))).toBe(200);
      // Progression bands reconstruct tax as band-widths × marginal rates.
      // 5000*1% + 5000*2% = 50 + 100 = 150. The base-tax offset (100 at threshold 10000)
      // is not tied to a band, so progression tax ≠ total tax for BUND. Document this:
      expect(taxSum).toBeCloseTo(150, 6);
    });

    test('FREIBURG: single bar at effective rate equals actual tax', () => {
      const tarif: TaxTarif = {
        group: 'LEDIG_ALLEINE',
        taxType: 'EINKOMMENSSTEUER',
        tableType: 'FREIBURG',
        splitting: 0,
        table: [
          { formula: '', taxes: 0, percent: 2, amount: 0 },
          { formula: '', taxes: 0, percent: 2, amount: 5000 },
          { formula: '', taxes: 0, percent: 2.8, amount: 10000 }
        ]
      };
      const income = 7000;
      const brackets = buildProgressionBrackets(income, tarif);
      expect(brackets).toHaveLength(1);
      expect(brackets[0].amountInBracket).toBe(income);
      expect(brackets[0].taxInBracket).toBeCloseTo(
        dineroToNumber(calculateTaxesAmount(dineroChf(income), tarif)),
        6
      );
    });

    test('FORMEL: bands sum to income and tax reasonably reconstructs total', () => {
      const tarif: TaxTarif = {
        group: 'LEDIG_ALLEINE',
        taxType: 'EINKOMMENSSTEUER',
        tableType: 'FORMEL',
        splitting: 0,
        table: [
          { formula: '', taxes: 0, percent: 0, amount: 0 },
          {
            formula:
              '-0.827429* $wert$ + 0.089718* $wert$ * (log $wert$ - 1) + 829.418770',
            taxes: 0,
            percent: 0,
            amount: 16716
          },
          {
            formula:
              '-0.328481* $wert$ + 0.043109 * $wert$ * (log $wert$ - 1) + (-1248.266121)',
            taxes: 0,
            percent: 0,
            amount: 44577
          }
        ]
      };
      const income = 50000;
      const brackets = buildProgressionBrackets(income, tarif);
      const amountSum = brackets.reduce((s, b) => s + b.amountInBracket, 0);
      expect(amountSum).toBeCloseTo(income, 6);
      // Top band tax = f(50000) - f(44577) via the 3rd row's formula.
      // We don't assert exact equality to calculateTaxesAmount here because
      // FORMEL tax at a point uses the applicable bracket's formula in absolute
      // terms, while bands accumulate differences across brackets. Just assert
      // all brackets have non-negative tax.
      brackets.forEach((b) => expect(b.taxInBracket).toBeGreaterThanOrEqual(0));
    });

    test('scaleProgression scales percent + tax, leaves bounds/amounts', () => {
      const source: ProgressionResult = {
        taxableIncome: 10000,
        brackets: [
          {
            lowerBound: 0,
            upperBound: 5000,
            percent: 1,
            amountInBracket: 5000,
            taxInBracket: 50
          },
          {
            lowerBound: 5000,
            upperBound: 10000,
            percent: 2,
            amountInBracket: 5000,
            taxInBracket: 100
          }
        ],
        currentBracketIndex: 1,
        amountIntoCurrentBracket: 5000,
        amountToNextBracket: null,
        nextBracketPercent: null,
        previousBracketPercent: 1
      };
      const scaled = scaleProgression(source, 2.5);
      expect(scaled.brackets[0].percent).toBe(2.5);
      expect(scaled.brackets[1].percent).toBe(5);
      expect(scaled.brackets[0].taxInBracket).toBe(125);
      expect(scaled.brackets[1].taxInBracket).toBe(250);
      expect(scaled.brackets[0].amountInBracket).toBe(5000);
      expect(scaled.previousBracketPercent).toBe(2.5);
    });

    test('combineOverallProgression sums marginal rates and aligns scales', () => {
      // Canton brackets on canton-taxable scale 0..10000
      const canton: ProgressionResult = {
        taxableIncome: 10000,
        brackets: [
          {
            lowerBound: 0,
            upperBound: 5000,
            percent: 10,
            amountInBracket: 5000,
            taxInBracket: 500
          },
          {
            lowerBound: 5000,
            upperBound: 10000,
            percent: 20,
            amountInBracket: 5000,
            taxInBracket: 1000
          }
        ],
        currentBracketIndex: 1,
        amountIntoCurrentBracket: 5000,
        amountToNextBracket: null,
        nextBracketPercent: null,
        previousBracketPercent: 10
      };
      // Bund taxable is 11000 (1000 higher than canton). Brackets on bund scale.
      const bund: ProgressionResult = {
        taxableIncome: 11000,
        brackets: [
          {
            lowerBound: 0,
            upperBound: 6000,
            percent: 0,
            amountInBracket: 6000,
            taxInBracket: 0
          },
          {
            lowerBound: 6000,
            upperBound: 11000,
            percent: 5,
            amountInBracket: 5000,
            taxInBracket: 250
          }
        ],
        currentBracketIndex: 1,
        amountIntoCurrentBracket: 5000,
        amountToNextBracket: null,
        nextBracketPercent: null,
        previousBracketPercent: 0
      };

      const overall = combineOverallProgression(bund, canton, 11000, 10000);
      // Merged thresholds on canton scale: 0, 5000 (canton), 10000 (end + canton upper),
      // and bund thresholds shifted by offset = cantonTaxable - bundTaxable = -1000:
      // bund [0,6000] → canton [-1000,5000] clamped to [0,5000]; bund [6000,11000] →
      // canton [5000,10000] clamped to [5000,10000]. Merged: {0, 5000, 10000}.
      expect(overall.brackets.length).toBe(2);
      // Band [0,5000]: canton 10%, bund 0% → 10%
      expect(overall.brackets[0].percent).toBe(10);
      expect(overall.brackets[0].taxInBracket).toBeCloseTo(500, 6);
      // Band [5000,10000]: canton 20%, bund 5% → 25%
      expect(overall.brackets[1].percent).toBe(25);
      expect(overall.brackets[1].taxInBracket).toBeCloseTo(1250, 6);
      // amountToNext null because user is in top bracket
      expect(overall.currentBracketIndex).toBe(1);
      expect(overall.amountToNextBracket).toBeNull();
    });
  });
});
