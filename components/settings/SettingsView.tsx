'use client';

import { useState } from 'react';
import { Database, Percent, PiggyBank, Receipt } from 'lucide-react';
import type {
  GlobalFundSettings,
  IndirectCost,
  ProductCalculation,
  RawMaterial,
  TaxSettings,
} from '@/lib/domain/types';
import { cn } from '@/lib/utils';
import { DataSyncPanel } from './DataSyncPanel';
import { GlobalFundSettingsPanel } from './GlobalFundSettings';
import { IndirectCostsSettings } from './IndirectCostsSettings';
import { TaxSettingsPanel } from './TaxSettingsPanel';

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
  const [activeSection, setActiveSection] = useState<SettingsSection>('sync');

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
                'inline-flex items-center gap-2 shrink-0 min-h-10 px-4 rounded-xl text-sm font-semibold border transition-colors',
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

      {activeSection === 'sync' && (
        <DataSyncPanel
          inventory={inventory}
          rawMaterials={rawMaterials}
          globalCosts={globalCosts}
          globalFund={globalFund}
          taxSettings={taxSettings}
        />
      )}
      {activeSection === 'indirect' && (
        <IndirectCostsSettings costs={globalCosts} onSave={onSaveCosts} />
      )}
      {activeSection === 'fund' && (
        <GlobalFundSettingsPanel settings={globalFund} onChange={onUpdateGlobalFund} />
      )}
      {activeSection === 'taxes' && (
        <TaxSettingsPanel settings={taxSettings} onChange={onUpdateTaxSettings} />
      )}
    </div>
  );
}
