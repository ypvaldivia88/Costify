import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Database, Percent, PiggyBank, Receipt } from 'lucide-react-native';
import type {
  GlobalFundSettings,
  IndirectCost,
  ProductCalculation,
  RawMaterial,
  TaxSettings,
} from '@/domain/types';
import { DataSyncPanel } from '@/components/settings/DataSyncPanel';
import { GlobalFundSettingsPanel } from '@/components/settings/GlobalFundSettings';
import { IndirectCostsSettings } from '@/components/settings/IndirectCostsSettings';
import { TaxSettingsPanel } from '@/components/settings/TaxSettingsPanel';
import { useTheme } from '@/context/ThemeContext';

type SettingsSection = 'sync' | 'indirect' | 'fund' | 'taxes';

interface SettingsViewProps {
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  taxSettings: TaxSettings;
  onSaveCosts: (costs: IndirectCost[]) => void;
  onUpdateGlobalFund: (updates: Partial<GlobalFundSettings>) => void;
  onUpdateTaxSettings: (updates: Partial<TaxSettings>) => void;
}

const sections: { id: SettingsSection; label: string; icon: typeof Database }[] = [
  { id: 'sync', label: 'Respaldo', icon: Database },
  { id: 'indirect', label: 'Gastos', icon: Percent },
  { id: 'fund', label: 'Fondo', icon: PiggyBank },
  { id: 'taxes', label: 'Impuestos', icon: Receipt },
];

export function SettingsView({
  inventory,
  rawMaterials,
  globalCosts,
  globalFund,
  taxSettings,
  onSaveCosts,
  onUpdateGlobalFund,
  onUpdateTaxSettings,
}: SettingsViewProps) {
  const { colors } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>('sync');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nav}>
        {sections.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <Pressable
              key={id}
              onPress={() => setActiveSection(id)}
              style={[
                styles.navItem,
                {
                  borderColor: active ? colors.brand : colors.border,
                  backgroundColor: active ? colors.brandMuted : colors.surface,
                },
              ]}
            >
              <Icon size={16} color={active ? colors.brandForeground : colors.muted} />
              <Text
                style={{
                  color: active ? colors.brandForeground : colors.muted,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeSection === 'sync' ? (
        <DataSyncPanel
          inventory={inventory}
          rawMaterials={rawMaterials}
          globalCosts={globalCosts}
          globalFund={globalFund}
          taxSettings={taxSettings}
        />
      ) : null}
      {activeSection === 'indirect' ? (
        <IndirectCostsSettings costs={globalCosts} onSave={onSaveCosts} />
      ) : null}
      {activeSection === 'fund' ? (
        <GlobalFundSettingsPanel settings={globalFund} onChange={onUpdateGlobalFund} />
      ) : null}
      {activeSection === 'taxes' ? (
        <TaxSettingsPanel settings={taxSettings} onChange={onUpdateTaxSettings} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  nav: { gap: 8, paddingBottom: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
