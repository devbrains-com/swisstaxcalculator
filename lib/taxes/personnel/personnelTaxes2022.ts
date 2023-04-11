import { PersonnelTaxItem } from './types';

export const personnelTaxes: Record<number, PersonnelTaxItem> = {
  26: { amount: 24, marriedBoth: true }, // Zürich
  4: { amount: 0, marriedBoth: true }, // Bern
  12: { amount: 50, marriedBoth: true }, // Luzern
  22: { amount: 70, marriedBoth: true }, // Uri
  19: { amount: 0, marriedBoth: true }, // Schwyz
  15: { amount: 0, marriedBoth: true }, // Obwalden
  14: { amount: 50, marriedBoth: false }, // Nidwalden
  9: { amount: 0, marriedBoth: true }, // Glarus
  25: { amount: 0, marriedBoth: true }, // Zug
  7: { amount: 0, marriedBoth: true }, // Freiburg
  18: { amount: 30, marriedBoth: true }, // Solothurn
  6: { amount: 0, marriedBoth: true }, // Basel-Stadt
  5: { amount: 0, marriedBoth: true }, // Basel-Landschaft
  17: { amount: 60, marriedBoth: false }, // Schaffhausen
  3: { amount: 0, marriedBoth: true }, // Appenzell Ausserrhoden
  2: { amount: 0, marriedBoth: true }, // Appenzell Innerrhoden
  16: { amount: 0, marriedBoth: true }, // St. Gallen
  10: { amount: 0, marriedBoth: true }, // Graubünden
  1: { amount: 0, marriedBoth: true }, // Aargau
  20: { amount: 0, marriedBoth: true }, // Thurgau
  21: { amount: 40, marriedBoth: true }, // Tessin
  23: { amount: 0, marriedBoth: true }, // Waadt
  24: { amount: 24, marriedBoth: false }, // Wallis
  13: { amount: 0, marriedBoth: true }, // Neuenburg
  8: { amount: 25, marriedBoth: false }, // Genf
  11: { amount: 0, marriedBoth: true } // Jura
};
