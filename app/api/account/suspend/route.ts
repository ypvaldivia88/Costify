import { NextResponse } from 'next/server';
import { suspendAccount } from '@/lib/auth/account';
import { AuthError, requireSession } from '@/lib/auth/guards';
import { SESSION_COOKIE } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as { password?: string };
    if (!body.password) {
      return NextResponse.json({ error: 'La contraseña es obligatoria.' }, { status: 400 });
    }

    await suspendAccount(session.userId, body.password);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[account suspend]', error);
    return NextResponse.json({ error: 'No se pudo suspender la cuenta.' }, { status: 500 });
  }
}
