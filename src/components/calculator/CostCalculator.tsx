import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import type {
  GlobalFundSettings,
  IndirectCost,
  MarginType,
  ProductCalculation,
  ProductType,
  RawMaterial,
  RecipeItem,
  TaxSettings,
} from '@/domain/types';
import { calculateProduct, migrateProductInput } from '@/domain/calculations';
import {
  MARGIN_TYPE_LABELS,
  PRODUCT_PURCHASE_UNIT_SUGGESTIONS,
  PRODUCT_TYPE_LABELS,
} from '@/domain/constants';
import { IndirectCostsEditor } from '@/components/calculator/IndirectCostsEditor';
import { PricingResults } from '@/components/calculator/PricingResults';
import { RecipeEditor } from '@/components/calculator/RecipeEditor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/NumericInput';
import { Select } from '@/components/ui/Select';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { createId } from '@/utils/uuid';

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

type FormErrors = Partial<
  Record<'name' | 'purchasePrice' | 'packageQuantity' | 'purchaseUnit' | 'recipe' | 'productionUnits', string>
>;

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
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showIndirect, setShowIndirect] = useState(false);

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
    setErrors({});
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
      if (form.purchasePrice <= 0) next.purchasePrice = 'Ingresa un precio de compra válido';
      if (form.packageQuantity <= 0) next.packageQuantity = 'Indica cuántas unidades incluye la compra';
      if (!form.purchaseUnit.trim()) next.purchaseUnit = 'Indica la unidad';
    }
    if (form.productionUnits <= 0) {
      next.productionUnits = 'Ingresa las unidades de producción/venta del período';
    }
    return next;
  };

  const handleSave = () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
    setErrors({});
    showToast(editingProduct ? 'Producto actualizado' : 'Producto guardado', 'success');
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PricingResults result={result} taxSettings={taxSettings} />

      <Card>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {editingProduct ? `Editando: ${editingProduct.name}` : 'Nuevo producto'}
        </Text>

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
            <NumericInput
              label="Precio de compra (CUP)"
              value={form.purchasePrice}
              error={errors.purchasePrice}
              onChange={(purchasePrice) => {
                setForm((p) => ({ ...p, purchasePrice }));
                if (errors.purchasePrice) setErrors((p) => ({ ...p, purchasePrice: undefined }));
              }}
              hint="Lo que pagaste por el lote"
            />
            <NumericInput
              label="Cantidad en la compra"
              value={form.packageQuantity}
              error={errors.packageQuantity}
              onChange={(packageQuantity) => {
                setForm((p) => ({ ...p, packageQuantity }));
                if (errors.packageQuantity) setErrors((p) => ({ ...p, packageQuantity: undefined }));
              }}
            />
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
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Sugerencias: {PRODUCT_PURCHASE_UNIT_SUGGESTIONS.slice(0, 6).join(', ')}…
            </Text>
          </View>
        )}

        <NumericInput
          label="Unidades a vender al mes"
          value={form.productionUnits}
          error={errors.productionUnits}
          onChange={(productionUnits) => {
            setForm((p) => ({ ...p, productionUnits }));
            if (errors.productionUnits) setErrors((p) => ({ ...p, productionUnits: undefined }));
          }}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Margen de utilidad</Text>
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

        <Pressable onPress={() => setShowIndirect((v) => !v)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Gastos indirectos {showIndirect ? '▾' : '▸'}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {form.indirectCosts.length > 0
              ? `${form.indirectCosts.length} gasto(s) configurado(s)`
              : 'Opcional — alquiler, servicios, etc.'}
          </Text>
        </Pressable>

        {showIndirect ? (
          <IndirectCostsEditor
            costs={form.indirectCosts}
            onChange={(indirectCosts) => setForm((p) => ({ ...p, indirectCosts }))}
            onImportGlobal={importGlobalCosts}
            showImport={globalIndirectCosts.length > 0}
          />
        ) : null}

        {editingProduct && onCancelEdit ? (
          <Button variant="outline" onPress={onCancelEdit}>
            Cancelar edición
          </Button>
        ) : null}
        <Button
          variant="secondary"
          onPress={handleSave}
          disabled={!form.name || !hasValidDirectCost}
        >
          {editingProduct ? 'Actualizar producto' : 'Guardar en historial'}
        </Button>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  typeBtn: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 48, justifyContent: 'center' },
  section: { gap: 10, marginTop: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
