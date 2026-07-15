'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';
import {
  getSubscriptionDiscountPercent,
  getSubscriptionPlanPriceUsd,
  SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD,
  SUBSCRIPTION_MONTHLY_PRICE_USD,
  SUBSCRIPTION_PLAN_LABELS,
} from '@costify/shared/domain/subscription';
import { cn } from '@/lib/utils';

const PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

const PLAN_FEATURES = [
  'Ficha de costos y precios',
  'Inventario multi-almacén',
  'App Android offline',
  'Sincronización en la nube',
  'Soporte por WhatsApp',
] as const;

export function LandingPricing() {
  return (
    <section id="precios" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20">
      <motion.div
        className="text-center max-w-2xl mx-auto mb-12"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.45 }}
      >
        <p className="font-data text-xs uppercase tracking-[0.2em] text-landing-sea mb-3">
          Planes
        </p>
        <h2 className="font-display text-3xl sm:text-4xl text-landing-ink leading-tight">
          Un precio claro, sin sorpresas
        </h2>
        <p className="text-landing-muted mt-3">
          Elige el período que prefieras. Incluye 1 local; cada local activo adicional suma $
          {SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD} USD/mes. Activamos tu cuenta después de confirmar el
          pago por WhatsApp.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
        {PLANS.map((plan, index) => {
          const priceUsd = getSubscriptionPlanPriceUsd(plan);
          const discountPercent = getSubscriptionDiscountPercent(plan);
          const isPopular = plan === 'semiannual';

          return (
            <motion.div
              key={plan}
              className={cn(
                'relative flex flex-col rounded-sm border bg-landing-surface p-6',
                isPopular
                  ? 'border-landing-brand shadow-[0_0_0_1px_var(--landing-brand),0_12px_40px_rgba(5,150,105,0.12)]'
                  : 'border-landing-rule'
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-5% 0px' }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-data text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-landing-brand text-white">
                  Más elegido
                </span>
              )}

              <div className="mb-6">
                <h3 className="font-display text-xl text-landing-ink">
                  {SUBSCRIPTION_PLAN_LABELS[plan]}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-data text-4xl text-landing-copper tabular-nums">
                    ${priceUsd}
                  </span>
                  <span className="text-sm text-landing-muted">USD</span>
                </div>
                {discountPercent > 0 ? (
                  <p className="text-sm text-landing-brand mt-1">
                    Ahorras {discountPercent}% vs mensual
                  </p>
                ) : (
                  <p className="text-sm text-landing-muted mt-1">
                    ${SUBSCRIPTION_MONTHLY_PRICE_USD} USD / mes · 1 local · +$
                    {SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD}/mes extra
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {PLAN_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-landing-muted">
                    <Check
                      className="w-4 h-4 text-landing-brand shrink-0 mt-0.5"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={`/register?plan=${plan}`}
                className={cn(
                  'inline-flex items-center justify-center min-h-12 w-full rounded-lg text-sm font-semibold transition-all duration-200',
                  isPopular
                    ? 'bg-landing-brand text-white hover:brightness-110'
                    : 'border border-landing-rule text-landing-ink hover:border-landing-brand/40 bg-landing-paper/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-brand focus-visible:ring-offset-2 focus-visible:ring-offset-landing-surface'
                )}
              >
                Elegir plan
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
