'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthenticatedHome } from '@/components/landing/AuthenticatedHome';
import { MarketingPage } from '@/components/marketing/marketing-page';
import { BrandSpinner } from '@/components/brand/BrandSpinner';

export function HomePageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === 'super_admin') {
      router.replace('/admin');
    }
  }, [loading, router, user]);

  if (loading) {
    return <BrandSpinner message="Cargando…" />;
  }

  if (user?.role === 'super_admin') {
    return <BrandSpinner message="Redirigiendo al panel…" />;
  }

  if (
    user &&
    (user.role === 'tenant_admin' || user.role === 'tenant_user') &&
    !user.workspaceId
  ) {
    return (
      <div className="page-container py-16 text-center space-y-3">
        <h1 className="text-lg font-bold text-foreground">Negocio no asignado</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Tu cuenta no tiene un espacio de trabajo asociado. Contacta al administrador.
        </p>
      </div>
    );
  }

  if (user) {
    return <AuthenticatedHome />;
  }

  return <MarketingPage />;
}
