import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ProductCalculation, TaxSettings } from '@/domain/types';
import { calculateMonthlyTaxProjection, hasActiveTaxes } from '@/domain/calculations/taxes';
import { DISTRIBUTION_CRITERIA_SHORT, PRODUCT_TYPE_LABELS, UNIT_SHORT_LABELS } from '@/domain/constants';
import { formatCurrency, formatPercent } from '@/format/currency';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/context/ThemeContext';

interface InventoryItemProps {
  item: ProductCalculation;
  expanded: boolean;
  taxSettings: TaxSettings;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function InventoryItem({
  item,
  expanded,
  taxSettings,
  onToggle,
  onEdit,
  onDelete,
}: InventoryItemProps) {
  const { colors } = useTheme();
  const monthlyRevenue = item.suggestedPrice * item.productionUnits;
  const monthlyGross = item.profitPerUnit * item.productionUnits;
  const taxes = calculateMonthlyTaxProjection(monthlyRevenue, monthlyGross, taxSettings);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.meta}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.badges}>
            <Text style={[styles.badge, { color: colors.muted, backgroundColor: colors.surfaceMuted }]}>
              {PRODUCT_TYPE_LABELS[item.productType ?? 'simple']}
            </Text>
            <Text style={[styles.badge, { color: colors.muted, backgroundColor: colors.surfaceMuted }]}>
              {new Date(item.timestamp).toLocaleDateString('es-CU')}
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Costo: <Text style={{ color: colors.foreground, fontWeight: '700' }}>{formatCurrency(item.totalUnitCost)}</Text>
            {'  '}Margen: <Text style={{ color: colors.brand, fontWeight: '700' }}>{formatPercent(item.grossMarginPercent)}</Text>
          </Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '700' }}>PRECIO</Text>
          <Text style={{ color: colors.brand, fontSize: 22, fontWeight: '900' }}>
            {formatCurrency(item.suggestedPrice)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onToggle}
          style={[styles.actionBtn, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={{ color: colors.foreground, fontWeight: '700' }}>
            {expanded ? 'Ocultar detalles' : 'Ver detalles'}
          </Text>
        </Pressable>
        <Pressable onPress={onEdit} style={[styles.iconBtn, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={{ color: colors.brand, fontWeight: '700' }}>Editar</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.iconBtn, { backgroundColor: colors.dangerMuted }]}>
          <Text style={{ color: colors.danger, fontWeight: '700' }}>Borrar</Text>
        </Pressable>
      </View>

      {expanded ? (
        <View style={[styles.details, { borderTopColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
          {item.recipeBreakdown?.map((rm) => (
            <View key={rm.rawMaterialId} style={styles.row}>
              <Text style={{ color: colors.muted, flex: 1 }} numberOfLines={2}>
                {rm.name} ({rm.quantity} {UNIT_SHORT_LABELS[rm.unitType]})
              </Text>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{formatCurrency(rm.lineCost)}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={{ color: colors.muted }}>Costo directo unitario</Text>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{formatCurrency(item.unitCost)}</Text>
          </View>
          {item.indirectBreakdown.map((ic, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={{ color: colors.muted, flex: 1 }}>
                {ic.name} ({DISTRIBUTION_CRITERIA_SHORT[ic.criteria]})
              </Text>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{formatCurrency(ic.perUnit)}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={{ color: colors.foreground, fontWeight: '800' }}>Costo total unitario</Text>
            <Text style={{ color: colors.foreground, fontWeight: '800' }}>{formatCurrency(item.totalUnitCost)}</Text>
          </View>

          {item.productionUnits > 0 ? (
            <View style={styles.projection}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                Proyección mensual ({item.productionUnits} uds.)
              </Text>
              <View style={styles.row}>
                <Text style={{ color: colors.muted }}>Ingresos</Text>
                <Text style={{ color: colors.brand, fontWeight: '700' }}>{formatCurrency(monthlyRevenue)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={{ color: colors.muted }}>Utilidad bruta</Text>
                <Text style={{ color: colors.brand, fontWeight: '700' }}>{formatCurrency(monthlyGross)}</Text>
              </View>
              {hasActiveTaxes(taxSettings) && taxes.totalTaxes > 0 ? (
                <View style={styles.row}>
                  <Text style={{ color: colors.muted }}>Después de impuestos estimados</Text>
                  <Text style={{ color: colors.foreground, fontWeight: '700' }}>{formatCurrency(taxes.netProfit)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', gap: 12, padding: 16 },
  meta: { flex: 1, gap: 6 },
  name: { fontSize: 16, fontWeight: '800' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  priceBox: { alignItems: 'flex-end' },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  actionBtn: { flex: 1, borderRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { borderRadius: 12, minHeight: 44, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  details: { borderTopWidth: 1, padding: 16, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  totalRow: { borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
  projection: { gap: 6, marginTop: 8 },
});
