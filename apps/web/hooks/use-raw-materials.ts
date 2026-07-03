'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RawMaterial, RawMaterialInput } from '@costify/shared/domain/types';
import {
  buildRawMaterial,
  migrateRawMaterialInput,
  recalculateRawMaterial,
} from '@costify/shared/domain/calculations';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';
import { useStorageReload } from '@/hooks/use-storage-reload';

function loadMaterials(): RawMaterial[] {
  const saved = loadFromStorage<Array<RawMaterial & { unitsPerPackage?: number; stockUnits?: number }>>(
    STORAGE_KEYS.rawMaterials,
    []
  );
  return saved.map((material) =>
    buildRawMaterial(migrateRawMaterialInput(material), material.id, material.timestamp)
  );
}

export function useRawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setMaterials(loadMaterials());
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload]);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.rawMaterials, materials);
  }, [materials, hydrated]);

  const saveMaterial = useCallback((input: RawMaterialInput, id?: string, timestamp?: number) => {
    const material = buildRawMaterial(input, id, timestamp);
    setMaterials((prev) => {
      const exists = prev.some((m) => m.id === material.id);
      return exists
        ? prev.map((m) => (m.id === material.id ? material : m))
        : [material, ...prev];
    });
    return material;
  }, []);

  const deleteMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateStock = useCallback((id: string, stockQuantity: number) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, stockQuantity: Math.max(0, stockQuantity) } : m))
    );
  }, []);

  const recalculateAll = useCallback(() => {
    setMaterials((prev) => prev.map(recalculateRawMaterial));
  }, []);

  return {
    materials,
    hydrated,
    saveMaterial,
    deleteMaterial,
    updateStock,
    recalculateAll,
  };
}
