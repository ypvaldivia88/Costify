import { getDb } from '@/lib/db/mongodb';
import { hashPassword } from '@/lib/auth/password';
import { TENANTS_COLLECTION, USERS_COLLECTION, type TenantDocument } from '@/lib/auth/types';
import { WORKSPACES_COLLECTION, type WorkspaceDocument } from '@/lib/db/workspace';
import { syncSubscriptionWithActiveLocations } from '@/lib/auth/sync-subscription-locations';
import { migrateWorkspaceLocations } from '@costify/shared/domain/migrate-workspace-locations';
import {
  activateSubscription,
  ensureTenantSubscription,
} from '@costify/shared/domain/subscription';
import type { Location } from '@costify/shared/domain/location';
import type { SaleRecord } from '@costify/shared/domain/sales';
import type { ProductCalculation, StockMovement, Warehouse } from '@costify/shared/domain/types';
import { buildDemoWorkspace, DEMO, DEMO_IDS } from '../../scripts/seed-demo-tenant';

const LOCATION_IDS = {
  main: 'demo-loc-main',
  centro: 'demo-loc-centro',
  playa: 'demo-loc-playa',
} as const;

const WAREHOUSE_PLAYA = 'demo-wh-playa';

function buildDemoLocations(now: number): Location[] {
  return [
    {
      id: LOCATION_IDS.main,
      name: 'Local principal',
      code: 'MAIN',
      active: true,
      address: 'Avenida Salvador Allende #45',
      timestamp: now,
    },
    {
      id: LOCATION_IDS.centro,
      name: 'Sucursal Centro',
      code: 'CENTRO',
      active: true,
      address: 'Calle Obispo #12, La Habana Vieja',
      timestamp: now,
    },
    {
      id: LOCATION_IDS.playa,
      name: 'Sucursal Playa',
      code: 'PLAYA',
      active: true,
      address: '1ra y 70, Miramar',
      timestamp: now,
    },
  ];
}

function attachPosSkus(inventory: ProductCalculation[]): ProductCalculation[] {
  const skuById: Record<string, string> = {
    [DEMO_IDS.products.refresco]: 'REFRESCO_355',
    [DEMO_IDS.products.panSobao]: 'PAN_SOBAO',
    [DEMO_IDS.products.pastel]: 'PASTEL_QUESO',
  };

  return inventory.map((product) => ({
    ...product,
    posSku: skuById[product.id] ?? product.posSku,
  }));
}

function assignWarehouseLocations(warehouses: Warehouse[], now: number): Warehouse[] {
  const playaWarehouse: Warehouse = {
    id: WAREHOUSE_PLAYA,
    name: 'Mostrador Playa',
    type: 'venta',
    active: true,
    locationId: LOCATION_IDS.playa,
    timestamp: now,
  };

  return [
    ...warehouses.map((warehouse) => {
      if (warehouse.id === DEMO_IDS.warehouses.principal) {
        return { ...warehouse, locationId: LOCATION_IDS.main };
      }
      if (warehouse.id === DEMO_IDS.warehouses.venta) {
        return { ...warehouse, locationId: LOCATION_IDS.centro };
      }
      if (warehouse.id === DEMO_IDS.warehouses.produccion) {
        return { ...warehouse, locationId: LOCATION_IDS.main };
      }
      return warehouse;
    }),
    playaWarehouse,
  ];
}

function buildReconciliationDemoData(now: number): {
  sales: SaleRecord[];
  stockMovements: StockMovement[];
} {
  const soldAtCentro = Date.parse('2026-07-14T12:00:00.000Z');
  const soldAtPlaya = Date.parse('2026-07-14T18:00:00.000Z');

  const sales: SaleRecord[] = [
    {
      id: 'demo-sale-centro-2026-07-14',
      locationId: LOCATION_IDS.centro,
      soldAt: soldAtCentro,
      source: 'import',
      note: 'Cierre caja POS — Centro',
      lines: [{ productId: DEMO_IDS.products.refresco, quantity: 15, unitPrice: 180 }],
    },
    {
      id: 'demo-sale-playa-2026-07-14',
      locationId: LOCATION_IDS.playa,
      soldAt: soldAtPlaya,
      source: 'import',
      note: 'Cierre caja POS — Playa',
      lines: [
        { productId: DEMO_IDS.products.panSobao, quantity: 20, unitPrice: 45 },
        { productId: DEMO_IDS.products.pastel, quantity: 5, unitPrice: 350 },
      ],
    },
  ];

  const stockMovements: StockMovement[] = [
    {
      id: 'demo-mv-venta-centro-refresco',
      type: 'venta',
      warehouseId: DEMO_IDS.warehouses.venta,
      locationId: LOCATION_IDS.centro,
      note: 'Salida por ventas POS (parcial vs cierre)',
      timestamp: soldAtCentro + 60_000,
      lines: [{ refType: 'product', refId: DEMO_IDS.products.refresco, quantity: 12, unitType: 'ud' }],
    },
    {
      id: 'demo-mv-venta-playa-pan',
      type: 'venta',
      warehouseId: WAREHOUSE_PLAYA,
      locationId: LOCATION_IDS.playa,
      note: 'Salida pan sobao — coincide con POS',
      timestamp: soldAtPlaya + 60_000,
      lines: [{ refType: 'product', refId: DEMO_IDS.products.panSobao, quantity: 20, unitType: 'ud' }],
    },
    {
      id: 'demo-mv-venta-playa-pastel',
      type: 'venta',
      warehouseId: WAREHOUSE_PLAYA,
      locationId: LOCATION_IDS.playa,
      note: 'Salida pastel — menor que cierre POS',
      timestamp: soldAtPlaya + 120_000,
      lines: [{ refType: 'product', refId: DEMO_IDS.products.pastel, quantity: 3, unitType: 'ud' }],
    },
  ];

  return { sales, stockMovements };
}

function enhanceWorkspaceForMultilocal(
  workspace: WorkspaceDocument,
  now: number
): WorkspaceDocument {
  const locations = buildDemoLocations(now);
  const warehouses = assignWarehouseLocations(workspace.warehouses, now);
  const inventory = attachPosSkus(workspace.inventory);
  const { sales, stockMovements: reconciliationMovements } = buildReconciliationDemoData(now);

  const stockMovements = workspace.stockMovements.map((movement) => {
    if (movement.warehouseId === DEMO_IDS.warehouses.principal) {
      return { ...movement, locationId: LOCATION_IDS.main };
    }
    if (movement.warehouseId === DEMO_IDS.warehouses.venta) {
      return { ...movement, locationId: LOCATION_IDS.centro };
    }
    if (movement.warehouseId === DEMO_IDS.warehouses.produccion) {
      return { ...movement, locationId: LOCATION_IDS.main };
    }
    return movement;
  });

  return migrateWorkspaceLocations(
    {
      ...workspace,
      locations,
      warehouses,
      inventory,
      stockMovements: [...stockMovements, ...reconciliationMovements],
      sales,
      updatedAt: now,
    },
    now
  );
}

async function findDemoTenant(): Promise<{ tenantId: string; workspaceId: string } | null> {
  const db = await getDb();
  const user = await db.collection(USERS_COLLECTION).findOne({ email: DEMO.adminEmail });
  if (!user?.tenantId) return null;

  const tenant = await db.collection<TenantDocument>(TENANTS_COLLECTION).findOne({
    tenantId: user.tenantId,
  });

  return {
    tenantId: user.tenantId,
    workspaceId: tenant?.workspaceId ?? user.tenantId,
  };
}

export interface DemoMultilocalSeedResult {
  tenantId: string;
  workspaceId: string;
  inventoryCount: number;
  locationCount: number;
  updatedAt: number;
}

export async function runDemoMultilocalSeed(): Promise<DemoMultilocalSeedResult> {
  const now = Date.now();
  const demo = await findDemoTenant();

  if (!demo) {
    throw new Error(`Demo user ${DEMO.adminEmail} not found. Run seed:demo first.`);
  }

  const db = await getDb();
  const baseWorkspace = buildDemoWorkspace(demo.tenantId, demo.workspaceId, now);
  const workspace = enhanceWorkspaceForMultilocal(baseWorkspace, now);

  await db.collection<WorkspaceDocument>(WORKSPACES_COLLECTION).updateOne(
    { workspaceId: demo.workspaceId },
    { $set: workspace },
    { upsert: true }
  );

  const tenant = await db.collection<TenantDocument>(TENANTS_COLLECTION).findOne({
    tenantId: demo.tenantId,
  });

  const subscription = syncSubscriptionWithActiveLocations(
    activateSubscription(ensureTenantSubscription(tenant?.subscription)),
    workspace.locations
  );

  await db.collection(TENANTS_COLLECTION).updateOne(
    { tenantId: demo.tenantId },
    {
      $set: {
        status: 'active',
        subscription,
      },
    }
  );

  const passwordHash = await hashPassword(DEMO.adminPassword);
  await db.collection(USERS_COLLECTION).updateOne(
    { email: DEMO.adminEmail },
    { $set: { passwordHash, status: 'active' } }
  );

  return {
    tenantId: demo.tenantId,
    workspaceId: demo.workspaceId,
    inventoryCount: workspace.inventory.length,
    locationCount: workspace.locations?.length ?? 0,
    updatedAt: workspace.updatedAt,
  };
}
