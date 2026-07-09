'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthCard } from '@/components/auth/auth-card';
import { useAuth } from '@/components/auth/AuthProvider';
import { PublicShell } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRoot,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ShadcnInput } from '@/components/ui/shadcn-input';
import { loginSchema, type LoginFormValues } from '@/lib/schemas/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const user = await login(values.email, values.password);
      const next = searchParams.get('next');
      if (user.role === 'super_admin') {
        router.replace('/admin');
        return;
      }
      router.replace(next && next !== '/login' ? next : '/');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    }
  };

  return (
    <PublicShell showFooter={false}>
      <AuthCard
        title="Iniciar sesión"
        description="Accede a tu negocio y gestiona costos, precios e inventario."
        footer={
          <>
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-brand font-semibold hover:underline">
              Registra tu negocio
            </Link>
            <span className="block mt-2">
              <Link href="/descarga" className="text-brand font-semibold hover:underline">
                Descargar app Android
              </Link>
            </span>
          </>
        }
      >
        <FormRoot form={form} onSubmit={onSubmit} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <ShadcnInput type="email" autoComplete="email" placeholder="tu@empresa.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {serverError ? (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">{serverError}</p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </FormRoot>
      </AuthCard>
    </PublicShell>
  );
}
