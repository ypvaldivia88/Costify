import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import type { RawMaterial, UnitType } from '@/domain/types';
import { calculateRawMaterialUnitCost } from '@/domain/calculations';
import { UNIT_LABELS, UNIT_SHORT_LABELS, UNIT_TYPES } from '@/domain/constants';
import { formatCurrency } from '@/format/currency';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/NumericInput';
import { Select } from '@/components/ui/Select';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();
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
    <View style={styles.wrap}>
      <Input
        label="Nombre de la materia prima"
        placeholder="Ej. Harina de trigo"
        value={form.name}
        error={errors.name}
        onChangeText={(name) => {
          setForm((p) => ({ ...p, name }));
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
      <Select
        label="Tipo de unidad"
        value={form.unitType}
        onValueChange={(unitType) => setForm((p) => ({ ...p, unitType: unitType as UnitType }))}
      >
        {UNIT_TYPES.map((unit) => (
          <Picker.Item key={unit} label={UNIT_LABELS[unit]} value={unit} />
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
      <NumericInput
        label={`Stock disponible (${unitLabel})`}
        value={form.stockQuantity}
        onChange={(stockQuantity) => setForm((p) => ({ ...p, stockQuantity }))}
      />

      {form.purchasePrice > 0 && form.packageQuantity > 0 ? (
        <View style={[styles.unitCostBox, { backgroundColor: colors.accentSurface, borderColor: colors.accentBorder }]}>
          <Text style={{ color: colors.brand, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
            Costo unitario
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
            {formatCurrency(unitCost)}
            <Text style={{ color: colors.brand, fontSize: 14 }}> / {unitLabel}</Text>
          </Text>
        </View>
      ) : null}

      {editingMaterial && onCancel ? (
        <Button variant="outline" onPress={onCancel}>
          Cancelar edición
        </Button>
      ) : null}
      <Button variant="secondary" onPress={handleSubmit} disabled={!form.name || form.purchasePrice <= 0}>
        {editingMaterial ? 'Actualizar materia prima' : 'Guardar materia prima'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  unitCostBox: { borderWidth: 1, borderRadius: 12, padding: 14 },
});
