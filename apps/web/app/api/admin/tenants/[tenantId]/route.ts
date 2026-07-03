import { NextResponse } from 'next/server';
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards';
import {
  createTenantUser,
  listTenantUsers,
  updateTenantStatus,
} from '@/lib/auth/tenants';
import { ensureSuperAdmin } from '@/lib/auth/users';

interface RouteContext {
  params: Promise<{ tenantId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await ensureSuperAdmin();
    await requireSuperAdmin();
    const { tenantId } = await context.params;
    const users = await listTenantUsers(tenantId);
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin tenant users GET]', error);
    return NextResponse.json({ error: 'No se pudieron listar los usuarios.' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await ensureSuperAdmin();
    await requireSuperAdmin();
    const { tenantId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: 'tenant_admin' | 'tenant_user';
    };

    if (!body.name?.trim() || !body.email?.trim() || !body.password) {
      return NextResponse.json(
        { error: 'Nombre, correo y contraseña son obligatorios.' },
        { status: 400 }
      );
    }
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      );
    }

    const user = await createTenantUser({
      tenantId,
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('[admin tenant users POST]', error);
    return NextResponse.json({ error: 'No se pudo crear el usuario.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await ensureSuperAdmin();
    await requireSuperAdmin();
    const { tenantId } = await context.params;
    const body = (await request.json()) as { status?: 'active' | 'suspended' };
    if (body.status !== 'active' && body.status !== 'suspended') {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    }

    const tenant = await updateTenantStatus(tenantId, body.status);
    if (!tenant) {
      return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin tenant PATCH]', error);
    return NextResponse.json({ error: 'No se pudo actualizar el cliente.' }, { status: 500 });
  }
}
