import { describe, expect, test } from 'vitest';
import { calculateTaxesIncomeAndFortune } from '..';
import { getTaxInputForTest } from '../../test/helpers';
import { TaxConfession, TaxRelationship } from '../../types';

describe('taxes', () => {
  test.each<{ relationship: TaxRelationship; income: number; expected: number }>([
    { relationship: 's', income: 14500, expected: 0 },
    { relationship: 's', income: 14600, expected: 1 },
    { relationship: 's', income: 17800, expected: 25 },
    { relationship: 's', income: 17899, expected: 25 },
    { relationship: 's', income: 17900, expected: 26 },
    { relationship: 's', income: 23000, expected: 65 },
    { relationship: 's', income: 31700, expected: 133 },
    { relationship: 's', income: 145100, expected: 6995 },
    { relationship: 's', income: 1000000, expected: 115000 },
    { relationship: 'm', income: 28300, expected: 0 },
    { relationship: 'm', income: 30800, expected: 25 },
    { relationship: 'm', income: 2000000, expected: 230000 }
  ])(
    'for Direkte Bundessteuer, $relationship, $income -> $expected',
    async ({ relationship, income, expected }) => {
      const result = await calculateTaxesIncomeAndFortune(
        await getTaxInputForTest({ cityId: 66, relationship, income, incomeType: 'TAXABLE' })
      );

      expect(result.taxesIncomeBund).toEqual(expected);
    }
  );

  test.each<{
    cityId: number;
    cityName: string;
    relationship: TaxRelationship;
    confession: TaxConfession;
    confession2?: TaxConfession;
    children: number;
    fortune: number;
    income: number;
    taxesIncomeCanton: number;
    taxesIncomeCity: number;
    taxesIncomeChurch: number;
    taxesFortuneCanton: number;
    taxesFortuneCity: number;
    taxesFortuneChurch: number;
    taxesPersonnel: number;
  }>([
    {
      cityId: 66,
      cityName: 'Opfikon (ZH)',
      relationship: 's',
      confession: 'protestant',
      children: 0,
      fortune: 500000,
      income: 100000,
      taxesIncomeCanton: 6233,
      taxesIncomeCity: 5918,
      taxesIncomeChurch: 504,
      taxesFortuneCanton: 304,
      taxesFortuneCity: 289,
      taxesFortuneChurch: 25,
      taxesPersonnel: 24
    },
    {
      cityId: 66,
      cityName: 'Opfikon (ZH)',
      relationship: 'm',
      confession: 'protestant',
      fortune: 500000,
      income: 100000,
      children: 0,
      taxesIncomeCanton: 4837,
      taxesIncomeCity: 4593,
      taxesIncomeChurch: 391,
      taxesFortuneCanton: 228,
      taxesFortuneCity: 217,
      taxesFortuneChurch: 18,
      taxesPersonnel: 48
    },
    {
      cityId: 66,
      cityName: 'Opfikon (ZH)',
      relationship: 'm',
      confession: 'protestant',
      fortune: 500000,
      income: 100000,
      children: 1,
      taxesIncomeCanton: 4837,
      taxesIncomeCity: 4593,
      taxesIncomeChurch: 391,
      taxesFortuneCanton: 228,
      taxesFortuneCity: 217,
      taxesFortuneChurch: 18,
      taxesPersonnel: 48
    },
    {
      cityId: 66,
      cityName: 'Opfikon (ZH)',
      relationship: 'm',
      confession: 'protestant',
      confession2: 'other',
      children: 0,
      fortune: 500000,
      income: 100000,
      taxesIncomeCanton: 4837,
      taxesIncomeCity: 4593,
      taxesIncomeChurch: 195,
      taxesFortuneCanton: 228,
      taxesFortuneCity: 217,
      taxesFortuneChurch: 9,
      taxesPersonnel: 48
    },
    {
      cityId: 66,
      cityName: 'Opfikon (ZH)',
      relationship: 's',
      children: 1,
      confession: 'protestant',
      fortune: 500000,
      income: 100000,
      taxesIncomeCanton: 4837,
      taxesIncomeCity: 4593,
      taxesIncomeChurch: 391,
      taxesFortuneCanton: 228,
      taxesFortuneCity: 217,
      taxesFortuneChurch: 18,
      taxesPersonnel: 24
    }
  ])(
    'for $cityName, $relationship, $confession, $income, $fortune ',
    async ({
      cityId,
      relationship,
      confession,
      confession2,
      fortune,
      income,
      children,
      taxesIncomeCanton,
      taxesIncomeCity,
      taxesIncomeChurch,
      taxesFortuneCanton,
      taxesFortuneCity,
      taxesFortuneChurch,
      taxesPersonnel
    }) => {
      const result = await calculateTaxesIncomeAndFortune(
        await getTaxInputForTest({
          cityId,
          relationship,
          confession,
          confession2: confession2 ?? confession,
          children,
          income,
          incomeType: 'TAXABLE',
          fortune
        })
      );

      expect({
        taxesIncomeCanton: result.taxesIncomeCanton,
        taxesIncomeCity: result.taxesIncomeCity,
        taxesIncomeChurch: result.taxesIncomeChurch,
        taxesFortuneCanton: result.taxesFortuneCanton,
        taxesFortuneCity: result.taxesFortuneCity,
        taxesFortuneChurch: result.taxesFortuneChurch,
        taxesPersonnel: result.taxesPersonnel
      }).toMatchObject({
        taxesIncomeCanton,
        taxesIncomeChurch,
        taxesIncomeCity,
        taxesFortuneCanton,
        taxesFortuneCity,
        taxesFortuneChurch,
        taxesPersonnel
      });
    }
  );

  test.each<{
    cityId: number;
    cityName: string;
    relationship: TaxRelationship;
    confession: TaxConfession;
    confession2?: TaxConfession;
    fortune: number;
    income: number;
    taxesIncomeCanton: number;
    taxesIncomeCity: number;
    taxesIncomeChurch: number;
    taxesFortuneCanton: number;
    taxesFortuneCity: number;
    taxesFortuneChurch: number;
  }>([
    {
      cityId: 66,
      cityName: 'Opfikon (ZH)',
      relationship: 's',
      confession: 'protestant',
      fortune: 500000,
      income: 100000,
      taxesIncomeCanton: 6233,
      taxesIncomeCity: 5918,
      taxesIncomeChurch: 504,
      taxesFortuneCanton: 304,
      taxesFortuneCity: 289,
      taxesFortuneChurch: 25
    },
    {
      cityId: 351,
      cityName: 'Bern (BE)',
      relationship: 's',
      confession: 'protestant',
      fortune: 500000,
      income: 100000,
      taxesIncomeCanton: 13740,
      taxesIncomeCity: 6995,
      taxesIncomeChurch: 836,
      taxesFortuneCanton: 1081,
      taxesFortuneCity: 551,
      taxesFortuneChurch: 66
    },
    {
      cityId: 2701,
      cityName: 'Basel (BS)',
      relationship: 's',
      confession: 'protestant',
      fortune: 500000,
      income: 100000,
      taxesIncomeCanton: 21750,
      taxesIncomeCity: 0,
      taxesIncomeChurch: 1740,
      taxesFortuneCanton: 2800,
      taxesFortuneCity: 0,
      taxesFortuneChurch: 0
    },
    {
      cityId: 2196,
      cityName: 'Fribourg (FR)',
      relationship: 's',
      confession: 'protestant',
      fortune: 500000,
      income: 100000,
      taxesIncomeCanton: 10392,
      taxesIncomeCity: 8660,
      taxesIncomeChurch: 974,
      taxesFortuneCanton: 1070,
      taxesFortuneCity: 856,
      taxesFortuneChurch: 107
    },
    {
      cityId: 2196,
      cityName: 'Fribourg (FR)',
      relationship: 'm',
      confession: 'protestant',
      fortune: 500000,
      income: 100000,
      taxesIncomeCanton: 7874,
      taxesIncomeCity: 6562,
      taxesIncomeChurch: 738,
      taxesFortuneCanton: 1070,
      taxesFortuneCity: 856,
      taxesFortuneChurch: 107
    }
  ])(
    'for $cityName, $relationship, $confession, $income, $fortune ',
    async ({
      cityId,
      relationship,
      confession,
      confession2,
      fortune,
      income,
      taxesIncomeCanton,
      taxesIncomeCity,
      taxesIncomeChurch,
      taxesFortuneCanton,
      taxesFortuneCity,
      taxesFortuneChurch
    }) => {
      const result = await calculateTaxesIncomeAndFortune(
        await getTaxInputForTest({
          cityId,
          relationship,
          confession,
          confession2: confession2 ?? confession,
          income,
          incomeType: 'TAXABLE',
          fortune
        })
      );

      expect({
        taxesIncomeCanton: result.taxesIncomeCanton,
        taxesIncomeCity: result.taxesIncomeCity,
        taxesIncomeChurch: result.taxesIncomeChurch,
        taxesFortuneCanton: result.taxesFortuneCanton,
        taxesFortuneCity: result.taxesFortuneCity,
        taxesFortuneChurch: result.taxesFortuneChurch
      }).toMatchObject({
        taxesIncomeCanton,
        taxesIncomeChurch,
        taxesIncomeCity,
        taxesFortuneCanton,
        taxesFortuneCity,
        taxesFortuneChurch
      });
    }
  );
});
