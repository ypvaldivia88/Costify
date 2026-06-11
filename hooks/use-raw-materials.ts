'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RawMaterial, RawMaterialInput } from '@/lib/domain/types';
import { buildRawMaterial, recalculateRawMaterial } from '@/lib/domain/calculations';
import { STORAGE_KEYS } from '@/lib/domain/constants';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';

export function useRawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadFromStorage<RawMaterial[]>(STORAGE_KEYS.rawMaterials, []);
    setMaterials(saved.map(recalculateRawMaterial));
    setHydrated(true);
  }, []);

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

  const updateStock = useCallback((id: string, stockUnits: number) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, stockUnits: Math.max(0, stockUnits) } : m))
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
