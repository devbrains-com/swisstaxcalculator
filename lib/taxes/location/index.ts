import { readFile } from 'fs/promises';
import path from 'path';
import { dataParsedBasePath } from '../constants';
import { TaxLocation } from '../types';

const locationsByYearAndCity = new Map<number, Map<number, TaxLocation>>();

const locationsByYear = new Map<number, TaxLocation[]>();

const loadLocationsIfRequired = async (year: number) => {
  if (locationsByYearAndCity.has(year)) return;

  // Load locations from file
  const resolvedPath = path.resolve(`${dataParsedBasePath}${year}/locations.json`);
  const locations: TaxLocation[] = JSON.parse(
    (await readFile(new URL(resolvedPath, import.meta.url))).toString()
  );

  const locationsByCity = new Map<number, TaxLocation>();
  locationsByYearAndCity.set(year, locationsByCity);

  locations.forEach((location) => {
    locationsByCity.set(location.BfsID, location);
  });

  locationsByYear.set(year, locations);
};

export const getCantonIdByCityId = async (cityId: number, year: number) => {
  await loadLocationsIfRequired(year);
  const location = locationsByYearAndCity.get(year)?.get(cityId);
  if (!location) throw new Error(`Location not found for ${cityId}, ${year}`);
  return location.CantonID;
};

export const getTaxLocations = async (year: number) => {
  await loadLocationsIfRequired(year);
  return locationsByYear.get(year);
};
