import { NextResponse } from 'next/server';
import { ensureSuperAdmin, ensureDemoAdmin, findUserByEmail, isSuperAdminBootstrapConfigured } from '@/lib/auth/users';
import { verifyPassword } from '@/lib/auth/password';
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/auth/session';
import { findTenantById } from '@/lib/auth/tenants';
import { enrichSessionUser } from '@/lib/auth/session-access';
import type { SessionUser } from '@/lib/auth/types';
import { loginRequestSchema, parseJsonBody } from '@costify/shared/schemas/api';

export async function POST(request: Request) {
  try {
    await ensureSuperAdmin();
    await ensureDemoAdmin();

    const parsed = parseJsonBody(loginRequestSchema, await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Correo y contraseña son obligatorios.' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const user = await findUserByEmail(email);
    if (!user) {
      const bootstrapConfigured = isSuperAdminBootstrapConfigured();
      const message =
        !bootstrapConfigured && email === process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
          ? 'El super administrador no está configurado en el servidor. Define SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD.'
          : 'Credenciales inválidas.';
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'Tu cuenta está suspendida. Contacta al administrador.' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    if (user.tenantId) {
      const tenant = await findTenantById(user.tenantId);
      if (!tenant) {
        return NextResponse.json({ error: 'El negocio asociado no existe.' }, { status: 403 });
      }
      if (tenant.status === 'suspended') {
        return NextResponse.json({ error: 'El negocio asociado está suspendido.' }, { status: 403 });
      }
      sessionUser.tenantId = tenant.tenantId;
      sessionUser.tenantName = tenant.name;
      sessionUser.workspaceId = tenant.workspaceId;
    }

    const enriched = await enrichSessionUser(sessionUser);
    const token = await createSessionToken(enriched);
    const response = NextResponse.json({ user: enriched, token });
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error('[auth login]', error);
    return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 500 });
  }
}
