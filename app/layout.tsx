import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#059669' },
    { media: '(prefers-color-scheme: dark)', color: '#34d399' },
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
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script id="costify-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
