import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import type {
  GlobalFundSettings,
  IndirectCost,
  LaborShareSettings,
  MarginType,
  ProductCalculation,
  ProductType,
  PurchaseCurrency,
  RawMaterial,
  RecipeItem,
  TaxSettings,
  UnitSettings,
} from '@costify/shared/domain/types';
import {
  calculateProduct,
  DEFAULT_PRODUCT_LABOR_SHARE,
  migrateProductInput,
  validateLaborSharePricing,
  validateProductLaborShare,
} from '@costify/shared/domain/calculations';
import { MARGIN_TYPE_LABELS, PRODUCT_TYPE_LABELS } from '@costify/shared/domain/constants';
import {
  getPurchaseFormValuesFromMeta,
  getSuggestedRate,
  resolvePurchasePrice,
} from '@costify/shared/domain/purchase-currency';
import type { PurchasePriceMode } from '@costify/shared/purchase-price';
import { IndirectCostsEditor } from '@/components/calculator/IndirectCostsEditor';
import { LaborShareEditor } from '@/components/calculator/LaborShareEditor';
import { PricingResults } from '@/components/calculator/PricingResults';
import { RecipeEditor } from '@/components/calculator/RecipeEditor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/NumericInput';
import { PurchasePriceInput } from '@/components/ui/PurchasePriceInput';
import { Select } from '@/components/ui/Select';
import { useTheme } from '@/context/ThemeContext';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useToast } from '@/context/ToastContext';
import { useExchangeRatesContext } from '@/hooks/use-exchange-rates-context';
import { useUnitCatalog } from '@/hooks/use-unit-catalog';
import { createId } from '@/utils/uuid';

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
  posSku: '',
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
  const { colors } = useTheme();
  const { scrollPaddingBottom } = useScreenInsets();
  const { showToast } = useToast();
  const unitCatalog = useUnitCatalog();
  const { snapshot, markCostingRate } = useExchangeRatesContext();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
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
        posSku: editingProduct.posSku ?? '',
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
  }, [editingProduct, unitSettings]);

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
          posSku: form.posSku.trim() || undefined,
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
          id: createId(),
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
    if (!form.name.trim()) next.name = 'Ingresa el nombre del producto';
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
          posSku: form.posSku.trim() || undefined,
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
      showToast(editingProduct ? 'Producto actualizado' : 'Producto guardado', 'success');
    } catch (error) {
      setErrors({
        exchangeRate: error instanceof Error ? error.message : 'No se pudo convertir el precio',
      });
    }
  };

  const purchaseUnitSuggestions = unitCatalog.getPurchaseUnitSuggestions();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(scrollPaddingBottom, keyboardHeight + 24) },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <PricingResults
        result={result}
        rawMaterials={rawMaterials}
        taxSettings={taxSettings}
      />

      <Card>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {editingProduct ? `Editando: ${editingProduct.name}` : 'Nuevo producto'}
        </Text>

        <View style={styles.form}>
          <Input
            label="Nombre"
            placeholder="Ej. Croqueta de jamón"
            value={form.name}
            error={errors.name}
            onChangeText={(name) => {
              setForm((p) => ({ ...p, name }));
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
          />

          <Input
            label="SKU caja (opcional)"
            placeholder="Ej. CERVEZA_350"
            value={form.posSku}
            onChangeText={(posSku) => setForm((p) => ({ ...p, posSku }))}
          />

          <View style={styles.typeRow}>
            {(Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][]).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setForm((p) => ({ ...p, productType: value }))}
                style={[
                  styles.typeBtn,
                  {
                    borderColor: form.productType === value ? colors.brand : colors.border,
                    backgroundColor: form.productType === value ? colors.brandMuted : colors.surface,
                  },
                ]}
              >
                <Text
                  style={{
                    color: form.productType === value ? colors.brandForeground : colors.muted,
                    fontWeight: '700',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {isElaborated ? (
            <View style={styles.section}>
              <RecipeEditor
                recipe={form.recipe}
                rawMaterials={rawMaterials}
                onChange={(recipe) => {
                  setForm((p) => ({ ...p, recipe }));
                  if (errors.recipe) setErrors((p) => ({ ...p, recipe: undefined }));
                }}
              />
              {errors.recipe ? <Text style={{ color: colors.danger, fontSize: 12 }}>{errors.recipe}</Text> : null}
            </View>
          ) : (
            <View style={styles.section}>
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

              <View style={styles.row}>
                <View style={styles.half}>
                  <NumericInput
                    label="Cantidad en la compra"
                    value={form.packageQuantity}
                    error={errors.packageQuantity}
                    onChange={(packageQuantity) => {
                      setForm((p) => ({ ...p, packageQuantity }));
                      if (errors.packageQuantity) setErrors((p) => ({ ...p, packageQuantity: undefined }));
                    }}
                  />
                </View>
                <View style={styles.half}>
                  <Input
                    label="Unidad"
                    placeholder="unidad, caja, bolsa, kg…"
                    value={form.purchaseUnit}
                    error={errors.purchaseUnit}
                    onChangeText={(purchaseUnit) => {
                      setForm((p) => ({ ...p, purchaseUnit }));
                      if (errors.purchaseUnit) setErrors((p) => ({ ...p, purchaseUnit: undefined }));
                    }}
                  />
                </View>
              </View>
              {purchaseUnitSuggestions.length > 0 ? (
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  Sugerencias: {purchaseUnitSuggestions.slice(0, 6).join(', ')}…
                </Text>
              ) : null}

              <CollapsibleSection
                title="¿Cómo funciona?"
                summary="Ejemplos para repartir el costo de compra"
              >
                <View style={styles.examples}>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    • Caja de 24 a 1 200 CUP → cantidad 24, unidad &quot;unidades&quot;
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    • 2 cajas a 2 000 CUP → cantidad 2, unidad &quot;cajas&quot;
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    • Bolsa de 5 kg a 500 CUP → cantidad 5, unidad &quot;kg&quot;
                  </Text>
                </View>
              </CollapsibleSection>
            </View>
          )}

          <CollapsibleSection
            title="Proyección mensual (opcional)"
            summary={
              form.productionUnits > 0
                ? `${form.productionUnits} uds./mes`
                : 'Sin estimar — precio por venta individual'
            }
          >
            <View style={styles.collapsibleBody}>
              <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
                El precio sugerido se calcula por cada venta (costo directo + margen). Solo necesitas
                estimar un volumen mensual si quieres incluir gastos fijos en el precio o ver
                proyecciones de ingresos e impuestos.
              </Text>
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
            </View>
          </CollapsibleSection>

          <CollapsibleSection
            title="Margen de utilidad"
            summary={`${form.profitMargin}% · ${MARGIN_TYPE_LABELS[form.marginType]}`}
            defaultOpen
          >
            <View style={styles.collapsibleBody}>
              <Select
                value={form.marginType}
                onValueChange={(marginType) => setForm((p) => ({ ...p, marginType: marginType as MarginType }))}
              >
                {Object.entries(MARGIN_TYPE_LABELS).map(([value, label]) => (
                  <Picker.Item key={value} label={label} value={value} />
                ))}
              </Select>
              <View style={styles.sliderRow}>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                  {form.marginType === 'markup' ? 'Recargo' : 'Margen bruto'}
                </Text>
                <Text style={{ color: colors.brand, fontWeight: '800' }}>{form.profitMargin}%</Text>
              </View>
              <Slider
                minimumValue={0}
                maximumValue={form.marginType === 'margin' ? 90 : 200}
                step={5}
                value={form.profitMargin}
                onValueChange={(profitMargin) => setForm((p) => ({ ...p, profitMargin }))}
                minimumTrackTintColor={colors.brand}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.brand}
              />
            </View>
          </CollapsibleSection>

          <CollapsibleSection
            title="Gastos indirectos"
            summary={
              form.indirectCosts.length > 0
                ? `${form.indirectCosts.length} gasto(s) configurado(s)`
                : 'Opcional — alquiler, servicios, etc.'
            }
          >
            <View style={styles.collapsibleBody}>
              <IndirectCostsEditor
                costs={form.indirectCosts}
                onChange={(indirectCosts) => setForm((p) => ({ ...p, indirectCosts }))}
                onImportGlobal={importGlobalCosts}
                showImport={globalIndirectCosts.length > 0}
              />
            </View>
          </CollapsibleSection>

          {laborShareSettings.enabled ? (
            <CollapsibleSection
              title="Participación salarial"
              summary={
                form.laborShare.enabled && form.laborShare.roles.length > 0
                  ? `${form.laborShare.roles.reduce((sum, role) => sum + role.percentOfSale, 0).toFixed(0)}% del precio`
                  : 'Opcional — % del precio por rol'
              }
            >
              <View style={styles.collapsibleBody}>
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
                {errors.laborShare ? (
                  <Text style={{ color: '#ef4444', fontSize: 12 }}>{errors.laborShare}</Text>
                ) : null}
              </View>
            </CollapsibleSection>
          ) : null}

          {onCancelEdit ? (
            <Button variant="outline" onPress={onCancelEdit}>
              {editingProduct ? 'Cancelar edición' : 'Volver a productos'}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onPress={handleSave}
            disabled={!form.name || !hasValidDirectCost}
          >
            {editingProduct ? 'Actualizar producto' : 'Guardar producto'}
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  form: { gap: 12 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 48, justifyContent: 'center' },
  section: { gap: 10 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, minWidth: 0 },
  examples: { gap: 8 },
  collapsibleBody: { gap: 12, paddingTop: 12 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
