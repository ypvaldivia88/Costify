import { getDb } from '../lib/db/mongodb';
import { createTenantWithAdmin, createTenantUser } from '../lib/auth/tenants';
import { hashPassword } from '../lib/auth/password';
import { USERS_COLLECTION } from '../lib/auth/types';
import { WORKSPACES_COLLECTION, type WorkspaceDocument } from '../lib/db/workspace';
import {
  DEFAULT_GLOBAL_FUND_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@costify/shared/domain/constants';
import { buildRawMaterial } from '@costify/shared/domain/calculations/raw-material';
import { calculateProduct, recalculateInventory } from '@costify/shared/domain/calculations/product';
import { DEFAULT_UNIT_SETTINGS } from '@costify/shared/domain/unit-settings';
import type {
  GlobalFundSettings,
  IndirectCost,
  ProductInput,
  StockMovement,
  StockThreshold,
  Warehouse,
} from '@costify/shared/domain/types';

const DEMO = {
  tenantName: 'Panadería La Espiga',
  contactEmail: 'demo@costify.local',
  adminName: 'María Demo',
  adminEmail: 'demo@costify.local',
  adminPassword: 'Demo2026!',
  userName: 'Carlos Operador',
  userEmail: 'operador@costify.local',
  userPassword: 'Demo2026!',
} as const;

const IDS = {
  warehouses: {
    principal: 'demo-wh-principal',
    venta: 'demo-wh-venta',
    produccion: 'demo-wh-produccion',
  },
  materials: {
    harina: 'demo-rm-harina',
    azucar: 'demo-rm-azucar',
    aceite: 'demo-rm-aceite',
    huevo: 'demo-rm-huevo',
    leche: 'demo-rm-leche',
  },
  products: {
    refresco: 'demo-prod-refresco',
    panSobao: 'demo-prod-pan-sobao',
    pastel: 'demo-prod-pastel',
  },
  globalCosts: {
    alquiler: 'demo-gc-alquiler',
    energia: 'demo-gc-energia',
  },
} as const;

function buildDemoWorkspace(tenantId: string, workspaceId: string, now: number): WorkspaceDocument {
  const warehouses: Warehouse[] = [
    {
      id: IDS.warehouses.principal,
      name: 'Bodega principal',
      type: 'principal',
      active: true,
      timestamp: now,
    },
    {
      id: IDS.warehouses.venta,
      name: 'Punto de venta',
      type: 'venta',
      active: true,
      timestamp: now,
    },
    {
      id: IDS.warehouses.produccion,
      name: 'Área de producción',
      type: 'produccion',
      active: true,
      timestamp: now,
    },
  ];

  const rawMaterials = [
    buildRawMaterial(
      {
        name: 'Harina de trigo',
        purchasePrice: 3200,
        unitType: 'kg',
        packageQuantity: 25,
        stockQuantity: 0,
      },
      IDS.materials.harina,
      now
    ),
    buildRawMaterial(
      {
        name: 'Azúcar',
        purchasePrice: 1800,
        unitType: 'kg',
        packageQuantity: 10,
        stockQuantity: 0,
      },
      IDS.materials.azucar,
      now
    ),
    buildRawMaterial(
      {
        name: 'Aceite vegetal',
        purchasePrice: 2400,
        unitType: 'lt',
        packageQuantity: 5,
        stockQuantity: 0,
      },
      IDS.materials.aceite,
      now
    ),
    buildRawMaterial(
      {
        name: 'Huevos',
        purchasePrice: 900,
        unitType: 'ud',
        packageQuantity: 30,
        stockQuantity: 0,
      },
      IDS.materials.huevo,
      now
    ),
    buildRawMaterial(
      {
        name: 'Leche en polvo',
        purchasePrice: 4500,
        unitType: 'kg',
        packageQuantity: 1,
        stockQuantity: 0,
        purchaseMeta: {
          originalCurrency: 'USD',
          originalAmount: 6.5,
          exchangeRateUsed: 692,
          rateDate: '2026-07-04',
          rateFetchedAt: now,
        },
      },
      IDS.materials.leche,
      now
    ),
  ];

  const globalCosts: IndirectCost[] = [
    {
      id: IDS.globalCosts.alquiler,
      name: 'Alquiler local',
      amount: 15000,
      distributionCriteria: 'units',
      distributionUnits: 500,
    },
    {
      id: IDS.globalCosts.energia,
      name: 'Electricidad',
      amount: 4500,
      distributionCriteria: 'direct-cost',
    },
  ];

  const globalFund: GlobalFundSettings = {
    ...DEFAULT_GLOBAL_FUND_SETTINGS,
    enabled: true,
    name: 'Fondo de imprevistos',
    percent: 3,
  };

  const productInputs: ProductInput[] = [
    {
      name: 'Refresco en lata 355 ml',
      productType: 'simple',
      purchasePrice: 120,
      purchaseUnit: 'caja',
      packageQuantity: 24,
      productionUnits: 200,
      indirectCosts: [],
      profitMargin: 35,
      marginType: 'markup',
    },
    {
      name: 'Pan sobao',
      productType: 'elaborated',
      purchasePrice: 0,
      purchaseUnit: 'unidad',
      packageQuantity: 1,
      recipe: [
        { rawMaterialId: IDS.materials.harina, quantity: 500, unitType: 'gr' },
        { rawMaterialId: IDS.materials.azucar, quantity: 50, unitType: 'gr' },
        { rawMaterialId: IDS.materials.aceite, quantity: 30, unitType: 'ml' },
        { rawMaterialId: IDS.materials.huevo, quantity: 1, unitType: 'ud' },
      ],
      productionUnits: 120,
      productWeight: 0.45,
      indirectCosts: [globalCosts[0]],
      profitMargin: 40,
      marginType: 'markup',
    },
    {
      name: 'Pastel de queso',
      productType: 'elaborated',
      purchasePrice: 0,
      purchaseUnit: 'unidad',
      packageQuantity: 1,
      recipe: [
        { rawMaterialId: IDS.materials.harina, quantity: 300, unitType: 'gr' },
        { rawMaterialId: IDS.materials.azucar, quantity: 200, unitType: 'gr' },
        { rawMaterialId: IDS.materials.leche, quantity: 150, unitType: 'gr' },
        { rawMaterialId: IDS.materials.huevo, quantity: 3, unitType: 'ud' },
      ],
      productionUnits: 24,
      productWeight: 0.8,
      indirectCosts: [globalCosts[1]],
      profitMargin: 45,
      marginType: 'margin',
    },
  ];

  const inventory = recalculateInventory(
    productInputs.map((input, index) => {
      const ids = [
        IDS.products.refresco,
        IDS.products.panSobao,
        IDS.products.pastel,
      ] as const;
      return calculateProduct(
        input,
        [],
        rawMaterials,
        globalFund,
        ids[index],
        now + index,
        DEFAULT_UNIT_SETTINGS
      );
    }),
    rawMaterials,
    globalFund,
    DEFAULT_UNIT_SETTINGS
  );

  const stockMovements: StockMovement[] = [
    {
      id: 'demo-mv-inventario-inicial',
      type: 'inventario_inicial',
      warehouseId: IDS.warehouses.principal,
      note: 'Inventario inicial de prueba',
      timestamp: now,
      lines: [
        { refType: 'raw_material', refId: IDS.materials.harina, quantity: 50, unitType: 'kg' },
        { refType: 'raw_material', refId: IDS.materials.azucar, quantity: 20, unitType: 'kg' },
        { refType: 'raw_material', refId: IDS.materials.aceite, quantity: 10, unitType: 'lt' },
        { refType: 'raw_material', refId: IDS.materials.huevo, quantity: 60, unitType: 'ud' },
        { refType: 'raw_material', refId: IDS.materials.leche, quantity: 5, unitType: 'kg' },
        { refType: 'product', refId: IDS.products.refresco, quantity: 48, unitType: 'ud' },
      ],
    },
    {
      id: 'demo-mv-transferencia-venta',
      type: 'transferencia',
      warehouseId: IDS.warehouses.venta,
      sourceWarehouseId: IDS.warehouses.principal,
      note: 'Traslado a punto de venta',
      timestamp: now + 1,
      lines: [
        { refType: 'product', refId: IDS.products.refresco, quantity: 24, unitType: 'ud' },
        { refType: 'product', refId: IDS.products.panSobao, quantity: 30, unitType: 'ud' },
      ],
    },
    {
      id: 'demo-mv-produccion-pan',
      type: 'produccion',
      warehouseId: IDS.warehouses.produccion,
      productId: IDS.products.panSobao,
      note: 'Producción semanal pan sobao',
      timestamp: now + 2,
      lines: [
        { refType: 'raw_material', refId: IDS.materials.harina, quantity: 15, unitType: 'kg' },
        { refType: 'raw_material', refId: IDS.materials.azucar, quantity: 2, unitType: 'kg' },
        { refType: 'raw_material', refId: IDS.materials.aceite, quantity: 1.5, unitType: 'lt' },
        { refType: 'raw_material', refId: IDS.materials.huevo, quantity: 30, unitType: 'ud' },
        { refType: 'product', refId: IDS.products.panSobao, quantity: 120, unitType: 'ud' },
      ],
    },
  ];

  const stockThresholds: StockThreshold[] = [
    {
      id: 'demo-th-harina',
      refType: 'raw_material',
      refId: IDS.materials.harina,
      warehouseId: IDS.warehouses.principal,
      minQuantity: 10,
    },
    {
      id: 'demo-th-refresco',
      refType: 'product',
      refId: IDS.products.refresco,
      warehouseId: IDS.warehouses.venta,
      minQuantity: 12,
    },
  ];

  return {
    workspaceId,
    tenantId,
    inventory,
    rawMaterials,
    globalCosts,
    globalFund,
    taxSettings: DEFAULT_TAX_SETTINGS,
    unitSettings: DEFAULT_UNIT_SETTINGS,
    warehouses,
    stockMovements,
    stockThresholds,
    exchangeRateSettings: {
      displayCurrency: 'USD' as const,
      lastSnapshot: {
        rates: { USD: 655, EUR: 750, MLC: 490 },
        date: '2026-07-04',
        hour: 15,
        minutes: 0,
        seconds: 0,
        fetchedAt: now,
      },
      alertThresholdPercent: 5,
      lastCostingRateUsd: 655,
      lastCostingAt: now,
    },
    updatedAt: now,
    createdAt: now,
  };
}

async function findDemoTenantId(): Promise<string | null> {
  const db = await getDb();
  const user = await db.collection(USERS_COLLECTION).findOne({ email: DEMO.adminEmail });
  return user?.tenantId ?? null;
}

async function main() {
  const now = Date.now();
  let tenantId = await findDemoTenantId();
  let workspaceId: string;
  let created = false;

  if (!tenantId) {
    const result = await createTenantWithAdmin({
      name: DEMO.tenantName,
      contactEmail: DEMO.contactEmail,
      adminName: DEMO.adminName,
      adminEmail: DEMO.adminEmail,
      adminPassword: DEMO.adminPassword,
    });
    tenantId = result.tenant.tenantId;
    workspaceId = result.tenant.workspaceId;
    created = true;
    console.log(`Cliente demo creado: ${result.tenant.name}`);
    console.log(`  Admin: ${result.admin.email}`);
  } else {
    const db = await getDb();
    const existing = await db
      .collection<WorkspaceDocument>(WORKSPACES_COLLECTION)
      .findOne({ tenantId });
    workspaceId = existing?.workspaceId ?? tenantId;
    console.log(`Cliente demo ya existe (tenantId: ${tenantId}), actualizando datos…`);

    const passwordHash = await hashPassword(DEMO.adminPassword);
    await db.collection(USERS_COLLECTION).updateOne(
      { email: DEMO.adminEmail },
      { $set: { passwordHash, status: 'active' } }
    );
  }

  const db = await getDb();
  const workspace = buildDemoWorkspace(tenantId, workspaceId, now);

  await db.collection<WorkspaceDocument>(WORKSPACES_COLLECTION).updateOne(
    { workspaceId },
    { $set: workspace },
    { upsert: true }
  );

  const operatorExists = await db
    .collection(USERS_COLLECTION)
    .findOne({ email: DEMO.userEmail });

  if (!operatorExists) {
    await createTenantUser({
      tenantId,
      name: DEMO.userName,
      email: DEMO.userEmail,
      password: DEMO.userPassword,
      role: 'tenant_user',
    });
    console.log(`  Usuario operador: ${DEMO.userEmail}`);
  }

  console.log('');
  console.log('=== Datos de prueba listos ===');
  console.log(`Negocio: ${DEMO.tenantName}`);
  console.log(`Workspace: ${workspaceId}`);
  console.log('');
  console.log('Credenciales admin:');
  console.log(`  ${DEMO.adminEmail} / ${DEMO.adminPassword}`);
  console.log('');
  console.log('Credenciales operador:');
  console.log(`  ${DEMO.userEmail} / ${DEMO.userPassword}`);
  console.log('');
  console.log('Contenido:');
  console.log(`  ${workspace.warehouses.length} almacenes`);
  console.log(`  ${workspace.rawMaterials.length} materias primas`);
  console.log(`  ${workspace.inventory.length} productos (${workspace.inventory.filter((p) => p.productType === 'simple').length} simple, ${workspace.inventory.filter((p) => p.productType === 'elaborated').length} elaborados)`);
  console.log(`  ${workspace.globalCosts.length} gastos indirectos globales`);
  console.log(`  ${workspace.stockMovements.length} movimientos de stock`);
  console.log(`  ${workspace.stockThresholds.length} umbrales de alerta`);
  if (created) {
    console.log('');
    console.log('Inicia sesión en /login con las credenciales admin para probar la app.');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
