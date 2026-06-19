'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { ProductCalculation } from '@/lib/domain/types';
import { NAV_BY_ID } from '@/lib/navigation/tabs';
import type { AppTab } from '@/lib/navigation/tabs';
import { UnitCatalogProvider } from '@/hooks/use-unit-catalog';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/ui/BottomNav';
import { CostCalculator } from '@/components/calculator/CostCalculator';
import { InventoryList } from '@/components/inventory/InventoryList';
import { RawMaterialsManager } from '@/components/raw-materials/RawMaterialsManager';
import { SettingsView } from '@/components/settings/SettingsView';
import { useAppData } from '@/hooks/use-app-data';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="w-9 h-9 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted">Cargando tus datos…</p>
    </div>
  );
}

export function AppShell() {
  const data = useAppData();
  const [activeTab, setActiveTab] = useState<AppTab>('calculator');
  const [editingProduct, setEditingProduct] = useState<ProductCalculation | null>(null);

  if (!data.hydrated) {
    return <LoadingScreen />;
  }

  const handleSaveProduct = (product: ProductCalculation) => {
    data.saveProduct(product, data.materials, data.globalFund, data.unitSettings);
    setEditingProduct(null);
    setActiveTab('inventory');
  };

  const handleEditProduct = (product: ProductCalculation) => {
    setEditingProduct(product);
    setActiveTab('calculator');
  };

  const currentNav = NAV_BY_ID[activeTab];

  return (
    <UnitCatalogProvider settings={data.unitSettings}>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="max-w-5xl mx-auto px-4 pt-4 pb-28 md:pb-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <PageHeader title={currentNav.title} description={currentNav.description} />

            {activeTab === 'calculator' && (
              <CostCalculator
                inventory={data.inventory}
                rawMaterials={data.materials}
                globalIndirectCosts={data.globalCosts}
                globalFund={data.globalFund}
                taxSettings={data.taxSettings}
                unitSettings={data.unitSettings}
                editingProduct={editingProduct}
                onSave={handleSaveProduct}
                onCancelEdit={() => setEditingProduct(null)}
              />
            )}

            {activeTab === 'raw-materials' && (
              <RawMaterialsManager
                materials={data.materials}
                onSave={data.saveMaterial}
                onDelete={data.deleteMaterial}
                onStockChange={data.updateStock}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryList
                items={data.inventory}
                taxSettings={data.taxSettings}
                onDelete={(id) =>
                  data.deleteProduct(id, data.materials, data.globalFund, data.unitSettings)
                }
                onEdit={handleEditProduct}
                onRecalculateAll={() =>
                  data.recalculateAll(data.materials, data.globalFund, data.unitSettings)
                }
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                inventory={data.inventory}
                rawMaterials={data.materials}
                globalCosts={data.globalCosts}
                globalFund={data.globalFund}
                taxSettings={data.taxSettings}
                unitSettings={data.unitSettings}
                onSaveCosts={data.saveCosts}
                onUpdateGlobalFund={data.updateGlobalFund}
                onUpdateTaxSettings={data.updateTaxSettings}
                onSaveUnitSettings={data.saveUnitSettings}
                onResetUnitSettings={data.resetUnitSettings}
              />
            )}
          </motion.div>
        </main>

        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          inventoryCount={data.inventory.length}
          rawMaterialsCount={data.materials.length}
        />
      </div>
    </UnitCatalogProvider>
  );
}
