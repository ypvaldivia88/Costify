'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { ProductCalculation } from '@/lib/domain/types';
import { NAV_BY_ID } from '@/lib/navigation/tabs';
import type { AppTab } from '@/lib/navigation/tabs';
import { useAuth } from '@/components/auth/AuthProvider';
import { UnitCatalogProvider } from '@/hooks/use-unit-catalog';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/ui/BottomNav';
import { ProductsView } from '@/components/products/ProductsView';
import { RawMaterialsManager } from '@/components/raw-materials/RawMaterialsManager';
import { SettingsView } from '@/components/settings/SettingsView';
import { WarehousesView } from '@/components/warehouses/WarehousesView';
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
  const { loading: authLoading } = useAuth();
  const data = useAppData();
  const [activeTab, setActiveTab] = useState<AppTab>('products');

  if (authLoading || !data.hydrated) {
    return <LoadingScreen />;
  }

  const defaultWarehouse = data.getDefaultWarehouse();
  const currentNav = NAV_BY_ID[activeTab];

  return (
    <UnitCatalogProvider settings={data.unitSettings}>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          cloudSync={data.cloudSync}
          user={data.user}
        />

        <main className="max-w-5xl mx-auto px-4 pt-4 pb-28 md:pb-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <PageHeader title={currentNav.title} description={currentNav.description} />

            {activeTab === 'products' && (
              <ProductsView
                inventory={data.inventory}
                materials={data.materials}
                globalIndirectCosts={data.globalCosts}
                globalFund={data.globalFund}
                taxSettings={data.taxSettings}
                unitSettings={data.unitSettings}
                warehouses={data.warehouses}
                stockLevels={data.stockLevels}
                stockValuation={data.stockValuation}
                defaultWarehouseId={defaultWarehouse?.id}
                onSaveProduct={(product) =>
                  data.saveProduct(product, data.materials, data.globalFund, data.unitSettings)
                }
                onDeleteProduct={(id) =>
                  data.deleteProduct(id, data.materials, data.globalFund, data.unitSettings)
                }
                onRecalculateAll={() =>
                  data.recalculateAll(data.materials, data.globalFund, data.unitSettings)
                }
                onRegisterProductMovement={(product, input) =>
                  data.registerProductMovement(product, input)
                }
                onRegisterProductInitialStock={(product, quantity, warehouseId) =>
                  data.registerProductInitialStock(product, quantity, warehouseId)
                }
                onRegisterProduction={(product, quantity, warehouseId, note) =>
                  data.registerProduction(product, quantity, warehouseId, note)
                }
              />
            )}

            {activeTab === 'raw-materials' && (
              <RawMaterialsManager
                materials={data.materials}
                warehouses={data.warehouses}
                stockLevels={data.stockLevels}
                defaultWarehouse={defaultWarehouse}
                onSave={data.saveMaterial}
                onDelete={data.deleteMaterial}
                onStockChange={data.updateStock}
              />
            )}

            {activeTab === 'warehouses' && (
              <WarehousesView
                warehouses={data.warehouses}
                stockMovements={data.stockMovements}
                stockThresholds={data.stockThresholds}
                stockLevels={data.stockLevels}
                stockAlerts={data.stockAlerts}
                stockValuation={data.stockValuation}
                materials={data.materials}
                products={data.inventory}
                onSaveWarehouse={data.saveWarehouse}
                onDeleteWarehouse={data.deleteWarehouse}
                onRegisterMovement={data.registerMovement}
                onSaveThreshold={data.saveStockThreshold}
                onDeleteThreshold={data.deleteStockThreshold}
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
                warehouses={data.warehouses}
                stockMovements={data.stockMovements}
                stockThresholds={data.stockThresholds}
                tenantName={data.user?.tenantName}
                user={data.user}
                cloudSync={data.cloudSync}
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
          productsCount={data.inventory.length}
          rawMaterialsCount={data.materials.length}
          alertCount={data.stockAlerts.length}
        />
      </div>
    </UnitCatalogProvider>
  );
}
