import type { Metadata } from 'next';
import { getMobileDownloadInfo } from '@/lib/mobile-download';
import DownloadPage from './page.client';

export const metadata: Metadata = {
  title: 'Descargar Costify Android',
  description:
    'Descarga la app Costify para Android. Calculadora de costos, precios e inventario para MIPYME en Cuba.',
};

export default function DescargaRoute() {
  const info = getMobileDownloadInfo();
  return <DownloadPage info={info} />;
}
