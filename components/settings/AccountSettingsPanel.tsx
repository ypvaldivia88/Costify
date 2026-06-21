'use client';

import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { SessionUser } from '@/lib/auth/types';

interface AccountSettingsPanelProps {
  user: SessionUser | null | undefined;
}

export function AccountSettingsPanel({ user }: AccountSettingsPanelProps) {
  const { logout } = useAuth();

  if (!user) return null;

  return (
    <Card>
      <SectionHeader
        icon={User}
        title="Cuenta"
        description="Sesión activa en este dispositivo"
      />

      <div className="space-y-4">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted">Nombre</dt>
            <dd className="font-semibold text-foreground">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Correo</dt>
            <dd className="font-semibold text-foreground break-all">{user.email}</dd>
          </div>
          {user.tenantName && (
            <div>
              <dt className="text-muted">Negocio</dt>
              <dd className="font-semibold text-foreground">{user.tenantName}</dd>
            </div>
          )}
        </dl>

        <Button type="button" variant="outline" className="w-full" onClick={() => void logout()}>
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </div>
    </Card>
  );
}
