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
import { Select } from '@/components/ui/Select';

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

type FormErrors = Partial<Record<'name' | 'purchasePrice' | 'packageQuantity', string>>;

const defaultForm = {
  name: '',
  purchasePrice: 0,
  unitType: 'kg' as UnitType,
  packageQuantity: 1,
  stockQuantity: 0,
};

export function RawMaterialForm({ editingMaterial, onSave, onCancel }: RawMaterialFormProps) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});

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
    setErrors({});
  }, [editingMaterial]);

  const unitCost = calculateRawMaterialUnitCost(form.purchasePrice, form.packageQuantity);
  const unitLabel = UNIT_SHORT_LABELS[form.unitType];

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Ingresa el nombre de la materia prima';
    if (form.purchasePrice <= 0) next.purchasePrice = 'Ingresa un precio de compra válido';
    if (form.packageQuantity <= 0) next.packageQuantity = 'Ingresa la cantidad comprada';
    return next;
  };

  const handleSubmit = () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      name: form.name.trim(),
      purchasePrice: form.purchasePrice,
      unitType: form.unitType,
      packageQuantity: form.packageQuantity,
      stockQuantity: form.stockQuantity,
    });

    if (!editingMaterial) setForm(defaultForm);
    setErrors({});
  };

  return (
    <div className="space-y-4">
      <Input
        label="Nombre de la materia prima"
        placeholder="Ej. Harina de trigo"
        value={form.name}
        error={errors.name}
        onChange={(e) => {
          setForm((p) => ({ ...p, name: e.target.value }));
          if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
        }}
      />

      <NumericInput
        label="Precio de compra (CUP)"
        value={form.purchasePrice}
        error={errors.purchasePrice}
        onChange={(purchasePrice) => {
          setForm((p) => ({ ...p, purchasePrice }));
          if (errors.purchasePrice) setErrors((p) => ({ ...p, purchasePrice: undefined }));
        }}
        hint="Costo del paquete o lote"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Tipo de unidad"
          value={form.unitType}
          onChange={(e) => setForm((p) => ({ ...p, unitType: e.target.value as UnitType }))}
        >
          {UNIT_TYPES.map((unit) => (
            <option key={unit} value={unit}>
              {UNIT_LABELS[unit]}
            </option>
          ))}
        </Select>

        <NumericInput
          label="Cantidad comprada"
          value={form.packageQuantity}
          error={errors.packageQuantity}
          onChange={(packageQuantity) => {
            setForm((p) => ({ ...p, packageQuantity }));
            if (errors.packageQuantity) setErrors((p) => ({ ...p, packageQuantity: undefined }));
          }}
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
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Costo unitario</p>
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
