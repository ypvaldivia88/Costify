'use client';

import { useMemo, useState } from 'react';
import { Copy, Download, Share2, Upload } from 'lucide-react';
import type {
  GlobalFundSettings,
  IndirectCost,
  ProductCalculation,
  RawMaterial,
  TaxSettings,
} from '@/lib/domain/types';
import {
  applyBackupToStorage,
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

  return (
    <Card>
      <SectionHeader
        icon={Share2}
        title="Sincronizar entre dispositivos"
        description="Copia el código de respaldo o comparte el archivo en otro dispositivo"
      />

      <div className="flex gap-2 mb-4">
        {(['export', 'import'] as SyncTab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
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

          <p className="text-sm text-muted">
            Copia el código y envíalo por WhatsApp, correo u otra app. También puedes descargar un
            archivo <code className="text-xs">.json</code>.
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Código de respaldo</label>
            <textarea
              readOnly
              value={payload}
              rows={5}
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
            Pega el código de respaldo o sube el archivo <code className="text-xs">.json</code>{' '}
            exportado desde otro dispositivo.
          </p>

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
              rows={6}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-border bg-surface text-foreground placeholder:text-muted resize-y min-h-[140px]"
            />
          </div>

          {importError && <p className="text-sm text-red-600 dark:text-red-400">{importError}</p>}

          <Button type="button" onClick={handleImport} disabled={!importText.trim()}>
            Importar datos
          </Button>
        </div>
      )}
    </Card>
  );
}
