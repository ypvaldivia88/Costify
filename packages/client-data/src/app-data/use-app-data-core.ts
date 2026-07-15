'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { RawMaterialInput } from '@costify/shared/domain/types';
import {
  calculateStockLevels,
  calculateStockValuation,
  createInitialStockMovements,
  createProductionMovement,
  createStockAdjustmentMovement,
  DEFAULT_WAREHOUSE_PRESETS,
  estimateRecipeConsumption,
  getStockAlerts,
  getStockQuantity,
  syncRawMaterialStockFromLevels,
} from '@costify/shared/domain/calculations';
import {
  ensureDefaultLocations,
  getDefaultLocationId,
} from '@costify/shared/domain/location';
import type { LocationInput } from '@costify/shared/domain/location';
import { migrateLaborShareSettings } from '@costify/shared/domain/calculations/labor-share';
import { DEFAULT_LABOR_SHARE_SETTINGS } from '@costify/shared/domain/constants';
import { createWorkspaceAccessGates } from '../access/workspace-access';
import { onSyncReload } from '../sync/sync-events';
import { useSyncApi } from '../context/ClientDataProvider';
import { useCloudSync } from '../hooks/use-cloud-sync';
import { useExchangeRates } from '../hooks/use-exchange-rates';
import { useGlobalCosts } from '../hooks/use-global-costs';
import { useGlobalFund } from '../hooks/use-global-fund';
import { useInventory } from '../hooks/use-inventory';
import { useLaborShareSettings } from '../hooks/use-labor-share-settings';
import { useRawMaterials } from '../hooks/use-raw-materials';
import { useStockMovements } from '../hooks/use-stock-movements';
import { useStockThresholds } from '../hooks/use-stock-thresholds';
import { useTaxSettings } from '../hooks/use-tax-settings';
import { useUnitSettings } from '../hooks/use-unit-settings';
import { useWarehouses } from '../hooks/use-warehouses';
import { useLocations } from '../hooks/use-locations';
import { useSales } from '../hooks/use-sales';
import type { AppBackupReloadInput, AppDataContextValue, AppDataUser } from './types';

export interface UseAppDataCoreOptions {
  user: AppDataUser | null;
  onDenyWrite: (message: string) => void;
}

export function useAppDataCore({ user, onDenyWrite }: UseAppDataCoreOptions): AppDataContextValue {
  const access = useMemo(() => createWorkspaceAccessGates(user?.accessLevel), [user?.accessLevel]);
  const sync = useSyncApi();
  const inventoryState = useInventory();
  const rawMaterialsState = useRawMaterials();
  const globalCostsState = useGlobalCosts();
  const globalFundState = useGlobalFund();
  const laborShareSettingsState = useLaborShareSettings();
  const taxSettingsState = useTaxSettings();
  const unitSettingsState = useUnitSettings();
  const warehousesState = useWarehouses();
  const locationsState = useLocations();
  const salesState = useSales();
  const stockMovementsState = useStockMovements();
  const stockThresholdsState = useStockThresholds();
  const exchangeRatesState = useExchangeRates();
  const migrationDone = useRef(false);

  const hydrated =
    inventoryState.hydrated &&
    rawMaterialsState.hydrated &&
    globalCostsState.hydrated &&
    globalFundState.hydrated &&
    laborShareSettingsState.hydrated &&
    taxSettingsState.hydrated &&
    unitSettingsState.hydrated &&
    warehousesState.hydrated &&
    locationsState.hydrated &&
    salesState.hydrated &&
    stockMovementsState.hydrated &&
    stockThresholdsState.hydrated &&
    exchangeRatesState.hydrated;

  const stockLevels = useMemo(
    () => calculateStockLevels(stockMovementsState.movements),
    [stockMovementsState.movements]
  );

  const stockValuation = useMemo(
    () =>
      calculateStockValuation(
        stockLevels,
        rawMaterialsState.materials,
        inventoryState.inventory
      ),
    [stockLevels, rawMaterialsState.materials, inventoryState.inventory]
  );

  const stockAlerts = useMemo(
    () =>
      getStockAlerts(
        stockLevels,
        stockThresholdsState.thresholds,
        rawMaterialsState.materials,
        inventoryState.inventory,
        warehousesState.warehouses,
        unitSettingsState.unitSettings
      ),
    [
      stockLevels,
      stockThresholdsState.thresholds,
      rawMaterialsState.materials,
      inventoryState.inventory,
      warehousesState.warehouses,
      unitSettingsState.unitSettings,
    ]
  );

  const syncData = useMemo(
    () => ({
      inventory: inventoryState.inventory,
      rawMaterials: rawMaterialsState.materials,
      globalCosts: globalCostsState.globalCosts,
      globalFund: globalFundState.globalFund,
      laborShareSettings: laborShareSettingsState.laborShareSettings,
      taxSettings: taxSettingsState.taxSettings,
      unitSettings: unitSettingsState.unitSettings,
      locations: locationsState.locations,
      warehouses: warehousesState.warehouses,
      stockMovements: stockMovementsState.movements,
      stockThresholds: stockThresholdsState.thresholds,
      sales: salesState.sales,
      exchangeRateSettings: exchangeRatesState.exchangeSettings,
    }),
    [
      inventoryState.inventory,
      rawMaterialsState.materials,
      globalCostsState.globalCosts,
      globalFundState.globalFund,
      laborShareSettingsState.laborShareSettings,
      taxSettingsState.taxSettings,
      unitSettingsState.unitSettings,
      locationsState.locations,
      warehousesState.warehouses,
      stockMovementsState.movements,
      stockThresholdsState.thresholds,
      salesState.sales,
      exchangeRatesState.exchangeSettings,
    ]
  );

  const cloudSync = useCloudSync({
    enabled: hydrated && Boolean(user?.workspaceId && user?.tenantId && access.canSync),
    data: syncData,
    tenantId: user?.tenantId,
    workspaceId: user?.workspaceId,
  });

  const getDefaultWarehouse = useCallback(() => {
    const active = warehousesState.warehouses.filter((w) => w.active);
    return (
      active.find((w) => w.type === 'principal') ??
      active[0] ??
      warehousesState.warehouses[0]
    );
  }, [warehousesState.warehouses]);

  const getDefaultLocation = useCallback(() => {
    const list = ensureDefaultLocations(locationsState.locations);
    return list.find((location) => location.active) ?? list[0];
  }, [locationsState.locations]);

  useEffect(() => {
    if (!hydrated || migrationDone.current) return;

    if (locationsState.locations.length === 0) {
      locationsState.saveLocation({ name: 'Local principal', code: 'MAIN', active: true });
    }

    if (warehousesState.warehouses.length === 0) {
      const warehouse = warehousesState.saveWarehouse(DEFAULT_WAREHOUSE_PRESETS[0]);
      const initialMovements = createInitialStockMovements(
        rawMaterialsState.materials,
        warehouse.id
      );
      if (initialMovements.length > 0) {
        stockMovementsState.setMovementsDirect([
          ...initialMovements,
          ...stockMovementsState.movements,
        ]);
      }
      migrationDone.current = true;
      return;
    }

    const hasInitialMigration = stockMovementsState.movements.some(
      (m) => m.type === 'inventario_inicial'
    );
    const hasLegacyStock = rawMaterialsState.materials.some((m) => m.stockQuantity > 0);

    if (!hasInitialMigration && hasLegacyStock && stockMovementsState.movements.length === 0) {
      const warehouse = getDefaultWarehouse();
      if (warehouse) {
        const initialMovements = createInitialStockMovements(
          rawMaterialsState.materials,
          warehouse.id
        );
        stockMovementsState.setMovementsDirect(initialMovements);
      }
    }

    migrationDone.current = true;
  }, [hydrated, locationsState, warehousesState, rawMaterialsState.materials, stockMovementsState, getDefaultWarehouse]);

  useEffect(() => {
    if (!hydrated) return;
    const defaultLocationId = getDefaultLocationId(ensureDefaultLocations(locationsState.locations));
    const needsWarehousePatch = warehousesState.warehouses.some((w) => !w.locationId);
    const needsMovementPatch = stockMovementsState.movements.some((m) => !m.locationId);
    if (!needsWarehousePatch && !needsMovementPatch) return;

    if (needsWarehousePatch) {
      warehousesState.setWarehousesDirect(
        warehousesState.warehouses.map((warehouse) =>
          warehouse.locationId ? warehouse : { ...warehouse, locationId: defaultLocationId }
        )
      );
    }
    if (needsMovementPatch) {
      stockMovementsState.setMovementsDirect(
        stockMovementsState.movements.map((movement) =>
          movement.locationId ? movement : { ...movement, locationId: defaultLocationId }
        )
      );
    }
  }, [hydrated, locationsState.locations, warehousesState, stockMovementsState]);

  useEffect(() => {
    if (!hydrated || stockMovementsState.movements.length === 0) return;

    const synced = syncRawMaterialStockFromLevels(rawMaterialsState.materials, stockLevels);
    const changed = synced.some(
      (m, i) => m.stockQuantity !== rawMaterialsState.materials[i]?.stockQuantity
    );
    if (changed) {
      synced.forEach((material) => {
        rawMaterialsState.saveMaterial(material, material.id, material.timestamp);
      });
    }
  }, [stockLevels, hydrated]);

  useEffect(() => {
    if (!hydrated || inventoryState.inventory.length === 0) return;
    inventoryState.recalculateAll(
      rawMaterialsState.materials,
      globalFundState.globalFund,
      unitSettingsState.unitSettings,
      laborShareSettingsState.laborShareSettings
    );
  }, [
    globalFundState.globalFund.enabled,
    globalFundState.globalFund.percent,
    laborShareSettingsState.laborShareSettings.enabled,
    laborShareSettingsState.laborShareSettings.areas,
    unitSettingsState.unitSettings,
    rawMaterialsState.materials,
    hydrated,
  ]);

  const guardWarehouse = useCallback(() => {
    if (!access.canManageWarehouses) {
      onDenyWrite(access.warehousesMessage);
      return false;
    }
    return true;
  }, [access, onDenyWrite]);

  const purgeStockReferences = useCallback(
    (refType: 'raw_material' | 'product', refId: string) => {
      stockMovementsState.setMovementsDirect(
        stockMovementsState.movements.filter(
          (movement) =>
            movement.productId !== refId &&
            !movement.lines.some((line) => line.refType === refType && line.refId === refId)
        )
      );
      stockThresholdsState.setThresholdsDirect(
        stockThresholdsState.thresholds.filter(
          (threshold) => !(threshold.refType === refType && threshold.refId === refId)
        )
      );
    },
    [stockMovementsState, stockThresholdsState]
  );

  const updateStock = useCallback(
    (id: string, stockQuantity: number) => {
      if (!access.canManageWarehouses) {
        onDenyWrite(access.warehousesMessage);
        return;
      }
      const warehouse = getDefaultWarehouse();
      if (!warehouse) {
        rawMaterialsState.updateStock(id, stockQuantity);
        return;
      }

      const current = getStockQuantity(stockLevels, 'raw_material', id, warehouse.id);
      const adjustment = createStockAdjustmentMovement(
        'raw_material',
        id,
        warehouse.id,
        current,
        stockQuantity,
        rawMaterialsState.materials.find((m) => m.id === id)?.unitType,
        'Ajuste desde insumos'
      );

      if (adjustment.lines[0]?.quantity !== 0) {
        stockMovementsState.addMovement(adjustment);
      }
    },
    [access, onDenyWrite, getDefaultWarehouse, stockLevels, rawMaterialsState, stockMovementsState]
  );

  const registerProduction = useCallback(
    (
      product: Parameters<AppDataContextValue['registerProduction']>[0],
      productionQuantity: number,
      warehouseId?: string,
      note?: string
    ) => {
      if (!access.canManageWarehouses) {
        onDenyWrite(access.warehousesMessage);
        throw new Error(access.warehousesMessage);
      }
      if (!product.recipe || product.recipe.length === 0) {
        throw new Error('El producto no tiene receta definida.');
      }

      const warehouse = warehouseId
        ? warehousesState.warehouses.find((w) => w.id === warehouseId)
        : getDefaultWarehouse();

      if (!warehouse) throw new Error('No hay almacén disponible.');

      const consumption = estimateRecipeConsumption(
        product.recipe,
        rawMaterialsState.materials,
        productionQuantity,
        unitSettingsState.unitSettings
      );

      const movement = createProductionMovement(
        product,
        consumption.map((c) => ({
          refType: 'raw_material' as const,
          refId: c.rawMaterialId,
          quantity: c.quantity,
        })),
        warehouse.id,
        productionQuantity,
        note
      );

      return stockMovementsState.addMovement(movement);
    },
    [
      access,
      onDenyWrite,
      warehousesState.warehouses,
      getDefaultWarehouse,
      rawMaterialsState.materials,
      unitSettingsState.unitSettings,
      stockMovementsState,
    ]
  );

  const registerProductMovement = useCallback(
    (
      product: Parameters<AppDataContextValue['registerProductMovement']>[0],
      input: Parameters<AppDataContextValue['registerProductMovement']>[1]
    ) => {
      if (!access.canManageWarehouses) {
        onDenyWrite(access.warehousesMessage);
        throw new Error(access.warehousesMessage);
      }
      const { type, warehouseId, sourceWarehouseId, quantity, note } = input;

      return stockMovementsState.addMovement({
        type,
        warehouseId,
        sourceWarehouseId,
        note,
        lines: [
          {
            refType: 'product',
            refId: product.id,
            quantity,
            unitType: product.purchaseUnit,
          },
        ],
      });
    },
    [access, onDenyWrite, stockMovementsState]
  );

  const registerProductInitialStock = useCallback(
    (
      product: Parameters<AppDataContextValue['registerProductInitialStock']>[0],
      quantity: number,
      warehouseId: string
    ) => {
      if (!access.canManageWarehouses) {
        onDenyWrite(access.warehousesMessage);
        return;
      }
      if (quantity <= 0) return;

      return stockMovementsState.addMovement({
        type: 'inventario_inicial',
        warehouseId,
        note: `Stock inicial: ${product.name}`,
        lines: [
          {
            refType: 'product',
            refId: product.id,
            quantity,
            unitType: product.purchaseUnit,
          },
        ],
      });
    },
    [access, onDenyWrite, stockMovementsState]
  );

  const saveMaterial = useCallback(
    (input: RawMaterialInput, id?: string, timestamp?: number) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        throw new Error(access.readonlyMessage);
      }
      const isNew = !id;
      if (
        isNew &&
        !access.canAddRawMaterial(
          rawMaterialsState.materials.length,
          user?.trialRawMaterialLimit
        )
      ) {
        onDenyWrite(access.trialMaterialLimitMessage(user?.trialRawMaterialLimit));
        throw new Error(access.trialMaterialLimitMessage(user?.trialRawMaterialLimit));
      }
      const previous = id
        ? rawMaterialsState.materials.find((material) => material.id === id)
        : undefined;
      const material = rawMaterialsState.saveMaterial(input, id, timestamp);

      const warehouse = getDefaultWarehouse();
      if (!warehouse || !access.canManageWarehouses) return material;

      if (isNew && input.stockQuantity > 0) {
        stockMovementsState.addMovement({
          type: 'inventario_inicial',
          warehouseId: warehouse.id,
          note: `Stock inicial: ${material.name}`,
          lines: [
            {
              refType: 'raw_material',
              refId: material.id,
              quantity: input.stockQuantity,
              unitType: material.unitType,
            },
          ],
        });
      } else if (previous && input.stockQuantity !== previous.stockQuantity) {
        const current = getStockQuantity(stockLevels, 'raw_material', material.id, warehouse.id);
        const adjustment = createStockAdjustmentMovement(
          'raw_material',
          material.id,
          warehouse.id,
          current,
          input.stockQuantity,
          material.unitType,
          'Ajuste desde insumos'
        );
        if (adjustment.lines[0]?.quantity !== 0) {
          stockMovementsState.addMovement(adjustment);
        }
      }

      return material;
    },
    [
      access,
      onDenyWrite,
      rawMaterialsState,
      getDefaultWarehouse,
      stockMovementsState,
      stockLevels,
      user?.trialRawMaterialLimit,
    ]
  );

  const deleteMaterial = useCallback(
    (id: string) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        return;
      }
      rawMaterialsState.deleteMaterial(id);
      purgeStockReferences('raw_material', id);
    },
    [access, onDenyWrite, rawMaterialsState, purgeStockReferences]
  );

  const saveProduct = useCallback(
    (
      product: Parameters<AppDataContextValue['saveProduct']>[0],
      rawMaterials = rawMaterialsState.materials,
      globalFund = globalFundState.globalFund,
      unitSettings = unitSettingsState.unitSettings
    ) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        return;
      }
      const isNew = !inventoryState.inventory.some((item) => item.id === product.id);
      if (
        isNew &&
        !access.canAddProduct(inventoryState.inventory.length, user?.trialProductLimit)
      ) {
        onDenyWrite(access.trialProductLimitMessage(user?.trialProductLimit));
        return;
      }
      inventoryState.saveProduct(
        product,
        rawMaterials,
        globalFund,
        unitSettings,
        laborShareSettingsState.laborShareSettings
      );
    },
    [
      access,
      onDenyWrite,
      inventoryState,
      rawMaterialsState.materials,
      globalFundState.globalFund,
      laborShareSettingsState.laborShareSettings,
      unitSettingsState.unitSettings,
      user?.trialProductLimit,
    ]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        return;
      }
      inventoryState.deleteProduct(
        id,
        rawMaterialsState.materials,
        globalFundState.globalFund,
        unitSettingsState.unitSettings,
        laborShareSettingsState.laborShareSettings
      );
      purgeStockReferences('product', id);
    },
    [
      access,
      onDenyWrite,
      inventoryState,
      rawMaterialsState.materials,
      globalFundState.globalFund,
      laborShareSettingsState.laborShareSettings,
      unitSettingsState.unitSettings,
      purgeStockReferences,
    ]
  );

  const saveWarehouse = useCallback(
    (...args: Parameters<typeof warehousesState.saveWarehouse>) => {
      if (!guardWarehouse()) throw new Error(access.warehousesMessage);
      return warehousesState.saveWarehouse(...args);
    },
    [guardWarehouse, access.warehousesMessage, warehousesState]
  );

  const deleteWarehouse = useCallback(
    (id: string) => {
      if (!guardWarehouse()) return;
      warehousesState.deleteWarehouse(id);
    },
    [guardWarehouse, warehousesState]
  );

  const registerMovement = useCallback(
    (input: Parameters<typeof stockMovementsState.addMovement>[0]) => {
      if (!guardWarehouse()) throw new Error(access.warehousesMessage);
      return stockMovementsState.addMovement(input);
    },
    [guardWarehouse, access.warehousesMessage, stockMovementsState]
  );

  const saveCosts = useCallback(
    (costs: Parameters<AppDataContextValue['saveCosts']>[0]) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        return;
      }
      globalCostsState.saveCosts(costs);
    },
    [access, onDenyWrite, globalCostsState]
  );

  const updateGlobalFund = useCallback(
    (updates: Parameters<AppDataContextValue['updateGlobalFund']>[0]) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        return;
      }
      globalFundState.updateGlobalFund(updates);
    },
    [access, onDenyWrite, globalFundState]
  );

  const updateLaborShareSettings = useCallback(
    (updates: Parameters<AppDataContextValue['updateLaborShareSettings']>[0]) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        return;
      }
      laborShareSettingsState.updateLaborShareSettings(updates);
    },
    [access, onDenyWrite, laborShareSettingsState]
  );

  const updateTaxSettings = useCallback(
    (updates: Parameters<AppDataContextValue['updateTaxSettings']>[0]) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        return;
      }
      taxSettingsState.updateTaxSettings(updates);
    },
    [access, onDenyWrite, taxSettingsState]
  );

  const saveUnitSettings = useCallback(
    (settings: Parameters<AppDataContextValue['saveUnitSettings']>[0]) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        return;
      }
      unitSettingsState.updateUnitSettings(settings);
    },
    [access, onDenyWrite, unitSettingsState]
  );

  const resetUnitSettings = useCallback(() => {
    if (!access.canWrite) {
      onDenyWrite(access.readonlyMessage);
      return;
    }
    unitSettingsState.resetUnitSettings();
  }, [access, onDenyWrite, unitSettingsState]);

  const recalculateAll = useCallback(
    (
      rawMaterials = rawMaterialsState.materials,
      globalFund = globalFundState.globalFund,
      unitSettings = unitSettingsState.unitSettings
    ) => {
      inventoryState.recalculateAll(
        rawMaterials,
        globalFund,
        unitSettings,
        laborShareSettingsState.laborShareSettings
      );
    },
    [
      inventoryState,
      rawMaterialsState.materials,
      globalFundState.globalFund,
      unitSettingsState.unitSettings,
      laborShareSettingsState.laborShareSettings,
    ]
  );

  const reloadFromBackup = useCallback(
    (backup: AppBackupReloadInput) => {
      const migratedLaborShare = migrateLaborShareSettings(
        backup.laborShareSettings ?? DEFAULT_LABOR_SHARE_SETTINGS
      );
      const unitSettings = backup.unitSettings ?? unitSettingsState.unitSettings;

      rawMaterialsState.replaceMaterials(backup.rawMaterials);
      globalCostsState.saveCosts(backup.globalCosts);
      globalFundState.replaceGlobalFund(backup.globalFund);
      laborShareSettingsState.replaceLaborShareSettings(migratedLaborShare);
      taxSettingsState.replaceTaxSettings(backup.taxSettings);
      if (backup.unitSettings) {
        unitSettingsState.replaceUnitSettings(backup.unitSettings);
      }
      warehousesState.setWarehousesDirect(backup.warehouses ?? []);
      locationsState.setLocationsDirect(backup.locations ?? []);
      stockMovementsState.setMovementsDirect(backup.stockMovements ?? []);
      stockThresholdsState.setThresholdsDirect(backup.stockThresholds ?? []);
      salesState.setSalesDirect(backup.sales ?? []);
      if (backup.exchangeRateSettings) {
        exchangeRatesState.replaceSettings(backup.exchangeRateSettings);
      }

      inventoryState.replaceInventory(
        backup.inventory,
        backup.rawMaterials,
        backup.globalFund,
        unitSettings,
        migratedLaborShare
      );
    },
    [
      inventoryState,
      rawMaterialsState,
      globalCostsState,
      globalFundState,
      laborShareSettingsState,
      taxSettingsState,
      unitSettingsState,
      warehousesState,
      locationsState,
      stockMovementsState,
      stockThresholdsState,
      salesState,
      exchangeRatesState,
    ]
  );

  useEffect(() => {
    return onSyncReload(() => {
      void (async () => {
        const data = await sync.collectLocalData();
        reloadFromBackup(data);
      })();
    });
  }, [reloadFromBackup, sync]);

  const saveLocation = useCallback(
    (input: LocationInput, id?: string, timestamp?: number) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        throw new Error(access.readonlyMessage);
      }
      return locationsState.saveLocation(input, id, timestamp);
    },
    [access, onDenyWrite, locationsState]
  );

  const deleteLocation = useCallback(
    (id: string) => {
      if (!access.canWrite) {
        onDenyWrite(access.readonlyMessage);
        return;
      }
      locationsState.deleteLocation(id);
    },
    [access, onDenyWrite, locationsState]
  );

  const addSales = useCallback(
    (records: Parameters<AppDataContextValue['addSales']>[0]) => {
      if (!access.canManageWarehouses) {
        onDenyWrite(access.warehousesMessage);
        return;
      }
      salesState.addSales(records);
    },
    [access, onDenyWrite, salesState]
  );

  const refreshExchangeRates = useCallback(
    async (force?: boolean) => {
      const snapshot = await exchangeRatesState.refreshRates(force);
      return snapshot ?? null;
    },
    [exchangeRatesState.refreshRates]
  );

  return {
    hydrated,
    user,
    inventory: inventoryState.inventory,
    materials: rawMaterialsState.materials,
    globalCosts: globalCostsState.globalCosts,
    globalFund: globalFundState.globalFund,
    laborShareSettings: laborShareSettingsState.laborShareSettings,
    taxSettings: taxSettingsState.taxSettings,
    unitSettings: unitSettingsState.unitSettings,
    locations: ensureDefaultLocations(locationsState.locations),
    warehouses: warehousesState.warehouses,
    stockMovements: stockMovementsState.movements,
    stockThresholds: stockThresholdsState.thresholds,
    sales: salesState.sales,
    stockLevels,
    stockValuation,
    stockAlerts,
    exchangeSettings: exchangeRatesState.exchangeSettings,
    exchangeSnapshot: exchangeRatesState.snapshot,
    exchangeRefreshing: exchangeRatesState.refreshing,
    exchangeError: exchangeRatesState.error,
    refreshExchangeRates,
    updateExchangeSettings: exchangeRatesState.updateSettings,
    markCostingRate: exchangeRatesState.markCostingRate,
    saveProduct,
    deleteProduct,
    recalculateAll,
    saveMaterial,
    deleteMaterial,
    updateStock,
    saveCosts,
    updateGlobalFund,
    updateLaborShareSettings,
    updateTaxSettings,
    saveUnitSettings,
    resetUnitSettings,
    saveLocation,
    deleteLocation,
    saveWarehouse,
    deleteWarehouse,
    registerMovement,
    deleteMovement: stockMovementsState.deleteMovement,
    saveStockThreshold: stockThresholdsState.saveThreshold,
    deleteStockThreshold: stockThresholdsState.deleteThreshold,
    registerProduction,
    registerProductMovement,
    registerProductInitialStock,
    getDefaultWarehouse,
    getDefaultLocation,
    addSales,
    reloadFromBackup,
    cloudSync,
    access,
  };
}
