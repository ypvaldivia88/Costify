'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calculator, Save } from 'lucide-react';
import type {
  GlobalFundSettings,
  IndirectCost,
  MarginType,
  ProductCalculation,
  ProductType,
  RawMaterial,
  RecipeItem,
} from '@/lib/domain/types';
import { calculateProduct } from '@/lib/domain/calculations';
import { MARGIN_TYPE_LABELS, PRODUCT_TYPE_LABELS } from '@/lib/domain/constants';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { IndirectCostsEditor } from './IndirectCostsEditor';
import { PricingResults } from './PricingResults';
import { RecipeEditor } from './RecipeEditor';
import type { TaxSettings } from '@/lib/domain/types';
import { formatNumericInput, parseNumericInput } from '@/lib/format/numeric-input';
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

const defaultForm = {
  name: '',
  productType: 'simple' as ProductType,
  purchasePrice: 0,
  unitsPerPackage: 1,
  recipe: [] as RecipeItem[],
  productionUnits: 100,
  productWeight: 0,
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
      setForm({
        name: editingProduct.name,
        productType: editingProduct.productType ?? 'simple',
        purchasePrice: editingProduct.purchasePrice,
        unitsPerPackage: editingProduct.unitsPerPackage,
        recipe: editingProduct.recipe ?? [],
        productionUnits: editingProduct.productionUnits,
        productWeight: editingProduct.productWeight ?? 0,
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
          unitsPerPackage: form.unitsPerPackage,
          recipe: form.recipe,
          productionUnits: form.productionUnits,
          productWeight: form.productWeight || undefined,
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
      if (form.unitsPerPackage <= 0) {
        alert('Ingresa las unidades por paquete.');
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
        unitsPerPackage: form.unitsPerPackage,
        recipe: isElaborated ? form.recipe : undefined,
        productionUnits: form.productionUnits,
        productWeight: form.productWeight || undefined,
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
      <div className="order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
        <PricingResults
          result={result}
          inventoryCount={otherProducts.length}
          taxSettings={taxSettings}
        />
      </div>

      <Card className="order-2 lg:order-1">
        <SectionHeader
          icon={Calculator}
          title={editingProduct ? `Editando: ${editingProduct.name}` : 'Datos del producto'}
          description="Elige el tipo de producto y configura sus costos directos"
        />

        <div className="space-y-4">
          <Input
            label="Nombre del producto"
            placeholder="Ej. Pan de guayaba"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Tipo de producto
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, productType: value }))}
                    className={cn(
                      'min-h-11 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors',
                      form.productType === value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                    )}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">
              {isElaborated
                ? 'Confecciona el producto seleccionando materias primas de tu inventario.'
                : 'Costo directo basado en precio de compra y unidades por paquete.'}
            </p>
          </div>

          {isElaborated ? (
            <RecipeEditor
              recipe={form.recipe}
              rawMaterials={rawMaterials}
              onChange={(recipe) => setForm((p) => ({ ...p, recipe }))}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Precio de compra (CUP)"
                type="number"
                inputMode="decimal"
                value={formatNumericInput(form.purchasePrice)}
                onChange={(e) =>
                  setForm((p) => ({ ...p, purchasePrice: parseNumericInput(e.target.value) }))
                }
                hint="Costo del paquete o lote de materia prima"
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
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Unidades a vender (mensual)"
              type="number"
              inputMode="numeric"
              value={formatNumericInput(form.productionUnits)}
              onChange={(e) =>
                setForm((p) => ({ ...p, productionUnits: parseNumericInput(e.target.value) }))
              }
              hint="Volumen estimado de ventas del mes"
            />
            <Input
              label="Peso/volumen por unidad (opcional)"
              type="number"
              inputMode="decimal"
              value={formatNumericInput(form.productWeight)}
              onChange={(e) =>
                setForm((p) => ({ ...p, productWeight: parseNumericInput(e.target.value) }))
              }
              hint="Para distribuir transporte o almacenamiento"
            />
          </div>

          <IndirectCostsEditor
            costs={form.indirectCosts}
            onChange={(indirectCosts) => setForm((p) => ({ ...p, indirectCosts }))}
            onImportGlobal={importGlobalCosts}
            showImport={globalIndirectCosts.length > 0}
          />

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-zinc-700">Tipo de margen</label>
              <select
                value={form.marginType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, marginType: e.target.value as MarginType }))
                }
                className="px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500 min-h-11"
              >
                {Object.entries(MARGIN_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-zinc-700">
                  {form.marginType === 'markup' ? 'Recargo sobre costo' : 'Margen bruto deseado'}
                </label>
                <span className="text-sm font-bold text-emerald-700">{form.profitMargin}%</span>
              </div>
              <input
                type="range"
                min="0"
                max={form.marginType === 'margin' ? 90 : 200}
                step="5"
                value={form.profitMargin}
                onChange={(e) => setForm((p) => ({ ...p, profitMargin: Number(e.target.value) }))}
                className="w-full h-2 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-xs text-zinc-500 mt-1">
                {form.marginType === 'markup'
                  ? 'Porcentaje añadido sobre el costo total unitario.'
                  : 'Porcentaje de ganancia sobre el precio de venta (margen bruto).'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
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
