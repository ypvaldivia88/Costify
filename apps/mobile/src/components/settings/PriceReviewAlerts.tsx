import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, ChevronRight, Info, X } from 'lucide-react-native';
import type { PriceReviewAlertTarget } from '@costify/shared/domain/exchange-rates';
import type { ProductCalculation, RawMaterial } from '@costify/shared/domain/types';
import { useActivePriceReviewAlerts } from '@/hooks/use-exchange-rates-context';
import { useTheme } from '@/context/ThemeContext';

interface PriceReviewAlertsProps {
  materials: RawMaterial[];
  products: ProductCalculation[];
  onNavigateToTarget?: (target: PriceReviewAlertTarget) => void;
  style?: object;
}

export function PriceReviewAlerts({
  materials,
  products,
  onNavigateToTarget,
  style,
}: PriceReviewAlertsProps) {
  const { colors, scheme } = useTheme();
  const { alerts, dismissAlert } = useActivePriceReviewAlerts(materials, products);

  if (alerts.length === 0) return null;

  return (
    <View style={[styles.stack, style]}>
      {alerts.map((alert) => {
        const Icon = alert.severity === 'warning' ? AlertTriangle : Info;
        const isWarning = alert.severity === 'warning';
        const canNavigate = Boolean(alert.target && onNavigateToTarget);

        const backgroundColor = isWarning
          ? scheme === 'dark'
            ? '#451a03'
            : '#fffbeb'
          : scheme === 'dark'
            ? '#172554'
            : '#eff6ff';

        const borderColor = isWarning
          ? scheme === 'dark'
            ? '#92400e'
            : '#fcd34d'
          : scheme === 'dark'
            ? '#1e40af'
            : '#93c5fd';

        const textColor = isWarning
          ? scheme === 'dark'
            ? '#fef3c7'
            : '#78350f'
          : scheme === 'dark'
            ? '#dbeafe'
            : '#1e3a8a';

        const iconColor = isWarning ? colors.warning : colors.brand;

        return (
          <View key={alert.id} style={[styles.alert, { backgroundColor, borderColor }]}>
            {canNavigate ? (
              <Pressable
                onPress={() => alert.target && onNavigateToTarget?.(alert.target)}
                style={styles.mainAction}
              >
                <Icon size={20} color={iconColor} />
                <View style={styles.messageWrap}>
                  <Text style={[styles.message, { color: textColor }]}>{alert.message}</Text>
                  {alert.actionLabel ? (
                    <Text style={[styles.actionLabel, { color: textColor }]}>{alert.actionLabel}</Text>
                  ) : null}
                </View>
                <ChevronRight size={16} color={textColor} />
              </Pressable>
            ) : (
              <View style={styles.mainAction}>
                <Icon size={20} color={iconColor} />
                <View style={styles.messageWrap}>
                  <Text style={[styles.message, { color: textColor }]}>{alert.message}</Text>
                </View>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar alerta"
              hitSlop={8}
              onPress={(event) => {
                event?.stopPropagation?.();
                dismissAlert(alert.id);
              }}
              style={styles.dismissBtn}
            >
              <X size={16} color={textColor} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  mainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  messageWrap: { flex: 1, gap: 4 },
  message: { fontSize: 13, lineHeight: 18 },
  actionLabel: { fontSize: 12, fontWeight: '700', opacity: 0.85 },
  dismissBtn: { padding: 2, marginTop: 1 },
});
