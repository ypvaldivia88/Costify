import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Building2, CheckCircle2, Clock3, LogOut, Plus, Shield, Users, XCircle } from 'lucide-react-native';
import {
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from '@costify/shared/domain/subscription';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/api/client';
import type { PublicTenant, PublicUser } from '@/auth/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';

function tenantStatusLabel(status: PublicTenant['status']): string {
  if (status === 'pending') return 'Pendiente';
  if (status === 'suspended') return 'Suspendido';
  return 'Activo';
}

export function AdminScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
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
  const [passwordEditUserId, setPasswordEditUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const loadTenants = useCallback(async () => {
    const response = await apiFetch('/api/admin/tenants');
    const json = (await response.json()) as { tenants?: PublicTenant[]; error?: string };
    if (!response.ok) {
      throw new Error(json.error || 'No se pudieron cargar los clientes.');
    }
    setTenants(json.tenants ?? []);
  }, []);

  const loadTenantUsers = useCallback(async (tenantId: string) => {
    const response = await apiFetch(`/api/admin/tenants/${tenantId}`);
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

  const handleCreateUser = async () => {
    if (!selectedTenantId) return;
    setCreating(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/admin/tenants/${selectedTenantId}`, {
        method: 'POST',
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
    const response = await apiFetch(`/api/admin/tenants/${tenant.tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(json.error || 'No se pudo actualizar el estado.');
      return;
    }
    await loadTenants();
  };

  const handleResetPassword = async (userId: string) => {
    if (!selectedTenantId || newPassword.length < 8) return;
    setCreating(true);
    setError(null);
    try {
      const response = await apiFetch(
        `/api/admin/tenants/${selectedTenantId}/users/${userId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ password: newPassword }),
        }
      );
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo cambiar la contraseña.');
      }
      setPasswordEditUserId(null);
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña.');
    } finally {
      setCreating(false);
    }
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
      const response = await apiFetch(`/api/admin/tenants/${tenantId}/approve`, { method: 'POST' });
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
      const response = await apiFetch(`/api/admin/tenants/${tenantId}/reject`, { method: 'POST' });
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
              Registra negocios y crea usuarios con acceso a su espacio individual.
            </Text>
          </View>
          <Button onPress={() => setShowCreateForm((value) => !value)}>
            <Plus size={16} color="#fff" />
            {' Nuevo'}
          </Button>
        </View>

        {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}

        {pendingTenants.length > 0 ? (
          <Card variant="accent">
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              <Clock3 size={16} color={colors.brand} /> Solicitudes pendientes
            </Text>
            {pendingTenants.map((tenant) => (
              <View
                key={tenant.tenantId}
                style={[styles.pendingItem, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tenantName, { color: colors.foreground }]}>{tenant.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{tenant.contactEmail}</Text>
                  {tenant.subscription ? (
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                      {SUBSCRIPTION_PLAN_LABELS[tenant.subscription.plan]} · {tenant.subscription.priceUsd} USD ·{' '}
                      {SUBSCRIPTION_STATUS_LABELS[tenant.subscription.status]}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.row}>
                  <Button size="sm" onPress={() => void handleApproveTenant(tenant.tenantId)}>
                    <CheckCircle2 size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Aprobar</Text>
                  </Button>
                  <Button size="sm" variant="outline" onPress={() => void handleRejectTenant(tenant.tenantId)}>
                    <XCircle size={14} color={colors.foreground} />
                    <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>Rechazar</Text>
                  </Button>
                </View>
              </View>
            ))}
          </Card>
        ) : null}

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
          ) : activeTenants.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13 }}>Aún no hay clientes activos.</Text>
          ) : (
            activeTenants.map((tenant) => {
              const selected = selectedTenantId === tenant.tenantId;
              return (
                <Pressable
                  key={tenant.tenantId}
                  onPress={() => setSelectedTenantId(tenant.tenantId)}
                  style={[
                    styles.tenantItem,
                    {
                      borderColor: selected ? colors.brand : colors.border,
                      backgroundColor: selected ? colors.brandMuted : colors.surfaceMuted,
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
                  <Text
                    style={[
                      styles.badge,
                      {
                        color:
                          tenant.status === 'active'
                            ? colors.brandForeground
                            : tenant.status === 'pending'
                              ? colors.brand
                              : colors.warning,
                        backgroundColor:
                          tenant.status === 'active'
                            ? colors.brandMuted
                            : tenant.status === 'pending'
                              ? colors.accentSurface
                              : colors.accentSurface,
                      },
                    ]}
                  >
                    {tenantStatusLabel(tenant.status)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </Card>

        <Card>
          <View style={styles.usersHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              <Users size={16} color={colors.brand} /> Usuarios del cliente
            </Text>
            {selectedTenant ? (
              <Button variant="outline" onPress={() => setShowUserForm(true)}>
                <Plus size={14} color={colors.foreground} />
                {' Usuario'}
              </Button>
            ) : null}
          </View>

          {!selectedTenant ? (
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              Selecciona un cliente para ver o crear usuarios.
            </Text>
          ) : (
            <>
              <View style={[styles.tenantDetail, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.tenantName, { color: colors.foreground }]}>{selectedTenant.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                  ID: {selectedTenant.tenantId}
                </Text>
                {selectedTenant.subscription ? (
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                    {SUBSCRIPTION_PLAN_LABELS[selectedTenant.subscription.plan]} ·{' '}
                    {selectedTenant.subscription.priceUsd} USD
                  </Text>
                ) : null}
                {selectedTenant.status !== 'pending' ? (
                  <Button
                    variant="outline"
                    onPress={() => void toggleTenantStatus(selectedTenant)}
                    style={{ marginTop: 12, alignSelf: 'flex-start' }}
                  >
                    {selectedTenant.status === 'active' ? 'Suspender acceso' : 'Reactivar acceso'}
                  </Button>
                ) : (
                  <View style={[styles.row, { marginTop: 12 }]}>
                    <Button onPress={() => void handleApproveTenant(selectedTenant.tenantId)}>
                      Aprobar registro
                    </Button>
                    <Button variant="outline" onPress={() => void handleRejectTenant(selectedTenant.tenantId)}>
                      Rechazar
                    </Button>
                  </View>
                )}
              </View>

              {showUserForm ? (
                <View style={[styles.userForm, { borderColor: colors.border }]}>
                  <Input
                    label="Nombre"
                    value={userForm.name}
                    onChangeText={(name) => setUserForm((prev) => ({ ...prev, name }))}
                  />
                  <Input
                    label="Correo"
                    value={userForm.email}
                    onChangeText={(email) => setUserForm((prev) => ({ ...prev, email }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <PasswordInput
                    label="Contraseña"
                    value={userForm.password}
                    onChangeText={(password) => setUserForm((prev) => ({ ...prev, password }))}
                    hint="Mínimo 8 caracteres"
                  />
                  <Text style={[styles.pickerLabel, { color: colors.foreground }]}>Rol</Text>
                  <View style={[styles.pickerWrap, { borderColor: colors.border }]}>
                    <Picker
                      selectedValue={userForm.role}
                      onValueChange={(role) =>
                        setUserForm((prev) => ({
                          ...prev,
                          role: role as 'tenant_admin' | 'tenant_user',
                        }))
                      }
                      style={{ color: colors.foreground }}
                    >
                      <Picker.Item label="Administrador del negocio" value="tenant_admin" />
                      <Picker.Item label="Usuario del negocio" value="tenant_user" />
                    </Picker>
                  </View>
                  <View style={styles.row}>
                    <Button onPress={() => void handleCreateUser()} disabled={creating}>
                      Crear usuario
                    </Button>
                    <Button variant="outline" onPress={() => setShowUserForm(false)}>
                      Cancelar
                    </Button>
                  </View>
                </View>
              ) : null}

              {tenantUsers.map((tenantUser) => (
                <View key={tenantUser.userId} style={[styles.userItem, { borderColor: colors.border }]}>
                  <Text style={[styles.tenantName, { color: colors.foreground }]}>{tenantUser.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{tenantUser.email}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                    {tenantUser.role === 'tenant_admin' ? 'Administrador' : 'Usuario'}
                  </Text>
                  {passwordEditUserId === tenantUser.userId ? (
                    <View style={styles.passwordEdit}>
                      <PasswordInput
                        label="Nueva contraseña"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        hint="Mínimo 8 caracteres"
                      />
                      <View style={styles.row}>
                        <Button
                          onPress={() => void handleResetPassword(tenantUser.userId)}
                          disabled={creating || newPassword.length < 8}
                        >
                          Guardar
                        </Button>
                        <Button
                          variant="outline"
                          onPress={() => {
                            setPasswordEditUserId(null);
                            setNewPassword('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </View>
                    </View>
                  ) : (
                    <Button
                      variant="outline"
                      onPress={() => {
                        setPasswordEditUserId(tenantUser.userId);
                        setNewPassword('');
                      }}
                      style={styles.passwordBtn}
                    >
                      Cambiar contraseña
                    </Button>
                  )}
                </View>
              ))}
            </>
          )}
        </Card>
      </ScrollView>
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
  usersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tenantDetail: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  pendingItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  userForm: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  pickerLabel: { fontSize: 14, fontWeight: '600' },
  pickerWrap: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  userItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  passwordEdit: { marginTop: 8, gap: 8 },
  passwordBtn: { marginTop: 8, alignSelf: 'flex-start' },
});
