'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import type {
  GlobalFundSettings,
  IndirectCost,
  LaborShareSettings,
  MarginType,
  ProductCalculation,
  ProductLaborShare,
  ProductType,
  PurchaseCurrency,
  RawMaterial,
  RecipeItem,
  TaxSettings,
  UnitSettings,
} from '@costify/shared/domain/types';
import { calculateProduct, DEFAULT_PRODUCT_LABOR_SHARE, migrateProductInput, validateLaborSharePricing, validateProductLaborShare } from '@costify/shared/domain/calculations';
import { MARGIN_TYPE_LABELS, PRODUCT_TYPE_LABELS } from '@costify/shared/domain/constants';
import { useUnitCatalog } from '@/hooks/use-unit-catalog';
import { useExchangeRatesContext } from '@/hooks/use-exchange-rates-context';
import {
  getPurchaseFormValuesFromMeta,
  getSuggestedRate,
  resolvePurchasePrice,
} from '@costify/shared/domain/purchase-currency';
import { fieldClassName } from '@/lib/ui/field-styles';
import type { PurchasePriceMode } from '@/lib/ui/purchase-price';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/NumericInput';
import { PurchasePriceInput } from '@/components/ui/PurchasePriceInput';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { IndirectCostsEditor } from './IndirectCostsEditor';
import { LaborShareEditor } from './LaborShareEditor';
import { PricingResults } from './PricingResults';
import { RecipeEditor } from './RecipeEditor';

interface CostCalculatorProps {
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalIndirectCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  laborShareSettings: LaborShareSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
  editingProduct?: ProductCalculation | null;
  onSave: (product: ProductCalculation) => void;
  onCancelEdit?: () => void;
}

type FormErrors = Partial<
  Record<
    | 'name'
    | 'purchasePrice'
    | 'packageQuantity'
    | 'purchaseUnit'
    | 'recipe'
    | 'productionUnits'
    | 'exchangeRate'
    | 'laborShare',
    string
  >
>;

const defaultForm = {
  name: '',
  productType: 'simple' as ProductType,
  purchasePrice: 0,
  purchasePriceMode: 'per-package' as PurchasePriceMode,
  purchaseCurrency: 'CUP' as PurchaseCurrency,
  exchangeRate: 0,
  purchaseUnit: 'unidad',
  packageQuantity: 1,
  recipe: [] as RecipeItem[],
  productionUnits: 0,
  profitMargin: 30,
  marginType: 'markup' as MarginType,
  indirectCosts: [] as IndirectCost[],
  laborShare: { ...DEFAULT_PRODUCT_LABOR_SHARE },
};

export function CostCalculator({
  inventory,
  rawMaterials,
  globalIndirectCosts,
  globalFund,
  laborShareSettings,
  taxSettings,
  unitSettings,
  editingProduct,
  onSave,
  onCancelEdit,
}: CostCalculatorProps) {
  const { showToast } = useToast();
  const unitCatalog = useUnitCatalog();
  const { snapshot, markCostingRate } = useExchangeRatesContext();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editingProduct) {
      const migrated = migrateProductInput(editingProduct, unitSettings);
      const fromMeta = getPurchaseFormValuesFromMeta(
        editingProduct.purchasePrice,
        migrated.packageQuantity,
        editingProduct.purchaseMeta
      );
      setForm({
        name: editingProduct.name,
        productType: editingProduct.productType ?? 'simple',
        purchasePrice: fromMeta.value,
        purchasePriceMode: fromMeta.mode,
        purchaseCurrency: fromMeta.currency,
        exchangeRate: fromMeta.exchangeRate,
        purchaseUnit: migrated.purchaseUnit,
        packageQuantity: migrated.packageQuantity,
        recipe: editingProduct.recipe ?? [],
        productionUnits: editingProduct.productionUnits,
        profitMargin: editingProduct.profitMargin,
        marginType: editingProduct.marginType ?? 'markup',
        indirectCosts: editingProduct.indirectCosts,
        laborShare: editingProduct.laborShare ?? { ...DEFAULT_PRODUCT_LABOR_SHARE },
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [editingProduct]);

  const otherProducts = editingProduct
    ? inventory.filter((p) => p.id !== editingProduct.id)
    : inventory;

  const suggestedRate = getSuggestedRate(snapshot, form.purchaseCurrency);

  const resolvedPurchase = (() => {
    try {
      return resolvePurchasePrice(
        form.purchasePrice,
        form.purchasePriceMode,
        form.packageQuantity,
        form.purchaseCurrency,
        form.exchangeRate,
        snapshot
      );
    } catch {
      return { purchasePriceCup: 0, purchaseMeta: undefined };
    }
  })();

  const totalPurchasePrice = resolvedPurchase.purchasePriceCup;

  const result = useMemo(
    () =>
      calculateProduct(
        {
          name: form.name || 'Producto',
          productType: form.productType,
          purchasePrice: totalPurchasePrice,
          purchaseUnit: form.purchaseUnit,
          packageQuantity: form.packageQuantity,
          recipe: form.recipe,
          productionUnits: form.productionUnits,
          indirectCosts: form.indirectCosts,
          profitMargin: form.profitMargin,
          marginType: form.marginType,
          laborShare: form.laborShare.enabled ? form.laborShare : undefined,
          purchaseMeta: resolvedPurchase.purchaseMeta,
        },
        otherProducts,
        rawMaterials,
        globalFund,
        undefined,
        undefined,
        unitSettings,
        laborShareSettings
      ),
    [form, otherProducts, rawMaterials, globalFund, laborShareSettings, unitSettings, totalPurchasePrice, resolvedPurchase.purchaseMeta]
  );

  const importGlobalCosts = () => {
    const currentNames = new Set(form.indirectCosts.map((c) => c.name.toLowerCase()));
    const newCosts = globalIndirectCosts.filter((c) => !currentNames.has(c.name.toLowerCase()));

    if (newCosts.length === 0) {
      showToast('No hay costos nuevos para importar', 'info');
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
    showToast(`${newCosts.length} gasto(s) importado(s)`, 'success');
  };

  const isElaborated = form.productType === 'elaborated';
  const hasValidDirectCost = isElaborated
    ? form.recipe.some((r) => r.quantity > 0)
    : form.purchasePrice > 0;

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (!form.name.trim()) {
      next.name = 'Ingresa el nombre del producto';
    }
    if (isElaborated) {
      if (!form.recipe.some((r) => r.quantity > 0)) {
        next.recipe = 'Agrega al menos una materia prima con cantidad mayor a cero';
      }
    } else {
      if (form.purchasePrice <= 0) {
        next.purchasePrice =
          form.purchasePriceMode === 'per-unit'
            ? 'Ingresa un precio por unidad válido'
            : 'Ingresa un precio del lote válido';
      }
      if (form.purchaseCurrency !== 'CUP' && form.exchangeRate <= 0) {
        next.exchangeRate = 'Indica la tasa real que pagaste';
      }
      if (form.packageQuantity <= 0) next.packageQuantity = 'Indica cuántas unidades incluye la compra';
      if (!form.purchaseUnit.trim()) next.purchaseUnit = 'Indica la unidad (unidad, caja, bolsa, kg…)';
    }
    if (form.productionUnits < 0) {
      next.productionUnits = 'Las unidades no pueden ser negativas';
    }

    if (form.laborShare.enabled) {
      const roleValidation = validateProductLaborShare(form.laborShare);
      if (!roleValidation.valid && roleValidation.error) {
        next.laborShare = roleValidation.error;
      }
      const totalPercent = form.laborShare.roles.reduce((sum, role) => sum + role.percentOfSale, 0);
      const validation = validateLaborSharePricing(
        totalPercent,
        form.profitMargin,
        form.marginType
      );
      if (!validation.valid && validation.error) {
        next.laborShare = validation.error;
      }
    }

    return next;
  };

  const handleSave = () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const resolved = resolvePurchasePrice(
        form.purchasePrice,
        form.purchasePriceMode,
        form.packageQuantity,
        form.purchaseCurrency,
        form.exchangeRate,
        snapshot
      );

      if (snapshot?.rates.USD) {
        markCostingRate(snapshot.rates.USD);
      }

      const saved = calculateProduct(
        {
          name: form.name.trim(),
          productType: form.productType,
          purchasePrice: resolved.purchasePriceCup,
          purchaseUnit: form.purchaseUnit.trim(),
          packageQuantity: form.packageQuantity,
          recipe: isElaborated ? form.recipe : undefined,
          productionUnits: form.productionUnits,
          indirectCosts: form.indirectCosts,
          profitMargin: form.profitMargin,
          marginType: form.marginType,
          laborShare: form.laborShare.enabled ? form.laborShare : undefined,
          purchaseMeta: isElaborated ? undefined : resolved.purchaseMeta,
        },
        otherProducts,
        rawMaterials,
        globalFund,
        editingProduct?.id,
        editingProduct?.timestamp,
        unitSettings,
        laborShareSettings
      );

      onSave(saved);
      if (!editingProduct) setForm(defaultForm);
      setErrors({});
    } catch (error) {
      setErrors({
        exchangeRate: error instanceof Error ? error.message : 'No se pudo convertir el precio',
      });
    }
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
          <h3 className="text-lg font-bold text-foreground">
            {editingProduct ? `Editando: ${editingProduct.name}` : 'Nuevo producto'}
          </h3>
        </div>

        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej. Croqueta de jamón"
            value={form.name}
            error={errors.name}
            onChange={(e) => {
              setForm((p) => ({ ...p, name: e.target.value }));
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
          />

          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, productType: value }))}
                className={cn(
                  'min-h-11 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors active:scale-[0.98]',
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
            <div className="space-y-1.5">
              <RecipeEditor
                recipe={form.recipe}
                rawMaterials={rawMaterials}
                onChange={(recipe) => {
                  setForm((p) => ({ ...p, recipe }));
                  if (errors.recipe) setErrors((p) => ({ ...p, recipe: undefined }));
                }}
              />
              {errors.recipe && <p className="text-xs text-red-600 dark:text-red-400">{errors.recipe}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <PurchasePriceInput
                mode={form.purchasePriceMode}
                onModeChange={(purchasePriceMode) => setForm((p) => ({ ...p, purchasePriceMode }))}
                currency={form.purchaseCurrency}
                onCurrencyChange={(purchaseCurrency) => {
                  const nextRate = getSuggestedRate(snapshot, purchaseCurrency);
                  setForm((p) => ({
                    ...p,
                    purchaseCurrency,
                    exchangeRate: purchaseCurrency === 'CUP' ? 0 : nextRate,
                  }));
                }}
                exchangeRate={form.exchangeRate}
                onExchangeRateChange={(exchangeRate) => {
                  setForm((p) => ({ ...p, exchangeRate }));
                  if (errors.exchangeRate) setErrors((p) => ({ ...p, exchangeRate: undefined }));
                }}
                suggestedTrmiRate={suggestedRate}
                value={form.purchasePrice}
                error={errors.purchasePrice}
                exchangeRateError={errors.exchangeRate}
                onChange={(purchasePrice) => {
                  setForm((p) => ({ ...p, purchasePrice }));
                  if (errors.purchasePrice) setErrors((p) => ({ ...p, purchasePrice: undefined }));
                }}
                packageQuantity={form.packageQuantity}
                unitLabel={form.purchaseUnit.trim() || 'unidad'}
                snapshot={snapshot}
                perUnitHint={`Costo por cada ${form.purchaseUnit.trim() || 'unidad'}`}
                perPackageHint="Lo que pagaste por la compra completa"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumericInput
                  label="Cantidad en la compra"
                  value={form.packageQuantity}
                  error={errors.packageQuantity}
                  onChange={(packageQuantity) => {
                    setForm((p) => ({ ...p, packageQuantity }));
                    if (errors.packageQuantity) setErrors((p) => ({ ...p, packageQuantity: undefined }));
                  }}
                />

                <div className="space-y-1.5">
                  <label htmlFor="product-purchase-unit" className="block text-sm font-medium text-foreground">
                    Unidad
                  </label>
                  <input
                    id="product-purchase-unit"
                    list="product-purchase-unit-suggestions"
                    value={form.purchaseUnit}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, purchaseUnit: e.target.value }));
                      if (errors.purchaseUnit) setErrors((p) => ({ ...p, purchaseUnit: undefined }));
                    }}
                    placeholder="unidad, caja, bolsa, kg…"
                    className={cn(
                      fieldClassName,
                      errors.purchaseUnit ? 'border-red-400 dark:border-red-500' : undefined
                    )}
                  />
                  <datalist id="product-purchase-unit-suggestions">
                    {unitCatalog.getPurchaseUnitSuggestions().map((unit) => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                  {errors.purchaseUnit && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.purchaseUnit}</p>
                  )}
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

          <CollapsibleSection
            title="Proyección mensual (opcional)"
            summary={
              form.productionUnits > 0
                ? `${form.productionUnits} uds./mes`
                : 'Sin estimar — precio por venta individual'
            }
          >
            <div className="space-y-3 pt-3">
              <p className="text-sm text-muted leading-relaxed">
                El precio sugerido se calcula por cada venta (costo directo + margen). Solo necesitas
                estimar un volumen mensual si quieres incluir gastos fijos en el precio o ver
                proyecciones de ingresos e impuestos.
              </p>
              <NumericInput
                label="Unidades a vender al mes (opcional)"
                value={form.productionUnits}
                error={errors.productionUnits}
                onChange={(productionUnits) => {
                  setForm((p) => ({ ...p, productionUnits }));
                  if (errors.productionUnits) setErrors((p) => ({ ...p, productionUnits: undefined }));
                }}
                hint="Déjalo en 0 si aún no sabes cuánto venderás"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Margen de utilidad"
            summary={`${form.profitMargin}% · ${MARGIN_TYPE_LABELS[form.marginType]}`}
            defaultOpen
          >
            <div className="space-y-3 pt-3">
              <Select
                value={form.marginType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, marginType: e.target.value as MarginType }))
                }
              >
                {Object.entries(MARGIN_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>

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
                  aria-label="Margen de utilidad"
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

          {laborShareSettings.enabled && (
            <CollapsibleSection
              title="Participación salarial"
              summary={
                form.laborShare.enabled && form.laborShare.roles.length > 0
                  ? `${form.laborShare.roles.reduce((sum, role) => sum + role.percentOfSale, 0).toFixed(0)}% del precio`
                  : 'Opcional — % del precio por rol'
              }
            >
              <div className="pt-3 space-y-2">
                <LaborShareEditor
                  laborShare={form.laborShare}
                  laborShareSettings={laborShareSettings}
                  profitMargin={form.profitMargin}
                  marginType={form.marginType}
                  onChange={(laborShare) => {
                    setForm((prev) => ({ ...prev, laborShare }));
                    if (errors.laborShare) setErrors((prev) => ({ ...prev, laborShare: undefined }));
                  }}
                />
                {errors.laborShare && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.laborShare}</p>
                )}
              </div>
            </CollapsibleSection>
          )}

          <div className="flex flex-col gap-2 pt-1">
            {onCancelEdit && (
              <Button variant="outline" onClick={onCancelEdit} type="button">
                {editingProduct ? 'Cancelar edición' : 'Volver a productos'}
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
              {editingProduct ? 'Actualizar producto' : 'Guardar producto'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
