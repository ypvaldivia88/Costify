'use client';

import { useState } from 'react';
import { AlertTriangle, Bell } from 'lucide-react';
import type {
  ProductCalculation,
  RawMaterial,
  StockAlert,
  StockThreshold,
  Warehouse,
} from '@/lib/domain/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumericField } from '@/components/ui/NumericField';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface StockAlertsPanelProps {
  alerts: StockAlert[];
  thresholds: StockThreshold[];
  warehouses: Warehouse[];
  materials: RawMaterial[];
  products: ProductCalculation[];
  onSaveThreshold: (input: Omit<StockThreshold, 'id'>, id?: string) => void;
  onDeleteThreshold: (id: string) => void;
}

export function StockAlertsPanel({
  alerts,
  thresholds,
  warehouses,
  materials,
  products,
  onSaveThreshold,
  onDeleteThreshold,
}: StockAlertsPanelProps) {
  const [refType, setRefType] = useState<'raw_material' | 'product'>('raw_material');
  const [refId, setRefId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [minQuantity, setMinQuantity] = useState(0);

  const refOptions =
    refType === 'raw_material'
      ? materials.map((m) => ({ id: m.id, name: m.name }))
      : products.map((p) => ({ id: p.id, name: p.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refId || minQuantity <= 0) return;

    onSaveThreshold({
      refType,
      refId,
      warehouseId: warehouseId || undefined,
      minQuantity,
    });

    setRefId('');
    setMinQuantity(0);
    setWarehouseId('');
  };

  return (
    <div className="space-y-4">
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertas activas ({alerts.length})
          </h3>
          {alerts.map((alert) => (
            <Card key={`${alert.refType}:${alert.refId}:${alert.warehouseId ?? 'all'}`} className="!p-4 border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{alert.name}</p>
                  <p className="text-sm text-muted">
                    {alert.currentQuantity.toLocaleString('es-CU')} {alert.unitLabel} · mínimo{' '}
                    {alert.minQuantity.toLocaleString('es-CU')}
                    {alert.warehouseName ? ` · ${alert.warehouseName}` : ' · todos los almacenes'}
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                  Bajo stock
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <SectionHeader
          icon={Bell}
          title="Umbrales de stock mínimo"
          description="Recibe alertas cuando un ítem baje del nivel configurado"
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {(['raw_material', 'product'] as const).map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => {
                  setRefType(rt);
                  setRefId('');
                }}
                className={`px-3 py-2 rounded-xl text-sm font-semibold border ${
                  refType === rt
                    ? 'border-brand bg-brand-muted text-brand-foreground'
                    : 'border-border text-muted'
                }`}
              >
                {rt === 'raw_material' ? 'Insumo' : 'Producto'}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Ítem</label>
            <select
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
              required
            >
              <option value="">Seleccionar…</option>
              {refOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Almacén (opcional)</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
            >
              <option value="">Todos los almacenes</option>
              {warehouses.filter((w) => w.active).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Cantidad mínima</label>
            <NumericField
              value={minQuantity}
              onChange={setMinQuantity}
              className="w-full min-h-11 px-3"
            />
          </div>

          <Button type="submit">Guardar umbral</Button>
        </form>
      </Card>

      {thresholds.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted">Umbrales configurados</h3>
          {thresholds.map((threshold) => {
            const name =
              threshold.refType === 'raw_material'
                ? materials.find((m) => m.id === threshold.refId)?.name
                : products.find((p) => p.id === threshold.refId)?.name;
            const wh = threshold.warehouseId
              ? warehouses.find((w) => w.id === threshold.warehouseId)?.name
              : 'Todos';

            return (
              <Card key={threshold.id} className="!p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{name ?? 'Ítem'}</p>
                  <p className="text-sm text-muted">
                    Mín. {threshold.minQuantity.toLocaleString('es-CU')} · {wh}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onDeleteThreshold(threshold.id)}>
                  Eliminar
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
