import { NextResponse } from 'next/server';
import { ensureSuperAdmin } from '@/lib/auth/users';
import { requireSession, AuthError } from '@/lib/auth/guards';
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/auth/session';
import { enrichSessionUser } from '@/lib/auth/session-access';

export async function POST() {
  try {
    await ensureSuperAdmin();
    const session = await requireSession();
    const user = await enrichSessionUser(session);
    const token = await createSessionToken(user);
    const response = NextResponse.json({ user, token });
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[auth refresh]', error);
    return NextResponse.json({ error: 'No se pudo actualizar la sesión.' }, { status: 500 });
  }
}
