import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  Package,
  PackagePlus,
  Scale,
  Warehouse,
} from 'lucide-react-native';
import type { PriceReviewAlertTarget } from '@costify/shared/domain/exchange-rates';
import type { ProductCalculation, RawMaterial, StockAlert } from '@costify/shared/domain/types';
import { formatCurrency } from '@costify/shared/format/currency';
import type { AppTab } from '@costify/client-data';
import type { SessionUser } from '@/auth/types';
import { useActivePriceReviewAlerts } from '@/hooks/use-exchange-rates-context';
import { PriceReviewAlerts } from '@/components/settings/PriceReviewAlerts';
import { TrialBanner } from '@/components/layout/TrialBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/context/ThemeContext';
import type { WarehouseSubview } from '@/components/warehouses/WarehouseSubNav';

export type HomeLaunchOptions = {
  productsMode?: 'create';
  warehouseSubview?: WarehouseSubview;
};

interface HomeViewProps {
  user: SessionUser | null | undefined;
  inventory: ProductCalculation[];
  materials: RawMaterial[];
  warehouses: { id: string; name: string }[];
  stockAlerts: StockAlert[];
  stockValuation: { rawMaterialsValue: number; productsValue: number; totalValue: number };
  salesCount: number;
  onNavigate: (tab: AppTab, options?: HomeLaunchOptions) => void;
  onNavigateToTarget?: (target: PriceReviewAlertTarget) => void;
}

function KpiCard({
  label,
  value,
  hint,
  alert,
}: {
  label: string;
  value: string;
  hint?: string;
  alert?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Card variant={alert ? 'accent' : 'muted'} style={styles.kpiCard}>
      <Text style={[styles.kpiLabel, { color: colors.muted }]}>{label}</Text>
      <Text
        style={[
          styles.kpiValue,
          { color: alert ? colors.brand : colors.foreground },
        ]}
      >
        {value}
      </Text>
      {hint ? <Text style={[styles.kpiHint, { color: colors.muted }]}>{hint}</Text> : null}
    </Card>
  );
}

function QuickAction({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: typeof PackagePlus;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
        },
      ]}
    >
      <Icon size={22} color={colors.brand} />
      <View style={styles.quickActionText}>
        <Text style={[styles.quickTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.quickSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

export function HomeView({
  user,
  inventory,
  materials,
  warehouses,
  stockAlerts,
  stockValuation,
  salesCount,
  onNavigate,
  onNavigateToTarget,
}: HomeViewProps) {
  const { colors } = useTheme();
  const { scrollPaddingBottom } = useScreenInsets();
  const { alerts: priceAlerts } = useActivePriceReviewAlerts(materials, inventory);
  const isEmpty = inventory.length === 0 && materials.length === 0;
  const alertCount = stockAlerts.length + priceAlerts.length;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollPaddingBottom }]}
      keyboardShouldPersistTaps="handled"
    >
      <TrialBanner user={user} />

      {isEmpty ? (
        <Card variant="accent" style={styles.checklist}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Configura tu negocio</Text>
          <Text style={[styles.sectionHint, { color: colors.muted }]}>
            Sigue estos pasos para empezar a calcular costos y controlar inventario.
          </Text>
          <Pressable onPress={() => onNavigate('raw-materials')} style={styles.checklistRow}>
            <Boxes size={18} color={colors.brand} />
            <Text style={[styles.checklistLink, { color: colors.brand }]}>1. Registra tu primer insumo</Text>
          </Pressable>
          <Pressable
            onPress={() => onNavigate('products', { productsMode: 'create' })}
            style={styles.checklistRow}
          >
            <Package size={18} color={colors.brand} />
            <Text style={[styles.checklistLink, { color: colors.brand }]}>
              2. Crea un producto con ficha de costo
            </Text>
          </Pressable>
          <Pressable onPress={() => onNavigate('warehouses')} style={styles.checklistRow}>
            <Warehouse size={18} color={colors.brand} />
            <Text style={[styles.checklistLink, { color: colors.brand }]}>3. Revisa stock en almacenes</Text>
          </Pressable>
        </Card>
      ) : null}

      <View style={styles.kpiGrid}>
        <KpiCard
          label="Valor inventario"
          value={formatCurrency(stockValuation.totalValue)}
          hint={`${inventory.length} productos · ${materials.length} insumos`}
        />
        <KpiCard
          label="Alertas"
          value={String(alertCount)}
          hint={alertCount > 0 ? 'Requieren atención' : 'Todo en orden'}
          alert={alertCount > 0}
        />
        <KpiCard
          label="Almacenes"
          value={String(warehouses.length)}
          hint={salesCount > 0 ? `${salesCount} ventas importadas` : 'Sin ventas importadas'}
        />
      </View>

      {alertCount > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={16} color={colors.brand} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pendientes</Text>
          </View>
          <PriceReviewAlerts
            materials={materials}
            products={inventory}
            onNavigateToTarget={onNavigateToTarget}
            style={styles.alerts}
          />
          {stockAlerts.length > 0 ? (
            <Card variant="accent">
              <Text style={[styles.stockAlertText, { color: colors.foreground }]}>
                {stockAlerts.length === 1
                  ? '1 alerta de stock bajo'
                  : `${stockAlerts.length} alertas de stock bajo`}
              </Text>
              <Button
                variant="outline"
                size="sm"
                style={{ marginTop: 12 }}
                onPress={() => onNavigate('warehouses', { warehouseSubview: 'alerts' })}
              >
                Ver en almacenes
              </Button>
            </Card>
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Acciones rápidas</Text>
        <QuickAction
          icon={PackagePlus}
          title="Nuevo producto"
          subtitle="Ficha de costo"
          onPress={() => onNavigate('products', { productsMode: 'create' })}
        />
        <QuickAction
          icon={ArrowRightLeft}
          title="Registrar movimiento"
          subtitle="Entrada o salida"
          onPress={() => onNavigate('warehouses', { warehouseSubview: 'movements' })}
        />
        <QuickAction
          icon={Scale}
          title="Conciliar ventas"
          subtitle="POS vs inventario"
          onPress={() => onNavigate('reconciliation')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20 },
  checklist: { gap: 10 },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 4,
  },
  checklistLink: { fontSize: 14, fontWeight: '600', flex: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { paddingVertical: 14, width: '48%', flexGrow: 1, minWidth: '47%' },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: { fontSize: 24, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'] },
  kpiHint: { fontSize: 12, marginTop: 4 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionHint: { fontSize: 14, lineHeight: 20 },
  alerts: { paddingHorizontal: 0, paddingBottom: 0 },
  stockAlertText: { fontSize: 14, fontWeight: '600' },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 56,
  },
  quickActionText: { flex: 1 },
  quickTitle: { fontSize: 15, fontWeight: '700' },
  quickSubtitle: { fontSize: 12, marginTop: 2 },
});
