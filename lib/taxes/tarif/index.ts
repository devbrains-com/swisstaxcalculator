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
import { ProgressionBracket, ProgressionResult, TaxRelationship } from '../typesClient';

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

export const calculateProgressionForTarif = async (
  cantonId: number,
  year: number,
  tarifGroup: TaxTarifGroupWithFallback,
  tarifType: TaxType,
  taxableIncome: DineroChf
): Promise<ProgressionResult> => {
  const [tarif, tarifGroupUsed] = await getTaxTarifTable(cantonId, year, tarifType, tarifGroup);

  let workingIncome = taxableIncome;
  const applySplitting =
    tarif.splitting > 0 && isGroupEligableForSplitting(tarifGroupUsed) ? tarif.splitting : 1;

  if (applySplitting > 1) {
    workingIncome = multiplyDineroFactor(workingIncome, 1 / applySplitting, 5);
  }

  const incomeForCalc =
    tarif.tableType === 'FORMEL' ? workingIncome : dineroRound100Down(workingIncome);
  const incomeNum = dineroToNumber(incomeForCalc);

  // Workaround for wrong tables of type Zürich (same as calculateTaxesAmount)
  let effectiveTableType = tarif.tableType;
  if (tarif.tableType === 'ZUERICH' && tarif.table.find((t) => t.taxes > 0)) {
    effectiveTableType = 'BUND';
  }

  let brackets = buildProgressionBrackets(incomeNum, tarif, effectiveTableType);

  // Scale for splitting: both income-in-bracket and tax-in-bracket double (or whatever factor)
  if (applySplitting > 1) {
    brackets = brackets.map((b) => ({
      lowerBound: b.lowerBound * applySplitting,
      upperBound: b.upperBound * applySplitting,
      percent: b.percent,
      amountInBracket: b.amountInBracket * applySplitting,
      taxInBracket: b.taxInBracket * applySplitting
    }));
  }

  const scaledIncome = dineroToNumber(taxableIncome);
  const currentBracketIndex = findCurrentBracketIndex(brackets, scaledIncome);
  const currentBracket = brackets[currentBracketIndex];
  const nextBracket = brackets[currentBracketIndex + 1];
  const previousBracket = brackets[currentBracketIndex - 1];

  const amountIntoCurrentBracket = currentBracket
    ? Math.max(0, scaledIncome - currentBracket.lowerBound)
    : 0;
  const amountToNextBracket = nextBracket
    ? Math.max(0, nextBracket.lowerBound - scaledIncome)
    : null;

  return {
    taxableIncome: scaledIncome,
    brackets,
    currentBracketIndex,
    amountIntoCurrentBracket,
    amountToNextBracket,
    nextBracketPercent: nextBracket ? nextBracket.percent : null,
    previousBracketPercent: previousBracket ? previousBracket.percent : null
  };
};

/**
 * Multiply each bracket's percent & tax by a factor. Used to convert canton "base"
 * tarif rates to effective rates by applying the Steuerfuss (canton + city + church).
 */
export const scaleProgression = (
  progression: ProgressionResult,
  factor: number
): ProgressionResult => ({
  ...progression,
  brackets: progression.brackets.map((b) => ({
    lowerBound: b.lowerBound,
    upperBound: b.upperBound,
    percent: b.percent * factor,
    amountInBracket: b.amountInBracket,
    taxInBracket: b.taxInBracket * factor
  })),
  nextBracketPercent:
    progression.nextBracketPercent !== null ? progression.nextBracketPercent * factor : null,
  previousBracketPercent:
    progression.previousBracketPercent !== null
      ? progression.previousBracketPercent * factor
      : null
});

/**
 * Build a combined progression across Bund + canton(effective).
 *
 * Bund and canton use slightly different taxable incomes (different deductions).
 * We project both onto the canton-taxable-income axis: a bund bracket at
 * bund-scale [a, b] appears at canton-scale [a + offset, b + offset] where
 * offset = cantonTaxable - bundTaxable (can be negative).
 *
 * At each merged band, combinedPercent = cantonRate + bundRate (both marginal).
 */
export const combineOverallProgression = (
  bund: ProgressionResult,
  cantonIncomeEffective: ProgressionResult,
  bundTaxable: number,
  cantonTaxable: number
): ProgressionResult => {
  const offset = cantonTaxable - bundTaxable;

  // Collect all bracket-boundary thresholds on the canton-taxable axis.
  // Closed-band thresholds: both lowerBound and upperBound when upper > lower.
  // Open-top brackets (upperBound === lowerBound): contribute only their lowerBound.
  const thresholdSet = new Set<number>([0]);
  for (const b of cantonIncomeEffective.brackets) {
    if (b.lowerBound >= 0) thresholdSet.add(b.lowerBound);
    if (b.upperBound > b.lowerBound && b.upperBound >= 0) thresholdSet.add(b.upperBound);
  }
  for (const b of bund.brackets) {
    const cLow = b.lowerBound + offset;
    if (cLow >= 0) thresholdSet.add(cLow);
    if (b.upperBound > b.lowerBound) {
      const cHigh = b.upperBound + offset;
      if (cHigh >= 0) thresholdSet.add(cHigh);
    }
  }

  const sorted = [...thresholdSet].sort((a, b) => a - b);

  const raw: ProgressionBracket[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const lower = sorted[i];
    const next = sorted[i + 1];
    const isOpenTop = next === undefined;
    const upper = isOpenTop ? lower : next;
    const width = isOpenTop ? 0 : next - lower;
    if (!isOpenTop && width <= 0) continue;

    // Rate probed slightly inside the band (or just above lower for open-top)
    // to avoid exact-threshold ambiguity.
    const probe = isOpenTop ? lower + 1 : lower + width / 2;
    const cantonRate = rateAtCanton(cantonIncomeEffective.brackets, probe);
    const bundRate = rateAtCanton(bund.brackets, probe - offset);
    const combined = cantonRate + bundRate;

    const userIn = isOpenTop
      ? Math.max(0, cantonTaxable - lower)
      : Math.max(0, Math.min(next, cantonTaxable) - lower);

    raw.push({
      lowerBound: lower,
      upperBound: upper,
      percent: combined,
      amountInBracket: userIn,
      taxInBracket: (userIn * combined) / 100
    });
  }

  // Merge adjacent bands that share the same effective rate (bracket bounds
  // from Bund and canton often create cosmetic splits with identical rates).
  const brackets: ProgressionBracket[] = [];
  for (const band of raw) {
    const last = brackets[brackets.length - 1];
    const sameRate = last && Math.abs(last.percent - band.percent) < 1e-9;
    const lastIsOpen = last && last.upperBound === last.lowerBound;
    if (sameRate && !lastIsOpen) {
      last.upperBound = band.upperBound === band.lowerBound ? last.lowerBound : band.upperBound;
      last.amountInBracket += band.amountInBracket;
      last.taxInBracket += band.taxInBracket;
    } else {
      brackets.push({ ...band });
    }
  }

  const currentBracketIndex = findCurrentBracketIndex(brackets, cantonTaxable);
  const currentBracket = brackets[currentBracketIndex];
  const nextBracket = brackets[currentBracketIndex + 1];
  const previousBracket = brackets[currentBracketIndex - 1];

  return {
    taxableIncome: cantonTaxable,
    brackets,
    currentBracketIndex,
    amountIntoCurrentBracket: currentBracket
      ? Math.max(0, cantonTaxable - currentBracket.lowerBound)
      : 0,
    amountToNextBracket: nextBracket ? Math.max(0, nextBracket.lowerBound - cantonTaxable) : null,
    nextBracketPercent: nextBracket ? nextBracket.percent : null,
    previousBracketPercent: previousBracket ? previousBracket.percent : null
  };
};

const rateAtCanton = (brackets: ProgressionBracket[], x: number): number => {
  if (x < 0) return 0;
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (x >= brackets[i].lowerBound) return brackets[i].percent;
  }
  return 0;
};

export const buildProgressionBrackets = (
  income: number,
  tarif: TaxTarif,
  effectiveTableType: TaxTarif['tableType'] = tarif.tableType
): ProgressionBracket[] => {
  switch (effectiveTableType) {
    case 'FLATTAX':
      return buildProgressionFlattax(income, tarif);
    case 'ZUERICH':
      return buildProgressionZurich(income, tarif);
    case 'BUND':
      return buildProgressionBund(income, tarif);
    case 'FREIBURG':
      return buildProgressionFreiburg(income, tarif);
    case 'FORMEL':
      return buildProgressionFormel(income, tarif);
    default:
      throw new Error(`Unknown table type ${effectiveTableType}`);
  }
};

const findCurrentBracketIndex = (brackets: ProgressionBracket[], income: number): number => {
  if (brackets.length === 0) return 0;
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (income >= brackets[i].lowerBound) return i;
  }
  return 0;
};

// NOTE: bracket semantics:
//   lowerBound / upperBound — true bracket bounds from the tarif table.
//   A bracket with upperBound === lowerBound is the top, open-ended bracket.
//   amountInBracket / taxInBracket — the user's CHF/tax inside that bracket
//   (0 for brackets entirely above the user's income).

const userAmountInBracket = (lower: number, upper: number, income: number): number => {
  // Open-top bracket: upper === lower, user amount = max(0, income - lower)
  if (upper <= lower) return Math.max(0, income - lower);
  return Math.max(0, Math.min(upper, income) - lower);
};

const buildProgressionFlattax = (income: number, tarif: TaxTarif): ProgressionBracket[] => {
  const percent = tarif.table[0]?.percent ?? 0;
  // Single open-ended bracket at this rate.
  return [
    {
      lowerBound: 0,
      upperBound: 0,
      percent,
      amountInBracket: Math.max(0, income),
      taxInBracket: (Math.max(0, income) * percent) / 100
    }
  ];
};

const buildProgressionZurich = (income: number, tarif: TaxTarif): ProgressionBracket[] => {
  // Zürich-type tables express row.amount as the *width* of each band, so we
  // accumulate. The last row's band defines the last finite boundary; no
  // open-top convention (the ZÜRICH calc simply stops once income is consumed).
  const brackets: ProgressionBracket[] = [];
  let lower = 0;
  for (const row of tarif.table) {
    const bandWidth = row.amount;
    if (bandWidth <= 0) continue;
    const upper = lower + bandWidth;
    const userIn = userAmountInBracket(lower, upper, income);
    brackets.push({
      lowerBound: lower,
      upperBound: upper,
      percent: row.percent,
      amountInBracket: userIn,
      taxInBracket: (userIn * row.percent) / 100
    });
    lower = upper;
  }
  return brackets;
};

const buildProgressionBund = (income: number, tarif: TaxTarif): ProgressionBracket[] => {
  const brackets: ProgressionBracket[] = [];
  for (let i = 0; i < tarif.table.length; i++) {
    const row = tarif.table[i];
    const nextRow = tarif.table[i + 1];
    const lower = row.amount;
    const upper = nextRow ? nextRow.amount : lower; // top bracket: open-ended
    const userIn = userAmountInBracket(lower, upper, income);
    brackets.push({
      lowerBound: lower,
      upperBound: upper,
      percent: row.percent,
      amountInBracket: userIn,
      taxInBracket: (userIn * row.percent) / 100
    });
  }
  return brackets;
};

const buildProgressionFreiburg = (income: number, tarif: TaxTarif): ProgressionBracket[] => {
  // Freiburg applies a single interpolated rate to the whole income → one bar
  // at effective rate. There are no discrete "next brackets" that matter —
  // the rate rises continuously with income.
  const totalTax = dineroToNumber(
    calculateTaxesByTypeFreiburg(dineroChf(income), tarif)
  );
  const effectivePercent = income > 0 ? (totalTax / income) * 100 : 0;
  return [
    {
      lowerBound: 0,
      upperBound: 0,
      percent: effectivePercent,
      amountInBracket: Math.max(0, income),
      taxInBracket: totalTax
    }
  ];
};

const buildProgressionFormel = (income: number, tarif: TaxTarif): ProgressionBracket[] => {
  const brackets: ProgressionBracket[] = [];
  for (let i = 0; i < tarif.table.length; i++) {
    const row = tarif.table[i];
    const nextRow = tarif.table[i + 1];
    const lower = row.amount;
    const upper = nextRow ? nextRow.amount : lower; // top bracket: open-ended

    const userIn = userAmountInBracket(lower, upper, income);

    // Tax-in-bracket via formula at the bounds of the user's slice.
    let taxInBand = 0;
    let percent = row.percent;
    if (userIn > 0 && row.formula && row.formula.trim() !== '') {
      const userUpper = upper > lower ? Math.min(upper, income) : income;
      const fLower = evaluateFormula(row.formula, lower);
      const fUpper = evaluateFormula(row.formula, userUpper);
      taxInBand = Math.max(
        0,
        (Number.isFinite(fUpper) ? fUpper : 0) - (Number.isFinite(fLower) ? fLower : 0)
      );
      if (taxInBand > 0 && userIn > 0) percent = (taxInBand / userIn) * 100;
    }

    brackets.push({
      lowerBound: lower,
      upperBound: upper,
      percent,
      amountInBracket: userIn,
      taxInBracket: taxInBand
    });
  }
  return brackets;
};
