import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ProductCalculation, TaxSettings } from '@/domain/types';
import {
  getIndirectCoverage,
  getTotalMonthlyIndirectCosts,
} from '@/domain/calculations';
import { calculateMonthlyTaxProjection, hasActiveTaxes } from '@/domain/calculations/taxes';
import {
  DISTRIBUTION_CRITERIA_SHORT,
  MARGIN_TYPE_LABELS,
  UNIT_SHORT_LABELS,
} from '@/domain/constants';
import { formatCurrency, formatPercent } from '@/format/currency';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { useTheme } from '@/context/ThemeContext';

interface PricingResultsProps {
  result: ProductCalculation;
  taxSettings: TaxSettings;
}

export function PricingResults({ result, taxSettings }: PricingResultsProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const totalMonthlyIndirect = getTotalMonthlyIndirectCosts(result.indirectCosts);
  const coverage = getIndirectCoverage(
    result.totalIndirectPerUnit,
    result.productionUnits,
    totalMonthlyIndirect
  );

  const monthlyRevenue = result.suggestedPrice * result.productionUnits;
  const monthlyGrossProfit = result.profitPerUnit * result.productionUnits;
  const taxes = calculateMonthlyTaxProjection(monthlyRevenue, monthlyGrossProfit, taxSettings);

  const hasDetails =
    (result.recipeBreakdown && result.recipeBreakdown.length > 0) ||
    result.indirectBreakdown.length > 0 ||
    totalMonthlyIndirect > 0 ||
    result.productionUnits > 0;

  return (
    <View style={styles.wrap}>
      <Card variant="accent" style={styles.priceCard}>
        <Text style={[styles.priceLabel, { color: colors.brandForeground }]}>Precio sugerido</Text>
        <Text style={[styles.priceValue, { color: colors.foreground }]}>
          {formatCurrency(result.suggestedPrice)}
        </Text>
        <View style={styles.priceMeta}>
          <Text style={{ color: colors.muted }}>
            Costo: <Text style={{ color: colors.foreground, fontWeight: '700' }}>{formatCurrency(result.totalUnitCost)}</Text>
          </Text>
          <Text style={{ color: colors.muted }}>
            Utilidad: <Text style={{ color: colors.brand, fontWeight: '700' }}>{formatCurrency(result.profitPerUnit)}</Text>
          </Text>
          <Text style={{ color: colors.muted }}>
            Margen: <Text style={{ color: colors.brand, fontWeight: '700' }}>{formatPercent(result.grossMarginPercent)}</Text>
          </Text>
        </View>
      </Card>

      {hasDetails ? (
        <Card style={styles.detailsCard}>
          <Pressable onPress={() => setExpanded((v) => !v)}>
            <Text style={[styles.detailsTitle, { color: colors.foreground }]}>
              {expanded ? 'Ocultar desglose completo' : 'Ver desglose completo'}
            </Text>
          </Pressable>

          {expanded ? (
            <View style={styles.detailsBody}>
              {result.recipeBreakdown?.map((item) => (
                <View key={item.rawMaterialId} style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.muted }]} numberOfLines={2}>
                    {item.name} ({item.quantity} {UNIT_SHORT_LABELS[item.unitType]})
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.foreground }]}>
                    {formatCurrency(item.lineCost)}
                  </Text>
                </View>
              ))}

              <View style={styles.statsGrid}>
                <StatCard label="Costo directo" value={formatCurrency(result.unitCost)} />
                <StatCard label="Gastos indirectos" value={formatCurrency(result.totalIndirectPerUnit)} />
              </View>

              {result.indirectBreakdown.map((item, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.muted }]}>
                    {item.name} ({DISTRIBUTION_CRITERIA_SHORT[item.criteria]})
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.foreground }]}>
                    {formatCurrency(item.perUnit)}/u
                  </Text>
                </View>
              ))}

              {totalMonthlyIndirect > 0 && result.productionUnits > 0 ? (
                <View style={styles.coverageWrap}>
                  <Text style={[styles.coverageLabel, { color: colors.muted }]}>Cobertura de gastos fijos</Text>
                  <View style={[styles.coverageBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[styles.coverageFill, { width: `${coverage.percent}%`, backgroundColor: colors.brand }]}
                    />
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{coverage.percent.toFixed(0)}%</Text>
                </View>
              ) : null}

              {result.productionUnits > 0 ? (
                <View style={styles.projection}>
                  <Text style={[styles.projectionTitle, { color: colors.muted }]}>
                    Proyección mensual ({result.productionUnits} uds.)
                  </Text>
                  <View style={styles.statsGrid}>
                    <StatCard label="Ingresos" value={formatCurrency(monthlyRevenue)} variant="accent" />
                    <StatCard label="Utilidad bruta" value={formatCurrency(monthlyGrossProfit)} variant="accent" />
                  </View>
                  {hasActiveTaxes(taxSettings) && taxes.totalTaxes > 0 ? (
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
                      Utilidad estimada después de impuestos:{' '}
                      <Text style={{ color: colors.brand, fontWeight: '700' }}>
                        {formatCurrency(taxes.netProfit)}
                      </Text>
                    </Text>
                  ) : null}
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                    {MARGIN_TYPE_LABELS[result.marginType]}: {result.profitMargin}%
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  priceCard: { alignItems: 'center', paddingVertical: 24 },
  priceLabel: { fontSize: 14, fontWeight: '600' },
  priceValue: { fontSize: 40, fontWeight: '900', marginTop: 4 },
  priceMeta: { marginTop: 12, gap: 4, alignItems: 'center' },
  detailsCard: { gap: 12 },
  detailsTitle: { fontSize: 14, fontWeight: '700' },
  detailsBody: { gap: 12, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { flex: 1, fontSize: 13 },
  rowValue: { fontSize: 13, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 8 },
  coverageWrap: { gap: 6 },
  coverageLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  coverageBar: { height: 8, borderRadius: 999, overflow: 'hidden' },
  coverageFill: { height: '100%', borderRadius: 999 },
  projection: { gap: 8 },
  projectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
