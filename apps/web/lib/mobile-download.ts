import {
  WHATSAPP_SUPPORT_NUMBER,
  WHATSAPP_SUPPORT_URL,
} from '@costify/shared/domain/subscription';

export interface MobileDownloadInfo {
  version: string;
  apkUrl: string;
  releasePageUrl: string;
  driveMirrorUrl: string | null;
  whatsappUrl: string;
  whatsappNumber: string;
  updatedAt: string;
}

const DEFAULT_VERSION = '1.0.19';
const GITHUB_REPO = 'https://github.com/ypvaldivia88/Costify';

function trimOrNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Configuración de la APK publicada — actualizar en cada release o vía variables de entorno. */
export function getMobileDownloadInfo(): MobileDownloadInfo {
  const version = process.env.MOBILE_APK_VERSION?.trim() || DEFAULT_VERSION;
  const tag = `v${version}`;

  const apkUrl =
    process.env.MOBILE_APK_URL?.trim() ||
    `${GITHUB_REPO}/releases/download/${tag}/costify-demo.${tag}.apk`;

  const releasePageUrl =
    process.env.MOBILE_RELEASE_PAGE_URL?.trim() || `${GITHUB_REPO}/releases/tag/${tag}`;

  return {
    version,
    apkUrl,
    releasePageUrl,
    driveMirrorUrl: trimOrNull(process.env.MOBILE_DRIVE_MIRROR_URL),
    whatsappUrl: WHATSAPP_SUPPORT_URL,
    whatsappNumber: WHATSAPP_SUPPORT_NUMBER,
    updatedAt: process.env.MOBILE_APK_UPDATED_AT?.trim() || '2026-07-24',
  };
}
