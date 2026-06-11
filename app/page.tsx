'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { ProductCalculation } from '@/lib/domain/types';
import { useInventory } from '@/hooks/use-inventory';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useGlobalCosts } from '@/hooks/use-global-costs';
import { useGlobalFund } from '@/hooks/use-global-fund';
import { useTaxSettings } from '@/hooks/use-tax-settings';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav, type AppTab } from '@/components/ui/BottomNav';
import { CostCalculator } from '@/components/calculator/CostCalculator';
import { InventoryList } from '@/components/inventory/InventoryList';
import { RawMaterialsManager } from '@/components/raw-materials/RawMaterialsManager';
import { IndirectCostsSettings } from '@/components/settings/IndirectCostsSettings';
import { GlobalFundSettingsPanel } from '@/components/settings/GlobalFundSettings';
import { TaxSettingsPanel } from '@/components/settings/TaxSettingsPanel';

const tabTitles: Record<AppTab, string> = {
  calculator: 'Calcular precio',
  'raw-materials': 'Materias primas',
  inventory: 'Historial',
  settings: 'Ajustes',
};

export default function Home() {
  const { inventory, hydrated: inventoryHydrated, saveProduct, deleteProduct, recalculateAll } =
    useInventory();
  const {
    materials,
    hydrated: materialsHydrated,
    saveMaterial,
    deleteMaterial,
    updateStock,
  } = useRawMaterials();
  const { globalCosts, saveCosts } = useGlobalCosts();
  const { globalFund, hydrated: globalFundHydrated, updateGlobalFund } = useGlobalFund();
  const { taxSettings, updateTaxSettings } = useTaxSettings();
  const [activeTab, setActiveTab] = useState<AppTab>('calculator');
  const [editingProduct, setEditingProduct] = useState<ProductCalculation | null>(null);

  const hydrated = inventoryHydrated && materialsHydrated && globalFundHydrated;

  useEffect(() => {
    if (!hydrated || inventory.length === 0) return;
    recalculateAll(materials, globalFund);
  }, [
    globalFund.enabled,
    globalFund.amount,
    globalFund.distributionCriteria,
    globalFund.distributionUnits,
    hydrated,
  ]);

  const handleSaveProduct = (product: ProductCalculation) => {
    saveProduct(product, materials, globalFund);
    setEditingProduct(null);
    setActiveTab('inventory');
  };

  const handleEditProduct = (product: ProductCalculation) => {
    setEditingProduct(product);
    setActiveTab('calculator');
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-5xl mx-auto px-4 pt-4 pb-28 md:pb-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab !== 'calculator' && (
            <h2 className="text-xl font-bold text-foreground mb-4">{tabTitles[activeTab]}</h2>
          )}

          {activeTab === 'calculator' && (
            <CostCalculator
              inventory={inventory}
              rawMaterials={materials}
              globalIndirectCosts={globalCosts}
              globalFund={globalFund}
              taxSettings={taxSettings}
              editingProduct={editingProduct}
              onSave={handleSaveProduct}
              onCancelEdit={() => setEditingProduct(null)}
            />
          )}

          {activeTab === 'raw-materials' && (
            <RawMaterialsManager
              materials={materials}
              onSave={saveMaterial}
              onDelete={deleteMaterial}
              onStockChange={updateStock}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryList
              items={inventory}
              taxSettings={taxSettings}
              onDelete={(id) => deleteProduct(id, materials, globalFund)}
              onEdit={handleEditProduct}
              onRecalculateAll={() => recalculateAll(materials, globalFund)}
            />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-2xl">
              <IndirectCostsSettings costs={globalCosts} onSave={saveCosts} />
              <GlobalFundSettingsPanel settings={globalFund} onChange={updateGlobalFund} />
              <TaxSettingsPanel settings={taxSettings} onChange={updateTaxSettings} />
            </div>
          )}
        </motion.div>
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        inventoryCount={inventory.length}
        rawMaterialsCount={materials.length}
      />
    </div>
  );
}
