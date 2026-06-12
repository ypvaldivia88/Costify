import { useCallback, useEffect, useState } from 'react';
import type { RawMaterial, RawMaterialInput } from '@/domain/types';
import { buildRawMaterial, recalculateRawMaterial } from '@/domain/calculations';
import { STORAGE_KEYS } from '@/domain/constants';
import { loadFromStorage, saveToStorage } from '@/storage/async-storage';

export function useRawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await loadFromStorage<RawMaterial[]>(STORAGE_KEYS.rawMaterials, []);
      if (mounted) {
        setMaterials(saved);
        setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveToStorage(STORAGE_KEYS.rawMaterials, materials);
  }, [materials, hydrated]);

  const saveMaterial = useCallback(
    (data: RawMaterialInput, id?: string, timestamp?: number) => {
      setMaterials((prev) => {
        if (id) {
          return prev.map((m) =>
            m.id === id ? recalculateRawMaterial({ ...m, ...data, timestamp: timestamp ?? m.timestamp }) : m
          );
        }
        return [buildRawMaterial(data), ...prev];
      });
    },
    []
  );

  const deleteMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateStock = useCallback((id: string, stockQuantity: number) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, stockQuantity } : m))
    );
  }, []);

  const replaceMaterials = useCallback((items: RawMaterial[]) => {
    setMaterials(items);
  }, []);

  return {
    materials,
    hydrated,
    saveMaterial,
    deleteMaterial,
    updateStock,
    replaceMaterials,
  };
}
