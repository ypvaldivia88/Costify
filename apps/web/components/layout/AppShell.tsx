'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { PriceReviewAlertTarget } from '@costify/shared/domain/exchange-rates';
import { getTabForPriceReviewTarget } from '@/hooks/use-exchange-rates-context';
import { NAV_BY_ID, type AppTab } from '@/lib/navigation/tabs';
import {
  getAccountNavGroupForAccess,
  getMainNavGroupsForAccess,
  getNavItemsForAccess,
} from '@costify/client-data';
import { UnitCatalogProvider } from '@/hooks/use-unit-catalog';
import { ExchangeRatesProvider } from '@/hooks/use-exchange-rates-context';
import { HomeView, type HomeLaunchOptions } from '@/components/home/HomeView';
import { AppHeader } from '@/components/layout/AppHeader';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/ui/BottomNav';
import { ProductsView } from '@/components/products/ProductsView';
import { RawMaterialsManager } from '@/components/raw-materials/RawMaterialsManager';
import { SettingsView } from '@/components/settings/SettingsView';
import { AccountSettingsPanel } from '@/components/settings/AccountSettingsPanel';
import { SubscriptionSettingsPanel } from '@/components/settings/SubscriptionSettingsPanel';
import { ExchangeRatesPanel } from '@/components/settings/ExchangeRatesPanel';
import { LocationsSettingsPanel } from '@/components/settings/LocationsSettingsPanel';
import { ReconciliationPanel } from '@/components/settings/ReconciliationPanel';
import { DataSyncPanel } from '@/components/settings/DataSyncPanel';
import { WarehousesView } from '@/components/warehouses/WarehousesView';
import { useAppData } from '@/hooks/use-app-data';
import { useAuth } from '@/components/auth/AuthProvider';
import { BrandSpinner } from '@/components/brand/BrandSpinner';

function LoadingScreen() {
  return <BrandSpinner message="Cargando tus datos…" />;
}

export function AppShell() {
  const { user, loading: authLoading } = useAuth();
  const data = useAppData();
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<PriceReviewAlertTarget | null>(null);
  const [productsInitialMode, setProductsInitialMode] = useState<HomeLaunchOptions['productsMode']>();
  const [warehouseInitialSubview, setWarehouseInitialSubview] =
    useState<HomeLaunchOptions['warehouseSubview']>();
  const navItems = getNavItemsForAccess(user?.accessLevel);
  const mainNavGroups = getMainNavGroupsForAccess(user?.accessLevel);
  const accountNavGroup = getAccountNavGroupForAccess(user?.accessLevel);
  const isTenantAdmin = user?.role === 'tenant_admin';

  useEffect(() => {
    if (!navItems.some((item) => item.id === activeTab)) {
      setActiveTab('home');
    }
  }, [activeTab, navItems]);

  const handleNavigateToTarget = (target: PriceReviewAlertTarget) => {
    setActiveTab(getTabForPriceReviewTarget(target));
    setFocusTarget(target);
  };

  const handleHomeNavigate = (tab: AppTab, options?: HomeLaunchOptions) => {
    if (options?.productsMode) setProductsInitialMode(options.productsMode);
    if (options?.warehouseSubview) setWarehouseInitialSubview(options.warehouseSubview);
    setActiveTab(tab);
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
        <div className="min-h-dvh mesh-bg text-foreground flex flex-col">
          <AppHeader
            cloudSync={data.cloudSync}
            user={user}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
          <OfflineBanner />

          <div className="flex flex-1 min-h-0">
            <AppSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              groups={mainNavGroups}
              accountGroup={accountNavGroup}
              tenantName={user?.tenantName}
              mobileOpen={sidebarOpen}
              onMobileOpenChange={setSidebarOpen}
            />

            <main className="flex-1 min-w-0 page-container pt-6 pb-28 md:pb-10">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab !== 'home' ? (
                  <PageHeader title={currentNav.title} description={currentNav.description} />
                ) : null}

                {activeTab === 'home' && (
                  <HomeView
                    user={user}
                    inventory={data.inventory}
                    materials={data.materials}
                    warehouses={data.warehouses}
                    stockAlerts={data.stockAlerts}
                    stockValuation={data.stockValuation}
                    salesCount={data.sales.length}
                    onNavigate={handleHomeNavigate}
                    onNavigateToTarget={handleNavigateToTarget}
                  />
                )}

                {activeTab === 'products' && (
                  <ProductsView
                    inventory={data.inventory}
                    materials={data.materials}
                    globalIndirectCosts={data.globalCosts}
                    globalFund={data.globalFund}
                    laborShareSettings={data.laborShareSettings}
                    taxSettings={data.taxSettings}
                    unitSettings={data.unitSettings}
                    warehouses={data.warehouses}
                    stockLevels={data.stockLevels}
                    stockValuation={data.stockValuation}
                    defaultWarehouseId={defaultWarehouse?.id}
                    focusProductId={focusTarget?.refType === 'product' ? focusTarget.refId : undefined}
                    onFocusConsumed={() => setFocusTarget(null)}
                    initialMode={productsInitialMode}
                    onInitialModeConsumed={() => setProductsInitialMode(undefined)}
                    onSaveProduct={(product) => data.saveProduct(product)}
                    onDeleteProduct={(id) => data.deleteProduct(id)}
                    onRecalculateAll={() => data.recalculateAll()}
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
                    initialSubview={warehouseInitialSubview}
                    onInitialSubviewConsumed={() => setWarehouseInitialSubview(undefined)}
                  />
                )}

                {activeTab === 'locations' && (
                  <LocationsSettingsPanel
                    locations={data.locations}
                    onSave={data.saveLocation}
                    onDelete={data.deleteLocation}
                  />
                )}

                {activeTab === 'reconciliation' && (
                  <ReconciliationPanel
                    locations={data.locations}
                    products={data.inventory}
                    sales={data.sales}
                    stockMovements={data.stockMovements}
                    onImportSales={data.addSales}
                  />
                )}

                {activeTab === 'exchange' && <ExchangeRatesPanel />}

                {activeTab === 'backup' && (
                  <DataSyncPanel
                    inventory={data.inventory}
                    rawMaterials={data.materials}
                    globalCosts={data.globalCosts}
                    globalFund={data.globalFund}
                    laborShareSettings={data.laborShareSettings}
                    taxSettings={data.taxSettings}
                    unitSettings={data.unitSettings}
                    exchangeRateSettings={data.exchangeSettings}
                    warehouses={data.warehouses}
                    stockMovements={data.stockMovements}
                    stockThresholds={data.stockThresholds}
                    locations={data.locations}
                    sales={data.sales}
                    tenantName={user?.tenantName}
                    cloudSync={data.cloudSync}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsView
                    inventory={data.inventory}
                    rawMaterials={data.materials}
                    globalCosts={data.globalCosts}
                    globalFund={data.globalFund}
                    laborShareSettings={data.laborShareSettings}
                    taxSettings={data.taxSettings}
                    unitSettings={data.unitSettings}
                    onSaveCosts={data.saveCosts}
                    onUpdateGlobalFund={data.updateGlobalFund}
                    onUpdateLaborShareSettings={data.updateLaborShareSettings}
                    onUpdateTaxSettings={data.updateTaxSettings}
                    onSaveUnitSettings={data.saveUnitSettings}
                    onResetUnitSettings={data.resetUnitSettings}
                  />
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6 max-w-2xl">
                    {isTenantAdmin ? <SubscriptionSettingsPanel user={user} /> : null}
                    <AccountSettingsPanel user={user} />
                  </div>
                )}
              </motion.div>
            </main>
          </div>

          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onOpenMenu={() => setSidebarOpen(true)}
            productsCount={data.inventory.length}
            alertCount={data.stockAlerts.length}
            navItems={navItems}
          />
        </div>
      </UnitCatalogProvider>
    </ExchangeRatesProvider>
  );
}
