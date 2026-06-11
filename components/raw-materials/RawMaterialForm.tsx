'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import type { RawMaterial } from '@/lib/domain/types';
import { calculateRawMaterialUnitCost } from '@/lib/domain/calculations';
import { formatCurrency } from '@/lib/format/currency';
import { formatNumericInput, parseNumericInput } from '@/lib/format/numeric-input';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface RawMaterialFormProps {
  editingMaterial?: RawMaterial | null;
  onSave: (data: {
    name: string;
    purchasePrice: number;
    unitsPerPackage: number;
    stockUnits: number;
  }) => void;
  onCancel?: () => void;
}

const defaultForm = {
  name: '',
  purchasePrice: 0,
  unitsPerPackage: 1,
  stockUnits: 0,
};

export function RawMaterialForm({ editingMaterial, onSave, onCancel }: RawMaterialFormProps) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (editingMaterial) {
      setForm({
        name: editingMaterial.name,
        purchasePrice: editingMaterial.purchasePrice,
        unitsPerPackage: editingMaterial.unitsPerPackage,
        stockUnits: editingMaterial.stockUnits,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editingMaterial]);

  const unitCost = calculateRawMaterialUnitCost(form.purchasePrice, form.unitsPerPackage);

  const handleSubmit = () => {
    if (!form.name.trim()) {
      alert('Ingresa el nombre de la materia prima.');
      return;
    }
    if (form.purchasePrice <= 0) {
      alert('Ingresa un precio de compra válido.');
      return;
    }
    if (form.unitsPerPackage <= 0) {
      alert('Ingresa las unidades por paquete.');
      return;
    }

    onSave({
      name: form.name.trim(),
      purchasePrice: form.purchasePrice,
      unitsPerPackage: form.unitsPerPackage,
      stockUnits: form.stockUnits,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <Input
          label="Unidades por paquete"
          type="number"
          inputMode="numeric"
          value={formatNumericInput(form.unitsPerPackage)}
          onChange={(e) =>
            setForm((p) => ({ ...p, unitsPerPackage: parseNumericInput(e.target.value) }))
          }
        />
      </div>

      <Input
        label="Stock disponible (unidades)"
        type="number"
        inputMode="decimal"
        value={formatNumericInput(form.stockUnits)}
        onChange={(e) =>
          setForm((p) => ({ ...p, stockUnits: parseNumericInput(e.target.value) }))
        }
        hint="Cantidad en inventario de esta materia prima"
      />

      {form.purchasePrice > 0 && form.unitsPerPackage > 0 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Costo unitario calculado
          </p>
          <p className="text-2xl font-black text-emerald-900 tabular-nums mt-1">
            {formatCurrency(unitCost)}
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            {formatCurrency(form.purchasePrice)} ÷ {form.unitsPerPackage} unidades
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
