import type { MetadataRoute } from 'next';
import { brandColors } from '@costify/ui-tokens/colors';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Costify — Calculadora de Costos',
    short_name: 'Costify',
    description:
      'Calculadora de fichas de costos, precios e inventario para MIPYME en Cuba. Funciona sin conexión.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: brandColors.light,
    theme_color: brandColors.light,
    lang: 'es',
    categories: ['business', 'finance', 'productivity'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/brand/costify-app-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
