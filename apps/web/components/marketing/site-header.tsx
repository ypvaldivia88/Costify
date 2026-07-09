'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { CostifyLogo } from '@/components/brand/CostifyLogo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/#funciones', label: 'Funciones' },
  { href: '/#precios', label: 'Precios' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/descarga', label: 'Descargar' },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl safe-top">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <CostifyLogo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex size-11 items-center justify-center rounded-xl border border-border text-foreground"
          aria-expanded={open}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          'md:hidden border-t border-border bg-background overflow-hidden transition-all duration-200',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-t-0'
        )}
      >
        <nav className="page-container py-4 flex flex-col gap-1" aria-label="Móvil">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="min-h-11 flex items-center px-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Button variant="outline" asChild className="w-full">
              <Link href="/login" onClick={() => setOpen(false)}>
                Iniciar sesión
              </Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/register" onClick={() => setOpen(false)}>
                Crear cuenta
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
