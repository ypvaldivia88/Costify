import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, KeyRound, LogOut, User } from 'lucide-react-native';
import { apiFetch } from '@/api/client';
import type { AccountDetails, SessionUser } from '@/auth/types';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/DialogContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { SubscriptionPanel } from '@/components/settings/SubscriptionPanel';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface AccountSettingsPanelProps {
  user: SessionUser | null | undefined;
}

export function AccountSettingsPanel({ user }: AccountSettingsPanelProps) {
  const { logout, updateSession } = useAuth();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', businessName: '', contactEmail: '' });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [dangerPassword, setDangerPassword] = useState('');

  const isTenantAdmin = user?.role === 'tenant_admin';

  const loadAccount = useCallback(async () => {
    const response = await apiFetch('/api/account');
    if (!response.ok) {
      throw new Error('No se pudo cargar los datos de la cuenta.');
    }
    const json = (await response.json()) as AccountDetails;
    setAccount(json);
    setProfile({
      name: json.user.name,
      email: json.user.email,
      businessName: json.tenant?.name ?? '',
      contactEmail: json.tenant?.contactEmail ?? '',
    });
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadAccount();
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Error al cargar la cuenta.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAccount, showToast]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await apiFetch('/api/account', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });
      const json = (await response.json()) as { user?: SessionUser; token?: string; error?: string };
      if (!response.ok || !json.user) {
        throw new Error(json.error || 'No se pudo guardar el perfil.');
      }
      await updateSession(json.user, json.token);
      await loadAccount();
      showToast('Datos actualizados correctamente.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al guardar.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('La confirmación de contraseña no coincide.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      const response = await apiFetch('/api/account/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo cambiar la contraseña.');
      }
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Contraseña actualizada correctamente.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al cambiar contraseña.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSuspend = async () => {
    if (!dangerPassword) {
      showToast('Introduce tu contraseña para suspender la cuenta.', 'error');
      return;
    }

    const confirmed = await confirm({
      title: 'Suspender cuenta',
      message:
        'Tu cuenta quedará inactiva y no podrás iniciar sesión hasta que un administrador la reactive.',
      confirmLabel: 'Suspender cuenta',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const response = await apiFetch('/api/account/suspend', {
        method: 'POST',
        body: JSON.stringify({ password: dangerPassword }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo suspender la cuenta.');
      }
      showToast('Cuenta suspendida.', 'success');
      await logout();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al suspender.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!dangerPassword) {
      showToast('Introduce tu contraseña para eliminar la cuenta.', 'error');
      return;
    }

    const confirmed = await confirm({
      title: 'Eliminar cuenta',
      message: 'Esta acción es permanente.',
      confirmLabel: 'Eliminar permanentemente',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const response = await apiFetch('/api/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: dangerPassword }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo eliminar la cuenta.');
      }
      showToast('Cuenta eliminada.', 'success');
      await logout();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al eliminar.', 'error');
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <Card>
        <Text style={{ color: colors.muted, fontSize: 14 }}>Cargando datos de la cuenta…</Text>
      </Card>
    );
  }

  return (
    <View style={styles.content}>
      {isTenantAdmin && account?.tenant ? (
        <SubscriptionPanel
          businessName={account.tenant.name}
          contactName={profile.name}
          contactEmail={profile.contactEmail || profile.email}
          subscription={account.tenant.subscription}
        />
      ) : null}

      <Card>
        <SectionHeader
          icon={User}
          title="Perfil personal"
          description="Actualiza tu nombre y correo de acceso"
        />
        <Input
          label="Nombre"
          value={profile.name}
          onChangeText={(name) => setProfile((prev) => ({ ...prev, name }))}
        />
        <Input
          label="Correo electrónico"
          value={profile.email}
          onChangeText={(email) => setProfile((prev) => ({ ...prev, email }))}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {isTenantAdmin && account?.tenant ? (
          <>
            <Input
              label="Nombre del negocio"
              value={profile.businessName}
              onChangeText={(businessName) => setProfile((prev) => ({ ...prev, businessName }))}
            />
            <Input
              label="Correo de contacto del negocio"
              value={profile.contactEmail}
              onChangeText={(contactEmail) => setProfile((prev) => ({ ...prev, contactEmail }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </>
        ) : null}
        <Button onPress={() => void handleSaveProfile()} disabled={savingProfile}>
          {savingProfile ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </Card>

      <Card>
        <SectionHeader
          icon={KeyRound}
          title="Contraseña"
          description="Cambia la contraseña de acceso a tu cuenta"
        />
        <PasswordInput
          label="Contraseña actual"
          value={passwords.currentPassword}
          onChangeText={(currentPassword) => setPasswords((prev) => ({ ...prev, currentPassword }))}
          autoComplete="password"
          returnKeyType="next"
        />
        <PasswordInput
          label="Nueva contraseña"
          value={passwords.newPassword}
          onChangeText={(newPassword) => setPasswords((prev) => ({ ...prev, newPassword }))}
          autoComplete="password-new"
          hint="Mínimo 8 caracteres"
          returnKeyType="next"
        />
        <PasswordInput
          label="Confirmar nueva contraseña"
          value={passwords.confirmPassword}
          onChangeText={(confirmPassword) => setPasswords((prev) => ({ ...prev, confirmPassword }))}
          autoComplete="password-new"
          returnKeyType="done"
        />
        <Button variant="outline" onPress={() => void handleChangePassword()} disabled={savingPassword}>
          {savingPassword ? 'Actualizando…' : 'Cambiar contraseña'}
        </Button>
      </Card>

      <Card>
        <SectionHeader
          icon={AlertTriangle}
          title="Zona de riesgo"
          description="Acciones irreversibles sobre tu cuenta"
        />
        <PasswordInput
          label="Confirma con tu contraseña"
          value={dangerPassword}
          onChangeText={setDangerPassword}
          autoComplete="password"
          returnKeyType="done"
        />
        <View style={styles.row}>
          <Button variant="outline" onPress={() => void handleSuspend()}>
            Suspender cuenta
          </Button>
          <Button variant="outline" onPress={() => void handleDelete()}>
            Eliminar cuenta
          </Button>
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 16 }}>
          Suspender desactiva tu acceso sin borrar datos. Eliminar borra tu cuenta de forma permanente.
        </Text>
      </Card>

      <Button variant="outline" onPress={() => void logout()}>
        <LogOut size={16} color={colors.foreground} />
        {' Cerrar sesión'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 24 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
