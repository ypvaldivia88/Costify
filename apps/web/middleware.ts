import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest, verifySessionToken } from '@/lib/auth/session';
import type { SessionUser } from '@/lib/auth/types';

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  let session: SessionUser | null = await getSessionFromRequest(request);

  if (!session && pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (bearer) {
      session = await verifySessionToken(bearer);
    }
  }

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminRoute =
    pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');

  if (isAdminRoute && session.role !== 'super_admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Acceso restringido.' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (
    session.role === 'super_admin' &&
    (pathname === '/' || pathname.startsWith('/api/sync') || pathname.startsWith('/api/account'))
  ) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Los super administradores deben usar el panel de administración.' },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (
    (pathname === '/' || pathname.startsWith('/api/sync')) &&
    (session.role === 'tenant_admin' || session.role === 'tenant_user') &&
    !session.workspaceId
  ) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Negocio no asignado.' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/admin/:path*', '/api/:path*'],
};
