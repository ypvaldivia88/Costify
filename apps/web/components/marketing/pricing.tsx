'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';
import {
  getSubscriptionDiscountPercent,
  getSubscriptionPlanPriceUsd,
  SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD,
  SUBSCRIPTION_INCLUDED_LOCATIONS,
  SUBSCRIPTION_MONTHLY_PRICE_USD,
  SUBSCRIPTION_PLAN_LABELS,
} from '@costify/shared/domain/subscription';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

const PLAN_FEATURES = [
  'Ficha de costos y precios',
  'Inventario multi-almacén',
  'App Android offline',
  'Sincronización en la nube',
  'Soporte por WhatsApp',
] as const;

export function MarketingPricing() {
  return (
    <section id="precios" className="page-container py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
        <p className="text-sm font-semibold text-brand mb-2">Precios</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Un precio claro, sin sorpresas
        </h2>
        <p className="mt-3 text-muted-foreground">
          Elige el período que prefieras. El precio incluye 1 local; cada local activo adicional suma
          ${SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD} USD/mes. Activamos tu cuenta después de confirmar el
          pago por WhatsApp.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan, index) => {
          const priceUsd = getSubscriptionPlanPriceUsd(plan);
          const discountPercent = getSubscriptionDiscountPercent(plan);
          const isPopular = plan === 'semiannual';

          return (
            <motion.div
              key={plan}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Card
                className={cn(
                  'relative flex flex-col h-full',
                  isPopular && 'ring-2 ring-brand shadow-glow'
                )}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
                    Más popular
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg">{SUBSCRIPTION_PLAN_LABELS[plan]}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tabular-nums">${priceUsd}</span>
                    <span className="text-muted-foreground text-sm">USD</span>
                  </div>
                  {discountPercent > 0 && (
                    <p className="text-xs text-brand font-medium mt-1">
                      Ahorra {discountPercent}% vs mensual (${SUBSCRIPTION_MONTHLY_PRICE_USD}/mes, 1 local)
                    </p>
                  )}
                  {discountPercent === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      1 local incluido · +${SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD}/mes por local extra
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {PLAN_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="size-4 text-brand shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button variant={isPopular ? 'primary' : 'outline'} className="w-full" asChild>
                  <Link href={`/register?plan=${plan}`}>Elegir plan</Link>
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
