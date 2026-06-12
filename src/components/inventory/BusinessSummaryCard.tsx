import { StyleSheet, Text, View } from 'react-native';
import type { BusinessSummary, TaxSettings } from '@/domain/types';
import { hasActiveTaxes } from '@/domain/calculations/taxes';
import { formatCurrency, formatPercent } from '@/format/currency';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { useTheme } from '@/context/ThemeContext';

interface BusinessSummaryCardProps {
  summary: BusinessSummary;
  taxSettings: TaxSettings;
}

export function BusinessSummaryCard({ summary, taxSettings }: BusinessSummaryCardProps) {
  const { colors } = useTheme();
  const showTaxes = hasActiveTaxes(taxSettings) && summary.taxLineTotals.length > 0;

  return (
    <Card variant="accent">
      <Text style={[styles.heading, { color: colors.brand }]}>Resumen mensual del negocio</Text>
      <View style={styles.grid}>
        <StatCard label="Ingresos proyectados" value={formatCurrency(summary.totalRevenue)} />
        <StatCard label="Utilidad bruta" value={formatCurrency(summary.totalGrossProfit)} variant="accent" />
        <StatCard label="Gastos indirectos" value={formatCurrency(summary.totalIndirectCost)} variant="warning" />
        <StatCard label="Margen promedio" value={formatPercent(summary.averageGrossMargin)} />
      </View>

      {showTaxes ? (
        <View style={[styles.taxes, { borderTopColor: colors.accentBorder }]}>
          {summary.taxLineTotals.map((line) => (
            <View key={line.id} style={styles.taxRow}>
              <Text style={{ color: colors.brandForeground }}>{line.name}</Text>
              <Text style={{ color: colors.brandForeground }}>-{formatCurrency(line.amount)}</Text>
            </View>
          ))}
          <View style={styles.taxRow}>
            <Text style={{ color: colors.foreground, fontWeight: '800' }}>Utilidad neta estimada</Text>
            <Text style={{ color: colors.foreground, fontWeight: '800' }}>
              {formatCurrency(summary.totalNetProfit)}
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={[styles.note, { color: colors.brand }]}>
        Basado en las unidades de venta configuradas por producto.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  taxes: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 6 },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between' },
  note: { fontSize: 11, marginTop: 10, opacity: 0.8 },
});
