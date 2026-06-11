'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Camera, Copy, Download, QrCode, Share2, Upload } from 'lucide-react';
import QRCode from 'react-qr-code';
import type {
  GlobalFundSettings,
  IndirectCost,
  ProductCalculation,
  RawMaterial,
  TaxSettings,
} from '@/lib/domain/types';
import {
  applyBackupToStorage,
  backupFitsQr,
  createBackupPayload,
  downloadBackupFile,
  parseBackupPayload,
  readBackupFromFile,
} from '@/lib/backup/app-backup';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

interface DataSyncPanelProps {
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  taxSettings: TaxSettings;
}

type SyncTab = 'export' | 'import';

export function DataSyncPanel({
  inventory,
  rawMaterials,
  globalCosts,
  globalFund,
  taxSettings,
}: DataSyncPanelProps) {
  const [tab, setTab] = useState<SyncTab>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRegionId = useId().replace(/:/g, '');

  const payload = useMemo(
    () =>
      createBackupPayload({
        inventory,
        rawMaterials,
        globalCosts,
        globalFund,
        taxSettings,
      }),
    [inventory, rawMaterials, globalCosts, globalFund, taxSettings]
  );

  const showQr = backupFitsQr(payload);
  const summary = `${inventory.length} producto(s), ${rawMaterials.length} materia(s) prima(s)`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('No se pudo copiar. Selecciona y copia el código manualmente.');
    }
  };

  const handleImport = () => {
    setImportError(null);
    try {
      const backup = parseBackupPayload(importText);
      const replace = confirm(
        `¿Importar respaldo?\n\n` +
          `${backup.inventory.length} productos y ${backup.rawMaterials.length} materias primas ` +
          `reemplazarán los datos actuales de este dispositivo.`
      );
      if (!replace) return;
      applyBackupToStorage(backup);
      window.location.reload();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Código inválido.');
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setImportError(null);
    try {
      const text = await readBackupFromFile(file);
      setImportText(text);
      setTab('import');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Archivo inválido.');
    }
  };

  const stopScanner = useCallback(() => {
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!scanning || tab !== 'import') return;

    let scanner: { clear: () => Promise<void> } | null = null;
    let cancelled = false;

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (cancelled) return;
      const instance = new Html5QrcodeScanner(
        scannerRegionId,
        { fps: 8, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        false
      );
      scanner = instance;
      instance.render(
        (decoded) => {
          setImportText(decoded);
          setImportError(null);
          instance.clear().catch(() => undefined);
          setScanning(false);
        },
        () => undefined
      );
    });

    return () => {
      cancelled = true;
      scanner?.clear().catch(() => undefined);
    };
  }, [scanning, tab, scannerRegionId]);

  return (
    <Card>
      <SectionHeader
        icon={Share2}
        title="Sincronizar entre dispositivos"
        description="Exporta tus datos y impórtalos en otro teléfono o computadora"
      />

      <div className="flex gap-2 mb-4">
        {(['export', 'import'] as SyncTab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              if (value !== 'import') stopScanner();
            }}
            className={cn(
              'flex-1 min-h-10 rounded-xl text-sm font-semibold border transition-colors',
              tab === value
                ? 'border-brand bg-brand-muted text-brand-foreground'
                : 'border-border text-muted hover:text-foreground'
            )}
          >
            {value === 'export' ? 'Exportar' : 'Importar'}
          </button>
        ))}
      </div>

      {tab === 'export' ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Respaldo actual: <strong className="text-foreground">{summary}</strong>
          </p>

          {showQr ? (
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white border border-border">
              <QRCode value={payload} size={220} level="M" />
              <p className="text-xs text-muted text-center">
                Escanea con la cámara del otro dispositivo o desde Importar → Escanear QR
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              Hay demasiados datos para un QR fiable. Usa <strong>copiar código</strong> o{' '}
              <strong>descargar archivo</strong>.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Código de respaldo</label>
            <textarea
              readOnly
              value={payload}
              rows={4}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-border bg-surface-muted text-foreground resize-none"
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado' : 'Copiar código'}
            </Button>
            <Button type="button" variant="outline" onClick={() => downloadBackupFile(payload)}>
              <Download className="w-4 h-4" />
              Descargar archivo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Pega un código, escanea un QR o sube un archivo <code className="text-xs">.json</code>{' '}
            exportado desde otro dispositivo.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setScanning((v) => !v)}
            >
              <Camera className="w-4 h-4" />
              {scanning ? 'Detener cámara' : 'Escanear QR'}
            </Button>
            <label className="inline-flex">
              <input
                type="file"
                accept=".json,application/json,text/plain"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm min-h-11 rounded-xl font-semibold border border-border text-foreground hover:bg-surface-muted cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Subir archivo
              </span>
            </label>
          </div>

          {scanning && (
            <div className="rounded-xl overflow-hidden border border-border bg-black">
              <div id={scannerRegionId} />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="import-backup" className="text-sm font-medium text-foreground">
              Código de respaldo
            </label>
            <textarea
              id="import-backup"
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError(null);
              }}
              placeholder="Pega aquí el código costify1:…"
              rows={5}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-border bg-surface text-foreground placeholder:text-muted resize-y min-h-[120px]"
            />
          </div>

          {importError && <p className="text-sm text-red-600 dark:text-red-400">{importError}</p>}

          <Button
            type="button"
            onClick={handleImport}
            disabled={!importText.trim()}
          >
            <QrCode className="w-4 h-4" />
            Importar datos
          </Button>
        </div>
      )}
    </Card>
  );
}
