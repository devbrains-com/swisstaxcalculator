export const round = (input: number, maxFractionDigits = 0) => {
  if (maxFractionDigits === 0) return Math.round(input);
  const factor = Math.pow(10, maxFractionDigits);

  if (maxFractionDigits > 0) return Math.round((input + Number.EPSILON) * factor) / factor;

  return Math.round((input + Number.EPSILON) / factor) * factor;
};

export const displayCurrency = (input: number, maxFractionDigits = 0) => {
  return round(input, maxFractionDigits).toLocaleString('de-CH');
};

export const displayCurrencyShort = (input: number, maxFractionDigits = 0) => {
  return `${displayCurrency(input, maxFractionDigits)} CHF`;
};
