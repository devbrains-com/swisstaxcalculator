import { describe, test, expect, vi, afterEach, Mock } from 'vitest';
import * as tarifs from '~/lib/taxes/tarif';
import { dineroChf, dineroToNumber } from '~/lib/utils/dinero';
import { calculateTaxesPensionCapitalByType } from '..';
import { getTaxInputForTest } from '../../test/helpers';
import { TaxRelationship } from '../../types';
import { getPensionCreditDefinition } from '../provider';

vi.mock('../../tarif/provider', () => {
  return {
    getTaxTarifTable: vi.fn()
  };
});

vi.mock('~/lib/taxes/tarif', async () => {
  const actual = await vi.importActual<Object>('~/lib/taxes/tarif');
  return {
    ...actual,
    calculateTaxesForTarif: vi.fn()
  };
});

describe('taxes pension capital', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('get definition for bund -> definition', () => {
    expect(getPensionCreditDefinition(0)).toMatchObject({ cantonId: 0 });
  });

  test('get definition for unknown -> throws', () => {
    expect(() => getPensionCreditDefinition(-1)).toThrowError();
  });

  test.each<{
    rel: TaxRelationship;
    children: number;
    canton: number;
    capital: number;
    expected: number;
  }>([{ rel: 's', children: 0, canton: 9, capital: 100, expected: 9 }])(
    'calculate taxes for flattax',
    async ({ rel: relationship, children, canton: cantonId, capital, expected }) => {
      const mock = tarifs.calculateTaxesForTarif as Mock<any, any>;
      mock.mockResolvedValue(dineroChf(expected));

      const taxInput = await getTaxInputForTest({
        cityId: 66,
        relationship,
        children,
        fortune: capital
      });
      expect(
        dineroToNumber(
          await calculateTaxesPensionCapitalByType(taxInput, { type: 'Flattax', cantonId })
        )
      ).toBe(expected);
    }
  );

  test.each<{
    rel: TaxRelationship;
    children: number;
    incomeTaxFactor: number;
    tax: number;
    canton: number;
    expected: number;
  }>([
    { rel: 's', children: 0, incomeTaxFactor: 0.5, tax: 100, canton: 9, expected: 50 },
    { rel: 's', children: 0, incomeTaxFactor: 0.1234567, tax: 100, canton: 9, expected: 12.34567 },
    { rel: 's', children: 0, incomeTaxFactor: 0.12345678, tax: 100, canton: 9, expected: 12.34568 },
    { rel: 's', children: 0, incomeTaxFactor: 0.12345675, tax: 100, canton: 9, expected: 12.34568 },
    { rel: 's', children: 0, incomeTaxFactor: 0.12345674, tax: 100, canton: 9, expected: 12.34567 }
  ])(
    'calculate taxes for income tax factor',
    async ({ rel: relationship, children, incomeTaxFactor, tax, canton: cantonId, expected }) => {
      const mock = tarifs.calculateTaxesForTarif as Mock<any, any>;
      mock.mockResolvedValue(dineroChf(tax));

      const taxInput = await getTaxInputForTest({ cityId: 66, relationship, children });
      expect(
        dineroToNumber(
          await calculateTaxesPensionCapitalByType(taxInput, {
            type: 'IncomeTaxFactor',
            cantonId,
            incomeTaxFactor
          })
        )
      ).toBe(expected);
    }
  );

  test.each<{
    rel: TaxRelationship;
    children: number;
    rentIncomeFactor: number;
    tax: number;
    capital: number;
    canton: number;
    expectedReduced: number;
    expected: number;
  }>([
    {
      rel: 's',
      children: 0,
      rentIncomeFactor: 0.05,
      capital: 100000,
      tax: 125,
      canton: 9,
      expectedReduced: 5000,
      expected: 2500
    },
    {
      rel: 's',
      children: 0,
      rentIncomeFactor: 0.0012345,
      capital: 100000,
      tax: 1,
      canton: 9,
      expectedReduced: 100,
      expected: 1000
    }
  ])(
    'calculate taxes for rent income factor',
    async ({
      rel: relationship,
      children,
      capital,
      tax,
      rentIncomeFactor,
      canton: cantonId,
      expectedReduced,
      expected
    }) => {
      const mock = tarifs.calculateTaxesForTarif as Mock<any, any>;
      mock.mockResolvedValue(dineroChf(tax));

      const taxInput = await getTaxInputForTest({
        cityId: 66,
        relationship,
        children,
        fortune: capital
      });

      expect(
        dineroToNumber(
          await calculateTaxesPensionCapitalByType(taxInput, {
            type: 'RentIncomeFactor',
            cantonId,
            rentIncomeFactor
          })
        )
      ).toBe(expected);

      expect(dineroToNumber(mock.mock.calls[0][4])).toMatchObject(expectedReduced);
    }
  );
});
