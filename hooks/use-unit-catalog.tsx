'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { UnitSettings } from '@/lib/domain/types';
import { createUnitCatalog, DEFAULT_UNIT_SETTINGS, type UnitCatalog } from '@/lib/domain/unit-settings';

const UnitCatalogContext = createContext<UnitCatalog>(createUnitCatalog(DEFAULT_UNIT_SETTINGS));

interface UnitCatalogProviderProps {
  settings: UnitSettings;
  children: ReactNode;
}

export function UnitCatalogProvider({ settings, children }: UnitCatalogProviderProps) {
  const catalog = useMemo(() => createUnitCatalog(settings), [settings]);
  return <UnitCatalogContext.Provider value={catalog}>{children}</UnitCatalogContext.Provider>;
}

export function useUnitCatalog(): UnitCatalog {
  return useContext(UnitCatalogContext);
}
