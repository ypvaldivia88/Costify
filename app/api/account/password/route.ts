import { NextResponse } from 'next/server';
import { changeAccountPassword } from '@/lib/auth/account';
import { AuthError, requireSession } from '@/lib/auth/guards';

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { error: 'La contraseña actual y la nueva son obligatorias.' },
        { status: 400 }
      );
    }

    await changeAccountPassword(session.userId, body.currentPassword, body.newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[account password]', error);
    return NextResponse.json({ error: 'No se pudo cambiar la contraseña.' }, { status: 500 });
  }
}
