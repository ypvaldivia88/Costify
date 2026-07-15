import { randomId } from '../random-id';

export interface Location {
  id: string;
  name: string;
  /** Short code for CSV import (e.g. LOCAL_A) */
  code?: string;
  active: boolean;
  address?: string;
  timestamp: number;
}

export interface LocationInput {
  name: string;
  code?: string;
  active?: boolean;
  address?: string;
}

export const DEFAULT_LOCATION_NAME = 'Local principal';

export function buildLocation(
  input: LocationInput,
  id?: string,
  timestamp?: number
): Location {
  return {
    id: id ?? randomId(),
    name: input.name.trim(),
    code: input.code?.trim() || undefined,
    active: input.active ?? true,
    address: input.address?.trim() || undefined,
    timestamp: timestamp ?? Date.now(),
  };
}

export function countActiveLocations(locations: Location[]): number {
  return locations.filter((location) => location.active).length;
}

export function ensureDefaultLocations(
  locations: Location[] | undefined,
  timestamp = Date.now()
): Location[] {
  if (locations && locations.length > 0) {
    return locations;
  }
  return [
    {
      id: 'default-location',
      name: DEFAULT_LOCATION_NAME,
      code: 'MAIN',
      active: true,
      timestamp,
    },
  ];
}

export function getDefaultLocationId(locations: Location[]): string {
  const list = ensureDefaultLocations(locations);
  return list[0]!.id;
}

export function findLocationByCode(locations: Location[], code: string): Location | undefined {
  const normalized = code.trim().toUpperCase();
  return locations.find(
    (location) =>
      location.code?.trim().toUpperCase() === normalized ||
      location.id === code ||
      location.name.trim().toUpperCase() === normalized
  );
}
