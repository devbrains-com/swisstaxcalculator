import { getCantonIdByCityId } from '../location';
import {
  TaxRelationship,
  TaxConfession,
  TaxIncomeType,
  TaxInput,
  TaxInputPerson
} from '../typesClient';

export const getTaxInputForTest = async ({
  cityId = 0,
  relationship = 's',
  children = 0,
  income = 0,
  income2 = 0,
  incomeType = 'GROSS',
  confession = 'other',
  confession2 = 'other',
  fortune = 0
}: {
  relationship?: TaxRelationship;
  children?: number;
  income?: number;
  income2?: number;
  confession?: TaxConfession;
  confession2?: TaxConfession;
  fortune?: number;
  cityId?: number;
  incomeType?: TaxIncomeType;
}): Promise<TaxInput> => {
  const year = 2022;
  const person1: TaxInputPerson = { age: 37, confession, income, incomeType };
  const person2: TaxInputPerson = { age: 37, confession: confession2, income: income2, incomeType };
  const persons = ['m', 'rp'].includes(relationship) ? [person1, person2] : [person1];
  const cantonId = await getCantonIdByCityId(cityId, year);
  return {
    taxType: 'pc',
    children,
    fortune,
    locationId: cityId,
    cantonId,
    persons,
    relationship,
    year
  };
};
