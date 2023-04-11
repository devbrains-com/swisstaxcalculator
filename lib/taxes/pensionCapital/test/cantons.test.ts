import { describe, expect, test } from 'vitest';
import { calculatePensionCapitalTaxes } from '..';
import { getTaxInputForTest } from '../../test/helpers';
import { TaxRelationship, TaxConfession } from '../../types';

describe('pension capital', () => {
  test.each<{ relationship: TaxRelationship; taxesIncomeBund: number }>([
    { relationship: 's', taxesIncomeBund: 2712 },
    { relationship: 'm', taxesIncomeBund: 2512 },
    { relationship: 'rp', taxesIncomeBund: 2512 },
    { relationship: 'c', taxesIncomeBund: 2712 }
  ])('for Direkte Bundessteuer, $relationship', async ({ relationship, taxesIncomeBund }) => {
    const result = await calculatePensionCapitalTaxes(
      await getTaxInputForTest({ cityId: 66, relationship, fortune: 200000 })
    );

    expect(result).toMatchObject({
      taxesIncomeBund
    });
  });

  test.each<{
    cityId: number;
    cityName: string;
    relationship: TaxRelationship;
    confession: TaxConfession;
    confession2?: TaxConfession;
    fortune: number;
    taxesIncomeCanton: number;
    taxesIncomeCity: number;
    taxesIncomeChurch: number;
  }>([
    {
      cityId: 66,
      cityName: 'Opfikon (ZH)',
      relationship: 's',
      confession: 'protestant',
      fortune: 200000,
      taxesIncomeCanton: 3960,
      taxesIncomeCity: 3760,
      taxesIncomeChurch: 320
    },
    {
      cityId: 66,
      cityName: 'Opfikon (ZH)',
      relationship: 'm',
      confession: 'protestant',
      fortune: 200000,
      taxesIncomeCanton: 3960,
      taxesIncomeCity: 3760,
      taxesIncomeChurch: 320
    },
    {
      cityId: 66,
      cityName: 'Opfikon (ZH)',
      relationship: 'rp',
      confession: 'other',
      confession2: 'protestant',
      fortune: 200000,
      taxesIncomeCanton: 3960,
      taxesIncomeCity: 3760,
      taxesIncomeChurch: 160
    },
    {
      cityId: 261,
      cityName: 'Zürich (ZH)',
      relationship: 's',
      confession: 'protestant',
      fortune: 500000,
      taxesIncomeCanton: 11959,
      taxesIncomeCity: 14375,
      taxesIncomeChurch: 1208
    },
    {
      cityId: 1061,
      cityName: 'Luzern (LU)',
      relationship: 's',
      confession: 'protestant',
      fortune: 50000,
      taxesIncomeCanton: 909,
      taxesIncomeCity: 994,
      taxesIncomeChurch: 142
    },
    {
      cityId: 1061,
      cityName: 'Luzern (LU)',
      relationship: 's',
      confession: 'protestant',
      fortune: 10000,
      taxesIncomeCanton: 80,
      taxesIncomeCity: 88,
      taxesIncomeChurch: 12
    },
    {
      cityId: 351,
      cityName: 'Bern (BE)',
      relationship: 's',
      confession: 'protestant',
      fortune: 200000,
      taxesIncomeCanton: 6424,
      taxesIncomeCity: 3270,
      taxesIncomeChurch: 391
    },
    {
      cityId: 1201,
      cityName: 'Altdorf (UR)',
      relationship: 's',
      confession: 'protestant',
      fortune: 200000,
      taxesIncomeCanton: 3800,
      taxesIncomeCity: 3610,
      taxesIncomeChurch: 1150
    },
    {
      cityId: 1201,
      cityName: 'Altdorf (UR)',
      relationship: 'm',
      confession: 'other',
      confession2: 'protestant',
      fortune: 200000,
      taxesIncomeCanton: 3800,
      taxesIncomeCity: 3610,
      taxesIncomeChurch: 575
    },
    {
      cityId: 3901,
      cityName: 'Chur (GR)',
      relationship: 's',
      confession: 'protestant',
      fortune: 200000,
      taxesIncomeCanton: 3000,
      taxesIncomeCity: 2640,
      taxesIncomeChurch: 435
    },
    {
      cityId: 3901,
      cityName: 'Chur (GR)',
      relationship: 's',
      confession: 'protestant',
      fortune: 1000000,
      taxesIncomeCanton: 20000,
      taxesIncomeCity: 17600,
      taxesIncomeChurch: 2900
    },
    {
      cityId: 3901,
      cityName: 'Chur (GR)',
      relationship: 's',
      confession: 'protestant',
      fortune: 350000,
      taxesIncomeCanton: 6030,
      taxesIncomeCity: 5306,
      taxesIncomeChurch: 874
    }
  ])(
    'for $cityName, $relationship, $confession, $fortune -> $taxesIncomeCanton, $taxesIncomeCity, $taxesIncomeChurch',
    async ({
      cityId,
      relationship,
      confession,
      confession2,
      fortune,
      taxesIncomeCanton,
      taxesIncomeCity,
      taxesIncomeChurch
    }) => {
      const result = await calculatePensionCapitalTaxes(
        await getTaxInputForTest({
          cityId,
          relationship,
          confession,
          confession2: confession2 ?? confession,
          fortune
        })
      );

      expect({
        taxesIncomeCanton: result.taxesIncomeCanton,
        taxesIncomeCity: result.taxesIncomeCity,
        taxesIncomeChurch: result.taxesIncomeChurch
      }).toMatchObject({
        taxesIncomeCanton,
        taxesIncomeChurch,
        taxesIncomeCity
      });
    }
  );
});
