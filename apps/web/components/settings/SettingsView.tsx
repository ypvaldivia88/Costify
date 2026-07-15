'use client';

import { useEffect, useState } from 'react';
import { Database, DollarSign, MapPin, Percent, PiggyBank, Receipt, Ruler, Scale, User, CreditCard, Users } from 'lucide-react';
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
import { DataSyncPanel } from './DataSyncPanel';
import { AccountSettingsPanel } from './AccountSettingsPanel';
import { SubscriptionSettingsPanel } from './SubscriptionSettingsPanel';
import { SettingsSectionNav, SettingsSectionPicker } from './SettingsSectionNav';
import { GlobalFundSettingsPanel } from './GlobalFundSettings';
import { LaborShareSettingsPanel } from './LaborShareSettings';
import { IndirectCostsSettings } from './IndirectCostsSettings';
import { TaxSettingsPanel } from './TaxSettingsPanel';
import { UnitSettingsPanel } from './UnitSettingsPanel';
import { ExchangeRatesPanel } from './ExchangeRatesPanel';
import { LocationsSettingsPanel } from './LocationsSettingsPanel';
import { ReconciliationPanel } from './ReconciliationPanel';
import type { SyncDirection, SyncStatus } from '@/lib/sync/sync-service';
import type { SessionUser } from '@/lib/auth/types';

import type { SettingsSectionId } from '@costify/client-data';

export type SettingsSection = SettingsSectionId;

const SETTINGS_ICONS: Record<SettingsSectionId, typeof Database> = {
  taxes: Receipt,
  fund: PiggyBank,
  labor: Users,
  indirect: Percent,
  units: Ruler,
  exchange: DollarSign,
  locations: MapPin,
  reconciliation: Scale,
  sync: Database,
  account: User,
  subscription: CreditCard,
};

interface SettingsViewProps {
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
  tenantName?: string;
  user?: SessionUser | null;
  cloudSync: {
    status: SyncStatus;
    direction: SyncDirection;
    pending: boolean;
    lastSyncedAt: number;
    errorMessage: string | null;
    workspaceId: string;
    syncNow: () => void;
  };
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
  initialSection?: SettingsSection;
  onInitialSectionConsumed?: () => void;
}

export function SettingsView({
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
  tenantName,
  user,
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
  initialSection,
  onInitialSectionConsumed,
}: SettingsViewProps) {
  const isTenantAdmin = user?.role === 'tenant_admin';
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection ?? 'taxes');

  useEffect(() => {
    if (!initialSection) return;
    setActiveSection(initialSection);
    onInitialSectionConsumed?.();
  }, [initialSection, onInitialSectionConsumed]);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,15rem)_1fr] lg:gap-8 w-full max-w-4xl">
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <SettingsSectionPicker
          value={activeSection}
          onChange={setActiveSection}
          includeSubscription={isTenantAdmin}
        />
        <SettingsSectionNav
          value={activeSection}
          onChange={setActiveSection}
          includeSubscription={isTenantAdmin}
          icons={SETTINGS_ICONS}
        />
      </aside>

      <div className="min-w-0 mt-4 lg:mt-0">
      {activeSection === 'taxes' && (
        <TaxSettingsPanel settings={taxSettings} onChange={onUpdateTaxSettings} />
      )}
      {activeSection === 'fund' && (
        <GlobalFundSettingsPanel settings={globalFund} onChange={onUpdateGlobalFund} />
      )}
      {activeSection === 'labor' && (
        <LaborShareSettingsPanel settings={laborShareSettings} onChange={onUpdateLaborShareSettings} />
      )}
      {activeSection === 'indirect' && (
        <IndirectCostsSettings costs={globalCosts} onSave={onSaveCosts} />
      )}
      {activeSection === 'units' && (
        <UnitSettingsPanel
          settings={unitSettings}
          rawMaterials={rawMaterials}
          inventory={inventory}
          onSave={onSaveUnitSettings}
          onReset={onResetUnitSettings}
        />
      )}
      {activeSection === 'exchange' && <ExchangeRatesPanel />}
      {activeSection === 'locations' && (
        <LocationsSettingsPanel
          locations={locations}
          onSave={onSaveLocation}
          onDelete={onDeleteLocation}
        />
      )}
      {activeSection === 'reconciliation' && (
        <ReconciliationPanel
          locations={locations}
          products={inventory}
          sales={sales}
          stockMovements={stockMovements}
          onImportSales={onImportSales}
        />
      )}
      {activeSection === 'sync' && (
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
          tenantName={tenantName}
          cloudSync={cloudSync}
        />
      )}
      {activeSection === 'account' && <AccountSettingsPanel user={user} />}
      {activeSection === 'subscription' && isTenantAdmin && (
        <SubscriptionSettingsPanel user={user} />
      )}
      </div>
    </div>
  );
}
