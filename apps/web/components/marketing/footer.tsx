import Link from 'next/link';
import { CostifyLogo } from '@/components/brand/CostifyLogo';

const FOOTER_LINKS = [
  { href: '/login', label: 'Iniciar sesión' },
  { href: '/register', label: 'Registrarse' },
  { href: '/descarga', label: 'Descargar APK' },
  { href: 'https://wa.me/5354148857', label: 'WhatsApp soporte', external: true },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="page-container py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="space-y-3">
            <CostifyLogo size="md" />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Calculadora de costos, precios e inventario para micro y pequeñas empresas privadas en
              Cuba.
            </p>
          </div>

          <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-x-8 gap-y-3" aria-label="Pie">
            {FOOTER_LINKS.map(({ href, label, ...rest }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                {...('external' in rest && rest.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
          © {new Date().getFullYear()} Costify. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
