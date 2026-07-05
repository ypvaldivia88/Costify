'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Clock3, LogOut, Plus, Shield, Users, XCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { PublicTenant, PublicUser } from '@/lib/auth/types';
import {
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from '@costify/shared/domain/subscription';
import { cn } from '@/lib/utils';
import { AdminSubscriptionPanel } from '@/components/admin/AdminSubscriptionPanel';

function tenantStatusLabel(status: PublicTenant['status']): string {
  if (status === 'pending') return 'Pendiente';
  if (status === 'suspended') return 'Suspendido';
  return 'Activo';
}

function tenantStatusClass(status: PublicTenant['status']): string {
  if (status === 'pending') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
  }
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
  return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
}

export default function AdminPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<PublicTenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [tenantUsers, setTenantUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactEmail: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tenant_user' as 'tenant_admin' | 'tenant_user',
  });

  const loadTenants = useCallback(async () => {
    const response = await fetch('/api/admin/tenants', { credentials: 'include' });
    const json = (await response.json()) as { tenants?: PublicTenant[]; error?: string };
    if (!response.ok) {
      throw new Error(json.error || 'No se pudieron cargar los clientes.');
    }
    setTenants(json.tenants ?? []);
  }, []);

  const loadTenantUsers = useCallback(async (tenantId: string) => {
    const response = await fetch(`/api/admin/tenants/${tenantId}`, { credentials: 'include' });
    const json = (await response.json()) as { users?: PublicUser[]; error?: string };
    if (!response.ok) {
      throw new Error(json.error || 'No se pudieron cargar los usuarios.');
    }
    setTenantUsers(json.users ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadTenants();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar.');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadTenants]);

  useEffect(() => {
    if (!selectedTenantId) {
      setTenantUsers([]);
      return;
    }
    void loadTenantUsers(selectedTenantId).catch((err) => {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios.');
    });
  }, [selectedTenantId, loadTenantUsers]);

  const handleCreateTenant = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const json = (await response.json()) as { error?: string; tenant?: PublicTenant };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo registrar el cliente.');
      }
      await loadTenants();
      if (json.tenant) setSelectedTenantId(json.tenant.tenantId);
      setShowCreateForm(false);
      setForm({
        name: '',
        contactEmail: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTenantId) return;
    setCreating(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/tenants/${selectedTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userForm),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo crear el usuario.');
      }
      await loadTenantUsers(selectedTenantId);
      setShowUserForm(false);
      setUserForm({ name: '', email: '', password: '', role: 'tenant_user' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario.');
    } finally {
      setCreating(false);
    }
  };

  const toggleTenantStatus = async (tenant: PublicTenant) => {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const response = await fetch(`/api/admin/tenants/${tenant.tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(json.error || 'No se pudo actualizar el estado.');
      return;
    }
    await loadTenants();
  };

  const selectedTenant = tenants.find((tenant) => tenant.tenantId === selectedTenantId) ?? null;
  const pendingTenants = useMemo(
    () => tenants.filter((tenant) => tenant.status === 'pending'),
    [tenants]
  );
  const activeTenants = useMemo(
    () => tenants.filter((tenant) => tenant.status !== 'pending'),
    [tenants]
  );

  const handleApproveTenant = async (tenantId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo aprobar el cliente.');
      }
      await loadTenants();
      setSelectedTenantId(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar.');
    }
  };

  const handleRejectTenant = async (tenantId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo rechazar el registro.');
      }
      if (selectedTenantId === tenantId) setSelectedTenantId(null);
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh mesh-bg flex items-center justify-center">
        <div className="w-10 h-10 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-glow">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh mesh-bg text-foreground">
      <header className="glass border-b border-border/60 safe-top">
        <div className="max-w-6xl mx-auto px-4 min-h-14 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-gradient rounded-xl flex items-center justify-center shadow-glow">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold">Panel Super Admin</h1>
              <p className="text-xs text-muted">{user?.name}</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => void logout()}>
            <LogOut className="w-4 h-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Clientes</h2>
            <p className="text-sm text-muted">
              Registra negocios y crea usuarios con acceso a su espacio individual.
            </p>
          </div>
          <Button type="button" onClick={() => setShowCreateForm((value) => !value)}>
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </Button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {pendingTenants.length > 0 && (
          <Card className="p-4 border-brand/30 bg-brand-muted/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-brand" />
              Solicitudes pendientes de aprobación
            </h3>
            <div className="space-y-3">
              {pendingTenants.map((tenant) => (
                <div
                  key={tenant.tenantId}
                  className="rounded-xl border border-border bg-surface p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-sm">{tenant.name}</p>
                    <p className="text-xs text-muted">{tenant.contactEmail}</p>
                    {tenant.subscription ? (
                      <p className="text-xs text-muted mt-1">
                        Plan: {SUBSCRIPTION_PLAN_LABELS[tenant.subscription.plan]} ·{' '}
                        {tenant.subscription.priceUsd} USD ·{' '}
                        {SUBSCRIPTION_STATUS_LABELS[tenant.subscription.status]}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleApproveTenant(tenant.tenantId)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Aprobar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleRejectTenant(tenant.tenantId)}
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {showCreateForm && (
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Registrar nuevo cliente</h3>
            <form onSubmit={handleCreateTenant} className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nombre del negocio"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <Input
                label="Correo de contacto"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
              />
              <Input
                label="Nombre del administrador"
                value={form.adminName}
                onChange={(e) => setForm((prev) => ({ ...prev, adminName: e.target.value }))}
                required
              />
              <Input
                label="Correo del administrador"
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, adminEmail: e.target.value }))}
                required
              />
              <Input
                label="Contraseña inicial"
                type="password"
                value={form.adminPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, adminPassword: e.target.value }))}
                hint="Mínimo 8 caracteres"
                required
              />
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Registrando…' : 'Registrar cliente'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand" />
              Negocios registrados
            </h3>
            {loading ? (
              <p className="text-sm text-muted">Cargando…</p>
            ) : activeTenants.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay clientes activos.</p>
            ) : (
              <div className="space-y-2">
                {activeTenants.map((tenant) => (
                  <button
                    key={tenant.tenantId}
                    type="button"
                    onClick={() => setSelectedTenantId(tenant.tenantId)}
                    className={cn(
                      'w-full text-left rounded-xl border px-3 py-3 transition-colors',
                      selectedTenantId === tenant.tenantId
                        ? 'border-brand bg-brand-muted'
                        : 'border-border hover:bg-surface-muted'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{tenant.name}</p>
                        <p className="text-xs text-muted">{tenant.contactEmail}</p>
                        {tenant.subscription ? (
                          <p className="text-xs text-muted mt-1">
                            {SUBSCRIPTION_PLAN_LABELS[tenant.subscription.plan]} ·{' '}
                            {tenant.subscription.priceUsd} USD
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-semibold px-2 py-1 rounded-full',
                          tenantStatusClass(tenant.status)
                        )}
                      >
                        {tenantStatusLabel(tenant.status)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-brand" />
                Usuarios del cliente
              </h3>
              {selectedTenant && (
                <Button type="button" size="sm" variant="outline" onClick={() => setShowUserForm(true)}>
                  <Plus className="w-4 h-4" />
                  Usuario
                </Button>
              )}
            </div>

            {!selectedTenant ? (
              <p className="text-sm text-muted">Selecciona un cliente para ver o crear usuarios.</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-border p-3 bg-surface-muted/50">
                  <p className="text-sm font-semibold">{selectedTenant.name}</p>
                  <p className="text-xs text-muted mt-1">ID: {selectedTenant.tenantId}</p>
                  {selectedTenant.subscription ? (
                    <p className="text-xs text-muted mt-1">
                      Plan: {SUBSCRIPTION_PLAN_LABELS[selectedTenant.subscription.plan]} ·{' '}
                      {selectedTenant.subscription.priceUsd} USD
                    </p>
                  ) : null}
                  {selectedTenant.status !== 'pending' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => void toggleTenantStatus(selectedTenant)}
                    >
                      {selectedTenant.status === 'active' ? 'Suspender acceso' : 'Reactivar acceso'}
                    </Button>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleApproveTenant(selectedTenant.tenantId)}
                      >
                        Aprobar registro
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleRejectTenant(selectedTenant.tenantId)}
                      >
                        Rechazar
                      </Button>
                    </div>
                  )}
                </div>

                <AdminSubscriptionPanel
                  tenant={selectedTenant}
                  onUpdated={() => {
                    void loadTenants().catch((err) => {
                      setError(err instanceof Error ? err.message : 'Error al actualizar.');
                    });
                  }}
                />

                {showUserForm && (
                  <form onSubmit={handleCreateUser} className="space-y-3 border border-border rounded-xl p-3">
                    <Input
                      label="Nombre"
                      value={userForm.name}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <Input
                      label="Correo"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                    <Input
                      label="Contraseña"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <label className="block text-sm font-medium text-foreground">Rol</label>
                    <select
                      value={userForm.role}
                      onChange={(e) =>
                        setUserForm((prev) => ({
                          ...prev,
                          role: e.target.value as 'tenant_admin' | 'tenant_user',
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
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowUserForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {tenantUsers.map((tenantUser) => (
                    <div key={tenantUser.userId} className="rounded-xl border border-border px-3 py-2.5">
                      <p className="text-sm font-semibold">{tenantUser.name}</p>
                      <p className="text-xs text-muted">{tenantUser.email}</p>
                      <p className="text-xs text-muted mt-1">
                        {tenantUser.role === 'tenant_admin' ? 'Administrador' : 'Usuario'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
