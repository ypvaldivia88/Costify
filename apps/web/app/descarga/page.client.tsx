'use client';

import Link from 'next/link';
import {
  Download,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { MobileDownloadInfo } from '@/lib/mobile-download';
import { PublicShell } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CostifyLogo } from '@/components/brand/CostifyLogo';

interface DownloadPageProps {
  info: MobileDownloadInfo;
}

const INSTALL_STEPS = [
  'Toca «Descargar APK» y espera a que termine la descarga.',
  'Abre el archivo descargado. Si el teléfono lo pide, permite instalar desde esta fuente.',
  'En Ajustes → Seguridad, activa «Orígenes desconocidos» solo si Android lo solicita.',
  'Confirma la instalación y abre Costify. Inicia sesión con tu cuenta.',
] as const;

export default function DownloadPage({ info }: DownloadPageProps) {
  const whatsappHelpUrl = `${info.whatsappUrl}?text=${encodeURIComponent(
    'Hola, necesito ayuda para instalar Costify en Android.'
  )}`;

  return (
    <PublicShell>
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <CostifyLogo size="xl" className="justify-center" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">App Android</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Calcula costos, precios e inventario desde tu teléfono, incluso sin conexión estable.
          </p>
        </div>

        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-xl bg-brand-muted flex items-center justify-center shrink-0">
                <Smartphone className="size-5 text-brand" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Versión publicada</p>
                <p className="text-xl font-bold">v{info.version}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">Actualizado {info.updatedAt}</span>
          </div>

          <Button size="lg" className="w-full" asChild>
            <a href={info.apkUrl} download>
              <Download className="size-5" />
              Descargar APK
            </a>
          </Button>

          {info.driveMirrorUrl ? (
            <Button variant="outline" className="w-full" asChild>
              <a href={info.driveMirrorUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Espejo en Google Drive
              </a>
            </Button>
          ) : null}

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Tamaño aproximado: 32 MB · Android 7+ · arm64
          </p>
        </Card>

        <Card variant="muted" className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand shrink-0" />
            <h2 className="text-sm font-semibold">Cómo instalar</h2>
          </div>
          <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
            {INSTALL_STEPS.map((step) => (
              <li key={step} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </Card>

        <Card variant="muted" className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Si la descarga falla, escríbenos por WhatsApp y te enviamos el enlace directamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <a href={whatsappHelpUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                WhatsApp {info.whatsappNumber}
              </a>
            </Button>
            <Button variant="ghost" className="flex-1" asChild>
              <a href={info.releasePageUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Ver en GitHub
              </a>
            </Button>
          </div>
        </Card>

        <div className="text-center space-y-2 text-sm text-muted-foreground">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-brand font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
          <p>
            ¿Negocio nuevo?{' '}
            <Link href="/register" className="text-brand font-semibold hover:underline">
              Registrar mi negocio
            </Link>
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
