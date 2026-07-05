'use client';

import { useEffect, useState } from 'react';
import { Database, DollarSign, Percent, PiggyBank, Receipt, Ruler, User, CreditCard } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { segmentClassName } from '@/lib/ui/field-styles';
import { HorizontalScroll } from '@/components/ui/HorizontalScroll';
import { DataSyncPanel } from './DataSyncPanel';
import { AccountSettingsPanel } from './AccountSettingsPanel';
import { SubscriptionSettingsPanel } from './SubscriptionSettingsPanel';
import { GlobalFundSettingsPanel } from './GlobalFundSettings';
import { IndirectCostsSettings } from './IndirectCostsSettings';
import { TaxSettingsPanel } from './TaxSettingsPanel';
import { UnitSettingsPanel } from './UnitSettingsPanel';
import { ExchangeRatesPanel } from './ExchangeRatesPanel';
import type { SyncDirection, SyncStatus } from '@/lib/sync/sync-service';
import type { SessionUser } from '@/lib/auth/types';

type SettingsSection = 'taxes' | 'fund' | 'indirect' | 'units' | 'exchange' | 'sync' | 'account' | 'subscription';

interface SettingsViewProps {
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
  onUpdateTaxSettings: (updates: Partial<TaxSettings>) => void;
  onSaveUnitSettings: (settings: UnitSettings) => void;
  onResetUnitSettings: () => void;
  initialSection?: SettingsSection;
  onInitialSectionConsumed?: () => void;
}

const baseSections: { id: SettingsSection; label: string; icon: typeof Database }[] = [
  { id: 'taxes', label: 'Impuestos', icon: Receipt },
  { id: 'fund', label: 'Fondo', icon: PiggyBank },
  { id: 'indirect', label: 'Gastos', icon: Percent },
  { id: 'units', label: 'Unidades', icon: Ruler },
  { id: 'exchange', label: 'Tasas', icon: DollarSign },
  { id: 'sync', label: 'Respaldo', icon: Database },
  { id: 'account', label: 'Cuenta', icon: User },
];

export function SettingsView({
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
  tenantName,
  user,
  cloudSync,
  onSaveCosts,
  onUpdateGlobalFund,
  onUpdateTaxSettings,
  onSaveUnitSettings,
  onResetUnitSettings,
  initialSection,
  onInitialSectionConsumed,
}: SettingsViewProps) {
  const isTenantAdmin = user?.role === 'tenant_admin';
  const sections = isTenantAdmin
    ? [
        ...baseSections.slice(0, -1),
        { id: 'subscription' as const, label: 'Suscripción', icon: CreditCard },
        baseSections[baseSections.length - 1],
      ]
    : baseSections;
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection ?? 'taxes');

  useEffect(() => {
    if (!initialSection) return;
    setActiveSection(initialSection);
    onInitialSectionConsumed?.();
  }, [initialSection, onInitialSectionConsumed]);

  return (
    <div className="space-y-4 max-w-2xl">
      <HorizontalScroll
        as="nav"
        className="flex gap-2 pb-1 -mx-1 px-1"
        aria-label="Secciones de ajustes"
      >
        {sections.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={cn(
                segmentClassName,
                active
                  ? 'border-brand bg-brand-muted text-brand-foreground'
                  : 'border-border text-muted hover:text-foreground hover:bg-surface-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </HorizontalScroll>

      {activeSection === 'taxes' && (
        <TaxSettingsPanel settings={taxSettings} onChange={onUpdateTaxSettings} />
      )}
      {activeSection === 'fund' && (
        <GlobalFundSettingsPanel settings={globalFund} onChange={onUpdateGlobalFund} />
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
      {activeSection === 'sync' && (
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
          tenantName={tenantName}
          cloudSync={cloudSync}
        />
      )}
      {activeSection === 'account' && <AccountSettingsPanel user={user} />}
      {activeSection === 'subscription' && isTenantAdmin && (
        <SubscriptionSettingsPanel user={user} />
      )}
    </div>
  );
}
