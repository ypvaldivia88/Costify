'use client';

import { PiggyBank } from 'lucide-react';
import type { GlobalFundSettings } from '@costify/shared/domain/types';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface GlobalFundSettingsProps {
  settings: GlobalFundSettings;
  onChange: (updates: Partial<GlobalFundSettings>) => void;
}

export function GlobalFundSettingsPanel({ settings, onChange }: GlobalFundSettingsProps) {
  return (
    <Card>
      <SectionHeader
        icon={PiggyBank}
        title="Fondo global opcional"
        description="Porcentaje del costo directo reservado en cada producto"
      />

      <label className="flex items-start gap-3 cursor-pointer py-2 mb-4">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="mt-1 w-5 h-5 rounded border-border text-brand focus:ring-brand"
        />
        <div>
          <p className="text-sm font-medium text-foreground">Activar fondo global</p>
          <p className="text-xs text-muted mt-0.5">
            Se suma automáticamente al costo de todos los productos.
          </p>
        </div>
      </label>

      {settings.enabled && (
        <div className="space-y-4 pt-2 border-t border-border">
          <Input
            label="Nombre del fondo"
            placeholder="Ej. Reserva operativa"
            value={settings.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-foreground">
                Porcentaje sobre costo directo
              </label>
              <span className="text-sm font-bold text-brand">{settings.percent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={settings.percent}
              onChange={(e) => onChange({ percent: Number(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
            />
            <p className="text-xs text-muted mt-1.5">
              Ej: 5% sobre un costo directo de 100 CUP añade 5 CUP al costo unitario.
            </p>
          </div>

          {settings.percent > 0 && (
            <div className="rounded-xl bg-accent-surface border border-accent-border px-4 py-3 text-sm text-brand-foreground">
              Cada producto incluirá un <strong>{settings.percent}%</strong> adicional sobre su
              costo directo como <strong>{settings.name.trim() || 'Fondo global'}</strong>.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
