import { useEffect, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Database, DollarSign, MapPin, Percent, PiggyBank, Receipt, Ruler, Scale, User, Users } from 'lucide-react-native';
import type { Location } from '@costify/shared/domain/location';
import type { SaleRecord } from '@costify/shared/domain/sales';
import type {
  GlobalFundSettings,
  IndirectCost,
  LaborShareSettings,
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
import { LaborShareSettingsPanel } from '@/components/settings/LaborShareSettings';
import { IndirectCostsSettings } from '@/components/settings/IndirectCostsSettings';
import { TaxSettingsPanel } from '@/components/settings/TaxSettingsPanel';
import { UnitSettingsPanel } from '@/components/settings/UnitSettingsPanel';
import { LocationsSettingsPanel } from '@/components/settings/LocationsSettingsPanel';
import { ReconciliationPanel } from '@/components/settings/ReconciliationPanel';
import { SettingsSectionPicker } from '@/components/settings/SettingsSectionPicker';
import { useCloudSync } from '@/hooks/use-cloud-sync';
import type { SettingsSectionId } from '@costify/client-data';

type SettingsSection = SettingsSectionId;

interface SettingsViewProps {
  user: SessionUser | null;
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  laborShareSettings: LaborShareSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
  exchangeRateSettings: ExchangeRateSettings;
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  stockThresholds: StockThreshold[];
  locations: Location[];
  sales: SaleRecord[];
  cloudSync: ReturnType<typeof useCloudSync>;
  onSaveCosts: (costs: IndirectCost[]) => void;
  onUpdateGlobalFund: (updates: Partial<GlobalFundSettings>) => void;
  onUpdateLaborShareSettings: (updates: Partial<LaborShareSettings>) => void;
  onUpdateTaxSettings: (updates: Partial<TaxSettings>) => void;
  onSaveUnitSettings: (settings: UnitSettings) => void;
  onResetUnitSettings: () => void;
  onSaveLocation: (
    input: { name: string; code?: string; active?: boolean; address?: string },
    id?: string,
    timestamp?: number
  ) => Location;
  onDeleteLocation: (id: string) => void;
  onImportSales: (records: SaleRecord[]) => void;
  onBackupImported?: (backup: AppBackupV1) => void;
  initialSection?: SettingsSection;
  onInitialSectionConsumed?: () => void;
}

export function SettingsView({
  user,
  inventory,
  rawMaterials,
  globalCosts,
  globalFund,
  laborShareSettings,
  taxSettings,
  unitSettings,
  exchangeRateSettings,
  warehouses,
  stockMovements,
  stockThresholds,
  locations,
  sales,
  cloudSync,
  onSaveCosts,
  onUpdateGlobalFund,
  onUpdateLaborShareSettings,
  onUpdateTaxSettings,
  onSaveUnitSettings,
  onResetUnitSettings,
  onSaveLocation,
  onDeleteLocation,
  onImportSales,
  onBackupImported,
  initialSection,
  onInitialSectionConsumed,
}: SettingsViewProps) {
  const isTenantAdmin = user?.role === 'tenant_admin';
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    initialSection ?? (isTenantAdmin ? 'account' : 'taxes')
  );
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
      <SettingsSectionPicker
        value={activeSection}
        onChange={setActiveSection}
        includeSubscription={isTenantAdmin}
      />

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
      {activeSection === 'labor' ? (
        <LaborShareSettingsPanel settings={laborShareSettings} onChange={onUpdateLaborShareSettings} />
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
      {activeSection === 'locations' ? (
        <LocationsSettingsPanel
          locations={locations}
          onSave={onSaveLocation}
          onDelete={onDeleteLocation}
        />
      ) : null}
      {activeSection === 'reconciliation' ? (
        <ReconciliationPanel
          locations={locations}
          products={inventory}
          sales={sales}
          stockMovements={stockMovements}
          onImportSales={onImportSales}
        />
      ) : null}
      {activeSection === 'sync' ? (
        <DataSyncPanel
          inventory={inventory}
          rawMaterials={rawMaterials}
          globalCosts={globalCosts}
          globalFund={globalFund}
          laborShareSettings={laborShareSettings}
          taxSettings={taxSettings}
          unitSettings={unitSettings}
          exchangeRateSettings={exchangeRateSettings}
          warehouses={warehouses}
          stockMovements={stockMovements}
          stockThresholds={stockThresholds}
          locations={locations}
          sales={sales}
          cloudSync={cloudSync}
          onBackupImported={onBackupImported}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
});
