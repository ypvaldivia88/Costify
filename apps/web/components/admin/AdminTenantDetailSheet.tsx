'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  Package,
  Plus,
  Users,
  Warehouse,
  XCircle,
} from 'lucide-react';
import type { AdminTenantRow } from '@/lib/admin/types';
import type { PublicUser } from '@/lib/auth/types';
import {
  buildWhatsAppPaymentMessage,
  buildWhatsAppPaymentUrl,
  formatSubscriptionExpiry,
  formatSubscriptionLocationBreakdown,
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from '@costify/shared/domain/subscription';
import { AdminSubscriptionPanel } from '@/components/admin/AdminSubscriptionPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StatCard } from '@/components/ui/StatCard';
import { useToast } from '@/components/ui/Toast';
import { formatAdminDate, tenantStatusLabel, tenantStatusTone } from '@/lib/admin/format';
import { cn } from '@/lib/utils';

interface AdminTenantDetailSheetProps {
  tenant: AdminTenantRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => Promise<void>;
  onApprove: (tenantId: string) => Promise<void>;
  onReject: (tenantId: string) => Promise<void>;
  onToggleStatus: (tenant: AdminTenantRow) => Promise<void>;
}

export function AdminTenantDetailSheet({
  tenant,
  open,
  onOpenChange,
  onRefresh,
  onApprove,
  onReject,
  onToggleStatus,
}: AdminTenantDetailSheetProps) {
  const { showToast } = useToast();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [passwordEditUserId, setPasswordEditUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tenant_user' as 'tenant_admin' | 'tenant_user',
  });

  useEffect(() => {
    if (!tenant || !open) {
      setUsers([]);
      return;
    }

    void (async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch(`/api/admin/tenants/${tenant.tenantId}`, {
          credentials: 'include',
        });
        const json = (await response.json()) as { users?: PublicUser[]; error?: string };
        if (!response.ok) {
          throw new Error(json.error || 'No se pudieron cargar los usuarios.');
        }
        setUsers(json.users ?? []);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Error al cargar usuarios.', 'error');
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [tenant, open, showToast]);

  if (!tenant) return null;

  const subscription = tenant.subscription;
  const whatsappUrl =
    subscription && tenant.adminEmail
      ? buildWhatsAppPaymentUrl(
          buildWhatsAppPaymentMessage({
            businessName: tenant.name,
            contactName: tenant.adminName ?? tenant.name,
            email: tenant.adminEmail,
            plan: subscription.plan,
            priceUsd: subscription.priceUsd,
            locationCount: subscription.locationCount,
          })
        )
      : null;

  const copyTenantId = async () => {
    try {
      await navigator.clipboard.writeText(tenant.tenantId);
      showToast('ID copiado al portapapeles.', 'success');
    } catch {
      showToast('No se pudo copiar el ID.', 'error');
    }
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await fetch(`/api/admin/tenants/${tenant.tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userForm),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo crear el usuario.');
      }
      showToast('Usuario creado.', 'success');
      setShowUserForm(false);
      setUserForm({ name: '', email: '', password: '', role: 'tenant_user' });
      await onRefresh();
      const usersResponse = await fetch(`/api/admin/tenants/${tenant.tenantId}`, {
        credentials: 'include',
      });
      const usersJson = (await usersResponse.json()) as { users?: PublicUser[] };
      setUsers(usersJson.users ?? []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al crear usuario.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (newPassword.length < 8) return;
    setCreating(true);
    try {
      const response = await fetch(`/api/admin/tenants/${tenant.tenantId}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo cambiar la contraseña.');
      }
      showToast('Contraseña actualizada.', 'success');
      setPasswordEditUserId(null);
      setNewPassword('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al cambiar contraseña.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <SheetTitle>{tenant.name}</SheetTitle>
              <SheetDescription>{tenant.contactEmail}</SheetDescription>
            </div>
            <span
              className={cn(
                'inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                tenantStatusTone(tenant.status)
              )}
            >
              {tenantStatusLabel(tenant.status)}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="flex flex-wrap gap-2">
            {tenant.status === 'pending' ? (
              <>
                <Button type="button" size="sm" onClick={() => void onApprove(tenant.tenantId)}>
                  <CheckCircle2 className="w-4 h-4" />
                  Aprobar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void onReject(tenant.tenantId)}
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </Button>
              </>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={() => void onToggleStatus(tenant)}>
                {tenant.status === 'active' ? 'Suspender acceso' : 'Reactivar acceso'}
              </Button>
            )}
            {whatsappUrl ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={() => void copyTenantId()}>
              <Copy className="w-4 h-4" />
              Copiar ID
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-3">
              <StatCard label="Usuarios" value={String(tenant.userCount)} />
            </div>
            <div className="rounded-xl border border-border p-3">
              <StatCard
                label="Productos"
                value={String(tenant.workspace?.productCount ?? 0)}
                subtext={`${tenant.workspace?.rawMaterialCount ?? 0} materias primas`}
              />
            </div>
            <div className="rounded-xl border border-border p-3">
              <StatCard
                label="Almacenes"
                value={String(tenant.workspace?.warehouseCount ?? 0)}
                subtext={`${tenant.workspace?.stockMovementCount ?? 0} movimientos`}
              />
            </div>
            <div className="rounded-xl border border-border p-3">
              <StatCard
                label="Última sync"
                value={
                  tenant.workspace?.updatedAt
                    ? formatAdminDate(tenant.workspace.updatedAt).split(',')[0]
                    : '—'
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 space-y-2 text-sm">
            <p className="font-semibold">Información del tenant</p>
            <div className="grid gap-1.5 text-xs text-muted">
              <p>
                <span className="text-foreground font-medium">Admin:</span>{' '}
                {tenant.adminName ?? '—'} ({tenant.adminEmail ?? '—'})
              </p>
              <p>
                <span className="text-foreground font-medium">Workspace ID:</span>{' '}
                <span className="font-mono">{tenant.workspaceId}</span>
              </p>
              <p>
                <span className="text-foreground font-medium">Registrado:</span>{' '}
                {formatAdminDate(tenant.createdAt)}
              </p>
              {subscription ? (
                <p>
                  <span className="text-foreground font-medium">Plan:</span>{' '}
                  {SUBSCRIPTION_PLAN_LABELS[subscription.plan]} · {subscription.priceUsd.toFixed(2)} USD ·{' '}
                  {formatSubscriptionLocationBreakdown(subscription.locationCount)} ·{' '}
                  {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                  {subscription.expiresAt
                    ? ` · Vence ${formatSubscriptionExpiry(subscription.expiresAt)}`
                    : ''}
                </p>
              ) : null}
            </div>
          </div>

          <AdminSubscriptionPanel
            tenant={tenant}
            onUpdated={() => {
              void onRefresh();
            }}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand" />
                <p className="font-semibold text-sm">Usuarios del negocio</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowUserForm(true)}>
                <Plus className="w-4 h-4" />
                Nuevo
              </Button>
            </div>

            {showUserForm ? (
              <form onSubmit={handleCreateUser} className="space-y-3 border border-border rounded-xl p-3">
                <Input
                  label="Nombre"
                  value={userForm.name}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <Input
                  label="Correo"
                  type="email"
                  value={userForm.email}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
                <Input
                  label="Contraseña"
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
                <label className="block text-sm font-medium text-foreground">Rol</label>
                <select
                  value={userForm.role}
                  onChange={(event) =>
                    setUserForm((prev) => ({
                      ...prev,
                      role: event.target.value as 'tenant_admin' | 'tenant_user',
                    }))
                  }
                  className="w-full min-h-11 px-3 py-2 rounded-xl border border-border bg-surface text-sm"
                >
                  <option value="tenant_admin">Administrador del negocio</option>
                  <option value="tenant_user">Usuario del negocio</option>
                </select>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={creating}>
                    Crear usuario
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowUserForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : null}

            {loadingUsers ? (
              <p className="text-sm text-muted">Cargando usuarios…</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted">Sin usuarios.</p>
            ) : (
              <div className="space-y-2">
                {users.map((tenantUser) => (
                  <div key={tenantUser.userId} className="rounded-xl border border-border px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{tenantUser.name}</p>
                        <p className="text-xs text-muted">{tenantUser.email}</p>
                      </div>
                      <Badge variant="outline">
                        {tenantUser.role === 'tenant_admin' ? 'Admin' : 'Usuario'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted mt-1">
                      Estado: {tenantStatusLabel(tenantUser.status)}
                    </p>
                    {passwordEditUserId === tenantUser.userId ? (
                      <div className="mt-3 space-y-3">
                        <Input
                          label="Nueva contraseña"
                          type="password"
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          hint="Mínimo 8 caracteres"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={creating || newPassword.length < 8}
                            onClick={() => void handleResetPassword(tenantUser.userId)}
                          >
                            Guardar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPasswordEditUserId(null);
                              setNewPassword('');
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => {
                          setPasswordEditUserId(tenantUser.userId);
                          setNewPassword('');
                        }}
                      >
                        Cambiar contraseña
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {tenant.workspace ? (
            <div className="rounded-xl border border-dashed border-border p-3 text-xs text-muted flex items-start gap-2">
              <Package className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Uso del workspace: {tenant.workspace.productCount} productos,{' '}
                {tenant.workspace.rawMaterialCount} materias primas, {tenant.workspace.warehouseCount}{' '}
                almacenes
                <Warehouse className="w-3 h-3 inline mx-0.5" />
                y {tenant.workspace.stockMovementCount} movimientos de stock.
              </p>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
