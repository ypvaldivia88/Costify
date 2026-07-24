import Link from 'next/link';
import { PublicShell } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Sin conexión — Costify',
};

export default function OfflinePage() {
  return (
    <PublicShell showFooter={false}>
      <div className="max-w-md mx-auto text-center space-y-6 py-8">
        <h1 className="text-2xl font-bold text-foreground">Sin conexión a internet</h1>
        <p className="text-muted-foreground leading-relaxed">
          No pudimos cargar esta página. Si ya iniciaste sesión antes en este dispositivo, abre la
          app desde tu pantalla de inicio o vuelve a intentar cuando tengas conexión.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
