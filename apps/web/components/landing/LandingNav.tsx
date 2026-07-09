'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CostifyLogo } from '@/components/brand/CostifyLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const NAV_LINKS = [
  { href: '#beneficios', label: 'Beneficios' },
  { href: '#precios', label: 'Precios' },
  { href: '/descarga', label: 'App Android' },
] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 safe-top transition-shadow duration-300',
        scrolled && 'shadow-[0_1px_0_var(--landing-rule),0_4px_24px_rgba(28,25,23,0.06)]'
      )}
    >
      <div
        className={cn(
          'mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between gap-4 min-h-[4.5rem]',
          'border-b border-landing-rule/80 bg-landing-paper/90 backdrop-blur-md'
        )}
      >
        <Link href="/" className="flex items-center shrink-0 min-h-11 py-1">
          <CostifyLogo size="lg" landing />
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-2 min-h-11 inline-flex items-center rounded-lg text-sm',
                'text-landing-muted hover:text-landing-ink transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-brand focus-visible:ring-offset-2 focus-visible:ring-offset-landing-paper'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle
            className={cn(
              'border border-landing-rule bg-landing-surface/80',
              'text-landing-muted hover:text-landing-ink hover:bg-landing-surface'
            )}
          />
          <Link
            href="/login"
            className={cn(
              'hidden sm:inline-flex items-center justify-center min-h-11 px-3 text-sm font-medium',
              'text-landing-muted hover:text-landing-ink transition-colors duration-200 rounded-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-brand'
            )}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className={cn(
              'inline-flex items-center justify-center min-h-11 px-4 text-sm font-semibold rounded-lg',
              'bg-landing-brand text-white hover:brightness-110 active:brightness-95 transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-brand focus-visible:ring-offset-2 focus-visible:ring-offset-landing-paper'
            )}
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}
