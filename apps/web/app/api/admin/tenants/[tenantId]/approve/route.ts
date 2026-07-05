import { NextResponse } from 'next/server';
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards';
import { approveTenant } from '@/lib/auth/tenants';
import { ensureSuperAdmin } from '@/lib/auth/users';

interface RouteContext {
  params: Promise<{ tenantId: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    await ensureSuperAdmin();
    await requireSuperAdmin();
    const { tenantId } = await context.params;
    const tenant = await approveTenant(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ tenant });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[admin tenant approve]', error);
    return NextResponse.json({ error: 'No se pudo aprobar el cliente.' }, { status: 500 });
  }
}
