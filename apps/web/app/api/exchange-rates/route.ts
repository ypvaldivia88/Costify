import { NextResponse } from 'next/server';
import { AuthError, requireSession } from '@/lib/auth/guards';
import { mapTrmiResponse, type TrmiApiResponse } from '@costify/shared/domain/exchange-rates';

const ELTOQUE_API_URL = 'https://tasas.eltoque.com/v1/trmi';
const CACHE_TTL_MS = 60 * 60 * 1000;

let cachedSnapshot: ReturnType<typeof mapTrmiResponse> | null = null;
let cacheExpiresAt = 0;

function buildDateParams(dateFrom?: string | null, dateTo?: string | null): string {
  if (!dateFrom || !dateTo) return '';
  const params = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
  });
  return `?${params.toString()}`;
}

async function fetchFromEltoque(dateFrom?: string | null, dateTo?: string | null) {
  const token = process.env.ELTOQUE_API_TOKEN;
  if (!token) {
    throw new Error('ELTOQUE_API_TOKEN no configurado.');
  }

  const url = `${ELTOQUE_API_URL}${buildDateParams(dateFrom, dateTo)}`;
  const response = await fetch(url, {
    headers: {
      accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`elTOQUE respondió con estado ${response.status}.`);
  }

  const data = (await response.json()) as TrmiApiResponse;
  return mapTrmiResponse(data);
}

export async function GET(request: Request) {
  try {
    await requireSession();

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const hasDateRange = Boolean(dateFrom && dateTo);

    if (!hasDateRange && cachedSnapshot && Date.now() < cacheExpiresAt) {
      return NextResponse.json({ snapshot: cachedSnapshot, cached: true });
    }

    const snapshot = await fetchFromEltoque(dateFrom, dateTo);

    if (!hasDateRange) {
      cachedSnapshot = snapshot;
      cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    }

    return NextResponse.json({ snapshot, cached: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (cachedSnapshot) {
      return NextResponse.json({
        snapshot: { ...cachedSnapshot, stale: true },
        cached: true,
        warning: 'No se pudo actualizar; se devuelve la última tasa conocida.',
      });
    }

    console.error('[exchange-rates GET]', error);
    const message =
      error instanceof Error ? error.message : 'No se pudieron obtener las tasas de cambio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
