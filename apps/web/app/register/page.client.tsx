'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CheckCircle2 } from 'lucide-react';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';
import {
  getSubscriptionDiscountPercent,
  getSubscriptionPlanPriceUsd,
  SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD,
  SUBSCRIPTION_INCLUDED_LOCATIONS,
  SUBSCRIPTION_MONTHLY_PRICE_USD,
  SUBSCRIPTION_PLAN_LABELS,
  formatSubscriptionLocationBreakdown,
} from '@costify/shared/domain/subscription';
import { AuthCard } from '@/components/auth/auth-card';
import { PublicShell } from '@/components/layout/PublicShell';
import { Input } from '@/components/ui/Input';
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
import { registerSchema, type RegisterFormValues } from '@/lib/schemas/auth';
import { cn } from '@/lib/utils';

const PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

function parsePlanParam(value: string | null): SubscriptionPlan {
  if (value && PLANS.includes(value as SubscriptionPlan)) {
    return value as SubscriptionPlan;
  }
  return 'monthly';
}

interface RegisterSuccess {
  planLabel: string;
  priceUsd: number;
  whatsappUrl: string;
  message: string;
}

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RegisterSuccess | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      contactEmail: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
      plan: parsePlanParam(searchParams.get('plan')),
    },
  });

  const [locationCount, setLocationCount] = useState(1);

  const planOptions = useMemo(
    () =>
      PLANS.map((plan) => ({
        plan,
        label: SUBSCRIPTION_PLAN_LABELS[plan],
        priceUsd: getSubscriptionPlanPriceUsd(plan, locationCount),
        discountPercent: getSubscriptionDiscountPercent(plan),
      })),
    [locationCount]
  );

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: values.businessName,
          contactEmail: values.contactEmail,
          adminName: values.adminName,
          adminEmail: values.adminEmail,
          adminPassword: values.adminPassword,
          plan: values.plan,
          locationCount,
        }),
      });
      const json = (await response.json()) as RegisterSuccess & { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo completar el registro.');
      }
      setSuccess({
        planLabel: json.planLabel,
        priceUsd: json.priceUsd,
        whatsappUrl: json.whatsappUrl,
        message: json.message,
      });
      window.open(json.whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al registrar.');
    }
  };

  return (
    <PublicShell showFooter={false}>
      <div className="w-full max-w-2xl mx-auto">
        {success ? (
          <AuthCard title="Cuenta creada">
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-brand shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{success.message}</p>
                  <p className="text-sm">
                    Plan seleccionado: <strong>{success.planLabel}</strong> ({success.priceUsd} USD)
                  </p>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-brand font-semibold hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </AuthCard>
        ) : (
          <AuthCard
            title="Registrar negocio"
            description="Crea tu cuenta y empieza con 14 días de prueba gratuita."
            className="max-w-2xl"
          >
            <FormRoot form={form} onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="w-4 h-4 text-brand" />
                  Datos del negocio
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del negocio</FormLabel>
                        <FormControl>
                          <ShadcnInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo de contacto</FormLabel>
                        <FormControl>
                          <ShadcnInput type="email" placeholder="opcional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold">Administrador del negocio</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tu nombre</FormLabel>
                        <FormControl>
                          <ShadcnInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo de acceso</FormLabel>
                        <FormControl>
                          <ShadcnInput type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <PasswordInput autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar contraseña</FormLabel>
                        <FormControl>
                          <PasswordInput autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">¿Cuántos locales administras?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluye {SUBSCRIPTION_INCLUDED_LOCATIONS} local en el precio base. Cada local activo
                    adicional: +${SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD} USD/mes.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setLocationCount(count)}
                      className={cn(
                        'rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
                        locationCount === count
                          ? 'border-brand bg-brand-muted'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      {count === 3 ? '3 o más' : count}
                    </button>
                  ))}
                  {locationCount > 3 ? (
                    <Input
                      type="number"
                      min={3}
                      max={20}
                      value={locationCount}
                      onChange={(e) =>
                        setLocationCount(Math.min(20, Math.max(3, Number(e.target.value) || 3)))
                      }
                      className="w-24"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLocationCount(4)}
                      className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted/50"
                    >
                      4+
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatSubscriptionLocationBreakdown(locationCount)}
                </p>
              </div>

              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <div>
                      <FormLabel>Plan de suscripción</FormLabel>
                      <p className="text-xs text-muted-foreground mt-1">
                        Precio base: {SUBSCRIPTION_MONTHLY_PRICE_USD} USD / mes (1 local). Locales
                        adicionales: +${SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD}/mes cada uno.
                      </p>
                    </div>
                    <FormControl>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {planOptions.map((option) => {
                          const selected = field.value === option.plan;
                          return (
                            <button
                              key={option.plan}
                              type="button"
                              onClick={() => field.onChange(option.plan)}
                              className={cn(
                                'rounded-2xl border p-4 text-left transition-colors min-h-[88px]',
                                selected
                                  ? 'border-brand bg-brand-muted ring-2 ring-brand/20'
                                  : 'border-border hover:bg-muted/50'
                              )}
                            >
                              <p className="text-sm font-semibold">{option.label}</p>
                              <p className="text-lg font-bold mt-1">{option.priceUsd} USD</p>
                              {option.discountPercent > 0 ? (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Ahorra {option.discountPercent}%
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground mt-1">Sin permanencia</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError ? (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
                  {serverError}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Enviando solicitud…' : 'Solicitar registro'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-brand font-semibold hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </FormRoot>
          </AuthCard>
        )}
      </div>
    </PublicShell>
  );
}
