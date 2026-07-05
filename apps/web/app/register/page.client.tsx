'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Building2, Calculator, CheckCircle2, Sparkles } from 'lucide-react';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';
import {
  getSubscriptionDiscountPercent,
  getSubscriptionPlanPriceUsd,
  SUBSCRIPTION_MONTHLY_PRICE_USD,
  SUBSCRIPTION_PLAN_LABELS,
} from '@costify/shared/domain/subscription';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';

const PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

interface RegisterSuccess {
  planLabel: string;
  priceUsd: number;
  whatsappUrl: string;
  message: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    businessName: '',
    contactEmail: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    plan: 'monthly' as SubscriptionPlan,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<RegisterSuccess | null>(null);

  const planOptions = useMemo(
    () =>
      PLANS.map((plan) => ({
        plan,
        label: SUBSCRIPTION_PLAN_LABELS[plan],
        priceUsd: getSubscriptionPlanPriceUsd(plan),
        discountPercent: getSubscriptionDiscountPercent(plan),
      })),
    []
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.adminPassword !== form.confirmPassword) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          contactEmail: form.contactEmail,
          adminName: form.adminName,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
          plan: form.plan,
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
      setError(err instanceof Error ? err.message : 'Error al registrar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh mesh-bg grid-pattern text-foreground flex flex-col">
      <div className="safe-fixed-top-right is-overlay">
        <ThemeToggle className="glass shadow-sm border border-border/60" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
        <motion.div
          className="w-full max-w-2xl space-y-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center space-y-4">
            <motion.div
              className="mx-auto relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-glow">
                <Calculator className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-light rounded-full flex items-center justify-center shadow-sm">
                <Sparkles className="w-3 h-3 text-brand-foreground" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-gradient-brand">
                Registra tu negocio
              </h1>
              <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                Crea tu cuenta en Costify. Tu solicitud quedará pendiente hasta que confirmemos el
                pago por WhatsApp.
              </p>
            </div>
          </div>

          {success ? (
            <motion.div
              className="glass rounded-3xl p-6 sm:p-8 shadow-float space-y-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-brand shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Solicitud enviada</h2>
                  <p className="text-sm text-muted">
                    Te redirigimos a WhatsApp para confirmar el pago y activar tu cuenta.
                  </p>
                  <p className="text-sm">
                    Plan seleccionado: <strong>{success.planLabel}</strong> ({success.priceUsd} USD)
                  </p>
                </div>
              </div>

              <p className="text-center text-sm text-muted">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-brand font-semibold hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="glass rounded-3xl p-6 sm:p-8 shadow-float"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Building2 className="w-4 h-4 text-brand" />
                    Datos del negocio
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Nombre del negocio"
                      value={form.businessName}
                      onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
                      required
                    />
                    <Input
                      label="Correo de contacto"
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                      placeholder="opcional"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-foreground">Administrador del negocio</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Tu nombre"
                      value={form.adminName}
                      onChange={(e) => setForm((prev) => ({ ...prev, adminName: e.target.value }))}
                      required
                    />
                    <Input
                      label="Correo de acceso"
                      type="email"
                      autoComplete="email"
                      value={form.adminEmail}
                      onChange={(e) => setForm((prev) => ({ ...prev, adminEmail: e.target.value }))}
                      required
                    />
                    <Input
                      label="Contraseña"
                      type="password"
                      autoComplete="new-password"
                      value={form.adminPassword}
                      onChange={(e) => setForm((prev) => ({ ...prev, adminPassword: e.target.value }))}
                      hint="Mínimo 8 caracteres"
                      required
                    />
                    <Input
                      label="Confirmar contraseña"
                      type="password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Plan de suscripción</p>
                    <p className="text-xs text-muted mt-1">
                      Precio base: {SUBSCRIPTION_MONTHLY_PRICE_USD} USD / mes. Descuentos en planes
                      de 6 meses y anual.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {planOptions.map((option) => {
                      const selected = form.plan === option.plan;
                      return (
                        <button
                          key={option.plan}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, plan: option.plan }))}
                          className={cn(
                            'rounded-2xl border p-4 text-left transition-colors',
                            selected
                              ? 'border-brand bg-brand-muted'
                              : 'border-border hover:bg-surface-muted'
                          )}
                        >
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className="text-lg font-bold mt-1">{option.priceUsd} USD</p>
                          {option.discountPercent > 0 ? (
                            <p className="text-xs text-muted mt-1">
                              Ahorra {option.discountPercent}%
                            </p>
                          ) : (
                            <p className="text-xs text-muted mt-1">Sin permanencia</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <motion.p
                    className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    {error}
                  </motion.p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? 'Enviando solicitud…' : 'Solicitar registro'}
                </Button>

                <p className="text-center text-sm text-muted">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/login" className="text-brand font-semibold hover:underline">
                    Iniciar sesión
                  </Link>
                </p>
              </form>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
