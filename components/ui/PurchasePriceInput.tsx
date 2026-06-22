'use client';

import { segmentClassName } from '@/lib/ui/field-styles';
import type { PurchasePriceMode } from '@/lib/ui/purchase-price';
import { switchPurchasePriceMode } from '@/lib/ui/purchase-price';
import { cn } from '@/lib/utils';
import { NumericInput } from './NumericInput';

const MODE_OPTIONS: { id: PurchasePriceMode; label: string }[] = [
  { id: 'per-unit', label: 'Por unidad' },
  { id: 'per-package', label: 'Por lote' },
];

interface PurchasePriceInputProps {
  mode: PurchasePriceMode;
  onModeChange: (mode: PurchasePriceMode) => void;
  value: number;
  onChange: (value: number) => void;
  packageQuantity: number;
  unitLabel: string;
  error?: string;
  perUnitHint?: string;
  perPackageHint?: string;
}

export function PurchasePriceInput({
  mode,
  onModeChange,
  value,
  onChange,
  packageQuantity,
  unitLabel,
  error,
  perUnitHint,
  perPackageHint,
}: PurchasePriceInputProps) {
  const label =
    mode === 'per-unit'
      ? `Precio de compra por ${unitLabel} (CUP)`
      : 'Precio de compra del lote (CUP)';

  const hint =
    mode === 'per-unit'
      ? (perUnitHint ?? `Costo por cada ${unitLabel}`)
      : (perPackageHint ?? 'Lo que pagaste por la compra completa');

  const handleModeChange = (nextMode: PurchasePriceMode) => {
    if (nextMode === mode) return;
    onModeChange(nextMode);
    onChange(switchPurchasePriceMode(value, mode, nextMode, packageQuantity));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2" role="group" aria-label="Modo de precio de compra">
        {MODE_OPTIONS.map(({ id, label: optionLabel }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleModeChange(id)}
              aria-pressed={active}
              className={cn(
                segmentClassName,
                'flex-1 justify-center',
                active
                  ? 'border-brand bg-brand-muted text-brand-foreground'
                  : 'border-border text-muted hover:text-foreground hover:bg-surface-muted'
              )}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>

      <NumericInput
        label={label}
        value={value}
        error={error}
        onChange={onChange}
        hint={hint}
      />
    </div>
  );
}
