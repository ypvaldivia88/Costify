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
import type { Location } from '@costify/shared/domain/location';
import type { SaleRecord } from '@costify/shared/domain/sales';
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
  locations?: Location[];
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  stockThresholds: StockThreshold[];
  sales?: SaleRecord[];
  exchangeRateSettings?: ExchangeRateSettings;
  updatedAt: number;
  createdAt: number;
}

export type WorkspacePayload = Omit<WorkspaceDocument, 'createdAt'>;
