import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getNavGroupsForAccess,
  type AppTab,
} from '@costify/client-data';
import { NAV_BY_ID } from '@/navigation/tabs';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface AppMenuScreenProps {
  activeTab: AppTab | 'menu';
  onNavigate: (tab: AppTab) => void;
}

export function AppMenuScreen({ activeTab, onNavigate }: AppMenuScreenProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const groups = getNavGroupsForAccess(user?.accessLevel);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {groups.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.muted }]}>{group.label}</Text>
          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            {group.items.map((tabId, index) => {
              const meta = NAV_BY_ID[tabId];
              const Icon = meta.icon;
              const active = activeTab === tabId;
              const isLast = index === group.items.length - 1;
              return (
                <Pressable
                  key={tabId}
                  onPress={() => onNavigate(tabId)}
                  style={[
                    styles.row,
                    !isLast ? { borderBottomColor: colors.border, borderBottomWidth: 1 } : null,
                    active ? { backgroundColor: colors.brandMuted } : null,
                  ]}
                >
                  <Icon size={18} color={active ? colors.brandForeground : colors.muted} />
                  <View style={styles.rowText}>
                    <Text
                      style={{
                        color: active ? colors.brandForeground : colors.foreground,
                        fontWeight: '700',
                        fontSize: 15,
                      }}
                    >
                      {meta.label}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                      {meta.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20, paddingBottom: 32 },
  group: { gap: 8 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowText: { flex: 1 },
});
