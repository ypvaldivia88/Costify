'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Download,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { MobileDownloadInfo } from '@/lib/mobile-download';
import { CostifyLogo } from '@/components/brand/CostifyLogo';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';

interface DownloadPageProps {
  info: MobileDownloadInfo;
}

const linkButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] w-full min-h-12 px-5 py-3 text-base';

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
    <div className="min-h-dvh mesh-bg grid-pattern text-foreground flex flex-col">
      <div className="safe-fixed-top-right is-overlay">
        <ThemeToggle className="glass shadow-sm border border-border/60" />
      </div>

      <div className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <motion.div
          className="mx-auto w-full max-w-lg space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CostifyLogo size="xl" className="justify-center" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">App Android</h1>
              <p className="text-sm text-muted max-w-sm mx-auto leading-relaxed">
                Descarga la app para calcular costos, precios e inventario desde tu teléfono, incluso sin
                conexión estable.
              </p>
            </div>
          </div>

          <Card className="!p-5 sm:!p-6 space-y-5 glass shadow-float">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-brand-muted flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted">Versión publicada</p>
                  <p className="text-xl font-bold text-foreground">v{info.version}</p>
                </div>
              </div>
              <span className="text-xs text-muted shrink-0">Actualizado {info.updatedAt}</span>
            </div>

            <a
              href={info.apkUrl}
              download
              className={cn(
                linkButtonClass,
                'bg-brand-gradient text-white hover:brightness-110 shadow-glow'
              )}
            >
              <Download className="w-5 h-5" />
              Descargar APK
            </a>

            {info.driveMirrorUrl ? (
              <a
                href={info.driveMirrorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  linkButtonClass,
                  'border border-border text-foreground hover:bg-surface-muted min-h-11 px-4 py-2.5 text-sm'
                )}
              >
                <ExternalLink className="w-4 h-4" />
                Espejo en Google Drive
              </a>
            ) : null}

            <p className="text-xs text-muted text-center leading-relaxed">
              Tamaño aproximado: 32 MB · Requiere Android 7 o superior · Arquitectura arm64
            </p>
          </Card>

          <Card className="!p-5 sm:!p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
              <h2 className="text-sm font-semibold text-foreground">Cómo instalar</h2>
            </div>
            <ol className="space-y-3 text-sm text-muted list-decimal pl-5">
              {INSTALL_STEPS.map((step) => (
                <li key={step} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </Card>

          <Card variant="muted" className="!p-5 space-y-3">
            <p className="text-sm text-muted leading-relaxed">
              Si la descarga falla o tu teléfono no instala el archivo, escríbenos por WhatsApp y te
              enviamos el enlace o el APK directamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={whatsappHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  linkButtonClass,
                  'flex-1 min-h-11 px-4 py-2.5 text-sm border border-border text-foreground hover:bg-surface-muted'
                )}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp {info.whatsappNumber}
              </a>
              <a
                href={info.releasePageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  linkButtonClass,
                  'flex-1 min-h-11 px-4 py-2.5 text-sm text-muted hover:bg-surface-muted hover:text-foreground'
                )}
              >
                <ExternalLink className="w-4 h-4" />
                Ver en GitHub
              </a>
            </div>
          </Card>

          <div className="text-center space-y-2 pt-2">
            <p className="text-sm text-muted">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-brand font-semibold hover:underline">
                Iniciar sesión
              </Link>
            </p>
            <p className="text-sm text-muted">
              ¿Negocio nuevo?{' '}
              <Link href="/register" className="text-brand font-semibold hover:underline">
                Registrar mi negocio
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
