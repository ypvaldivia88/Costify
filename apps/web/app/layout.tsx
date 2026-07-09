import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { brandColors } from '@costify/ui-tokens/colors';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { WebClientDataProvider } from '@/components/client-data/WebClientDataProvider';
import { ClientProviders } from '@/components/providers/ClientProviders';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Costify — Calculadora de Costos para MIPYME',
  description:
    'Calculadora de fichas de costos y precios de venta para micro y pequeñas empresas privadas en Cuba.',
  applicationName: 'Costify',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: brandColors.light },
    { media: '(prefers-color-scheme: dark)', color: brandColors.dark },
  ],
};

const themeScript = `
(function () {
  try {
    var key = 'costify_theme_v1';
    var stored = localStorage.getItem(key);
    var dark = stored === 'dark' || (!stored || stored === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={plusJakarta.variable} suppressHydrationWarning>
      <head>
        <Script id="costify-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body className="antialiased">
        <AuthProvider>
          <WebClientDataProvider>
            <ClientProviders>{children}</ClientProviders>
          </WebClientDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
