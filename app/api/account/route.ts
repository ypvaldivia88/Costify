import { NextResponse } from 'next/server';
import {
  changeAccountPassword,
  deleteAccount,
  getAccountDetails,
  suspendAccount,
  updateAccountProfile,
} from '@/lib/auth/account';
import { AuthError, requireSession } from '@/lib/auth/guards';
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await requireSession();
    const account = await getAccountDetails(session.userId);
    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada.' }, { status: 404 });
    }
    return NextResponse.json(account);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[account GET]', error);
    return NextResponse.json({ error: 'No se pudo cargar la cuenta.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      businessName?: string;
      contactEmail?: string;
    };

    const updatedUser = await updateAccountProfile(session.userId, body);
    const token = await createSessionToken(updatedUser);
    const response = NextResponse.json({ user: updatedUser, token });
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[account PATCH]', error);
    return NextResponse.json({ error: 'No se pudo actualizar la cuenta.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as { password?: string };
    if (!body.password) {
      return NextResponse.json({ error: 'La contraseña es obligatoria.' }, { status: 400 });
    }

    await deleteAccount(session.userId, body.password);

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
    console.error('[account DELETE]', error);
    return NextResponse.json({ error: 'No se pudo eliminar la cuenta.' }, { status: 500 });
  }
}
