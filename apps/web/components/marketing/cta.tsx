'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function MarketingCta() {
  return (
    <section className="page-container py-12 md:py-16">
      <div className="rounded-2xl bg-brand-gradient px-6 py-10 sm:px-10 sm:py-12 text-center text-white shadow-glow">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Empieza a calcular con margen real
        </h2>
        <p className="mt-3 text-white/90 max-w-lg mx-auto text-base">
          Regístrate en minutos, elige tu plan y activa tu negocio con soporte directo por WhatsApp.
        </p>
        <Button size="lg" variant="secondary" className="mt-6 surface-inverse" asChild>
          <Link href="/register">
            Crear cuenta gratis
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
