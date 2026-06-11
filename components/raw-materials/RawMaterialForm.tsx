'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import type { MaterialUnitType, RawMaterial } from '@/lib/domain/types';
import { calculateRawMaterialUnitCost } from '@/lib/domain/calculations';
import { MATERIAL_UNIT_LABELS, MATERIAL_UNIT_TYPES } from '@/lib/domain/constants';
import { formatCurrency } from '@/lib/format/currency';
import { formatNumericInput, parseNumericInput } from '@/lib/format/numeric-input';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface RawMaterialFormProps {
  editingMaterial?: RawMaterial | null;
  onSave: (data: {
    name: string;
    purchasePrice: number;
    unitType: MaterialUnitType;
    packageQuantity: number;
    stockQuantity: number;
  }) => void;
  onCancel?: () => void;
}

const defaultForm = {
  name: '',
  purchasePrice: 0,
  unitType: 'kg' as MaterialUnitType,
  packageQuantity: 1,
  stockQuantity: 0,
};

const selectClassName = cn(
  'w-full min-h-11 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900',
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all'
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
  const unitLabel = MATERIAL_UNIT_LABELS[form.unitType];

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

      <Input
        label="Precio de compra (CUP)"
        type="number"
        inputMode="decimal"
        value={formatNumericInput(form.purchasePrice)}
        onChange={(e) =>
          setForm((p) => ({ ...p, purchasePrice: parseNumericInput(e.target.value) }))
        }
        hint="Costo del paquete o lote"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="unit-type" className="block text-sm font-medium text-zinc-700">
            Tipo de unidad
          </label>
          <select
            id="unit-type"
            value={form.unitType}
            onChange={(e) =>
              setForm((p) => ({ ...p, unitType: e.target.value as MaterialUnitType }))
            }
            className={selectClassName}
          >
            {MATERIAL_UNIT_TYPES.map((unit) => (
              <option key={unit} value={unit}>
                {MATERIAL_UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Cantidad comprada"
          type="number"
          inputMode="decimal"
          value={formatNumericInput(form.packageQuantity)}
          onChange={(e) =>
            setForm((p) => ({ ...p, packageQuantity: parseNumericInput(e.target.value) }))
          }
          hint={`Cantidad en ${unitLabel} incluida en el precio de compra`}
        />
      </div>

      <Input
        label={`Stock disponible (${unitLabel})`}
        type="number"
        inputMode="decimal"
        value={formatNumericInput(form.stockQuantity)}
        onChange={(e) =>
          setForm((p) => ({ ...p, stockQuantity: parseNumericInput(e.target.value) }))
        }
        hint="Cantidad en inventario de esta materia prima"
      />

      {form.purchasePrice > 0 && form.packageQuantity > 0 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Costo unitario calculado
          </p>
          <p className="text-2xl font-black text-emerald-900 tabular-nums mt-1">
            {formatCurrency(unitCost)}
            <span className="text-sm font-semibold text-emerald-700"> / {unitLabel}</span>
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            {formatCurrency(form.purchasePrice)} ÷ {form.packageQuantity} {unitLabel}
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
