'use client';

import { useEffect, useState } from 'react';
import { Database, DollarSign, Percent, PiggyBank, Receipt, Ruler, User, CreditCard, Users } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { DataSyncPanel } from './DataSyncPanel';
import { AccountSettingsPanel } from './AccountSettingsPanel';
import { SubscriptionSettingsPanel } from './SubscriptionSettingsPanel';
import { GlobalFundSettingsPanel } from './GlobalFundSettings';
import { LaborShareSettingsPanel } from './LaborShareSettings';
import { IndirectCostsSettings } from './IndirectCostsSettings';
import { TaxSettingsPanel } from './TaxSettingsPanel';
import { UnitSettingsPanel } from './UnitSettingsPanel';
import { ExchangeRatesPanel } from './ExchangeRatesPanel';
import type { SyncDirection, SyncStatus } from '@/lib/sync/sync-service';
import type { SessionUser } from '@/lib/auth/types';

type SettingsSection = 'taxes' | 'fund' | 'labor' | 'indirect' | 'units' | 'exchange' | 'sync' | 'account' | 'subscription';

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
  initialSection?: SettingsSection;
  onInitialSectionConsumed?: () => void;
}

const baseSections: { id: SettingsSection; label: string; icon: typeof Database }[] = [
  { id: 'taxes', label: 'Impuestos', icon: Receipt },
  { id: 'fund', label: 'Fondo', icon: PiggyBank },
  { id: 'labor', label: 'Salarios', icon: Users },
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
  laborShareSettings,
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
  onUpdateLaborShareSettings,
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
    <div className="lg:grid lg:grid-cols-[minmax(0,14rem)_1fr] lg:gap-8 space-y-5 lg:space-y-0 max-w-3xl">
      <nav className="flex flex-col gap-1.5" aria-label="Secciones de ajustes">
        {sections.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={cn(
                'w-full min-h-11 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-muted text-brand-foreground border border-brand/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
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
