'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { PriceReviewAlertTarget } from '@costify/shared/domain/exchange-rates';
import type { ProductCalculation } from '@costify/shared/domain/types';
import { getTabForPriceReviewTarget } from '@/hooks/use-exchange-rates-context';
import { NAV_BY_ID } from '@/lib/navigation/tabs';
import type { AppTab } from '@/lib/navigation/tabs';
import { TrialBanner } from '@/components/layout/TrialBanner';
import { getNavItemsForAccess } from '@costify/client-data';
import { UnitCatalogProvider } from '@/hooks/use-unit-catalog';
import { ExchangeRatesProvider } from '@/hooks/use-exchange-rates-context';
import { PriceReviewAlerts } from '@/components/settings/PriceReviewAlerts';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/ui/BottomNav';
import { ProductsView } from '@/components/products/ProductsView';
import { RawMaterialsManager } from '@/components/raw-materials/RawMaterialsManager';
import { SettingsView } from '@/components/settings/SettingsView';
import { WarehousesView } from '@/components/warehouses/WarehousesView';
import { useAppData } from '@/hooks/use-app-data';
import { useAuth } from '@/components/auth/AuthProvider';

function LoadingScreen() {
  return (
    <div className="min-h-dvh mesh-bg flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-glow">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm text-muted">Cargando tus datos…</p>
    </div>
  );
}

export function AppShell() {
  const { loading: authLoading } = useAuth();
  const data = useAppData();
  const [activeTab, setActiveTab] = useState<AppTab>('products');
  const [settingsSection, setSettingsSection] = useState<
    'subscription' | undefined
  >(undefined);
  const [focusTarget, setFocusTarget] = useState<PriceReviewAlertTarget | null>(null);
  const navItems = getNavItemsForAccess(data.user?.accessLevel);

  useEffect(() => {
    if (!navItems.some((item) => item.id === activeTab)) {
      setActiveTab('products');
    }
  }, [activeTab, navItems]);

  const handleNavigateToTarget = (target: PriceReviewAlertTarget) => {
    setActiveTab(getTabForPriceReviewTarget(target));
    setFocusTarget(target);
  };

  if (authLoading || !data.hydrated) {
    return <LoadingScreen />;
  }

  const defaultWarehouse = data.getDefaultWarehouse();
  const currentNav = NAV_BY_ID[activeTab];

  return (
    <ExchangeRatesProvider
      snapshot={data.exchangeSnapshot}
      settings={data.exchangeSettings}
      refreshing={data.exchangeRefreshing}
      error={data.exchangeError}
      refreshRates={data.refreshExchangeRates}
      updateSettings={data.updateExchangeSettings}
      markCostingRate={data.markCostingRate}
    >
    <UnitCatalogProvider settings={data.unitSettings}>
      <div className="min-h-dvh mesh-bg text-foreground">
        <AppHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          cloudSync={data.cloudSync}
          user={data.user}
          navItems={navItems}
        />

        <main className="max-w-5xl mx-auto px-4 pt-5 pb-32 md:pb-8">
          <TrialBanner user={data.user} className="mb-4" />
          <PriceReviewAlerts
            materials={data.materials}
            products={data.inventory}
            onNavigateToTarget={handleNavigateToTarget}
            className="mb-4"
          />

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
                focusProductId={focusTarget?.refType === 'product' ? focusTarget.refId : undefined}
                onFocusConsumed={() => setFocusTarget(null)}
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
                focusMaterialId={
                  focusTarget?.refType === 'raw_material' ? focusTarget.refId : undefined
                }
                onFocusConsumed={() => setFocusTarget(null)}
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
                exchangeRateSettings={data.exchangeSettings}
                warehouses={data.warehouses}
                stockMovements={data.stockMovements}
                stockThresholds={data.stockThresholds}
                tenantName={data.user?.tenantName}
                user={data.user}
                cloudSync={data.cloudSync}
                initialSection={settingsSection}
                onInitialSectionConsumed={() => setSettingsSection(undefined)}
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
          navItems={navItems}
        />
      </div>
    </UnitCatalogProvider>
    </ExchangeRatesProvider>
  );
}
