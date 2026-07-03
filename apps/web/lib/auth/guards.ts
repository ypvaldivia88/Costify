import { getServerSession } from '@/lib/auth/session';
import type { SessionUser, UserRole } from '@/lib/auth/types';

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getServerSession();
  if (!session) {
    throw new AuthError('No autorizado.', 401);
  }
  return session;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== 'super_admin') {
    throw new AuthError('Acceso restringido a super administradores.', 403);
  }
  return session;
}

export async function requireTenantAccess(workspaceId: string): Promise<SessionUser> {
  const session = await requireSession();

  if (session.role === 'super_admin') {
    throw new AuthError('Los super administradores no pueden modificar negocios de clientes.', 403);
  }

  if (!session.workspaceId || session.workspaceId !== workspaceId) {
    throw new AuthError('No tienes acceso a este negocio.', 403);
  }

  return session;
}

export function isTenantRole(role: UserRole): boolean {
  return role === 'tenant_admin' || role === 'tenant_user';
}
