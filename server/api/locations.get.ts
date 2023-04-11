import { getTaxLocations } from '~~/lib/taxes/location';

export default defineEventHandler(async (event) => {
  const taxes = await getTaxLocations(
    event.context.params?.year ? Number(event.context.params?.year) : 2022
  );
  return taxes;
});
