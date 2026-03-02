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
import { TaxTarif, TaxTarifGroup, TaxTarifGroupWithFallback, TaxTarifTableItem } from './types';
import { TaxType } from '../types';
import { TaxRelationship } from '../typesClient';

export const taxTarifGroups = [
  'VERHEIRATET',
  'LEDIG_MIT_KINDER',
  'LEDIG_ALLEINE',
  'LEDIG_KONKUBINAT'
] as const;

export const getTaxTarifGroup = (
  relationship: TaxRelationship,
  children: number
): TaxTarifGroupWithFallback => {
  const tarifGroupWithFallback: TaxTarifGroupWithFallback = [];
  if (['m', 'rp'].includes(relationship)) {
    tarifGroupWithFallback.push('VERHEIRATET');
  } else {
    // "LEDIG_MIT_KINDER" has a fallback of "LEDIG_ALLEINE" or "LEDIG_KONKUBINAT"
    // as there are cantons without "LEDIG_MIT_KINDER" group
    if (children > 0) tarifGroupWithFallback.push('LEDIG_MIT_KINDER');
    if (relationship === 's') tarifGroupWithFallback.push('LEDIG_ALLEINE');
    else if (relationship === 'c') tarifGroupWithFallback.push('LEDIG_KONKUBINAT');
  }

  if (tarifGroupWithFallback.length === 0) {
    throw new Error('No tarif group found');
  }

  return tarifGroupWithFallback;
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
      taxes = calculateTaxesByTypeFormel(amount, tarif);
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

const evaluateFormula = (formula: string, wert: number): number => {
  if (!formula || formula.trim() === '') return 0;

  const tokens = tokenizeFormula(formula, wert);
  const ctx = { pos: 0 };
  const result = parseExpression(tokens, ctx);
  if (ctx.pos !== tokens.length) {
    throw new Error(`Unexpected token '${tokens[ctx.pos]}' in formula: ${formula}`);
  }
  return result;
};

const tokenizeFormula = (formula: string, wert: number): string[] => {
  const tokens: string[] = [];
  let i = 0;
  const s = formula;

  while (i < s.length) {
    if (s[i] === ' ' || s[i] === '\t') {
      i++;
    } else if (s[i] === '$') {
      // $wert$ variable
      const end = s.indexOf('$', i + 1);
      if (end === -1) throw new Error(`Unterminated variable in formula: ${formula}`);
      const variableName = s.substring(i + 1, end);
      if (variableName !== 'wert') {
        throw new Error(`Unknown variable '${variableName}' in formula: ${formula}`);
      }
      tokens.push(String(wert));
      i = end + 1;
    } else if (s.substring(i, i + 3) === 'log') {
      tokens.push('log');
      i += 3;
    } else if ('+-*/()'.includes(s[i])) {
      tokens.push(s[i]);
      i++;
    } else if (/[\d.]/.test(s[i])) {
      let num = '';
      while (i < s.length && /[\d.]/.test(s[i])) {
        num += s[i];
        i++;
      }
      tokens.push(num);
    } else {
      throw new Error(`Unexpected character '${s[i]}' in formula: ${formula}`);
    }
  }
  return tokens;
};

const parseExpression = (tokens: string[], ctx: { pos: number }): number => {
  let left = parseTerm(tokens, ctx);
  while (ctx.pos < tokens.length && (tokens[ctx.pos] === '+' || tokens[ctx.pos] === '-')) {
    const op = tokens[ctx.pos++];
    const right = parseTerm(tokens, ctx);
    left = op === '+' ? left + right : left - right;
  }
  return left;
};

const parseTerm = (tokens: string[], ctx: { pos: number }): number => {
  let left = parseUnary(tokens, ctx);
  while (ctx.pos < tokens.length && (tokens[ctx.pos] === '*' || tokens[ctx.pos] === '/')) {
    const op = tokens[ctx.pos++];
    const right = parseUnary(tokens, ctx);
    left = op === '*' ? left * right : left / right;
  }
  return left;
};

const parseUnary = (tokens: string[], ctx: { pos: number }): number => {
  if (tokens[ctx.pos] === '-') {
    ctx.pos++;
    return -parsePrimary(tokens, ctx);
  }
  return parsePrimary(tokens, ctx);
};

const parsePrimary = (tokens: string[], ctx: { pos: number }): number => {
  const token = tokens[ctx.pos];

  if (token === 'log') {
    ctx.pos++;
    const value = parsePrimary(tokens, ctx);
    return Math.log(value);
  }

  if (token === '(') {
    ctx.pos++;
    const value = parseExpression(tokens, ctx);
    if (tokens[ctx.pos] !== ')') throw new Error('Missing closing parenthesis');
    ctx.pos++;
    return value;
  }

  // Must be a number
  const num = parseFloat(token);
  if (isNaN(num)) throw new Error(`Expected number but got '${token}'`);
  ctx.pos++;
  return num;
};

const calculateTaxesByTypeFormel = (amount: Dinero<number>, tarif: TaxTarif) => {
  const wert = dineroToNumber(amount);

  // Find applicable bracket (same logic as BUND - last bracket where amount <= income)
  let lastTarif: TaxTarifTableItem | undefined;
  for (let i = 0; i < tarif.table.length; i++) {
    const tarifItem = tarif.table[i];
    if (tarifItem.amount <= wert) {
      lastTarif = tarifItem;
    } else {
      break;
    }
  }

  if (!lastTarif) {
    throw new Error(
      `No Tarif found for income ${wert}, ${tarif.taxType}, ${tarif.tableType}`
    );
  }

  if (!lastTarif.formula || lastTarif.formula.trim() === '') {
    return dineroChf(0);
  }

  const result = evaluateFormula(lastTarif.formula, wert);
  if (!Number.isFinite(result)) {
    return dineroChf(0);
  }
  return dineroChf(Math.max(0, result));
};

export const calculateTaxesForTarif = async (
  cantonId: number,
  year: number,
  tarifGroup: TaxTarifGroupWithFallback,
  tarifType: TaxType,
  taxableIncome: DineroChf
) => {
  const [tarifIncome, tarifGroupUsed] = await getTaxTarifTable(
    cantonId,
    year,
    tarifType,
    tarifGroup
  );

  // Apply splitting if tarif includes splitting
  if (tarifIncome.splitting > 0 && isGroupEligableForSplitting(tarifGroupUsed)) {
    taxableIncome = multiplyDineroFactor(taxableIncome, 1 / tarifIncome.splitting, 5);
  }

  // FORMEL uses continuous formulas that expect the exact taxable income;
  // other types use discrete brackets where rounding to 100 is required.
  const taxableIncomeForCalc =
    tarifIncome.tableType === 'FORMEL' ? taxableIncome : dineroRound100Down(taxableIncome);
  const taxes = calculateTaxesAmount(taxableIncomeForCalc, tarifIncome);

  // Apply splitting if tarif includes splitting
  if (tarifIncome.splitting > 0 && isGroupEligableForSplitting(tarifGroupUsed)) {
    return multiplyDineroFactor(taxes, tarifIncome.splitting, 5);
  }

  return taxes;
};
