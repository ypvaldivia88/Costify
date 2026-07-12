import { NextResponse } from 'next/server';
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards';
import { getAdminOverview } from '@/lib/admin/overview';
import { ensureSuperAdmin } from '@/lib/auth/users';

export async function GET() {
  try {
    await ensureSuperAdmin();
    await requireSuperAdmin();
    const overview = await getAdminOverview();
    return NextResponse.json(overview);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin overview GET]', error);
    return NextResponse.json({ error: 'No se pudo cargar el panel de administración.' }, { status: 500 });
  }
}
