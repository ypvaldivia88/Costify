'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import type {
  GlobalFundSettings,
  IndirectCost,
  MarginType,
  ProductCalculation,
  ProductType,
  RawMaterial,
  RecipeItem,
  TaxSettings,
} from '@/lib/domain/types';
import { calculateProduct, migrateProductInput } from '@/lib/domain/calculations';
import { MARGIN_TYPE_LABELS, PRODUCT_PURCHASE_UNIT_SUGGESTIONS, PRODUCT_TYPE_LABELS } from '@/lib/domain/constants';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/NumericInput';
import { IndirectCostsEditor } from './IndirectCostsEditor';
import { PricingResults } from './PricingResults';
import { RecipeEditor } from './RecipeEditor';
import { cn } from '@/lib/utils';

interface CostCalculatorProps {
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalIndirectCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  taxSettings: TaxSettings;
  editingProduct?: ProductCalculation | null;
  onSave: (product: ProductCalculation) => void;
  onCancelEdit?: () => void;
}

const fieldClassName = cn(
  'w-full min-h-11 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground',
  'focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-all'
);

const defaultForm = {
  name: '',
  productType: 'simple' as ProductType,
  purchasePrice: 0,
  purchaseUnit: 'unidad',
  packageQuantity: 1,
  recipe: [] as RecipeItem[],
  productionUnits: 100,
  profitMargin: 30,
  marginType: 'markup' as MarginType,
  indirectCosts: [] as IndirectCost[],
};

export function CostCalculator({
  inventory,
  rawMaterials,
  globalIndirectCosts,
  globalFund,
  taxSettings,
  editingProduct,
  onSave,
  onCancelEdit,
}: CostCalculatorProps) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (editingProduct) {
      const migrated = migrateProductInput(editingProduct);
      setForm({
        name: editingProduct.name,
        productType: editingProduct.productType ?? 'simple',
        purchasePrice: editingProduct.purchasePrice,
        purchaseUnit: migrated.purchaseUnit,
        packageQuantity: migrated.packageQuantity,
        recipe: editingProduct.recipe ?? [],
        productionUnits: editingProduct.productionUnits,
        profitMargin: editingProduct.profitMargin,
        marginType: editingProduct.marginType ?? 'markup',
        indirectCosts: editingProduct.indirectCosts,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editingProduct]);

  const otherProducts = editingProduct
    ? inventory.filter((p) => p.id !== editingProduct.id)
    : inventory;

  const result = useMemo(
    () =>
      calculateProduct(
        {
          name: form.name || 'Producto',
          productType: form.productType,
          purchasePrice: form.purchasePrice,
          purchaseUnit: form.purchaseUnit,
          packageQuantity: form.packageQuantity,
          recipe: form.recipe,
          productionUnits: form.productionUnits,
          indirectCosts: form.indirectCosts,
          profitMargin: form.profitMargin,
          marginType: form.marginType,
        },
        otherProducts,
        rawMaterials,
        globalFund
      ),
    [form, otherProducts, rawMaterials, globalFund]
  );

  const importGlobalCosts = () => {
    const currentNames = new Set(form.indirectCosts.map((c) => c.name.toLowerCase()));
    const newCosts = globalIndirectCosts.filter((c) => !currentNames.has(c.name.toLowerCase()));

    if (newCosts.length === 0) {
      alert('No hay costos nuevos para importar.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      indirectCosts: [
        ...prev.indirectCosts,
        ...newCosts.map((c) => ({
          ...c,
          id: crypto.randomUUID(),
          distributionCriteria: c.distributionCriteria ?? 'units',
          distributionUnits: c.distributionUnits ?? 1,
        })),
      ],
    }));
  };

  const isElaborated = form.productType === 'elaborated';
  const hasValidDirectCost = isElaborated
    ? form.recipe.some((r) => r.quantity > 0)
    : form.purchasePrice > 0;

  const handleSave = () => {
    if (!form.name.trim()) {
      alert('Ingresa el nombre del producto.');
      return;
    }
    if (isElaborated) {
      if (!form.recipe.some((r) => r.quantity > 0)) {
        alert('Agrega al menos una materia prima con cantidad mayor a cero.');
        return;
      }
    } else {
      if (form.purchasePrice <= 0) {
        alert('Ingresa un precio de compra válido.');
        return;
      }
      if (form.packageQuantity <= 0) {
        alert('Ingresa cuántas unidades incluye la compra.');
        return;
      }
      if (!form.purchaseUnit.trim()) {
        alert('Indica qué estás contando (unidad, caja, bolsa, kg, etc.).');
        return;
      }
    }
    if (form.productionUnits <= 0) {
      alert('Ingresa las unidades de producción/venta del período.');
      return;
    }

    const saved = calculateProduct(
      {
        name: form.name.trim(),
        productType: form.productType,
        purchasePrice: form.purchasePrice,
        purchaseUnit: form.purchaseUnit.trim(),
        packageQuantity: form.packageQuantity,
        recipe: isElaborated ? form.recipe : undefined,
        productionUnits: form.productionUnits,
        indirectCosts: form.indirectCosts,
        profitMargin: form.profitMargin,
        marginType: form.marginType,
      },
      otherProducts,
      rawMaterials,
      globalFund,
      editingProduct?.id,
      editingProduct?.timestamp
    );

    onSave(saved);
    if (!editingProduct) setForm(defaultForm);
  };

  return (
    <div className="space-y-4 pb-4">
      <PricingResults
        result={result}
        inventoryCount={otherProducts.length}
        taxSettings={taxSettings}
      />

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground">
            {editingProduct ? `Editando: ${editingProduct.name}` : 'Nuevo producto'}
          </h2>
        </div>

        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej. Pan de guayaba"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, productType: value }))}
                className={cn(
                  'min-h-11 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors',
                  form.productType === value
                    ? 'border-brand bg-brand-muted text-brand-foreground'
                    : 'border-border bg-surface text-muted hover:border-brand/40'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {isElaborated ? (
            <RecipeEditor
              recipe={form.recipe}
              rawMaterials={rawMaterials}
              onChange={(recipe) => setForm((p) => ({ ...p, recipe }))}
            />
          ) : (
            <div className="space-y-4">
              <NumericInput
                label="Precio de compra (CUP)"
                value={form.purchasePrice}
                onChange={(purchasePrice) => setForm((p) => ({ ...p, purchasePrice }))}
                hint="Lo que pagaste por el lote"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumericInput
                  label="Cantidad en la compra"
                  value={form.packageQuantity}
                  onChange={(packageQuantity) => setForm((p) => ({ ...p, packageQuantity }))}
                />

                <div className="space-y-1.5">
                  <label htmlFor="product-purchase-unit" className="block text-sm font-medium text-foreground">
                    Unidad
                  </label>
                  <input
                    id="product-purchase-unit"
                    list="product-purchase-unit-suggestions"
                    value={form.purchaseUnit}
                    onChange={(e) => setForm((p) => ({ ...p, purchaseUnit: e.target.value }))}
                    placeholder="unidad, caja, bolsa, kg…"
                    className={fieldClassName}
                  />
                  <datalist id="product-purchase-unit-suggestions">
                    {PRODUCT_PURCHASE_UNIT_SUGGESTIONS.map((unit) => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                </div>
              </div>

              <CollapsibleSection
                title="¿Cómo funciona?"
                summary="Ejemplos para repartir el costo de compra"
              >
                <ul className="text-sm text-muted space-y-2 list-disc pl-4">
                  <li>Caja de 24 a 1&nbsp;200 CUP → cantidad 24, unidad &quot;unidades&quot;</li>
                  <li>2 cajas a 2&nbsp;000 CUP → cantidad 2, unidad &quot;cajas&quot;</li>
                  <li>Bolsa de 5&nbsp;kg a 500 CUP → cantidad 5, unidad &quot;kg&quot;</li>
                </ul>
              </CollapsibleSection>
            </div>
          )}

          <NumericInput
            label="Unidades a vender al mes"
            value={form.productionUnits}
            onChange={(productionUnits) => setForm((p) => ({ ...p, productionUnits }))}
          />

          <CollapsibleSection
            title="Margen de utilidad"
            summary={`${form.profitMargin}% · ${MARGIN_TYPE_LABELS[form.marginType]}`}
            defaultOpen
          >
            <div className="space-y-3 pt-3">
              <select
                value={form.marginType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, marginType: e.target.value as MarginType }))
                }
                className={fieldClassName}
              >
                {Object.entries(MARGIN_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {form.marginType === 'markup' ? 'Recargo' : 'Margen bruto'}
                  </span>
                  <span className="text-sm font-bold text-brand">{form.profitMargin}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={form.marginType === 'margin' ? 90 : 200}
                  step="5"
                  value={form.profitMargin}
                  onChange={(e) => setForm((p) => ({ ...p, profitMargin: Number(e.target.value) }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Gastos indirectos"
            summary={
              form.indirectCosts.length > 0
                ? `${form.indirectCosts.length} gasto(s) configurado(s)`
                : 'Opcional — alquiler, servicios, etc.'
            }
          >
            <div className="pt-3">
              <IndirectCostsEditor
                costs={form.indirectCosts}
                onChange={(indirectCosts) => setForm((p) => ({ ...p, indirectCosts }))}
                onImportGlobal={importGlobalCosts}
                showImport={globalIndirectCosts.length > 0}
              />
            </div>
          </CollapsibleSection>

          <div className="flex flex-col gap-2 pt-1">
            {editingProduct && (
              <Button variant="outline" onClick={onCancelEdit} type="button">
                Cancelar edición
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              onClick={handleSave}
              disabled={!form.name || !hasValidDirectCost}
              type="button"
            >
              <Save className="w-4 h-4" />
              {editingProduct ? 'Actualizar producto' : 'Guardar en historial'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
