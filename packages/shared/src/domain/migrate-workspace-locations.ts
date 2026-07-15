import type { Location } from './location';
import { ensureDefaultLocations, getDefaultLocationId } from './location';
import type { SaleRecord } from './sales';
import type { StockMovement, Warehouse } from './types';

export interface WorkspaceLocationData {
  locations?: Location[];
  warehouses?: Warehouse[];
  stockMovements?: StockMovement[];
  sales?: SaleRecord[];
}

export function migrateWorkspaceLocations<T extends WorkspaceLocationData>(
  workspace: T,
  timestamp = Date.now()
): T & { locations: Location[]; warehouses: Warehouse[]; stockMovements: StockMovement[]; sales: SaleRecord[] } {
  const locations = ensureDefaultLocations(workspace.locations, timestamp);
  const defaultLocationId = getDefaultLocationId(locations);

  const warehouses = (workspace.warehouses ?? []).map((warehouse) =>
    warehouse.locationId ? warehouse : { ...warehouse, locationId: defaultLocationId }
  );

  const stockMovements = (workspace.stockMovements ?? []).map((movement) =>
    movement.locationId ? movement : { ...movement, locationId: defaultLocationId }
  );

  return {
    ...workspace,
    locations,
    warehouses,
    stockMovements,
    sales: workspace.sales ?? [],
  };
}
