import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type {
  GlobalFundSettings,
  IndirectCost,
  LaborShareSettings,
  ProductCalculation,
  RawMaterial,
  RawMaterialInput,
  StockMovement,
  TaxSettings,
  UnitSettings,
  Warehouse,
} from '@costify/shared/domain/types';
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
import type { ExchangeRateSettings } from '@costify/shared/domain/exchange-rates';
import type { StockThreshold } from '@costify/shared/domain/types';
import { migrateLaborShareSettings } from '@costify/shared/domain/calculations/labor-share';
import { DEFAULT_LABOR_SHARE_SETTINGS } from '@costify/shared/domain/constants';
import { onSyncReload, useSyncApi, createWorkspaceAccessGates } from '@costify/client-data';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCloudSync } from '@/hooks/use-cloud-sync';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { useGlobalCosts } from '@/hooks/use-global-costs';
import { useGlobalFund } from '@/hooks/use-global-fund';
import { useLaborShareSettings } from '@/hooks/use-labor-share-settings';
import { useInventory } from '@/hooks/use-inventory';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useStockMovements } from '@/hooks/use-stock-movements';
import { useStockThresholds } from '@/hooks/use-stock-thresholds';
import { useTaxSettings } from '@/hooks/use-tax-settings';
import { useUnitSettings } from '@/hooks/use-unit-settings';
import { useWarehouses } from '@/hooks/use-warehouses';

interface AppDataContextValue {
  hydrated: boolean;
  inventory: ProductCalculation[];
  materials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  laborShareSettings: LaborShareSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  stockThresholds: StockThreshold[];
  stockLevels: ReturnType<typeof calculateStockLevels>;
  stockValuation: ReturnType<typeof calculateStockValuation>;
  stockAlerts: ReturnType<typeof getStockAlerts>;
  exchangeSettings: ExchangeRateSettings;
  saveProduct: (
    product: ProductCalculation,
    rawMaterials?: RawMaterial[],
    globalFund?: GlobalFundSettings,
    unitSettings?: UnitSettings
  ) => void;
  deleteProduct: (id: string) => void;
  recalculateAll: () => void;
  saveMaterial: (input: RawMaterialInput, id?: string, timestamp?: number) => RawMaterial;
  deleteMaterial: (id: string) => void;
  updateStock: (id: string, stockQuantity: number) => void;
  saveCosts: (costs: IndirectCost[]) => void;
  updateGlobalFund: (updates: Partial<GlobalFundSettings>) => void;
  updateLaborShareSettings: (updates: Partial<LaborShareSettings>) => void;
  updateTaxSettings: (updates: Partial<TaxSettings>) => void;
  saveUnitSettings: (settings: UnitSettings) => void;
  resetUnitSettings: () => void;
  saveWarehouse: (
    input: Omit<Warehouse, 'id' | 'timestamp'>,
    id?: string,
    timestamp?: number
  ) => Warehouse;
  deleteWarehouse: (id: string) => void;
  registerMovement: (input: Omit<StockMovement, 'id' | 'timestamp'>) => StockMovement;
  deleteMovement: (id: string) => void;
  saveStockThreshold: (input: Omit<StockThreshold, 'id'>, id?: string) => void;
  deleteStockThreshold: (id: string) => void;
  registerProduction: (
    product: ProductCalculation,
    productionQuantity: number,
    warehouseId?: string,
    note?: string
  ) => StockMovement;
  registerProductMovement: (
    product: ProductCalculation,
    input: {
      type: StockMovement['type'];
      warehouseId: string;
      sourceWarehouseId?: string;
      quantity: number;
      note?: string;
    }
  ) => StockMovement;
  registerProductInitialStock: (
    product: ProductCalculation,
    quantity: number,
    warehouseId: string
  ) => StockMovement | undefined;
  getDefaultWarehouse: () => Warehouse | undefined;
  reloadFromBackup: (backup: {
    inventory: ProductCalculation[];
    rawMaterials: RawMaterial[];
    globalCosts: IndirectCost[];
    globalFund: GlobalFundSettings;
    laborShareSettings?: LaborShareSettings;
    taxSettings: TaxSettings;
    unitSettings?: UnitSettings;
    warehouses?: Warehouse[];
    stockMovements?: StockMovement[];
    stockThresholds?: StockThreshold[];
    exchangeRateSettings?: ExchangeRateSettings;
  }) => void;
  cloudSync: ReturnType<typeof useCloudSync>;
  access: ReturnType<typeof createWorkspaceAccessGates>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
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
      laborShareSettingsState.laborShareSettings,
      taxSettingsState.taxSettings,
      unitSettingsState.unitSettings,
      warehousesState.warehouses,
      stockMovementsState.movements,
      stockThresholdsState.thresholds,
      exchangeRatesState.exchangeSettings,
    ]
  );

  const cloudSync = useCloudSync({
    enabled: hydrated && Boolean(user?.workspaceId && user?.tenantId && access.canSync),
    data: syncData,
    tenantId: user?.tenantId,
    workspaceId: user?.workspaceId,
  });

  const denyWrite = useCallback(
    (message: string) => {
      showToast(message, 'error');
      return true;
    },
    [showToast]
  );

  const getDefaultWarehouse = useCallback((): Warehouse | undefined => {
    const active = warehousesState.warehouses.filter((w) => w.active);
    return (
      active.find((w) => w.type === 'principal') ??
      active[0] ??
      warehousesState.warehouses[0]
    );
  }, [warehousesState.warehouses]);

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
    hydrated,
  ]);

  const registerMovement = useCallback(
    (input: Omit<StockMovement, 'id' | 'timestamp'>) => {
      if (!access.canManageWarehouses) {
        denyWrite(access.warehousesMessage);
        throw new Error(access.warehousesMessage);
      }
      return stockMovementsState.addMovement(input);
    },
    [access, denyWrite, stockMovementsState]
  );

  const updateStock = useCallback(
    (id: string, stockQuantity: number) => {
      if (!access.canManageWarehouses) {
        denyWrite(access.warehousesMessage);
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
    [getDefaultWarehouse, stockLevels, rawMaterialsState, stockMovementsState]
  );

  const registerProduction = useCallback(
    (
      product: ProductCalculation,
      productionQuantity: number,
      warehouseId?: string,
      note?: string
    ) => {
      if (!access.canManageWarehouses) {
        denyWrite(access.warehousesMessage);
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
      denyWrite,
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
      if (!access.canManageWarehouses) {
        denyWrite(access.warehousesMessage);
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
    [access, denyWrite, stockMovementsState]
  );

  const registerProductInitialStock = useCallback(
    (product: ProductCalculation, quantity: number, warehouseId: string) => {
      if (!access.canManageWarehouses) {
        denyWrite(access.warehousesMessage);
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
    [access, denyWrite, stockMovementsState]
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
      if (!access.canWrite) {
        denyWrite(access.readonlyMessage);
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
        denyWrite(access.trialMaterialLimitMessage(user?.trialRawMaterialLimit));
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
    [access, denyWrite, rawMaterialsState, getDefaultWarehouse, stockMovementsState, stockLevels, user?.trialRawMaterialLimit]
  );

  const deleteMaterial = useCallback(
    (id: string) => {
      if (!access.canWrite) {
        denyWrite(access.readonlyMessage);
        return;
      }
      rawMaterialsState.deleteMaterial(id);
      purgeStockReferences('raw_material', id);
    },
    [access, denyWrite, rawMaterialsState, purgeStockReferences]
  );

  const saveProduct = useCallback(
    (
      product: ProductCalculation,
      rawMaterials: RawMaterial[] = rawMaterialsState.materials,
      globalFund: GlobalFundSettings = globalFundState.globalFund,
      unitSettings: UnitSettings = unitSettingsState.unitSettings
    ) => {
      if (!access.canWrite) {
        denyWrite(access.readonlyMessage);
        return;
      }
      const isNew = !inventoryState.inventory.some((item) => item.id === product.id);
      if (
        isNew &&
        !access.canAddProduct(
          inventoryState.inventory.length,
          user?.trialProductLimit
        )
      ) {
        denyWrite(access.trialProductLimitMessage(user?.trialProductLimit));
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
      denyWrite,
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
        denyWrite(access.readonlyMessage);
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
      denyWrite,
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
      if (!access.canManageWarehouses) {
        denyWrite(access.warehousesMessage);
        throw new Error(access.warehousesMessage);
      }
      return warehousesState.saveWarehouse(...args);
    },
    [access, denyWrite, warehousesState]
  );

  const deleteWarehouse = useCallback(
    (id: string) => {
      if (!access.canManageWarehouses) {
        denyWrite(access.warehousesMessage);
        return;
      }
      warehousesState.deleteWarehouse(id);
    },
    [access, denyWrite, warehousesState]
  );

  const saveCosts = useCallback(
    (costs: IndirectCost[]) => {
      if (!access.canWrite) {
        denyWrite(access.readonlyMessage);
        return;
      }
      globalCostsState.saveCosts(costs);
    },
    [access, denyWrite, globalCostsState]
  );

  const updateGlobalFund = useCallback(
    (updates: Partial<GlobalFundSettings>) => {
      if (!access.canWrite) {
        denyWrite(access.readonlyMessage);
        return;
      }
      globalFundState.updateGlobalFund(updates);
    },
    [access, denyWrite, globalFundState]
  );

  const updateLaborShareSettings = useCallback(
    (updates: Partial<LaborShareSettings>) => {
      if (!access.canWrite) {
        denyWrite(access.readonlyMessage);
        return;
      }
      laborShareSettingsState.updateLaborShareSettings(updates);
    },
    [access, denyWrite, laborShareSettingsState]
  );

  const updateTaxSettings = useCallback(
    (updates: Partial<TaxSettings>) => {
      if (!access.canWrite) {
        denyWrite(access.readonlyMessage);
        return;
      }
      taxSettingsState.updateTaxSettings(updates);
    },
    [access, denyWrite, taxSettingsState]
  );

  const saveUnitSettings = useCallback(
    (settings: UnitSettings) => {
      if (!access.canWrite) {
        denyWrite(access.readonlyMessage);
        return;
      }
      unitSettingsState.updateUnitSettings(settings);
    },
    [access, denyWrite, unitSettingsState]
  );

  const resetUnitSettings = useCallback(() => {
    if (!access.canWrite) {
      denyWrite(access.readonlyMessage);
      return;
    }
    unitSettingsState.resetUnitSettings();
  }, [access, denyWrite, unitSettingsState]);

  const recalculateAll = useCallback(() => {
    inventoryState.recalculateAll(
      rawMaterialsState.materials,
      globalFundState.globalFund,
      unitSettingsState.unitSettings,
      laborShareSettingsState.laborShareSettings
    );
  }, [
    inventoryState,
    rawMaterialsState.materials,
    globalFundState.globalFund,
    laborShareSettingsState.laborShareSettings,
    unitSettingsState.unitSettings,
  ]);

  const reloadFromBackup = useCallback(
    (backup: {
      inventory: ProductCalculation[];
      rawMaterials: RawMaterial[];
      globalCosts: IndirectCost[];
      globalFund: GlobalFundSettings;
      laborShareSettings?: LaborShareSettings;
      taxSettings: TaxSettings;
      unitSettings?: UnitSettings;
      warehouses?: Warehouse[];
      stockMovements?: StockMovement[];
      stockThresholds?: StockThreshold[];
      exchangeRateSettings?: ExchangeRateSettings;
    }) => {
      inventoryState.replaceInventory(backup.inventory);
      rawMaterialsState.replaceMaterials(backup.rawMaterials);
      globalCostsState.saveCosts(backup.globalCosts);
      globalFundState.replaceGlobalFund(backup.globalFund);
      laborShareSettingsState.replaceLaborShareSettings(
        migrateLaborShareSettings(backup.laborShareSettings ?? DEFAULT_LABOR_SHARE_SETTINGS)
      );
      taxSettingsState.replaceTaxSettings(backup.taxSettings);
      if (backup.unitSettings) {
        unitSettingsState.replaceUnitSettings(backup.unitSettings);
      }
      warehousesState.setWarehousesDirect(backup.warehouses ?? []);
      stockMovementsState.setMovementsDirect(backup.stockMovements ?? []);
      stockThresholdsState.setThresholdsDirect(backup.stockThresholds ?? []);
      if (backup.exchangeRateSettings) {
        exchangeRatesState.replaceSettings(backup.exchangeRateSettings);
      }
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
      stockMovementsState,
      stockThresholdsState,
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

  const value = useMemo<AppDataContextValue>(
    () => ({
      hydrated,
      inventory: inventoryState.inventory,
      materials: rawMaterialsState.materials,
      globalCosts: globalCostsState.globalCosts,
      globalFund: globalFundState.globalFund,
      laborShareSettings: laborShareSettingsState.laborShareSettings,
      taxSettings: taxSettingsState.taxSettings,
      unitSettings: unitSettingsState.unitSettings,
      warehouses: warehousesState.warehouses,
      stockMovements: stockMovementsState.movements,
      stockThresholds: stockThresholdsState.thresholds,
      stockLevels,
      stockValuation,
      stockAlerts,
      exchangeSettings: exchangeRatesState.exchangeSettings,
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
      reloadFromBackup,
      cloudSync,
      access,
    }),
    [
      hydrated,
      inventoryState,
      rawMaterialsState,
      globalCostsState,
      globalFundState,
      taxSettingsState,
      unitSettingsState,
      warehousesState,
      stockMovementsState,
      stockThresholdsState,
      exchangeRatesState,
      stockLevels,
      stockValuation,
      stockAlerts,
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
      saveWarehouse,
      deleteWarehouse,
      registerMovement,
      registerProduction,
      registerProductMovement,
      registerProductInitialStock,
      getDefaultWarehouse,
      reloadFromBackup,
      cloudSync,
      access,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
