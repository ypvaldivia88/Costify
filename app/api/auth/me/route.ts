import { NextResponse } from 'next/server';
import { ensureSuperAdmin } from '@/lib/auth/users';
import { getServerSession } from '@/lib/auth/session';

export async function GET() {
  try {
    await ensureSuperAdmin();
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch (error) {
    console.error('[auth me]', error);
    return NextResponse.json({ error: 'No se pudo obtener la sesión.' }, { status: 500 });
  }
}
