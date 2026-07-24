import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react-native';
import type { SyncDirection, SyncStatus } from '@/sync/sync-service';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';

interface CloudSyncStatusProps {
  status: SyncStatus;
  direction: SyncDirection;
  pending: boolean;
  lastSyncedAt: number;
  errorMessage: string | null;
  onSync: () => void;
  compact?: boolean;
}

function formatLastSync(timestamp: number): string {
  if (!timestamp) return 'Aún no sincronizado';
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function statusLabel(status: SyncStatus, pending: boolean, direction: SyncDirection): string {
  if (status === 'offline') return 'Sin conexión';
  if (status === 'syncing') return 'Sincronizando…';
  if (status === 'error') return 'Error al sincronizar';
  if (pending) return 'Cambios pendientes';
  if (direction === 'pull') return 'Descargado de la nube';
  if (direction === 'push') return 'Guardado en la nube';
  return 'Sincronizado';
}

export function CloudSyncStatus({
  status,
  direction,
  pending,
  lastSyncedAt,
  errorMessage,
  onSync,
  compact = false,
}: CloudSyncStatusProps) {
  const { colors } = useTheme();
  const offline = status === 'offline';
  const syncing = status === 'syncing';
  const errored = status === 'error';
  const Icon = syncing ? RefreshCw : offline ? CloudOff : errored ? AlertCircle : Cloud;

  if (compact) {
    return (
      <Pressable
        onPress={onSync}
        disabled={syncing}
        style={[
          styles.compactBtn,
          {
            borderColor: offline ? colors.warning : errored ? colors.danger : pending ? colors.brand : colors.border,
            backgroundColor: offline
              ? colors.accentSurface
              : errored
                ? colors.accentSurface
                : pending
                  ? colors.brandMuted
                  : colors.surfaceMuted,
          },
        ]}
        accessibilityLabel={statusLabel(status, pending, direction)}
      >
        {syncing ? (
          <ActivityIndicator size="small" color={colors.brand} />
        ) : (
          <Icon size={16} color={offline ? colors.warning : errored ? colors.danger : colors.brand} />
        )}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
      <View style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: offline ? colors.accentSurface : colors.brandMuted },
          ]}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <Icon size={20} color={offline ? colors.warning : colors.brand} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {statusLabel(status, pending, direction)}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {offline
              ? 'Puedes seguir trabajando. Los cambios se subirán al reconectar.'
              : `Última sincronización: ${formatLastSync(lastSyncedAt)}`}
          </Text>
          {errorMessage ? (
            <Text style={[styles.error, { color: colors.danger }]}>{errorMessage}</Text>
          ) : null}
        </View>
        <Button variant="outline" onPress={onSync} disabled={syncing}>
          <RefreshCw size={14} color={colors.brand} />
          {' Sync'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  error: { fontSize: 12, marginTop: 4 },
});
