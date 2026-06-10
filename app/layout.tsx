import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Costify — Calculadora de Costos para MIPYME',
  description:
    'Calculadora de fichas de costos y precios de venta para micro y pequeñas empresas privadas en Cuba.',
  applicationName: 'Costify',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#059669',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
