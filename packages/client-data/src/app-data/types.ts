import type { ExchangeRateSettings, ExchangeRateSnapshot } from '@costify/shared/domain/exchange-rates';
import type {
  GlobalFundSettings,
  IndirectCost,
  LaborShareSettings,
  ProductCalculation,
  RawMaterial,
  RawMaterialInput,
  StockAlert,
  StockLevel,
  StockMovement,
  StockThreshold,
  TaxSettings,
  UnitSettings,
  Warehouse,
} from '@costify/shared/domain/types';
import type { createWorkspaceAccessGates } from '../access/workspace-access';
import type { useCloudSync } from '../hooks/use-cloud-sync';
import type { AccessLevel } from '../auth/types';

export interface AppDataUser {
  accessLevel?: AccessLevel;
  workspaceId?: string;
  tenantId?: string;
  trialProductLimit?: number;
  trialRawMaterialLimit?: number;
}

export interface AppBackupReloadInput {
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
}

export interface AppDataContextValue {
  hydrated: boolean;
  user: AppDataUser | null;
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
  stockLevels: StockLevel[];
  stockValuation: {
    rawMaterialsValue: number;
    productsValue: number;
    totalValue: number;
  };
  stockAlerts: StockAlert[];
  exchangeSettings: ExchangeRateSettings;
  exchangeSnapshot: ExchangeRateSnapshot | null;
  exchangeRefreshing: boolean;
  exchangeError: string | null;
  refreshExchangeRates: (force?: boolean) => Promise<ExchangeRateSnapshot | null>;
  updateExchangeSettings: (updates: Partial<ExchangeRateSettings>) => void;
  markCostingRate: (usdRate: number) => void;
  saveProduct: (
    product: ProductCalculation,
    rawMaterials?: RawMaterial[],
    globalFund?: GlobalFundSettings,
    unitSettings?: UnitSettings
  ) => void;
  deleteProduct: (id: string) => void;
  recalculateAll: (
    rawMaterials?: RawMaterial[],
    globalFund?: GlobalFundSettings,
    unitSettings?: UnitSettings
  ) => void;
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
  reloadFromBackup: (backup: AppBackupReloadInput) => void;
  cloudSync: ReturnType<typeof useCloudSync>;
  access: ReturnType<typeof createWorkspaceAccessGates>;
}
