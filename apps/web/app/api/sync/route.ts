import { NextResponse } from 'next/server';
import { AuthError, requireTenantAccess } from '@/lib/auth/guards';
import { getDb } from '@/lib/db/mongodb';
import {
  WORKSPACES_COLLECTION,
  type WorkspaceDocument,
  type WorkspacePayload,
} from '@/lib/db/workspace';
import {
  DEFAULT_GLOBAL_FUND_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@costify/shared/domain/constants';
import { migrateGlobalFundSettings } from '@costify/shared/domain/calculations/global-fund';
import { migrateTaxSettings } from '@costify/shared/domain/migrate-tax-settings';
import { migrateExchangeRateSettings } from '@costify/shared/domain/migrate-exchange-rates';
import { migrateUnitSettings } from '@costify/shared/domain/unit-settings';

function isValidWorkspaceId(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!isValidWorkspaceId(workspaceId)) {
      return NextResponse.json({ error: 'workspaceId inválido.' }, { status: 400 });
    }

    await requireTenantAccess(workspaceId);

    const db = await getDb();
    const workspace = await db
      .collection<WorkspaceDocument>(WORKSPACES_COLLECTION)
      .findOne({ workspaceId });

    if (!workspace) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    const { _id, ...payload } = workspace as WorkspaceDocument & { _id?: unknown };

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
    const body = (await request.json()) as Partial<WorkspacePayload>;
    const workspaceId = body.workspaceId;
    const updatedAt = body.updatedAt;

    if (!isValidWorkspaceId(workspaceId)) {
      return NextResponse.json({ error: 'workspaceId inválido.' }, { status: 400 });
    }

    if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) {
      return NextResponse.json({ error: 'updatedAt inválido.' }, { status: 400 });
    }

    const session = await requireTenantAccess(workspaceId);

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
    const document: WorkspaceDocument = {
      workspaceId,
      tenantId: session.tenantId!,
      inventory: Array.isArray(body.inventory) ? body.inventory : [],
      rawMaterials: Array.isArray(body.rawMaterials) ? body.rawMaterials : [],
      globalCosts: Array.isArray(body.globalCosts) ? body.globalCosts : [],
      globalFund: migrateGlobalFundSettings(body.globalFund ?? DEFAULT_GLOBAL_FUND_SETTINGS),
      taxSettings: migrateTaxSettings(body.taxSettings ?? DEFAULT_TAX_SETTINGS),
      unitSettings: migrateUnitSettings(body.unitSettings),
      warehouses: Array.isArray(body.warehouses) ? body.warehouses : [],
      stockMovements: Array.isArray(body.stockMovements) ? body.stockMovements : [],
      stockThresholds: Array.isArray(body.stockThresholds) ? body.stockThresholds : [],
      exchangeRateSettings: migrateExchangeRateSettings(body.exchangeRateSettings),
      updatedAt,
      createdAt: existing?.createdAt ?? now,
    };

    await collection.updateOne({ workspaceId }, { $set: document }, { upsert: true });

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
