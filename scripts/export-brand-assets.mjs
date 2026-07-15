#!/usr/bin/env node
/**
 * Rasterize brand SVGs into web + mobile PNG assets.
 * Run from repo root: node scripts/export-brand-assets.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const brandDir = join(root, 'apps/web/public/brand');
const mobileAssets = join(root, 'apps/mobile/assets');

const exportsPlan = [
  {
    input: 'costify-app-icon.svg',
    outputs: [
      { path: join(brandDir, 'costify-app-icon.png'), size: 512 },
      { path: join(mobileAssets, 'icon.png'), size: 1024 },
      { path: join(mobileAssets, 'splash-icon.png'), size: 512 },
      { path: join(mobileAssets, 'favicon.png'), size: 192 },
    ],
  },
  {
    input: 'costify-icon-foreground.svg',
    outputs: [{ path: join(mobileAssets, 'android-icon-foreground.png'), size: 1024 }],
  },
  {
    input: 'costify-icon-background.svg',
    outputs: [{ path: join(mobileAssets, 'android-icon-background.png'), size: 1024 }],
  },
  {
    input: 'costify-icon-monochrome.svg',
    outputs: [{ path: join(mobileAssets, 'android-icon-monochrome.png'), size: 1024 }],
  },
  {
    input: 'costify-mark.svg',
    outputs: [{ path: join(mobileAssets, 'costify-splash-mark.png'), size: 256 }],
  },
];

async function rasterize(svgPath, outPath, size) {
  const svg = readFileSync(svgPath);
  const png = await sharp(svg, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  console.log(`  ${outPath.replace(root + '\\', '').replace(root + '/', '')} (${size}px)`);
}

async function main() {
  console.log('Exporting Costify brand PNGs…');
  for (const job of exportsPlan) {
    const svgPath = join(brandDir, job.input);
    console.log(`\n${job.input}`);
    for (const output of job.outputs) {
      await rasterize(svgPath, output.path, output.size);
    }
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
