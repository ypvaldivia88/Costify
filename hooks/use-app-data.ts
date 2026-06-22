'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useInventory } from '@/hooks/use-inventory';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useGlobalCosts } from '@/hooks/use-global-costs';
import { useGlobalFund } from '@/hooks/use-global-fund';
import { useTaxSettings } from '@/hooks/use-tax-settings';
import { useUnitSettings } from '@/hooks/use-unit-settings';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useStockMovements } from '@/hooks/use-stock-movements';
import { useStockThresholds } from '@/hooks/use-stock-thresholds';
import { useCloudSync } from '@/hooks/use-cloud-sync';
import type { ProductCalculation, StockMovement, Warehouse } from '@/lib/domain/types';
import {
  calculateStockLevels,
  createInitialStockMovements,
  createProductionMovement,
  createStockAdjustmentMovement,
  DEFAULT_WAREHOUSE_PRESETS,
  estimateRecipeConsumption,
  getStockAlerts,
  getStockQuantity,
  calculateStockValuation,
  syncRawMaterialStockFromLevels,
} from '@/lib/domain/calculations';

export function useAppData() {
  const { user } = useAuth();
  const inventoryState = useInventory();
  const rawMaterialsState = useRawMaterials();
  const globalCostsState = useGlobalCosts();
  const globalFundState = useGlobalFund();
  const taxSettingsState = useTaxSettings();
  const unitSettingsState = useUnitSettings();
  const warehousesState = useWarehouses();
  const stockMovementsState = useStockMovements();
  const stockThresholdsState = useStockThresholds();
  const migrationDone = useRef(false);

  const hydrated =
    inventoryState.hydrated &&
    rawMaterialsState.hydrated &&
    globalCostsState.hydrated &&
    globalFundState.hydrated &&
    taxSettingsState.hydrated &&
    unitSettingsState.hydrated &&
    warehousesState.hydrated &&
    stockMovementsState.hydrated &&
    stockThresholdsState.hydrated;

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
      taxSettings: taxSettingsState.taxSettings,
      unitSettings: unitSettingsState.unitSettings,
      warehouses: warehousesState.warehouses,
      stockMovements: stockMovementsState.movements,
      stockThresholds: stockThresholdsState.thresholds,
    }),
    [
      inventoryState.inventory,
      rawMaterialsState.materials,
      globalCostsState.globalCosts,
      globalFundState.globalFund,
      taxSettingsState.taxSettings,
      unitSettingsState.unitSettings,
      warehousesState.warehouses,
      stockMovementsState.movements,
      stockThresholdsState.thresholds,
    ]
  );

  const cloudSync = useCloudSync({
    enabled: hydrated && Boolean(user?.workspaceId && user?.tenantId),
    data: syncData,
    tenantId: user?.tenantId,
    workspaceId: user?.workspaceId,
  });

  const getDefaultWarehouse = useCallback((): Warehouse | undefined => {
    const active = warehousesState.warehouses.filter((w) => w.active);
    return (
      active.find((w) => w.type === 'principal') ??
      active[0] ??
      warehousesState.warehouses[0]
    );
  }, [warehousesState.warehouses]);

  // Migración: crear almacén por defecto y movimientos iniciales desde stock de insumos
  useEffect(() => {
    if (!hydrated || migrationDone.current) return;

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
  }, [hydrated, warehousesState, rawMaterialsState.materials, stockMovementsState, getDefaultWarehouse]);

  // Sincronizar stockQuantity de insumos desde movimientos de almacén
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
      unitSettingsState.unitSettings
    );
  }, [
    globalFundState.globalFund.enabled,
    globalFundState.globalFund.percent,
    unitSettingsState.unitSettings,
    hydrated,
  ]);

  const registerMovement = useCallback(
    (input: Omit<StockMovement, 'id' | 'timestamp'>) => {
      return stockMovementsState.addMovement(input);
    },
    [stockMovementsState]
  );

  const updateStock = useCallback(
    (id: string, stockQuantity: number) => {
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
    [getDefaultWarehouse, stockLevels, rawMaterialsState, stockMovementsState]
  );

  const registerProduction = useCallback(
    (
      product: ProductCalculation,
      productionQuantity: number,
      warehouseId?: string,
      note?: string
    ) => {
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
      warehousesState.warehouses,
      getDefaultWarehouse,
      rawMaterialsState.materials,
      unitSettingsState.unitSettings,
      stockMovementsState,
    ]
  );

  return {
    hydrated,
    user,
    inventory: inventoryState.inventory,
    materials: rawMaterialsState.materials,
    globalCosts: globalCostsState.globalCosts,
    globalFund: globalFundState.globalFund,
    taxSettings: taxSettingsState.taxSettings,
    unitSettings: unitSettingsState.unitSettings,
    warehouses: warehousesState.warehouses,
    stockMovements: stockMovementsState.movements,
    stockThresholds: stockThresholdsState.thresholds,
    stockLevels,
    stockValuation,
    stockAlerts,
    cloudSync,
    saveProduct: inventoryState.saveProduct,
    deleteProduct: inventoryState.deleteProduct,
    recalculateAll: inventoryState.recalculateAll,
    saveMaterial: rawMaterialsState.saveMaterial,
    deleteMaterial: rawMaterialsState.deleteMaterial,
    updateStock,
    saveCosts: globalCostsState.saveCosts,
    updateGlobalFund: globalFundState.updateGlobalFund,
    updateTaxSettings: taxSettingsState.updateTaxSettings,
    saveUnitSettings: unitSettingsState.updateUnitSettings,
    resetUnitSettings: unitSettingsState.resetUnitSettings,
    saveWarehouse: warehousesState.saveWarehouse,
    deleteWarehouse: warehousesState.deleteWarehouse,
    registerMovement,
    deleteMovement: stockMovementsState.deleteMovement,
    saveStockThreshold: stockThresholdsState.saveThreshold,
    deleteStockThreshold: stockThresholdsState.deleteThreshold,
    registerProduction,
    getDefaultWarehouse,
  };
}
