import { CHF } from '@dinero.js/currencies';
import {
  Dinero,
  add,
  dinero,
  greaterThanOrEqual,
  isZero,
  lessThanOrEqual,
  subtract,
  toDecimal,
  toSnapshot
} from 'dinero.js';
import {
  dineroChf,
  multiplyDineroPercent,
  dineroToNumber,
  DineroChf,
  multiplyDineroFactor,
  dineroRound100Down
} from '~/lib/utils/dinero';
import { getTaxTarifTable } from './provider';
import { TaxTarif, TaxTarifGroup, TaxTarifTableItem } from './types';
import { TaxRelationship, TaxType } from '../types';

export const taxTarifGroups = [
  'VERHEIRATET',
  'LEDIG_MIT_KINDER',
  'LEDIG_ALLEINE',
  'LEDIG_KONKUBINAT'
] as const;

export const getTaxTarifGroup = (
  relationship: TaxRelationship,
  children: number
): TaxTarifGroup => {
  if (['m', 'rp'].includes(relationship)) return 'VERHEIRATET';
  if (children > 0) return 'LEDIG_MIT_KINDER';
  if (relationship === 's') return 'LEDIG_ALLEINE';
  if (relationship === 'c') return 'LEDIG_KONKUBINAT';

  throw new Error('Invalid relationship');
};

export const isGroupEligableForSplitting = (group: TaxTarifGroup): boolean => {
  if (['VERHEIRATET', 'LEDIG_MIT_KINDER'].includes(group)) return true;
  return false;
};

export const calculateTaxesAmount = (amount: Dinero<number>, tarif: TaxTarif) => {
  // Workaround for wrong tables of type Zürich
  let tableType = tarif.tableType;
  if (tarif.tableType === 'ZUERICH' && tarif.table.find((t) => t.taxes > 0)) tableType = 'BUND';

  let taxes = dineroChf(0);

  switch (tableType) {
    case 'FLATTAX':
      taxes = calculateTaxesByTypeFlattax(amount, tarif);
      break;
    case 'ZUERICH':
      taxes = calculateTaxesByTypeZurich(amount, tarif);
      break;
    case 'BUND':
      taxes = calculateTaxesByTypeBund(amount, tarif);
      break;
    case 'FREIBURG':
      taxes = calculateTaxesByTypeFreiburg(amount, tarif);
      break;
    case 'FORMEL':
      taxes = dineroChf(0); // TODO implement
      break;
    default:
      throw new Error(`Unknown table type ${tarif.tableType}`);
  }

  return taxes;
};

const calculateTaxesByTypeZurich = (amount: Dinero<number>, tarif: TaxTarif) => {
  let taxes = dineroChf(0);
  let remainingIncome = dinero(toSnapshot(amount));
  for (let i = 0; i < tarif.table.length; i++) {
    const tarifItem = tarif.table[i];
    const tarifAmount = dineroChf(tarifItem.amount);
    const usableIncome = greaterThanOrEqual(remainingIncome, tarifAmount)
      ? tarifAmount
      : remainingIncome;

    // console.log(tarifItem, dineroToNumber(taxes), tarifItem.percent, dineroToNumber(usableIncome));

    taxes = add(taxes, multiplyDineroPercent(usableIncome, tarifItem.percent, 5));

    remainingIncome = subtract(remainingIncome, usableIncome);

    if (isZero(remainingIncome)) {
      return taxes;
    }
  }

  console.log(
    `No Tarif found for income ${toDecimal(amount)}, ${tarif.taxType}, ${tarif.tableType}`
  );

  return taxes;
};

const calculateTaxesByTypeFreiburg = (amount: Dinero<number>, tarif: TaxTarif) => {
  let lastTarifItem: TaxTarifTableItem | undefined;

  for (let i = 0; i < tarif.table.length; i++) {
    const tarifItem = tarif.table[i];
    const tarifAmount = dinero({ amount: tarifItem.amount, currency: CHF, scale: 0 });
    if (greaterThanOrEqual(tarifAmount, amount)) {
      if (!lastTarifItem || lastTarifItem.amount === 0) return dineroChf(0);

      const lastTarifAmount = dineroChf(lastTarifItem.amount);
      const lastPercent = lastTarifItem ? lastTarifItem.percent : 0;
      const percentDiff = tarifItem.percent - lastPercent;
      const partCount = dineroToNumber(subtract(tarifAmount, lastTarifAmount));
      const partPercentage = percentDiff / partCount;
      const partDiff = dineroToNumber(subtract(amount, lastTarifAmount));
      const finalPercentage = partDiff * partPercentage + lastPercent;

      // console.log(
      //   partCount,
      //   partDiff,
      //   finalPercentage,
      //   dineroToNumber(multiplyDineroPercent(amount, finalPercentage, 5))
      // );

      return multiplyDineroPercent(amount, finalPercentage, 5);
    }

    lastTarifItem = tarifItem;
  }

  throw new Error(
    `No Tarif found for income ${toDecimal(amount)}, ${tarif.taxType}, ${tarif.tableType}`
  );
};

const calculateTaxesByTypeBund = (amount: Dinero<number>, tarif: TaxTarif) => {
  let lastTarif: TaxTarifTableItem | undefined;
  for (let i = 0; i < tarif.table.length; i++) {
    const tarifItem = tarif.table[i];
    const tarifAmount = dineroChf(tarifItem.amount);
    if (lessThanOrEqual(tarifAmount, amount)) {
      lastTarif = tarifItem;
    } else {
      break;
    }
  }
  if (!lastTarif)
    throw new Error(
      `No Tarif found for income ${toDecimal(amount)}, ${tarif.taxType}, ${tarif.tableType}`
    );

  const tarifTaxes = dineroChf(lastTarif.taxes);
  const tarifAmount = dineroChf(lastTarif.amount);

  return add(
    tarifTaxes,
    multiplyDineroPercent(subtract(amount, tarifAmount), lastTarif.percent, 5)
  );
};

const calculateTaxesByTypeFlattax = (amount: Dinero<number>, tarif: TaxTarif) => {
  return multiplyDineroPercent(amount, tarif.table[0].percent, 5);
};

export const calculateTaxesForTarif = async (
  cantonId: number,
  year: number,
  tarifGroup: TaxTarifGroup,
  tarifType: TaxType,
  taxableIncome: DineroChf
) => {
  const tarifIncome = await getTaxTarifTable(cantonId, year, tarifType, tarifGroup);

  // Apply splitting if tarif includes splitting
  if (tarifIncome.splitting > 0 && isGroupEligableForSplitting(tarifGroup)) {
    taxableIncome = multiplyDineroFactor(taxableIncome, 1 / tarifIncome.splitting, 5);
  }

  const taxableIncomeRounded = dineroRound100Down(taxableIncome);
  const taxes = calculateTaxesAmount(taxableIncomeRounded, tarifIncome);

  // Apply splitting if tarif includes splitting
  if (tarifIncome.splitting > 0 && isGroupEligableForSplitting(tarifGroup)) {
    return multiplyDineroFactor(taxes, tarifIncome.splitting, 5);
  }

  return taxes;
};
