import type {
  GlobalFundSettings,
  IndirectCost,
  LaborShareSettings,
  ProductCalculation,
  RawMaterial,
  StockMovement,
  StockThreshold,
  TaxSettings,
  UnitSettings,
  Warehouse,
} from '@costify/shared/domain/types';
import type { ExchangeRateSettings } from '@costify/shared/domain/exchange-rates';
import { migrateExchangeRateSettings } from '@costify/shared/domain/migrate-exchange-rates';

export const WORKSPACES_COLLECTION = 'workspaces';

export interface WorkspaceDocument {
  workspaceId: string;
  tenantId: string;
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  laborShareSettings?: LaborShareSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  stockThresholds: StockThreshold[];
  exchangeRateSettings?: ExchangeRateSettings;
  updatedAt: number;
  createdAt: number;
}

export type WorkspacePayload = Omit<WorkspaceDocument, 'createdAt'>;
