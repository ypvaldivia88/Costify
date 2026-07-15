import { NextResponse } from 'next/server';
import { AuthError, requireTenantAccess, requireCloudSyncAccess } from '@/lib/auth/guards';
import { getDb } from '@/lib/db/mongodb';
import {
  WORKSPACES_COLLECTION,
  type WorkspaceDocument,
  type WorkspacePayload,
} from '@/lib/db/workspace';
import {
  DEFAULT_GLOBAL_FUND_SETTINGS,
  DEFAULT_LABOR_SHARE_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@costify/shared/domain/constants';
import { migrateGlobalFundSettings } from '@costify/shared/domain/calculations/global-fund';
import { migrateLaborShareSettings } from '@costify/shared/domain/calculations/labor-share';
import { migrateTaxSettings } from '@costify/shared/domain/migrate-tax-settings';
import { migrateExchangeRateSettings } from '@costify/shared/domain/migrate-exchange-rates';
import { migrateUnitSettings } from '@costify/shared/domain/unit-settings';
import { migrateWorkspaceLocations } from '@costify/shared/domain/migrate-workspace-locations';
import { syncSubscriptionWithActiveLocations } from '@/lib/auth/sync-subscription-locations';
import { TENANTS_COLLECTION, type TenantDocument } from '@/lib/auth/types';
import {
  parseJsonBody,
  workspaceIdSchema,
  workspaceSyncPutSchema,
} from '@costify/shared/schemas/api';
import { ensureTenantSubscription } from '@costify/shared/domain/subscription';

function withMigratedWorkspace(workspace: WorkspaceDocument): WorkspaceDocument {
  return migrateWorkspaceLocations(workspace, workspace.updatedAt);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const parsedId = workspaceIdSchema.safeParse(workspaceId);

    if (!parsedId.success) {
      return NextResponse.json({ error: 'workspaceId inválido.' }, { status: 400 });
    }

    await requireTenantAccess(parsedId.data);

    const db = await getDb();
    const workspace = await db
      .collection<WorkspaceDocument>(WORKSPACES_COLLECTION)
      .findOne({ workspaceId: parsedId.data });

    if (!workspace) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    const migrated = withMigratedWorkspace(workspace);
    const { _id: _mongoId, ...payload } = migrated as WorkspaceDocument & { _id?: unknown };

    return NextResponse.json({
      exists: true,
      workspace: payload,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[sync GET]', error);
    return NextResponse.json({ error: 'No se pudo leer la base de datos.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const parsed = parseJsonBody(workspaceSyncPutSchema, await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Solicitud de sincronización inválida.' }, { status: 400 });
    }

    const body = parsed.data as Partial<WorkspacePayload> & {
      workspaceId: string;
      updatedAt: number;
    };
    const { workspaceId, updatedAt } = body;

    const session = await requireCloudSyncAccess();
    if (session.workspaceId !== workspaceId) {
      throw new AuthError('No tienes acceso a este negocio.', 403);
    }

    const db = await getDb();
    const collection = db.collection<WorkspaceDocument>(WORKSPACES_COLLECTION);
    const existing = await collection.findOne({ workspaceId });

    if (existing && existing.updatedAt > updatedAt) {
      return NextResponse.json(
        {
          error: 'conflict',
          workspace: existing,
        },
        { status: 409 }
      );
    }

    const now = Date.now();
    const incomingInventory = Array.isArray(body.inventory) ? body.inventory : [];

    if (existing && existing.inventory.length > 0 && incomingInventory.length === 0) {
      const preserved = withMigratedWorkspace(existing);
      return NextResponse.json(
        {
          error: 'conflict',
          workspace: preserved,
        },
        { status: 409 }
      );
    }

    const migrated = migrateWorkspaceLocations(
      {
        workspaceId,
        tenantId: session.tenantId!,
        inventory: incomingInventory,
        rawMaterials: Array.isArray(body.rawMaterials) ? body.rawMaterials : [],
        globalCosts: Array.isArray(body.globalCosts) ? body.globalCosts : [],
        globalFund: migrateGlobalFundSettings(body.globalFund ?? DEFAULT_GLOBAL_FUND_SETTINGS),
        laborShareSettings: migrateLaborShareSettings(
          body.laborShareSettings ?? DEFAULT_LABOR_SHARE_SETTINGS
        ),
        taxSettings: migrateTaxSettings(body.taxSettings ?? DEFAULT_TAX_SETTINGS),
        unitSettings: migrateUnitSettings(body.unitSettings),
        locations: Array.isArray(body.locations) ? body.locations : [],
        warehouses: Array.isArray(body.warehouses) ? body.warehouses : [],
        stockMovements: Array.isArray(body.stockMovements) ? body.stockMovements : [],
        stockThresholds: Array.isArray(body.stockThresholds) ? body.stockThresholds : [],
        sales: Array.isArray(body.sales) ? body.sales : [],
        exchangeRateSettings: migrateExchangeRateSettings(body.exchangeRateSettings),
        updatedAt,
        createdAt: existing?.createdAt ?? now,
      },
      now
    );

    const document: WorkspaceDocument = migrated;

    await collection.updateOne({ workspaceId }, { $set: document }, { upsert: true });

    if (session.tenantId) {
      const tenant = await db
        .collection<TenantDocument>(TENANTS_COLLECTION)
        .findOne({ tenantId: session.tenantId });
      if (tenant) {
        const subscription = syncSubscriptionWithActiveLocations(
          tenant.subscription,
          document.locations
        );
        const current = ensureTenantSubscription(tenant.subscription);
        if (
          subscription.locationCount !== current.locationCount ||
          subscription.priceUsd !== current.priceUsd
        ) {
          await db
            .collection<TenantDocument>(TENANTS_COLLECTION)
            .updateOne({ tenantId: session.tenantId }, { $set: { subscription } });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      workspace: document,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[sync PUT]', error);
    return NextResponse.json({ error: 'No se pudo guardar en la base de datos.' }, { status: 500 });
  }
}
