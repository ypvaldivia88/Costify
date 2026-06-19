'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import type { RawMaterial, UnitType } from '@/lib/domain/types';
import { calculateRawMaterialUnitCost } from '@/lib/domain/calculations';
import { useUnitCatalog } from '@/hooks/use-unit-catalog';
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

type FormErrors = Partial<Record<'name' | 'unitPurchasePrice' | 'packageQuantity', string>>;

const defaultForm = {
  name: '',
  unitPurchasePrice: 0,
  unitType: 'kg' as UnitType,
  packageQuantity: 1,
  stockQuantity: 0,
};

function toUnitPurchasePrice(material: RawMaterial): number {
  if (material.packageQuantity <= 0) return material.unitCost;
  return material.purchasePrice / material.packageQuantity;
}

export function RawMaterialForm({ editingMaterial, onSave, onCancel }: RawMaterialFormProps) {
  const unitCatalog = useUnitCatalog();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editingMaterial) {
      setForm({
        name: editingMaterial.name,
        unitPurchasePrice: toUnitPurchasePrice(editingMaterial),
        unitType: editingMaterial.unitType,
        packageQuantity: editingMaterial.packageQuantity,
        stockQuantity: editingMaterial.stockQuantity,
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [editingMaterial]);

  const unitLabel = unitCatalog.getShortLabel(form.unitType);
  const unitOptions = unitCatalog.getSelectableUnitIds();
  const totalPurchasePrice = form.unitPurchasePrice * form.packageQuantity;
  const unitCost = calculateRawMaterialUnitCost(totalPurchasePrice, form.packageQuantity);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Ingresa el nombre de la materia prima';
    if (form.unitPurchasePrice <= 0) next.unitPurchasePrice = 'Ingresa un precio por unidad válido';
    if (form.packageQuantity <= 0) next.packageQuantity = 'Ingresa la cantidad comprada';
    return next;
  };

  const handleSubmit = () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      name: form.name.trim(),
      purchasePrice: totalPurchasePrice,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Tipo de unidad"
          value={form.unitType}
          onChange={(e) => setForm((p) => ({ ...p, unitType: e.target.value as UnitType }))}
        >
          {unitOptions.map((unit) => (
            <option key={unit} value={unit}>
              {unitCatalog.getLabel(unit)}
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
          hint={`Total de ${unitCatalog.getLabel(form.unitType)} adquiridos`}
        />
      </div>

      <NumericInput
        label={`Precio de compra por ${unitLabel} (CUP)`}
        value={form.unitPurchasePrice}
        error={errors.unitPurchasePrice}
        onChange={(unitPurchasePrice) => {
          setForm((p) => ({ ...p, unitPurchasePrice }));
          if (errors.unitPurchasePrice) setErrors((p) => ({ ...p, unitPurchasePrice: undefined }));
        }}
        hint={`Costo por cada ${unitCatalog.getLabel(form.unitType)}`}
      />

      <NumericInput
        label={`Stock disponible (${unitLabel})`}
        value={form.stockQuantity}
        onChange={(stockQuantity) => setForm((p) => ({ ...p, stockQuantity }))}
      />

      {form.unitPurchasePrice > 0 && form.packageQuantity > 0 && (
        <div className="rounded-xl bg-accent-surface border border-accent-border px-4 py-3 space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Costo unitario</p>
            <p className="text-2xl font-black text-foreground tabular-nums mt-1">
              {formatCurrency(unitCost)}
              <span className="text-sm font-semibold text-brand"> / {unitLabel}</span>
            </p>
          </div>
          <p className="text-sm text-muted">
            Precio total de compra:{' '}
            <strong className="text-foreground tabular-nums">
              {formatCurrency(totalPurchasePrice)}
            </strong>
            <span className="ml-1">
              ({form.packageQuantity} {unitLabel} × {formatCurrency(form.unitPurchasePrice)})
            </span>
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
          disabled={!form.name || form.unitPurchasePrice <= 0}
          type="button"
        >
          <Save className="w-4 h-4" />
          {editingMaterial ? 'Actualizar materia prima' : 'Guardar materia prima'}
        </Button>
      </div>
    </div>
  );
}
