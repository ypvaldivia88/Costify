'use client';

import { useState } from 'react';
import { Factory } from 'lucide-react';
import type { ProductCalculation, RawMaterial, UnitSettings, Warehouse } from '@/lib/domain/types';
import { estimateRecipeConsumption } from '@/lib/domain/calculations';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumericField } from '@/components/ui/NumericField';
import { useToast } from '@/components/ui/Toast';
import { useUnitCatalog } from '@/hooks/use-unit-catalog';

interface ProductionSectionProps {
  product: ProductCalculation;
  materials: RawMaterial[];
  warehouses: Warehouse[];
  unitSettings: UnitSettings;
  onProduce: (quantity: number, warehouseId: string, note?: string) => void;
}

export function ProductionSection({
  product,
  materials,
  warehouses,
  unitSettings,
  onProduce,
}: ProductionSectionProps) {
  const { showToast } = useToast();
  const unitCatalog = useUnitCatalog();
  const activeWarehouses = warehouses.filter((w) => w.active);
  const [quantity, setQuantity] = useState(1);
  const [warehouseId, setWarehouseId] = useState(
    activeWarehouses.find((w) => w.type === 'produccion')?.id ??
      activeWarehouses[0]?.id ??
      ''
  );
  const [note, setNote] = useState('');

  const consumption =
    product.recipe && quantity > 0
      ? estimateRecipeConsumption(product.recipe, materials, quantity, unitSettings)
      : [];

  const insufficient = consumption.filter((c) => {
    const material = materials.find((m) => m.id === c.rawMaterialId);
    return material && c.quantity > material.stockQuantity;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId || quantity <= 0) {
      showToast('Indica cantidad y almacén.', 'error');
      return;
    }

    if (insufficient.length > 0) {
      showToast('Stock insuficiente de uno o más insumos.', 'error');
      return;
    }

    try {
      onProduce(quantity, warehouseId, note.trim() || undefined);
      showToast('Producción registrada', 'success');
      setQuantity(1);
      setNote('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo registrar.', 'error');
    }
  };

  return (
    <Card className="!p-4">
      <div className="flex items-center gap-2 mb-4">
        <Factory className="w-5 h-5 text-brand" />
        <h3 className="text-lg font-bold text-foreground">Registrar producción</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Unidades a producir</label>
          <NumericField
            value={quantity}
            onChange={setQuantity}
            className="w-full min-h-11 px-3"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Almacén destino</label>
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

        {consumption.length > 0 && (
          <div className="rounded-xl bg-surface-muted p-3 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted">Consumo de insumos</p>
            {consumption.map((c) => {
              const material = materials.find((m) => m.id === c.rawMaterialId);
              const available = material?.stockQuantity ?? 0;
              const short = material && c.quantity > available;
              return (
                <div key={c.rawMaterialId} className="flex justify-between gap-2 text-sm">
                  <span className={short ? 'text-red-600 dark:text-red-400' : 'text-muted'}>
                    {material?.name ?? 'Insumo'}
                  </span>
                  <span className="font-medium tabular-nums shrink-0">
                    {c.quantity.toLocaleString('es-CU')}{' '}
                    {material ? unitCatalog.getShortLabel(material.unitType) : ''}
                    <span className="text-xs text-muted font-normal ml-1">
                      (disp. {available.toLocaleString('es-CU')})
                    </span>
                  </span>
                </div>
              );
            })}
            {insufficient.length > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                Stock insuficiente para producir esta cantidad.
              </p>
            )}
          </div>
        )}

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota opcional"
          className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
        />

        <Button type="submit" disabled={insufficient.length > 0} className="w-full">
          Confirmar producción
        </Button>
      </form>
    </Card>
  );
}
