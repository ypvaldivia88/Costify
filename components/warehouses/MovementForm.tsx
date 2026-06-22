'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type {
  MovementType,
  ProductCalculation,
  RawMaterial,
  StockMovement,
  Warehouse,
} from '@/lib/domain/types';
import { MOVEMENT_TYPE_LABELS } from '@/lib/domain/constants';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { NumericField } from '@/components/ui/NumericField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';

interface MovementFormProps {
  warehouses: Warehouse[];
  materials: RawMaterial[];
  products: ProductCalculation[];
  onSubmit: (input: Omit<StockMovement, 'id' | 'timestamp'>) => void;
}

const MOVEMENT_TYPES: MovementType[] = [
  'entrada',
  'salida',
  'transferencia',
  'merma',
  'ajuste',
  'inventario_inicial',
];

export function MovementForm({
  warehouses,
  materials,
  products,
  onSubmit,
}: MovementFormProps) {
  const { showToast } = useToast();
  const activeWarehouses = warehouses.filter((w) => w.active);

  const [type, setType] = useState<MovementType>('entrada');
  const [warehouseId, setWarehouseId] = useState(activeWarehouses[0]?.id ?? '');
  const [sourceWarehouseId, setSourceWarehouseId] = useState(activeWarehouses[0]?.id ?? '');
  const [refType, setRefType] = useState<'raw_material' | 'product'>('raw_material');
  const [refId, setRefId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');

  const refOptions = useMemo(() => {
    return refType === 'raw_material'
      ? materials.map((m) => ({ id: m.id, name: m.name }))
      : products.map((p) => ({ id: p.id, name: p.name }));
  }, [refType, materials, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseId || !refId || quantity === 0) {
      showToast('Completa almacén, ítem y cantidad.', 'error');
      return;
    }

    if (type === 'transferencia' && (!sourceWarehouseId || sourceWarehouseId === warehouseId)) {
      showToast('Selecciona almacenes de origen y destino distintos.', 'error');
      return;
    }

    const selectedMaterial = materials.find((m) => m.id === refId);
    const selectedProduct = products.find((p) => p.id === refId);

    try {
      onSubmit({
        type,
        warehouseId,
        sourceWarehouseId: type === 'transferencia' ? sourceWarehouseId : undefined,
        note: note.trim() || undefined,
        lines: [
          {
            refType,
            refId,
            quantity: type === 'ajuste' ? quantity : Math.abs(quantity),
            unitType:
              refType === 'raw_material'
                ? selectedMaterial?.unitType
                : selectedProduct?.purchaseUnit,
          },
        ],
      });

      showToast('Movimiento registrado', 'success');
      setQuantity(0);
      setNote('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo registrar.', 'error');
    }
  };

  return (
    <Card>
      <SectionHeader
        icon={ArrowLeftRight}
        title="Registrar movimiento"
        description="Entradas, salidas, transferencias, mermas y ajustes de inventario"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Tipo</label>
          <div className="flex flex-wrap gap-2">
            {MOVEMENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`min-h-11 px-4 py-2.5 rounded-xl text-xs font-semibold border active:scale-[0.98] transition-transform ${
                  type === t
                    ? 'border-brand bg-brand-muted text-brand-foreground'
                    : 'border-border text-muted'
                }`}
              >
                {MOVEMENT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {type === 'transferencia' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Origen</label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
              >
                {activeWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              {type === 'transferencia' ? 'Destino' : 'Almacén'}
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
            >
              {activeWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          {(['raw_material', 'product'] as const).map((rt) => (
            <button
              key={rt}
              type="button"
              onClick={() => {
                setRefType(rt);
                setRefId('');
              }}
              className={`min-h-11 px-4 py-2.5 rounded-xl text-sm font-semibold border active:scale-[0.98] transition-transform ${
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
          <label className="block text-sm font-medium text-foreground">
            Cantidad{type === 'ajuste' ? ' (delta, puede ser negativo)' : ''}
          </label>
          <NumericField
            value={quantity}
            onChange={setQuantity}
            className="w-full min-h-11 px-3"
          />
        </div>

        <Input
          label="Nota (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. Compra en TRD, rotura, conteo físico…"
        />

        <Button type="submit" disabled={activeWarehouses.length === 0}>
          Registrar movimiento
        </Button>
      </form>
    </Card>
  );
}
