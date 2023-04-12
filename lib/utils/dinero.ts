import { CHF } from '@dinero.js/currencies';
import {
  Currency,
  Dinero,
  add,
  dinero,
  down,
  halfEven,
  maximum,
  minimum,
  multiply,
  subtract,
  toDecimal,
  transformScale,
  trimScale
} from 'dinero.js';

export type DineroChf = Dinero<number>;

export const dineroAddMany = (...addends: Dinero<number>[]) => addends.reduce(add);

export const dineroSubtractMany = (...addends: Dinero<number>[]) => addends.reduce(subtract);

export const transformNumber = ({ value }: { value: string; currency: Currency<number> }) => {
  return Number(value);
};

export const dineroRound = (input: Dinero<number>, scale = 0) =>
  transformScale(input, scale, halfEven);

export const dineroRound100Down = (input: Dinero<number>) =>
  transformScale(transformScale(input, -2, down), 0, down);

export const dineroRoundMin0 = (input: Dinero<number>, scale = 0) =>
  transformScale(dineroMax(input, dineroChf(0)), scale, halfEven);

export const dineroChf = (amount: number, scale?: number) => {
  const scaleResult = scale ?? CHF.exponent;
  const factor = 10 ** scaleResult;
  const amountResult = Math.round(amount * factor);

  return dinero({ amount: amountResult, currency: CHF, scale: scaleResult });
};

export const dineroScaledPercent = (value: number, precision: number) => {
  const factor = 10 ** precision;
  const amount = Math.round(value * factor);

  // +2 to make it a factor -> / 100
  return { amount, scale: precision + 2 };
};

export const dineroScaledFactor = (value: number, precision: number) => {
  const factor = 10 ** precision;
  const amount = Math.round(value * factor);

  return { amount, scale: precision };
};

export const multiplyDineroPercent = (
  input: Dinero<number>,
  percent: number,
  precision: number
) => {
  return trimScale(multiply(input, dineroScaledPercent(percent, precision)));
};

export const multiplyDineroFactor = (input: Dinero<number>, factor: number, precision: number) => {
  return trimScale(multiply(input, dineroScaledFactor(factor, precision)));
};

export const dineroToNumber = (input: Dinero<number>) => toDecimal(input, transformNumber);

export const dineroMin = (...dineros: Dinero<number>[]) => {
  return minimum(dineros);
};

export const dineroMax = (...dineros: Dinero<number>[]) => {
  return maximum(dineros);
};
