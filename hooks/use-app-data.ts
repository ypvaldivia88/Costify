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
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import type { ProductCalculation, RawMaterialInput, StockMovement, Warehouse } from '@/lib/domain/types';
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
  const exchangeRatesState = useExchangeRates();
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
      taxSettings: taxSettingsState.taxSettings,
      unitSettings: unitSettingsState.unitSettings,
      warehouses: warehousesState.warehouses,
      stockMovements: stockMovementsState.movements,
      stockThresholds: stockThresholdsState.thresholds,
      exchangeRateSettings: exchangeRatesState.exchangeSettings,
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
      exchangeRatesState.exchangeSettings,
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

  const registerProductMovement = useCallback(
    (
      product: ProductCalculation,
      input: {
        type: StockMovement['type'];
        warehouseId: string;
        sourceWarehouseId?: string;
        quantity: number;
        note?: string;
      }
    ) => {
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
    [stockMovementsState]
  );

  const registerProductInitialStock = useCallback(
    (product: ProductCalculation, quantity: number, warehouseId: string) => {
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
    [stockMovementsState]
  );

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

  const saveMaterial = useCallback(
    (input: RawMaterialInput, id?: string, timestamp?: number) => {
      const isNew = !id;
      const previous = id
        ? rawMaterialsState.materials.find((material) => material.id === id)
        : undefined;
      const material = rawMaterialsState.saveMaterial(input, id, timestamp);

      const warehouse = getDefaultWarehouse();
      if (!warehouse) return material;

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
    [rawMaterialsState, getDefaultWarehouse, stockMovementsState, stockLevels]
  );

  const deleteMaterial = useCallback(
    (id: string) => {
      rawMaterialsState.deleteMaterial(id);
      purgeStockReferences('raw_material', id);
    },
    [rawMaterialsState, purgeStockReferences]
  );

  const deleteProduct = useCallback(
    (
      id: string,
      rawMaterials: Parameters<typeof inventoryState.deleteProduct>[1],
      globalFund: Parameters<typeof inventoryState.deleteProduct>[2],
      unitSettings: Parameters<typeof inventoryState.deleteProduct>[3]
    ) => {
      inventoryState.deleteProduct(id, rawMaterials, globalFund, unitSettings);
      purgeStockReferences('product', id);
    },
    [inventoryState, purgeStockReferences]
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
    exchangeSettings: exchangeRatesState.exchangeSettings,
    exchangeSnapshot: exchangeRatesState.snapshot,
    exchangeRefreshing: exchangeRatesState.refreshing,
    exchangeError: exchangeRatesState.error,
    refreshExchangeRates: exchangeRatesState.refreshRates,
    updateExchangeSettings: exchangeRatesState.updateSettings,
    markCostingRate: exchangeRatesState.markCostingRate,
    saveProduct: inventoryState.saveProduct,
    deleteProduct,
    recalculateAll: inventoryState.recalculateAll,
    saveMaterial,
    deleteMaterial,
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
    registerProductMovement,
    registerProductInitialStock,
    getDefaultWarehouse,
  };
}
