import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { X } from 'lucide-react-native';
import type { PublicTenant, PublicUser } from '@/auth/types';
import { getTenantListStatus } from '@costify/shared/domain/tenant-list-status';
import {
  SUBSCRIPTION_PLAN_LABELS,
} from '@costify/shared/domain/subscription';
import { apiFetch } from '@/api/client';
import { useTheme } from '@/context/ThemeContext';
import { AdminSubscriptionPanel } from '@/components/admin/AdminSubscriptionPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';

interface AdminTenantDetailModalProps {
  tenant: PublicTenant | null;
  visible: boolean;
  onClose: () => void;
  onTenantUpdated: (tenant: PublicTenant) => void;
  onApprove: (tenantId: string) => Promise<void>;
  onReject: (tenantId: string) => Promise<void>;
  onToggleStatus: (tenant: PublicTenant) => Promise<void>;
}

export function AdminTenantDetailModal({
  tenant,
  visible,
  onClose,
  onTenantUpdated,
  onApprove,
  onReject,
  onToggleStatus,
}: AdminTenantDetailModalProps) {
  const { colors } = useTheme();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [passwordEditUserId, setPasswordEditUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tenant_user' as 'tenant_admin' | 'tenant_user',
  });

  useEffect(() => {
    if (!tenant || !visible) {
      setUsers([]);
      return;
    }

    void (async () => {
      setLoadingUsers(true);
      try {
        const response = await apiFetch(`/api/admin/tenants/${tenant.tenantId}`);
        const json = (await response.json()) as { users?: PublicUser[] };
        setUsers(json.users ?? []);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [tenant, visible]);

  if (!tenant) return null;

  const listStatus = getTenantListStatus({
    status: tenant.status,
    createdAt: tenant.createdAt,
    subscription: tenant.subscription,
  });

  const handleCreateUser = async () => {
    setCreating(true);
    try {
      const response = await apiFetch(`/api/admin/tenants/${tenant.tenantId}`, {
        method: 'POST',
        body: JSON.stringify(userForm),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo crear el usuario.');
      }
      const reload = await apiFetch(`/api/admin/tenants/${tenant.tenantId}`);
      const reloadJson = (await reload.json()) as { users?: PublicUser[] };
      setUsers(reloadJson.users ?? []);
      setShowUserForm(false);
      setUserForm({ name: '', email: '', password: '', role: 'tenant_user' });
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (newPassword.length < 8) return;
    setCreating(true);
    try {
      await apiFetch(`/api/admin/tenants/${tenant.tenantId}/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPassword }),
      });
      setPasswordEditUserId(null);
      setNewPassword('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>{tenant.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{tenant.contactEmail}</Text>
          </View>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceMuted }]}>
            <X size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.statusCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.statusLabel, { color: colors.foreground }]}>{listStatus.label}</Text>
            {listStatus.detail ? (
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{listStatus.detail}</Text>
            ) : null}
            {tenant.subscription ? (
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
                {SUBSCRIPTION_PLAN_LABELS[tenant.subscription.plan]} · {tenant.subscription.priceUsd} USD
              </Text>
            ) : null}
          </View>

          {tenant.status === 'pending' ? (
            <View style={styles.row}>
              <Button onPress={() => void onApprove(tenant.tenantId)}>Aprobar</Button>
              <Button variant="outline" onPress={() => void onReject(tenant.tenantId)}>
                Rechazar
              </Button>
            </View>
          ) : (
            <Button variant="outline" onPress={() => void onToggleStatus(tenant)}>
              {tenant.status === 'active' ? 'Suspender acceso' : 'Reactivar acceso'}
            </Button>
          )}

          <AdminSubscriptionPanel
            tenant={tenant}
            onUpdated={(updated) => {
              if (updated) onTenantUpdated(updated);
            }}
          />

          <View style={[styles.usersSection, { borderColor: colors.border }]}>
            <View style={styles.usersHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Usuarios</Text>
              <Button variant="outline" size="sm" onPress={() => setShowUserForm((value) => !value)}>
                {showUserForm ? 'Cancelar' : 'Nuevo usuario'}
              </Button>
            </View>

            {showUserForm ? (
              <View style={styles.userForm}>
                <Input label="Nombre" value={userForm.name} onChangeText={(name) => setUserForm((p) => ({ ...p, name }))} />
                <Input
                  label="Correo"
                  value={userForm.email}
                  onChangeText={(email) => setUserForm((p) => ({ ...p, email }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <PasswordInput
                  label="Contraseña"
                  value={userForm.password}
                  onChangeText={(password) => setUserForm((p) => ({ ...p, password }))}
                />
                <View style={[styles.pickerWrap, { borderColor: colors.border }]}>
                  <Picker
                    selectedValue={userForm.role}
                    onValueChange={(role) =>
                      setUserForm((p) => ({ ...p, role: role as 'tenant_admin' | 'tenant_user' }))
                    }
                    style={{ color: colors.foreground }}
                  >
                    <Picker.Item label="Administrador del negocio" value="tenant_admin" />
                    <Picker.Item label="Usuario del negocio" value="tenant_user" />
                  </Picker>
                </View>
                <Button onPress={() => void handleCreateUser()} disabled={creating}>
                  Crear usuario
                </Button>
              </View>
            ) : null}

            {loadingUsers ? (
              <Text style={{ color: colors.muted, fontSize: 13 }}>Cargando usuarios…</Text>
            ) : (
              users.map((tenantUser) => (
                <View key={tenantUser.userId} style={[styles.userItem, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.foreground, fontWeight: '700' }}>{tenantUser.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{tenantUser.email}</Text>
                  {passwordEditUserId === tenantUser.userId ? (
                    <View style={{ gap: 8, marginTop: 8 }}>
                      <PasswordInput label="Nueva contraseña" value={newPassword} onChangeText={setNewPassword} />
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
                      size="sm"
                      onPress={() => {
                        setPasswordEditUserId(tenantUser.userId);
                        setNewPassword('');
                      }}
                      style={{ marginTop: 8, alignSelf: 'flex-start' }}
                    >
                      Cambiar contraseña
                    </Button>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '800' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  statusCard: { borderWidth: 1, borderRadius: 12, padding: 12 },
  statusLabel: { fontSize: 16, fontWeight: '800' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  usersSection: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  usersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  userForm: { gap: 8 },
  pickerWrap: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  userItem: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
});
