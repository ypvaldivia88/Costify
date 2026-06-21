import { NextResponse } from 'next/server';
import { ensureSuperAdmin, findUserByEmail } from '@/lib/auth/users';
import { verifyPassword } from '@/lib/auth/password';
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/auth/session';
import { findTenantById } from '@/lib/auth/tenants';
import type { SessionUser } from '@/lib/auth/types';

export async function POST(request: Request) {
  try {
    await ensureSuperAdmin();

    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: 'Correo y contraseña son obligatorios.' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user || user.status !== 'active') {
      return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
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
      if (!tenant || tenant.status !== 'active') {
        return NextResponse.json({ error: 'El negocio asociado está suspendido.' }, { status: 403 });
      }
      sessionUser.tenantId = tenant.tenantId;
      sessionUser.tenantName = tenant.name;
      sessionUser.workspaceId = tenant.workspaceId;
    }

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error('[auth login]', error);
    return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 500 });
  }
}
