import { NextResponse } from 'next/server';
import { AuthError, requireSuperAdmin } from '@/lib/auth/guards';
import { runDemoMultilocalSeed } from '@/lib/admin/seed-demo-multilocal';

export async function POST() {
  try {
    await requireSuperAdmin();
    const result = await runDemoMultilocalSeed();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin/seed-demo POST]', error);
    const message = error instanceof Error ? error.message : 'No se pudo ejecutar el seed demo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
