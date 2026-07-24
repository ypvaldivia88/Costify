import { NextResponse } from 'next/server';

/** Public liveness probe for mobile connectivity checks (no auth). */
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
