import { NextResponse } from 'next/server';
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards';
import { updateTenantUserPassword } from '@/lib/auth/tenants';
import { ensureSuperAdmin } from '@/lib/auth/users';

interface RouteContext {
  params: Promise<{ tenantId: string; userId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await ensureSuperAdmin();
    await requireSuperAdmin();
    const { tenantId, userId } = await context.params;
    const body = (await request.json()) as { password?: string };

    if (!body.password) {
      return NextResponse.json({ error: 'La nueva contraseña es obligatoria.' }, { status: 400 });
    }
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      );
    }

    const user = await updateTenantUserPassword(tenantId, userId, body.password);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[admin tenant user password PATCH]', error);
    return NextResponse.json({ error: 'No se pudo actualizar la contraseña.' }, { status: 500 });
  }
}
