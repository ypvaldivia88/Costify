import type {
  GlobalFundSettings,
  IndirectCost,
  ProductCalculation,
  RawMaterial,
  StockMovement,
  StockThreshold,
  TaxSettings,
  UnitSettings,
  Warehouse,
} from '@/lib/domain/types';
import type { ExchangeRateSettings } from '@/lib/domain/exchange-rates';
import { migrateExchangeRateSettings } from '@/lib/domain/migrate-exchange-rates';

export const WORKSPACES_COLLECTION = 'workspaces';

export interface WorkspaceDocument {
  workspaceId: string;
  tenantId: string;
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
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
