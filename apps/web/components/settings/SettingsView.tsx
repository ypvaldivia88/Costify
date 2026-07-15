'use client';

import { useEffect, useState } from 'react';
import { Percent, PiggyBank, Receipt, Ruler, Users } from 'lucide-react';
import type {
  GlobalFundSettings,
  IndirectCost,
  LaborShareSettings,
  ProductCalculation,
  RawMaterial,
  TaxSettings,
  UnitSettings,
} from '@costify/shared/domain/types';
import { SETTINGS_SECTIONS, type SettingsSectionId } from '@costify/client-data';
import { GlobalFundSettingsPanel } from './GlobalFundSettings';
import { LaborShareSettingsPanel } from './LaborShareSettings';
import { IndirectCostsSettings } from './IndirectCostsSettings';
import { TaxSettingsPanel } from './TaxSettingsPanel';
import { UnitSettingsPanel } from './UnitSettingsPanel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const SETTINGS_ICONS: Record<SettingsSectionId, typeof Receipt> = {
  taxes: Receipt,
  fund: PiggyBank,
  labor: Users,
  indirect: Percent,
  units: Ruler,
};

export type SettingsSection = SettingsSectionId;

interface SettingsViewProps {
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  laborShareSettings: LaborShareSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
  onSaveCosts: (costs: IndirectCost[]) => void;
  onUpdateGlobalFund: (updates: Partial<GlobalFundSettings>) => void;
  onUpdateLaborShareSettings: (updates: Partial<LaborShareSettings>) => void;
  onUpdateTaxSettings: (updates: Partial<TaxSettings>) => void;
  onSaveUnitSettings: (settings: UnitSettings) => void;
  onResetUnitSettings: () => void;
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
  onSaveCosts,
  onUpdateGlobalFund,
  onUpdateLaborShareSettings,
  onUpdateTaxSettings,
  onSaveUnitSettings,
  onResetUnitSettings,
  initialSection,
  onInitialSectionConsumed,
}: SettingsViewProps) {
  const [openSection, setOpenSection] = useState<string[]>(
    initialSection ? [initialSection] : ['taxes']
  );

  useEffect(() => {
    if (!initialSection) return;
    setOpenSection([initialSection]);
    onInitialSectionConsumed?.();
  }, [initialSection, onInitialSectionConsumed]);

  return (
    <div className="w-full max-w-2xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Estos valores se aplican al calcular costos de todos los productos.
      </p>

      <Accordion
        value={openSection}
        onValueChange={setOpenSection}
        className="rounded-2xl border border-border bg-card px-4 sm:px-5"
      >
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = SETTINGS_ICONS[section.id];
          return (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="min-h-11 py-3.5 gap-3 hover:no-underline">
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span>{section.label}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                {section.id === 'taxes' ? (
                  <TaxSettingsPanel settings={taxSettings} onChange={onUpdateTaxSettings} />
                ) : null}
                {section.id === 'fund' ? (
                  <GlobalFundSettingsPanel settings={globalFund} onChange={onUpdateGlobalFund} />
                ) : null}
                {section.id === 'labor' ? (
                  <LaborShareSettingsPanel
                    settings={laborShareSettings}
                    onChange={onUpdateLaborShareSettings}
                  />
                ) : null}
                {section.id === 'indirect' ? (
                  <IndirectCostsSettings costs={globalCosts} onSave={onSaveCosts} />
                ) : null}
                {section.id === 'units' ? (
                  <UnitSettingsPanel
                    settings={unitSettings}
                    rawMaterials={rawMaterials}
                    inventory={inventory}
                    onSave={onSaveUnitSettings}
                    onReset={onResetUnitSettings}
                  />
                ) : null}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
