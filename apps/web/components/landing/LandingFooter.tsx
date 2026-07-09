'use client';

import Link from 'next/link';
import { WHATSAPP_SUPPORT_URL } from '@costify/shared/domain/subscription';
import { CostifyLogo } from '@/components/brand/CostifyLogo';
import { cn } from '@/lib/utils';

export function LandingCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20">
      <div
        className={cn(
          'rounded-sm border border-landing-rule bg-landing-surface px-6 py-12 sm:px-12 sm:py-14 text-center',
          'shadow-[0_8px_32px_rgba(28,25,23,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]'
        )}
      >
        <h2 className="font-display text-3xl sm:text-4xl text-landing-ink max-w-xl mx-auto leading-tight">
          Deja de adivinar el precio de venta
        </h2>
        <p className="text-landing-muted mt-4 max-w-lg mx-auto">
          Registra tu negocio en minutos. Te ayudamos a activar la cuenta por WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/register"
            className={cn(
              'inline-flex items-center justify-center min-h-12 px-8 rounded-lg text-base font-semibold',
              'bg-landing-brand text-white hover:brightness-110 transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-brand focus-visible:ring-offset-2 focus-visible:ring-offset-landing-surface'
            )}
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className={cn(
              'inline-flex items-center justify-center min-h-12 px-8 rounded-lg text-base font-semibold',
              'border border-landing-rule text-landing-ink hover:border-landing-brand/40 transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-brand focus-visible:ring-offset-2 focus-visible:ring-offset-landing-surface'
            )}
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-landing-rule bg-landing-paper/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start gap-3">
          <CostifyLogo size="md" />
          <p className="text-xs text-landing-muted text-center sm:text-left max-w-xs">
            Calculadora de costos e inventario para micro y pequeñas empresas privadas.
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-landing-muted"
          aria-label="Pie de página"
        >
          <Link href="/register" className="hover:text-landing-ink transition-colors">
            Registro
          </Link>
          <Link href="/login" className="hover:text-landing-ink transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/descarga" className="hover:text-landing-ink transition-colors">
            App Android
          </Link>
          <a
            href={WHATSAPP_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-landing-ink transition-colors"
          >
            WhatsApp
          </a>
          <a
            href="https://github.com/ypvaldivia88/Costify/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-landing-ink transition-colors"
          >
            Releases
          </a>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-8 safe-bottom">
        <p className="text-center text-xs text-landing-muted/80">
          © {new Date().getFullYear()} Costify
        </p>
      </div>
    </footer>
  );
}
