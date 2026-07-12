'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LogOut, Plus, RefreshCw, Shield } from 'lucide-react';
import { BrandSpinner } from '@/components/brand/BrandSpinner';
import { AdminChartsGrid } from '@/components/admin/AdminCharts';
import { AdminOverviewStatsGrid } from '@/components/admin/AdminOverviewStats';
import { AdminTenantDetailSheet } from '@/components/admin/AdminTenantDetailSheet';
import { AdminTenantsTable } from '@/components/admin/AdminTenantsTable';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toast';
import type { AdminOverview, AdminTenantRow } from '@/lib/admin/types';
import type { PublicTenant } from '@/lib/auth/types';

export function AdminConsole() {
  const { user, logout, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactEmail: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  const loadOverview = useCallback(async () => {
    const response = await fetch('/api/admin/overview', { credentials: 'include', cache: 'no-store' });
    const json = (await response.json()) as AdminOverview & { error?: string };
    if (!response.ok) {
      throw new Error(json.error || 'No se pudo cargar el panel.');
    }
    setOverview(json);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await loadOverview();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setRefreshing(false);
    }
  }, [loadOverview, showToast]);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar.');
    } finally {
      setLoading(false);
    }
  }, [loadOverview]);

  useEffect(() => {
    void initialLoad();
  }, [initialLoad]);

  const tenants = overview?.tenants ?? [];
  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.tenantId === selectedTenantId) ?? null,
    [tenants, selectedTenantId]
  );

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setDetailOpen(true);
  };

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
      await refresh();
      if (json.tenant) {
        setSelectedTenantId(json.tenant.tenantId);
        setDetailOpen(true);
      }
      setShowCreateForm(false);
      setForm({
        name: '',
        contactEmail: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
      });
      showToast('Cliente registrado.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear cliente.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setCreating(false);
    }
  };

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
      await refresh();
      setSelectedTenantId(tenantId);
      setDetailOpen(true);
      showToast('Cliente aprobado.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aprobar.';
      setError(message);
      showToast(message, 'error');
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
      if (selectedTenantId === tenantId) {
        setSelectedTenantId(null);
        setDetailOpen(false);
      }
      await refresh();
      showToast('Registro rechazado.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al rechazar.';
      setError(message);
      showToast(message, 'error');
    }
  };

  const toggleTenantStatus = async (tenant: AdminTenantRow) => {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const response = await fetch(`/api/admin/tenants/${tenant.tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      const message = json.error || 'No se pudo actualizar el estado.';
      setError(message);
      showToast(message, 'error');
      return;
    }
    await refresh();
    showToast(nextStatus === 'active' ? 'Cliente reactivado.' : 'Cliente suspendido.', 'success');
  };

  if (authLoading || loading) {
    return <BrandSpinner />;
  }

  return (
    <div className="min-h-dvh mesh-bg text-foreground">
      <header className="glass border-b border-border/60 safe-top sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 min-h-14 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-gradient rounded-xl flex items-center justify-center shadow-glow">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold">Panel Super Admin</h1>
              <p className="text-xs text-muted">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={refreshing} onClick={() => void refresh()}>
              <RefreshCw className={refreshing ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
              Actualizar
            </Button>
            <Button type="button" variant="outline" onClick={() => void logout()}>
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Centro de control</h2>
            <p className="text-sm text-muted">
              Métricas, directorio completo de clientes y gestión de suscripciones y usuarios.
            </p>
          </div>
          <Button type="button" onClick={() => setShowCreateForm((value) => !value)}>
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </Button>
        </div>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        {overview ? <AdminOverviewStatsGrid stats={overview.stats} /> : null}

        <Tabs defaultValue="directory">
          <TabsList>
            <TabsTrigger value="directory">Directorio</TabsTrigger>
            <TabsTrigger value="analytics">Analítica</TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="space-y-4 mt-4">
            {showCreateForm ? (
              <Card className="p-5">
                <h3 className="text-lg font-semibold mb-4">Registrar nuevo cliente</h3>
                <form onSubmit={handleCreateTenant} className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Nombre del negocio"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                  <Input
                    label="Correo de contacto"
                    type="email"
                    value={form.contactEmail}
                    onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                  />
                  <Input
                    label="Nombre del administrador"
                    value={form.adminName}
                    onChange={(event) => setForm((prev) => ({ ...prev, adminName: event.target.value }))}
                    required
                  />
                  <Input
                    label="Correo del administrador"
                    type="email"
                    value={form.adminEmail}
                    onChange={(event) => setForm((prev) => ({ ...prev, adminEmail: event.target.value }))}
                    required
                  />
                  <Input
                    label="Contraseña inicial"
                    type="password"
                    value={form.adminPassword}
                    onChange={(event) => setForm((prev) => ({ ...prev, adminPassword: event.target.value }))}
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
            ) : null}

            <AdminTenantsTable
              tenants={tenants}
              selectedTenantId={selectedTenantId}
              onSelectTenant={handleSelectTenant}
              onApprove={(tenantId) => void handleApproveTenant(tenantId)}
              onReject={(tenantId) => void handleRejectTenant(tenantId)}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            {overview ? (
              <AdminChartsGrid
                tenantsByStatus={overview.charts.tenantsByStatus}
                tenantsByPlan={overview.charts.tenantsByPlan}
                registrationsByMonth={overview.charts.registrationsByMonth}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </main>

      <AdminTenantDetailSheet
        tenant={selectedTenant}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRefresh={refresh}
        onApprove={handleApproveTenant}
        onReject={handleRejectTenant}
        onToggleStatus={toggleTenantStatus}
      />
    </div>
  );
}
