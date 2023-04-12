import { PensionCreditTaxDefinition } from './types';

export const getPensionCreditDefinition = (cantonId: number) => {
  const definition = pensionCreditTaxDefinitions[cantonId];
  if (!definition) throw new Error(`No pension credit definition found for canton ${cantonId}`);

  return definition;
};

/* As of year 2022 */
const pensionCreditTaxDefinitions: Record<number, PensionCreditTaxDefinition> = {
  0: { type: 'IncomeTaxFactor', cantonId: 0, incomeTaxFactor: 0.2 }, // Bund
  26: { type: 'RentIncomeFactor', cantonId: 26, rentIncomeFactor: 0.05, minTaxFactor: 0.02 }, // Zürich
  4: { type: 'Tarif', cantonId: 4, amountFree: 5200 }, // Bern
  12: { type: 'IncomeTaxFactor', cantonId: 12, incomeTaxFactor: 1 / 3, minTaxFactor: 0.005 }, // Luzern
  22: { type: 'Flattax', cantonId: 22, taxFactorChurch: 0.005 }, // Uri
  19: { type: 'RentIncomeFactor', cantonId: 19, rentIncomeFactor: 0.04, maxTaxFactor: 0.025 }, // Schwyz
  15: { type: 'IncomeTaxFactor', cantonId: 15, incomeTaxFactor: 0.4 }, // Obwalden
  14: { type: 'IncomeTaxFactor', cantonId: 14, incomeTaxFactor: 0.4, minTaxFactor: 0.008 }, // Nidwalden
  9: { type: 'Flattax', cantonId: 9 }, // Glarus
  25: { type: 'IncomeTaxFactor', cantonId: 25, minTaxFactor: 0.01 }, // Zug - Eigner Tarif auch noch beachten
  7: { type: 'Tarif', cantonId: 7, deductionMarried: 5000, amountFree: 5000 }, // Freiburg
  18: { type: 'IncomeTaxFactor', cantonId: 18, incomeTaxFactor: 0.25 }, // Solothurn
  6: { type: 'Tarif', cantonId: 6 }, // Basel-Stadt
  5: { type: 'Tarif', cantonId: 5, maxTaxFactor: 0.045 }, // Basel-Landschaft
  17: { type: 'IncomeTaxFactor', cantonId: 17, incomeTaxFactor: 0.2 }, // Schaffhausen
  3: { type: 'Tarif', cantonId: 3 }, // Appenzell Ausserrhoden
  2: { type: 'IncomeTaxFactor', cantonId: 2, incomeTaxFactor: 0.25, minTaxFactor: 0.005 }, // Appenzell Innerrhoden
  16: { type: 'Flattax', cantonId: 16 }, // St. Gallen
  10: {
    type: 'RentIncomeFactorOwn',
    cantonId: 10,
    rentIncomeFactor: 1 / 15,
    minTaxFactor: 0.015,
    maxTaxFactor: 0.02
  }, // Graubünden
  1: { type: 'IncomeTaxFactor', cantonId: 1, incomeTaxFactor: 0.3, minTaxFactor: 0.01 }, // Aargau
  20: { type: 'Flattax', cantonId: 20 }, // Thurgau
  21: { type: 'RentIncomeFactor', cantonId: 21, rentIncomeFactor: 0.068, minTaxFactor: 0.02 }, // Tessin
  23: { type: 'IncomeTaxFactor', cantonId: 23, incomeTaxFactor: 0.33 }, // Waadt
  24: { type: 'RentIncomeFactor', cantonId: 24, rentIncomeFactor: 0.068, minTaxFactor: 0.02 }, // Wallis
  13: { type: 'IncomeTaxFactor', cantonId: 13, incomeTaxFactor: 0.25, minTaxFactor: 0.025 }, // Neuenburg
  8: { type: 'IncomeTaxFactor', cantonId: 8, incomeTaxFactor: 0.2 }, // Genf
  11: { type: 'Tarif', cantonId: 11 } // Jura
};
