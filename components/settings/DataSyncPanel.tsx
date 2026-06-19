'use client';

import { useMemo, useState } from 'react';
import { Copy, Download, Share2, Upload } from 'lucide-react';
import type {
  GlobalFundSettings,
  IndirectCost,
  ProductCalculation,
  RawMaterial,
  TaxSettings,
  UnitSettings,
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
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface DataSyncPanelProps {
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
}

type SyncTab = 'export' | 'import';

export function DataSyncPanel({
  inventory,
  rawMaterials,
  globalCosts,
  globalFund,
  taxSettings,
  unitSettings,
}: DataSyncPanelProps) {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
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
        unitSettings,
      }),
    [inventory, rawMaterials, globalCosts, globalFund, taxSettings, unitSettings]
  );

  const summary = `${inventory.length} producto(s), ${rawMaterials.length} materia(s) prima(s)`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      showToast('Código copiado al portapapeles', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('No se pudo copiar. Selecciona y copia el código manualmente.', 'error');
    }
  };

  const handleImport = async () => {
    setImportError(null);
    try {
      const backup = parseBackupPayload(importText);
      const confirmed = await confirm({
        title: 'Importar respaldo',
        message:
          `Se importarán ${backup.inventory.length} productos y ${backup.rawMaterials.length} materias primas.\n\n` +
          'Los datos actuales de este dispositivo serán reemplazados.',
        confirmLabel: 'Importar',
        variant: 'primary',
      });
      if (!confirmed) return;
      applyBackupToStorage(backup);
      showToast('Respaldo importado. Recargando…', 'success');
      window.setTimeout(() => window.location.reload(), 600);
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
      showToast('Archivo cargado. Revisa y confirma la importación.', 'info');
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

      <div className="flex gap-2 mb-4" role="tablist" aria-label="Modo de sincronización">
        {(['export', 'import'] as SyncTab[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              'flex-1 min-h-10 rounded-xl text-sm font-semibold border transition-colors active:scale-[0.98]',
              tab === value
                ? 'border-brand bg-brand-muted text-brand-foreground'
                : 'border-border text-muted hover:text-foreground hover:bg-surface-muted'
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
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-border bg-surface-muted text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-brand/25"
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
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm min-h-11 rounded-xl font-semibold border border-border text-foreground hover:bg-surface-muted cursor-pointer transition-colors active:scale-[0.98]">
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
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-border bg-surface text-foreground placeholder:text-muted resize-y min-h-[140px] focus:outline-none focus:ring-2 focus:ring-brand/25"
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
