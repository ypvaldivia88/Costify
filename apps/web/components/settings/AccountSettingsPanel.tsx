'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, KeyRound, LogOut, User } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { SubscriptionPanel } from '@/components/settings/SubscriptionPanel';
import type { AccountDetails } from '@/lib/auth/account';
import type { SessionUser } from '@/lib/auth/types';

interface AccountSettingsPanelProps {
  user: SessionUser | null | undefined;
}

export function AccountSettingsPanel({ user }: AccountSettingsPanelProps) {
  const { logout, refresh } = useAuth();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
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
    const response = await fetch('/api/account', { credentials: 'include', cache: 'no-store' });
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

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profile),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo guardar el perfil.');
      }
      await refresh();
      await loadAccount();
      showToast('Datos actualizados correctamente.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al guardar.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('La confirmación de contraseña no coincide.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      const response = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        'Tu cuenta quedará inactiva y no podrás iniciar sesión hasta que un administrador la reactive.\n\n' +
        (isTenantAdmin
          ? 'Los demás usuarios del negocio podrán seguir operando.'
          : 'Tus datos del negocio no se eliminarán.'),
      confirmLabel: 'Suspender cuenta',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const response = await fetch('/api/account/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      message:
        'Esta acción es permanente.\n\n' +
        (isTenantAdmin && account?.tenant
          ? 'Si eres el único usuario del negocio, también se eliminarán todos los datos del negocio en la nube.'
          : 'Se eliminará tu acceso a este negocio.'),
      confirmLabel: 'Eliminar permanentemente',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        <p className="text-sm text-muted">Cargando datos de la cuenta…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isTenantAdmin && account?.tenant && (
        <SubscriptionPanel
          businessName={account.tenant.name}
          contactName={profile.name}
          contactEmail={profile.contactEmail || profile.email}
          subscription={account.tenant.subscription}
        />
      )}

      <Card>
        <SectionHeader
          icon={User}
          title="Perfil personal"
          description="Actualiza tu nombre y correo de acceso"
        />
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Nombre"
            value={profile.name}
            onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Correo electrónico"
            type="email"
            value={profile.email}
            onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          {isTenantAdmin && account?.tenant && (
            <>
              <Input
                label="Nombre del negocio"
                value={profile.businessName}
                onChange={(e) => setProfile((prev) => ({ ...prev, businessName: e.target.value }))}
                required
              />
              <Input
                label="Correo de contacto del negocio"
                type="email"
                value={profile.contactEmail}
                onChange={(e) => setProfile((prev) => ({ ...prev, contactEmail: e.target.value }))}
                required
              />
            </>
          )}
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </form>
      </Card>

      <Card>
        <SectionHeader
          icon={KeyRound}
          title="Contraseña"
          description="Cambia la contraseña de acceso a tu cuenta"
        />
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }))}
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))}
            hint="Mínimo 8 caracteres"
            required
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
          <Button type="submit" variant="outline" disabled={savingPassword}>
            {savingPassword ? 'Actualizando…' : 'Cambiar contraseña'}
          </Button>
        </form>
      </Card>

      <Card variant="muted">
        <SectionHeader
          icon={AlertTriangle}
          title="Zona de riesgo"
          description="Acciones irreversibles sobre tu cuenta"
        />
        <div className="space-y-4">
          <Input
            label="Confirma con tu contraseña"
            type="password"
            autoComplete="current-password"
            value={dangerPassword}
            onChange={(e) => setDangerPassword(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => void handleSuspend()}>
              Suspender cuenta
            </Button>
            <Button type="button" variant="danger" onClick={() => void handleDelete()}>
              Eliminar cuenta
            </Button>
          </div>
          <p className="text-xs text-muted">
            Suspender desactiva tu acceso sin borrar datos. Eliminar borra tu cuenta de forma
            permanente.
          </p>
        </div>
      </Card>

      <Button type="button" variant="outline" className="w-full" onClick={() => void logout()}>
        <LogOut className="w-4 h-4" />
        Cerrar sesión
      </Button>
    </div>
  );
}
