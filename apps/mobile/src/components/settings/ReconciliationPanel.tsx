import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { AlertTriangle, FileUp, Scale } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import type { Location } from '@costify/shared/domain/location';
import { findLocationByCode } from '@costify/shared/domain/location';
import type { ProductCalculation, StockMovement } from '@costify/shared/domain/types';
import { calculateReconciliationReport } from '@costify/shared/domain/calculations/reconciliation';
import type { SaleRecord } from '@costify/shared/domain/sales';
import {
  getSaleCsvTemplate,
  groupSaleCsvRowsIntoRecords,
  parseSaleCsv,
} from '@costify/shared/domain/sales';
import { RECONCILIATION_GUIDE_ITEMS } from '@costify/shared';
import { randomId } from '@costify/shared/random-id';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

interface ReconciliationPanelProps {
  locations: Location[];
  products: ProductCalculation[];
  sales: SaleRecord[];
  stockMovements: StockMovement[];
  onImportSales: (records: SaleRecord[]) => void;
}

export function ReconciliationPanel({
  locations,
  products,
  sales,
  stockMovements,
  onImportSales,
}: ReconciliationPanelProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [locationId, setLocationId] = useState(
    locations.find((l) => l.active)?.id ?? locations[0]?.id ?? ''
  );
  const [csvText, setCsvText] = useState('');

  const report = useMemo(() => {
    if (!locationId) return null;
    const to = Date.now();
    const from = to - 30 * 24 * 60 * 60 * 1000;
    return calculateReconciliationReport({
      sales,
      stockMovements,
      products,
      locationId,
      from,
      to,
    });
  }, [sales, stockMovements, products, locationId]);

  const alerts = report?.variances.filter((item) => item.severity !== 'ok') ?? [];

  function handleImport() {
    const parsed = parseSaleCsv(csvText);
    if (parsed.errors.length > 0) {
      showToast(parsed.errors[0] ?? 'CSV inválido', 'error');
      return;
    }
    const result = groupSaleCsvRowsIntoRecords(
      parsed.rows,
      (code) => findLocationByCode(locations, code)?.id,
      (sku) => products.find((p) => p.posSku?.toUpperCase() === sku.toUpperCase())?.id,
      () => randomId()
    );
    if (result.errors.length > 0) {
      showToast(result.errors[0] ?? 'Error al importar', 'error');
      return;
    }
    if (result.records.length === 0) {
      showToast('No hay filas válidas para importar.', 'error');
      return;
    }
    onImportSales(result.records);
    setCsvText('');
    showToast(`Importadas ${result.records.length} ventas.`, 'success');
  }

  async function pickCsvFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    try {
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
      setCsvText(text);
      showToast('Archivo CSV cargado.', 'info');
    } catch {
      showToast('No se pudo leer el archivo.', 'error');
    }
  }

  return (
    <Card>
      <SectionHeader
        icon={Scale}
        title="Conciliación ventas vs inventario"
        description="Compara lo vendido (caja o CSV) con las salidas de inventario. Últimos 30 días."
      />

      {locations.length > 0 ? (
        <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Local</Text>
          <Picker
            selectedValue={locationId}
            onValueChange={setLocationId}
            style={{ color: colors.foreground }}
            dropdownIconColor={colors.muted}
          >
            {locations.map((location) => (
              <Picker.Item key={location.id} label={location.name} value={location.id} />
            ))}
          </Picker>
        </View>
      ) : (
        <Text style={[styles.hint, { color: colors.muted }]}>
          Agrega al menos un local en Ajustes → Locales.
        </Text>
      )}

      <View style={[styles.importBox, { borderColor: colors.border }]}>
        <View style={styles.importTitle}>
          <FileUp size={16} color={colors.foreground} />
          <Text style={[styles.importTitleText, { color: colors.foreground }]}>
            Importar ventas (CSV)
          </Text>
        </View>
        <Text style={[styles.template, { color: colors.muted }]}>{getSaleCsvTemplate()}</Text>
        <TextInput
          multiline
          value={csvText}
          onChangeText={setCsvText}
          placeholder="Pega aquí el CSV exportado de caja…"
          placeholderTextColor={colors.muted}
          style={[
            styles.textarea,
            {
              borderColor: colors.border,
              color: colors.foreground,
              backgroundColor: colors.surface,
            },
          ]}
        />
        <View style={styles.importActions}>
          <Button variant="outline" onPress={() => void pickCsvFile()}>
            Elegir archivo
          </Button>
          <Button variant="outline" onPress={handleImport}>
            Importar ventas
          </Button>
        </View>
      </View>

      {alerts.length === 0 ? (
        <Text style={[styles.hint, { color: colors.muted }]}>
          Sin desviaciones críticas en el período.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHead, { borderColor: colors.border }]}>
              <Text style={[styles.cellHead, styles.cellProduct, { color: colors.muted }]}>Producto</Text>
              <Text style={[styles.cellHead, styles.cellNum, { color: colors.muted }]}>Vendido</Text>
              <Text style={[styles.cellHead, styles.cellNum, { color: colors.muted }]}>Salida inv.</Text>
              <Text style={[styles.cellHead, styles.cellNum, { color: colors.muted }]}>Delta</Text>
            </View>
            {alerts.map((row) => (
              <View key={row.productId} style={[styles.tableRow, { borderColor: colors.border }]}>
                <View style={styles.cellProduct}>
                  <Text style={[styles.cellBody, { color: colors.foreground }]}>{row.productName}</Text>
                  {row.posSku ? (
                    <Text style={[styles.sku, { color: colors.muted }]}>{row.posSku}</Text>
                  ) : null}
                </View>
                <Text style={[styles.cellBody, styles.cellNum, { color: colors.foreground }]}>
                  {row.soldQty}
                </Text>
                <Text style={[styles.cellBody, styles.cellNum, { color: colors.foreground }]}>
                  {row.stockOutQty}
                </Text>
                <View style={[styles.cellNum, styles.deltaCell]}>
                  {row.severity === 'critical' ? (
                    <AlertTriangle size={14} color={colors.danger} />
                  ) : null}
                  <Text
                    style={[
                      styles.cellBody,
                      {
                        color: row.severity === 'critical' ? colors.danger : '#d97706',
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {row.delta > 0 ? '+' : ''}
                    {row.delta}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={[styles.checklist, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.checklistTitle, { color: colors.foreground }]}>
          Cómo usar la conciliación
        </Text>
        {RECONCILIATION_GUIDE_ITEMS.map((item) => (
          <View key={item.title} style={styles.guideItem}>
            <Text style={[styles.guideTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.checklistItem, { color: colors.muted }]}>{item.description}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  fieldLabel: { fontSize: 12, paddingHorizontal: 12, paddingTop: 8 },
  hint: { fontSize: 13, marginBottom: 12 },
  importBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  importTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importTitleText: { fontSize: 14, fontWeight: '600' },
  template: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlignVertical: 'top',
  },
  importActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  table: { minWidth: 360 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  tableHead: { paddingTop: 0 },
  cellHead: { fontSize: 12, fontWeight: '600' },
  cellBody: { fontSize: 13 },
  cellProduct: { width: 140, paddingRight: 8 },
  cellNum: { width: 72, textAlign: 'right' },
  sku: { fontSize: 11, marginTop: 2 },
  deltaCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  checklist: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 6,
  },
  checklistTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  guideItem: { gap: 2, marginTop: 6 },
  guideTitle: { fontSize: 13, fontWeight: '700' },
  checklistItem: { fontSize: 13, lineHeight: 18 },
});
