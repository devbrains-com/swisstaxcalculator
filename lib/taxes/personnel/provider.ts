import { personnelTaxes } from './personnelTaxes2022';
import { PersonnelTaxItem } from './types';

const personnelTaxesByCanton = new Map<number, PersonnelTaxItem>();
let taxesLoaded = false;

const loadPersonnelTaxesIfRequired = () => {
  if (taxesLoaded) return;
  Object.entries(personnelTaxes).forEach(([cantonId, personnelTax]) => {
    personnelTaxesByCanton.set(parseInt(cantonId), personnelTax);
  });
  taxesLoaded = true;
};

export const getPersonnelTax = (cantonId: number) => {
  loadPersonnelTaxesIfRequired();
  const personnelTaxes = personnelTaxesByCanton.get(cantonId);
  if (!personnelTaxes) throw new Error(`Personnel taxes not found for canton ${cantonId}`);

  return personnelTaxes;
};
