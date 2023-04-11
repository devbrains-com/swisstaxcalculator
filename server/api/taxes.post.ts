import { calculateTaxes } from '~~/lib/taxes';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const taxes = await calculateTaxes(body);
  return taxes;
});
