'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Smartphone } from 'lucide-react';
import { CostSheetMock } from '@/components/landing/CostSheetMock';
import { cn } from '@/lib/utils';
import { SUBSCRIPTION_MONTHLY_PRICE_USD } from '@costify/shared/domain/subscription';

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 landing-ruled-bg opacity-40 pointer-events-none" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-16 md:pt-16 md:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            className="space-y-8 text-center lg:text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-4">
              <p className="font-data text-xs uppercase tracking-[0.25em] text-landing-sea">
                Para MIPYME en Cuba
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] leading-[1.08] text-landing-ink text-balance">
                Sabe cuánto cuesta antes de poner precio
              </h1>
              <p className="text-lg text-landing-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Ficha de costos, inventario y márgenes para tu negocio — web y Android, con o sin
                internet.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/register"
                className={cn(
                  'inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-lg text-base font-semibold',
                  'bg-landing-brand text-white hover:brightness-110 active:brightness-95 transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-brand focus-visible:ring-offset-2 focus-visible:ring-offset-landing-paper'
                )}
              >
                Crear cuenta
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <Link
                href="/descarga"
                className={cn(
                  'inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-lg text-base font-semibold',
                  'border border-landing-rule bg-landing-surface text-landing-ink',
                  'hover:border-landing-brand/40 transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-brand focus-visible:ring-offset-2 focus-visible:ring-offset-landing-paper'
                )}
              >
                <Smartphone className="w-4 h-4" aria-hidden />
                Descargar app
              </Link>
            </div>

            <p className="text-sm text-landing-muted">
              Desde{' '}
              <span className="font-data text-landing-copper font-medium">
                ${SUBSCRIPTION_MONTHLY_PRICE_USD} USD/mes
              </span>{' '}
              · Pago
              y activación por WhatsApp
            </p>
          </motion.div>

          <CostSheetMock />
        </div>
      </div>
    </section>
  );
}
