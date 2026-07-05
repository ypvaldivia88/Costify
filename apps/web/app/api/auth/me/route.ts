import { NextResponse } from 'next/server';
import { ensureSuperAdmin } from '@/lib/auth/users';
import { getServerSession } from '@/lib/auth/session';
import { enrichSessionUser } from '@/lib/auth/session-access';

export async function GET() {
  try {
    await ensureSuperAdmin();
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    const user = await enrichSessionUser(session);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('[auth me]', error);
    return NextResponse.json({ error: 'No se pudo obtener la sesión.' }, { status: 500 });
  }
}
