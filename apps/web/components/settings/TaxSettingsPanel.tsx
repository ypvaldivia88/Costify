'use client';

import { Plus, Receipt, Trash2 } from 'lucide-react';
import type { TaxLine, TaxLineBase, TaxSector, TaxSettings } from '@costify/shared/domain/types';
import {
  TAX_LINE_BASE_LABELS,
  TAX_SECTOR_DESCRIPTIONS,
  TAX_SECTOR_LABELS,
  createTaxSettingsForSector,
} from '@costify/shared/domain/tax-presets';
import { Card } from '@/components/ui/Card';
import { NumericField } from '@/components/ui/NumericField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { iconButtonDangerClassName } from '@/lib/ui/field-styles';

interface TaxSettingsPanelProps {
  settings: TaxSettings;
  onChange: (updates: Partial<TaxSettings>) => void;
}

const SECTOR_OPTIONS: TaxSector[] = ['none', 'tcp', 'mipyme', 'cna', 'custom'];

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-5 h-5 rounded border-zinc-300 text-brand focus:ring-emerald-500"
      />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function updateLine(lines: TaxLine[], id: string, patch: Partial<TaxLine>): TaxLine[] {
  return lines.map((line) => (line.id === id ? { ...line, ...patch } : line));
}

export function TaxSettingsPanel({ settings, onChange }: TaxSettingsPanelProps) {
  const handleSectorChange = (sector: TaxSector) => {
    onChange(createTaxSettingsForSector(sector, settings));
  };

  const handleLineChange = (id: string, patch: Partial<TaxLine>) => {
    onChange({
      lines: updateLine(settings.lines, id, patch),
      sector: settings.sector === 'custom' ? 'custom' : 'custom',
    });
  };

  const addCustomLine = () => {
    const newLine: TaxLine = {
      id: `custom-${Date.now()}`,
      name: 'Impuesto adicional',
      enabled: true,
      ratePercent: 0,
      base: 'revenue',
    };
    onChange({
      sector: 'custom',
      lines: [...settings.lines, newLine],
    });
  };

  const removeLine = (id: string) => {
    onChange({
      sector: 'custom',
      lines: settings.lines.filter((line) => line.id !== id),
    });
  };

  const showLines = settings.enabled && settings.sector !== 'none';

  return (
    <Card>
      <SectionHeader
        icon={Receipt}
        title="Impuestos (Cuba)"
        description="Sector tributario y tasas editables según normativa vigente"
      />

      <div className="space-y-4">
        <Toggle
          label="Incluir estimación de impuestos"
          description="Desactiva para omitir impuestos en proyecciones y precios."
          checked={settings.enabled}
          onChange={(enabled) => {
            if (enabled && settings.sector === 'none') {
              onChange(createTaxSettingsForSector('mipyme'));
              return;
            }
            onChange({ enabled });
          }}
        />

        {settings.enabled && (
          <>
            <div>
              <label className="text-sm font-medium text-foreground">Sector / forma de gestión</label>
              <select
                value={settings.sector}
                onChange={(e) => handleSectorChange(e.target.value as TaxSector)}
                className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {SECTOR_OPTIONS.map((sector) => (
                  <option key={sector} value={sector}>
                    {TAX_SECTOR_LABELS[sector]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                {TAX_SECTOR_DESCRIPTIONS[settings.sector]}
              </p>
            </div>

            {showLines && (
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Líneas de impuesto
                </p>

                {settings.lines.map((line) => (
                  <div
                    key={line.id}
                    className="rounded-lg border border-border bg-surface/50 p-3 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={line.enabled}
                        onChange={(e) => handleLineChange(line.id, { enabled: e.target.checked })}
                        className="mt-1 w-4 h-4 rounded border-zinc-300 text-brand focus:ring-emerald-500"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <input
                          type="text"
                          value={line.name}
                          onChange={(e) => handleLineChange(line.id, { name: e.target.value })}
                          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-medium text-foreground"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted">Tasa (%)</label>
                            <NumericField
                              value={line.ratePercent}
                              onChange={(ratePercent) =>
                                handleLineChange(line.id, { ratePercent })
                              }
                              className="mt-0.5 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm min-h-11"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted">Base de cálculo</label>
                            <select
                              value={line.base}
                              onChange={(e) =>
                                handleLineChange(line.id, {
                                  base: e.target.value as TaxLineBase,
                                })
                              }
                              className="mt-0.5 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                            >
                              {(
                                Object.entries(TAX_LINE_BASE_LABELS) as [TaxLineBase, string][]
                              ).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {line.base === 'revenueExcess' && (
                          <div>
                            <label className="text-xs text-muted">Umbral mensual (CUP)</label>
                            <NumericField
                              value={line.monthlyThresholdCup ?? 0}
                              onChange={(monthlyThresholdCup) =>
                                handleLineChange(line.id, { monthlyThresholdCup })
                              }
                              className="mt-0.5 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm min-h-11"
                            />
                          </div>
                        )}
                      </div>
                      {settings.sector === 'custom' && settings.lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className={iconButtonDangerClassName}
                          aria-label="Eliminar línea"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {settings.sector === 'custom' && (
                  <button
                    type="button"
                    onClick={addCustomLine}
                    className="flex items-center gap-2 text-sm text-brand hover:text-brand/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir línea de impuesto
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-muted mt-4 leading-relaxed">
        Referencias: Res. 306/2023 (MIPYME/CNA), Res. 271/2024 (TCP). Tasas orientativas —
        consulta con tu contador para declaraciones oficiales.
      </p>
    </Card>
  );
}
