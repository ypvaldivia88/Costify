import { useCallback } from 'react';
import type { RawMaterial, RawMaterialInput } from '@costify/shared/domain/types';
import {
  buildRawMaterial,
  migrateRawMaterialInput,
  recalculateRawMaterial,
} from '@costify/shared/domain/calculations';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

export function useRawMaterials() {
  const storage = useStorage();

  const load = useCallback(async () => {
    const saved = await storage.load<
      Array<RawMaterial & { unitsPerPackage?: number; stockUnits?: number }>
    >(STORAGE_KEYS.rawMaterials, []);
    return saved.map((material) =>
      buildRawMaterial(migrateRawMaterialInput(material), material.id, material.timestamp)
    );
  }, [storage]);

  const save = useCallback(
    (materials: RawMaterial[]) => storage.save(STORAGE_KEYS.rawMaterials, materials),
    [storage]
  );

  const { value: materials, setValue: setMaterials, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: [] as RawMaterial[],
  });

  const saveMaterial = useCallback(
    (input: RawMaterialInput, id?: string, timestamp?: number) => {
      const material = buildRawMaterial(input, id, timestamp);
      setMaterials((prev) => {
        const exists = prev.some((m) => m.id === material.id);
        return exists
          ? prev.map((m) => (m.id === material.id ? material : m))
          : [material, ...prev];
      });
      return material;
    },
    [setMaterials]
  );

  const deleteMaterial = useCallback(
    (id: string) => {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    },
    [setMaterials]
  );

  const updateStock = useCallback(
    (id: string, stockQuantity: number) => {
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, stockQuantity: Math.max(0, stockQuantity) } : m))
      );
    },
    [setMaterials]
  );

  const recalculateAll = useCallback(() => {
    setMaterials((prev) => prev.map(recalculateRawMaterial));
  }, [setMaterials]);

  const replaceMaterials = useCallback(
    (items: RawMaterial[]) => {
      setMaterials(items.map(recalculateRawMaterial));
    },
    [setMaterials]
  );

  return {
    materials,
    hydrated,
    saveMaterial,
    deleteMaterial,
    updateStock,
    recalculateAll,
    replaceMaterials,
  };
}
