import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CreditCard, Database, DollarSign, Percent, PiggyBank, Receipt, Ruler, User } from 'lucide-react-native';
import type {
  GlobalFundSettings,
  IndirectCost,
  ProductCalculation,
  RawMaterial,
  StockMovement,
  StockThreshold,
  TaxSettings,
  UnitSettings,
  Warehouse,
} from '@costify/shared/domain/types';
import type { ExchangeRateSettings } from '@costify/shared/domain/exchange-rates';
import type { AppBackupV1 } from '@/backup/app-backup';
import type { SessionUser } from '@/auth/types';
import { AccountSettingsPanel } from '@/components/settings/AccountSettingsPanel';
import { SubscriptionSettingsPanel } from '@/components/settings/SubscriptionSettingsPanel';
import { DataSyncPanel } from '@/components/settings/DataSyncPanel';
import { ExchangeRatesPanel } from '@/components/settings/ExchangeRatesPanel';
import { GlobalFundSettingsPanel } from '@/components/settings/GlobalFundSettings';
import { IndirectCostsSettings } from '@/components/settings/IndirectCostsSettings';
import { TaxSettingsPanel } from '@/components/settings/TaxSettingsPanel';
import { UnitSettingsPanel } from '@/components/settings/UnitSettingsPanel';
import { useCloudSync } from '@/hooks/use-cloud-sync';
import { useTheme } from '@/context/ThemeContext';

type SettingsSection = 'account' | 'subscription' | 'taxes' | 'fund' | 'indirect' | 'units' | 'exchange' | 'sync';

interface SettingsViewProps {
  user: SessionUser | null;
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
  exchangeRateSettings: ExchangeRateSettings;
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  stockThresholds: StockThreshold[];
  cloudSync: ReturnType<typeof useCloudSync>;
  onSaveCosts: (costs: IndirectCost[]) => void;
  onUpdateGlobalFund: (updates: Partial<GlobalFundSettings>) => void;
  onUpdateTaxSettings: (updates: Partial<TaxSettings>) => void;
  onSaveUnitSettings: (settings: UnitSettings) => void;
  onResetUnitSettings: () => void;
  onBackupImported?: (backup: AppBackupV1) => void;
  initialSection?: SettingsSection;
  onInitialSectionConsumed?: () => void;
}

const baseSections: { id: SettingsSection; label: string; icon: typeof Database }[] = [
  { id: 'account', label: 'Cuenta', icon: User },
  { id: 'taxes', label: 'Impuestos', icon: Receipt },
  { id: 'fund', label: 'Fondo', icon: PiggyBank },
  { id: 'indirect', label: 'Gastos', icon: Percent },
  { id: 'units', label: 'Unidades', icon: Ruler },
  { id: 'exchange', label: 'Tasas', icon: DollarSign },
  { id: 'sync', label: 'Respaldo', icon: Database },
];

export function SettingsView({
  user,
  inventory,
  rawMaterials,
  globalCosts,
  globalFund,
  taxSettings,
  unitSettings,
  exchangeRateSettings,
  warehouses,
  stockMovements,
  stockThresholds,
  cloudSync,
  onSaveCosts,
  onUpdateGlobalFund,
  onUpdateTaxSettings,
  onSaveUnitSettings,
  onResetUnitSettings,
  onBackupImported,
  initialSection,
  onInitialSectionConsumed,
}: SettingsViewProps) {
  const { colors } = useTheme();
  const isTenantAdmin = user?.role === 'tenant_admin';
  const sections = isTenantAdmin
    ? [
        baseSections[0],
        { id: 'subscription' as const, label: 'Suscripción', icon: CreditCard },
        ...baseSections.slice(1),
      ]
    : baseSections;
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection ?? 'account');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!initialSection) return;
    setActiveSection(initialSection);
    onInitialSectionConsumed?.();
  }, [initialSection, onInitialSectionConsumed]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        keyboardHeight > 0 ? { paddingBottom: keyboardHeight + 24 } : null,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
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

      {activeSection === 'account' ? <AccountSettingsPanel user={user} /> : null}
      {activeSection === 'subscription' && isTenantAdmin ? (
        <SubscriptionSettingsPanel user={user} />
      ) : null}
      {activeSection === 'taxes' ? (
        <TaxSettingsPanel settings={taxSettings} onChange={onUpdateTaxSettings} />
      ) : null}
      {activeSection === 'fund' ? (
        <GlobalFundSettingsPanel settings={globalFund} onChange={onUpdateGlobalFund} />
      ) : null}
      {activeSection === 'indirect' ? (
        <IndirectCostsSettings costs={globalCosts} onSave={onSaveCosts} />
      ) : null}
      {activeSection === 'units' ? (
        <UnitSettingsPanel
          settings={unitSettings}
          rawMaterials={rawMaterials}
          inventory={inventory}
          onSave={onSaveUnitSettings}
          onReset={onResetUnitSettings}
        />
      ) : null}
      {activeSection === 'exchange' ? <ExchangeRatesPanel /> : null}
      {activeSection === 'sync' ? (
        <DataSyncPanel
          inventory={inventory}
          rawMaterials={rawMaterials}
          globalCosts={globalCosts}
          globalFund={globalFund}
          taxSettings={taxSettings}
          unitSettings={unitSettings}
          exchangeRateSettings={exchangeRateSettings}
          warehouses={warehouses}
          stockMovements={stockMovements}
          stockThresholds={stockThresholds}
          cloudSync={cloudSync}
          onBackupImported={onBackupImported}
        />
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
