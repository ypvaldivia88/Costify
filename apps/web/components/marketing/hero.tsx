'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Calculator, Package, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@costify/shared/format/currency';

function DashboardMock() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-float overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/40">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-xs text-muted-foreground font-medium">Calculadora — Pan de leche</span>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Costo unitario</p>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(18.5)}</p>
          </div>
          <div className="rounded-xl bg-brand-muted/60 p-3">
            <p className="text-xs text-brand-dark dark:text-brand-foreground/80">Precio sugerido</p>
            <p className="text-lg font-bold text-brand tabular-nums">{formatCurrency(28)}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Margen bruto</span>
            <span className="font-semibold text-brand">34%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Impuestos estimados</span>
            <span className="font-medium tabular-nums">{formatCurrency(2.1)}</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-[68%] rounded-full bg-brand-gradient" />
        </div>
      </div>
    </div>
  );
}

export function MarketingHero() {
  return (
    <section className="page-container section-stack py-12 md:py-20">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-surface px-3 py-1 text-xs font-semibold text-brand-dark dark:text-brand-foreground">
            <Calculator className="size-3.5" />
            Para MIPYME en Cuba
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
            Costos claros.
            <span className="text-gradient-brand"> Precios con margen.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
            Calcula fichas de costo, fija precios de venta con impuestos y gestiona inventario desde
            la web o la app Android — incluso sin conexión.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/register">
                Empezar gratis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link href="/login">Ya tengo cuenta</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
            <span className="inline-flex items-center gap-1.5">
              <Package className="size-4 text-brand" />
              Multi-almacén
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="size-4 text-brand" />
              App offline
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}
