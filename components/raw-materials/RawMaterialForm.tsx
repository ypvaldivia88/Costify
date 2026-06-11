'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import type { RawMaterial, UnitType } from '@/lib/domain/types';
import { calculateRawMaterialUnitCost } from '@/lib/domain/calculations';
import { UNIT_LABELS, UNIT_SHORT_LABELS, UNIT_TYPES } from '@/lib/domain/constants';
import { formatCurrency } from '@/lib/format/currency';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/NumericInput';
import { cn } from '@/lib/utils';

interface RawMaterialFormProps {
  editingMaterial?: RawMaterial | null;
  onSave: (data: {
    name: string;
    purchasePrice: number;
    unitType: UnitType;
    packageQuantity: number;
    stockQuantity: number;
  }) => void;
  onCancel?: () => void;
}

const defaultForm = {
  name: '',
  purchasePrice: 0,
  unitType: 'kg' as UnitType,
  packageQuantity: 1,
  stockQuantity: 0,
};

const selectClassName = cn(
  'w-full min-h-11 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground',
  'focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-all'
);

export function RawMaterialForm({ editingMaterial, onSave, onCancel }: RawMaterialFormProps) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (editingMaterial) {
      setForm({
        name: editingMaterial.name,
        purchasePrice: editingMaterial.purchasePrice,
        unitType: editingMaterial.unitType,
        packageQuantity: editingMaterial.packageQuantity,
        stockQuantity: editingMaterial.stockQuantity,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editingMaterial]);

  const unitCost = calculateRawMaterialUnitCost(form.purchasePrice, form.packageQuantity);
  const unitLabel = UNIT_SHORT_LABELS[form.unitType];

  const handleSubmit = () => {
    if (!form.name.trim()) {
      alert('Ingresa el nombre de la materia prima.');
      return;
    }
    if (form.purchasePrice <= 0) {
      alert('Ingresa un precio de compra válido.');
      return;
    }
    if (form.packageQuantity <= 0) {
      alert('Ingresa la cantidad comprada.');
      return;
    }

    onSave({
      name: form.name.trim(),
      purchasePrice: form.purchasePrice,
      unitType: form.unitType,
      packageQuantity: form.packageQuantity,
      stockQuantity: form.stockQuantity,
    });

    if (!editingMaterial) setForm(defaultForm);
  };

  return (
    <div className="space-y-4">
      <Input
        label="Nombre de la materia prima"
        placeholder="Ej. Harina de trigo"
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
      />

      <NumericInput
        label="Precio de compra (CUP)"
        value={form.purchasePrice}
        onChange={(purchasePrice) => setForm((p) => ({ ...p, purchasePrice }))}
        hint="Costo del paquete o lote"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="unit-type" className="block text-sm font-medium text-foreground">
            Tipo de unidad
          </label>
          <select
            id="unit-type"
            value={form.unitType}
            onChange={(e) =>
              setForm((p) => ({ ...p, unitType: e.target.value as UnitType }))
            }
            className={selectClassName}
          >
            {UNIT_TYPES.map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </div>

        <NumericInput
          label="Cantidad comprada"
          value={form.packageQuantity}
          onChange={(packageQuantity) => setForm((p) => ({ ...p, packageQuantity }))}
          hint={`En ${UNIT_LABELS[form.unitType]} incluidos en el precio`}
        />
      </div>

      <NumericInput
        label={`Stock disponible (${unitLabel})`}
        value={form.stockQuantity}
        onChange={(stockQuantity) => setForm((p) => ({ ...p, stockQuantity }))}
      />

      {form.purchasePrice > 0 && form.packageQuantity > 0 && (
        <div className="rounded-xl bg-accent-surface border border-accent-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Costo unitario
          </p>
          <p className="text-2xl font-black text-foreground tabular-nums mt-1">
            {formatCurrency(unitCost)}
            <span className="text-sm font-semibold text-brand"> / {unitLabel}</span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {editingMaterial && onCancel && (
          <Button variant="outline" onClick={onCancel} type="button">
            Cancelar edición
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={handleSubmit}
          disabled={!form.name || form.purchasePrice <= 0}
          type="button"
        >
          <Save className="w-4 h-4" />
          {editingMaterial ? 'Actualizar materia prima' : 'Guardar materia prima'}
        </Button>
      </div>
    </div>
  );
}
