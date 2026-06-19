import type {
  GlobalFundSettings,
  IndirectCost,
  ProductCalculation,
  RawMaterial,
  TaxSettings,
  UnitSettings,
} from '@/lib/domain/types';

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
  updatedAt: number;
  createdAt: number;
}

export type WorkspacePayload = Omit<WorkspaceDocument, 'createdAt'>;
