import { describe, test, expect } from 'vitest';
import { DineroChf, dineroChf, dineroToNumber, dineroRound } from '~/lib/utils/dinero';
import { calculatePensionCapitalIncomeTaxes } from '..';
import { TaxTarifGroupWithFallback } from '../../tarif/types';
import { getPensionCreditDefinition } from '../provider';

describe('pension capital', () => {
  test('get definition throws error if canton not found', () => {
    expect(() => getPensionCreditDefinition(-1)).toThrowError();
  });

  test('get definition returns a definition', () => {
    expect(getPensionCreditDefinition(0)).toBeTruthy();
  });

  test.each<{
    tarifGroup: TaxTarifGroupWithFallback;
    capital: DineroChf;
    cantonId: number;
    incomeTaxFactor: number;
    expected: number;
  }>([
    {
      tarifGroup: ['LEDIG_ALLEINE'],
      cantonId: 0,
      capital: dineroChf(100000),
      incomeTaxFactor: 0.2,
      expected: 575
    },
    {
      tarifGroup: ['LEDIG_ALLEINE'],
      cantonId: 0,
      capital: dineroChf(100100),
      incomeTaxFactor: 0.2,
      expected: 576
    },
    {
      tarifGroup: ['LEDIG_ALLEINE'],
      cantonId: 0,
      capital: dineroChf(2000000),
      incomeTaxFactor: 0.2,
      expected: 46000
    },
    {
      tarifGroup: ['LEDIG_ALLEINE'],
      cantonId: 0,
      capital: dineroChf(100000000),
      incomeTaxFactor: 0.2,
      expected: 2300000
    },
    {
      tarifGroup: ['LEDIG_KONKUBINAT'],
      cantonId: 0,
      capital: dineroChf(100000),
      incomeTaxFactor: 0.2,
      expected: 575
    },
    {
      tarifGroup: ['LEDIG_MIT_KINDER'],
      cantonId: 0,
      capital: dineroChf(100000),
      incomeTaxFactor: 0.2,
      expected: 394
    },
    {
      tarifGroup: ['VERHEIRATET'],
      cantonId: 0,
      capital: dineroChf(100000),
      incomeTaxFactor: 0.2,
      expected: 394
    }
  ])(
    'calculate income tax for $tarifGroup, $cantonId, $amount, $incomeTaxFactor -> $expected',
    async ({ tarifGroup, cantonId, capital, incomeTaxFactor, expected }) => {
      expect(
        dineroToNumber(
          dineroRound(
            await calculatePensionCapitalIncomeTaxes({
              tarifGroup,
              cantonId,
              year: 2022,
              capital,
              incomeTaxFactor
            })
          )
        )
      ).toBe(expected);
    }
  );
});
