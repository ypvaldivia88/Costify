'use client';

import { useState } from 'react';
import { Database, Percent, PiggyBank, Receipt, Ruler, User } from 'lucide-react';
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
} from '@/lib/domain/types';
import { cn } from '@/lib/utils';
import { segmentClassName } from '@/lib/ui/field-styles';
import { DataSyncPanel } from './DataSyncPanel';
import { AccountSettingsPanel } from './AccountSettingsPanel';
import { GlobalFundSettingsPanel } from './GlobalFundSettings';
import { IndirectCostsSettings } from './IndirectCostsSettings';
import { TaxSettingsPanel } from './TaxSettingsPanel';
import { UnitSettingsPanel } from './UnitSettingsPanel';
import type { SyncDirection, SyncStatus } from '@/lib/sync/sync-service';
import type { SessionUser } from '@/lib/auth/types';

type SettingsSection = 'taxes' | 'fund' | 'indirect' | 'units' | 'sync' | 'account';

interface SettingsViewProps {
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
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
}

const sections: { id: SettingsSection; label: string; icon: typeof Database }[] = [
  { id: 'taxes', label: 'Impuestos', icon: Receipt },
  { id: 'fund', label: 'Fondo', icon: PiggyBank },
  { id: 'indirect', label: 'Gastos', icon: Percent },
  { id: 'units', label: 'Unidades', icon: Ruler },
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
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('taxes');

  return (
    <div className="space-y-4 max-w-2xl">
      <nav
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
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
      </nav>

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
      {activeSection === 'sync' && (
        <DataSyncPanel
          inventory={inventory}
          rawMaterials={rawMaterials}
          globalCosts={globalCosts}
          globalFund={globalFund}
          taxSettings={taxSettings}
          unitSettings={unitSettings}
          warehouses={warehouses}
          stockMovements={stockMovements}
          stockThresholds={stockThresholds}
          tenantName={tenantName}
          cloudSync={cloudSync}
        />
      )}
      {activeSection === 'account' && <AccountSettingsPanel user={user} />}
    </div>
  );
}
