import { useCallback } from 'react';
import type { Location, LocationInput } from '@costify/shared/domain/location';
import { buildLocation } from '@costify/shared/domain/location';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

export function useLocations() {
  const storage = useStorage();
  const load = useCallback(
    () => storage.load<Location[]>(STORAGE_KEYS.locations, []),
    [storage]
  );
  const save = useCallback(
    (locations: Location[]) => storage.save(STORAGE_KEYS.locations, locations),
    [storage]
  );

  const { value: locations, setValue: setLocations, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: [] as Location[],
  });

  const saveLocation = useCallback(
    (input: LocationInput, id?: string, timestamp?: number) => {
      const location = buildLocation(input, id, timestamp);
      setLocations((prev) => {
        const exists = prev.some((item) => item.id === location.id);
        return exists
          ? prev.map((item) => (item.id === location.id ? location : item))
          : [location, ...prev];
      });
      return location;
    },
    [setLocations]
  );

  const deleteLocation = useCallback(
    (id: string) => {
      setLocations((prev) => prev.filter((item) => item.id !== id));
    },
    [setLocations]
  );

  const setLocationsDirect = useCallback(
    (next: Location[]) => {
      setLocations(next);
    },
    [setLocations]
  );

  return {
    locations,
    hydrated,
    saveLocation,
    deleteLocation,
    setLocationsDirect,
  };
}
