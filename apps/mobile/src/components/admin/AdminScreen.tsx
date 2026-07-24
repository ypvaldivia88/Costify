import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Building2, LogOut, Plus, Shield } from 'lucide-react-native';
import { getTenantListStatus } from '@costify/shared/domain/tenant-list-status';
import { SUBSCRIPTION_PLAN_LABELS } from '@costify/shared/domain/subscription';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/api/client';
import type { PublicTenant } from '@/auth/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AdminTenantDetailModal } from '@/components/admin/AdminTenantDetailModal';

export function AdminScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const [tenants, setTenants] = useState<PublicTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<PublicTenant | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactEmail: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  const loadTenants = useCallback(async () => {
    const response = await apiFetch('/api/admin/tenants');
    const json = (await response.json()) as { tenants?: PublicTenant[]; error?: string };
    if (!response.ok) {
      throw new Error(json.error || 'No se pudieron cargar los clientes.');
    }
    setTenants(json.tenants ?? []);
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

  const sortedTenants = useMemo(
    () => [...tenants].sort((a, b) => b.createdAt - a.createdAt),
    [tenants]
  );

  const handleCreateTenant = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await apiFetch('/api/admin/tenants', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const json = (await response.json()) as { error?: string; tenant?: PublicTenant };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo registrar el cliente.');
      }
      await loadTenants();
      if (json.tenant) {
        setSelectedTenant(json.tenant);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente.');
    } finally {
      setCreating(false);
    }
  };

  const handleApproveTenant = async (tenantId: string) => {
    setError(null);
    try {
      const response = await apiFetch(`/api/admin/tenants/${tenantId}/approve`, { method: 'POST' });
      const json = (await response.json()) as { error?: string; tenant?: PublicTenant };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo aprobar el cliente.');
      }
      await loadTenants();
      if (json.tenant) setSelectedTenant(json.tenant);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar.');
    }
  };

  const handleRejectTenant = async (tenantId: string) => {
    setError(null);
    try {
      const response = await apiFetch(`/api/admin/tenants/${tenantId}/reject`, { method: 'POST' });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo rechazar el registro.');
      }
      setDetailOpen(false);
      setSelectedTenant(null);
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar.');
    }
  };

  const toggleTenantStatus = async (tenant: PublicTenant) => {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const response = await apiFetch(`/api/admin/tenants/${tenant.tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = (await response.json()) as { error?: string; tenant?: PublicTenant };
    if (!response.ok) {
      setError(json.error || 'No se pudo actualizar el estado.');
      return;
    }
    await loadTenants();
    if (json.tenant) setSelectedTenant(json.tenant);
  };

  const handleTenantUpdated = (updated: PublicTenant) => {
    setTenants((prev) =>
      prev.map((item) => (item.tenantId === updated.tenantId ? { ...item, ...updated } : item))
    );
    setSelectedTenant(updated);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: colors.brand }]}>
            <Shield size={16} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Panel Super Admin</Text>
            <Text style={[styles.headerSub, { color: colors.muted }]}>{user?.name}</Text>
          </View>
        </View>
        <Button variant="outline" onPress={() => void logout()}>
          <LogOut size={16} color={colors.foreground} />
          {' Salir'}
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Clientes</Text>
            <Text style={[styles.sectionDesc, { color: colors.muted }]}>
              Toca un negocio para gestionar suscripción, usuarios y estado.
            </Text>
          </View>
          <Button onPress={() => setShowCreateForm((value) => !value)}>
            <Plus size={16} color="#fff" />
            {' Nuevo'}
          </Button>
        </View>

        {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}

        {showCreateForm ? (
          <Card>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Registrar nuevo cliente</Text>
            <Input
              label="Nombre del negocio"
              value={form.name}
              onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
            />
            <Input
              label="Correo de contacto"
              value={form.contactEmail}
              onChangeText={(contactEmail) => setForm((prev) => ({ ...prev, contactEmail }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Nombre del administrador"
              value={form.adminName}
              onChangeText={(adminName) => setForm((prev) => ({ ...prev, adminName }))}
            />
            <Input
              label="Correo del administrador"
              value={form.adminEmail}
              onChangeText={(adminEmail) => setForm((prev) => ({ ...prev, adminEmail }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <PasswordInput
              label="Contraseña inicial"
              value={form.adminPassword}
              onChangeText={(adminPassword) => setForm((prev) => ({ ...prev, adminPassword }))}
              hint="Mínimo 8 caracteres"
            />
            <View style={styles.row}>
              <Button onPress={() => void handleCreateTenant()} disabled={creating}>
                {creating ? 'Registrando…' : 'Registrar cliente'}
              </Button>
              <Button variant="outline" onPress={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </View>
          </Card>
        ) : null}

        <Card>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            <Building2 size={16} color={colors.brand} /> Negocios registrados
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.brand} />
          ) : sortedTenants.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13 }}>Aún no hay clientes.</Text>
          ) : (
            sortedTenants.map((tenant) => {
              const listStatus = getTenantListStatus({
                status: tenant.status,
                createdAt: tenant.createdAt,
                subscription: tenant.subscription,
              });

              return (
                <Pressable
                  key={tenant.tenantId}
                  onPress={() => {
                    setSelectedTenant(tenant);
                    setDetailOpen(true);
                  }}
                  style={[
                    styles.tenantItem,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceMuted,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tenantName, { color: colors.foreground }]}>{tenant.name}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>{tenant.contactEmail}</Text>
                    {tenant.subscription ? (
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                        {SUBSCRIPTION_PLAN_LABELS[tenant.subscription.plan]} · {tenant.subscription.priceUsd} USD
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[styles.badge, { color: colors.brand, backgroundColor: colors.brandMuted }]}>
                      {listStatus.label}
                    </Text>
                    {listStatus.detail ? (
                      <Text style={{ color: colors.muted, fontSize: 11 }}>{listStatus.detail}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </Card>
      </ScrollView>

      <AdminTenantDetailModal
        tenant={selectedTenant}
        visible={detailOpen}
        onClose={() => setDetailOpen(false)}
        onTenantUpdated={handleTenantUpdated}
        onApprove={handleApproveTenant}
        onReject={handleRejectTenant}
        onToggleStatus={toggleTenantStatus}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSub: { fontSize: 12 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  sectionDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tenantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  tenantName: { fontSize: 14, fontWeight: '700' },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
