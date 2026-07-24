import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import type { PriceReviewAlertTarget } from '@costify/shared/domain/exchange-rates';
import { getTabForPriceReviewTarget } from '@/hooks/use-exchange-rates-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LayoutGrid, Moon, Sun } from 'lucide-react-native';
import { AdminScreen } from '@/components/admin/AdminScreen';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { RegisterScreen } from '@/components/auth/RegisterScreen';
import { AppMenuScreen } from '@/components/navigation/AppMenuScreen';
import { HomeView, type HomeLaunchOptions } from '@/components/home/HomeView';
import { ProductsView } from '@/components/products/ProductsView';
import { RawMaterialsManager } from '@/components/raw-materials/RawMaterialsManager';
import { SettingsView } from '@/components/settings/SettingsView';
import { AccountSettingsPanel } from '@/components/settings/AccountSettingsPanel';
import { SubscriptionSettingsPanel } from '@/components/settings/SubscriptionSettingsPanel';
import { ExchangeRatesPanel } from '@/components/settings/ExchangeRatesPanel';
import { LocationsSettingsPanel } from '@/components/settings/LocationsSettingsPanel';
import { ReconciliationPanel } from '@/components/settings/ReconciliationPanel';
import { DataSyncPanel } from '@/components/settings/DataSyncPanel';
import { CloudSyncStatus } from '@/components/settings/CloudSyncStatus';
import { WarehousesView } from '@/components/warehouses/WarehousesView';
import type { AppBackupV1 } from '@/backup/app-backup';
import { MobileAppDataProvider, useAppData } from '@/client-data/MobileAppDataProvider';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DialogProvider } from '@/context/DialogContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { ExchangeRatesProvider } from '@/hooks/use-exchange-rates-context';
import { UnitCatalogProvider } from '@/hooks/use-unit-catalog';
import {
  NAV_BY_ID,
  PRIMARY_BOTTOM_TAB_IDS,
  type AppTab,
} from '@/navigation/tabs';
import { CostifyMark } from '@/components/brand/CostifyLogo';
import { TabScreenScroll } from '@/components/layout/TabScreenScroll';
import { TAB_BAR_CONTENT_HEIGHT } from '@/hooks/use-screen-insets';
import { PrimaryTabBar } from '@/navigation/PrimaryTabBar';

type MobileTab = AppTab | 'menu';
type RootTabParamList = Record<MobileTab, undefined>;

const Tab = createBottomTabNavigator<RootTabParamList>();
const navigationRef = createNavigationContainerRef<RootTabParamList>();

function LoadingScreen({ message = 'Cargando…' }: { message?: string }) {
  const { colors, scheme } = useTheme();
  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <CostifyMark size={56} isDark={scheme === 'dark'} />
      <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 16 }} />
      <Text style={{ color: colors.muted, marginTop: 12 }}>{message}</Text>
    </View>
  );
}

function SettingsTab() {
  const data = useAppData();

  return (
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
  );
}

function AccountTab() {
  const { user } = useAuth();
  const isTenantAdmin = user?.role === 'tenant_admin';

  return (
    <TabScreenScroll contentContainerStyle={styles.accountContent}>
      {isTenantAdmin ? <SubscriptionSettingsPanel user={user} /> : null}
      <AccountSettingsPanel user={user} />
    </TabScreenScroll>
  );
}

function BackupTab() {
  const data = useAppData();

  const handleBackupImported = (backup: AppBackupV1) => {
    data.reloadFromBackup(backup);
  };

  return (
    <TabScreenScroll>
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
        cloudSync={data.cloudSync}
        onBackupImported={handleBackupImported}
      />
    </TabScreenScroll>
  );
}

function ExchangeRatesBridge({ children }: { children: ReactNode }) {
  const data = useAppData();

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
      {children}
    </ExchangeRatesProvider>
  );
}

function AppHeader({ title, description }: { title: string; description?: string | null }) {
  const { colors, scheme, toggleScheme } = useTheme();
  const { user } = useAuth();
  const data = useAppData();

  return (
    <SafeAreaView
      edges={['top']}
      style={{ backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }}
    >
      <View style={styles.header}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <CostifyMark size={28} isDark={scheme === 'dark'} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800' }}>{title}</Text>
            {user?.tenantName ? (
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{user.tenantName}</Text>
            ) : description ? (
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                {description}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.headerActions}>
          {data.cloudSync ? (
            <CloudSyncStatus
              compact
              status={data.cloudSync.status}
              direction={data.cloudSync.direction}
              pending={data.cloudSync.pending}
              lastSyncedAt={data.cloudSync.lastSyncedAt}
              errorMessage={data.cloudSync.errorMessage}
              onSync={() => void data.cloudSync.syncNow()}
            />
          ) : null}
          <Pressable
            onPress={toggleScheme}
            style={[styles.themeBtn, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          >
            {scheme === 'dark' ? (
              <Sun size={18} color={colors.foreground} />
            ) : (
              <Moon size={18} color={colors.foreground} />
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function MainTabs({ onRouteChange }: { onRouteChange: (route: MobileTab) => void }) {
  const data = useAppData();
  const { user, refresh } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [focusTarget, setFocusTarget] = useState<PriceReviewAlertTarget | null>(null);
  const [productsInitialMode, setProductsInitialMode] = useState<HomeLaunchOptions['productsMode']>();
  const [warehouseInitialSubview, setWarehouseInitialSubview] =
    useState<HomeLaunchOptions['warehouseSubview']>();
  const defaultWarehouse = data.getDefaultWarehouse();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleNavigateToTarget = (target: PriceReviewAlertTarget) => {
    const tab = getTabForPriceReviewTarget(target);
    setFocusTarget(target);
    setActiveTab(tab);
    if (navigationRef.isReady()) {
      navigationRef.navigate(tab);
    }
  };

  const navigateToTab = (tab: AppTab) => {
    setActiveTab(tab);
    if (navigationRef.isReady()) {
      navigationRef.navigate(tab);
    }
  };

  const handleHomeNavigate = (tab: AppTab, options?: HomeLaunchOptions) => {
    if (options?.productsMode) setProductsInitialMode(options.productsMode);
    if (options?.warehouseSubview) setWarehouseInitialSubview(options.warehouseSubview);
    navigateToTab(tab);
  };

  if (!data.hydrated) return <LoadingScreen message="Cargando tus datos…" />;

  const screenTitle =
    activeTab === 'menu' ? 'Menú' : NAV_BY_ID[activeTab as AppTab].title;
  const screenDescription =
    activeTab === 'menu' ? null : NAV_BY_ID[activeTab as AppTab].description;
  const menuSecondaryActive =
    activeTab !== 'menu' && !PRIMARY_BOTTOM_TAB_IDS.includes(activeTab as AppTab);
  const warehouseTabBadge =
    data.stockAlerts.length > 0 ? Math.min(data.stockAlerts.length, 99) : undefined;

  return (
    <UnitCatalogProvider settings={data.unitSettings}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title={screenTitle} description={user?.tenantName ? null : screenDescription} />
        <Tab.Navigator
          initialRouteName="home"
          tabBar={(props) => <PrimaryTabBar {...props} />}
          screenListeners={{
            state: (e) => {
              const route = e.data.state?.routes[e.data.state.index];
              if (route?.name) {
                const name = route.name as MobileTab;
                setActiveTab(name);
                onRouteChange(name);
              }
            },
          }}
          screenOptions={({ route }) => {
            const isMenu = route.name === 'menu';
            const meta = isMenu ? null : NAV_BY_ID[route.name as AppTab];
            return {
              headerShown: false,
              tabBarActiveTintColor: colors.brand,
              tabBarInactiveTintColor: colors.muted,
              tabBarStyle: {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
                paddingBottom: Math.max(insets.bottom, 6),
                paddingTop: 6,
              },
              tabBarItemStyle: { flex: 1, paddingVertical: 2, maxWidth: undefined },
              tabBarIconStyle: { marginBottom: 0 },
              tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
              tabBarAllowFontScaling: false,
              tabBarBadge:
                route.name === 'warehouses' ? warehouseTabBadge : undefined,
              tabBarBadgeStyle: {
                fontSize: 9,
                minWidth: 16,
                height: 16,
                lineHeight: 16,
                top: -2,
              },
              tabBarIcon: ({ color, size, focused }) => {
                if (isMenu) {
                  const highlight = focused || menuSecondaryActive;
                  return (
                    <LayoutGrid
                      color={highlight ? colors.brand : colors.muted}
                      size={size}
                    />
                  );
                }
                const Icon = meta!.icon;
                return <Icon color={color} size={size} />;
              },
              tabBarLabel:
                isMenu && menuSecondaryActive
                  ? ({ color }) => (
                      <Text
                        style={{ color: colors.brand, fontSize: 10, fontWeight: '700' }}
                        numberOfLines={1}
                      >
                        Más
                      </Text>
                    )
                  : isMenu
                    ? 'Más'
                    : meta?.shortLabel ?? meta?.label,
              title: isMenu ? 'Más' : meta?.label,
            };
          }}
        >
          <Tab.Screen name="home">
            {() => (
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
          </Tab.Screen>
          <Tab.Screen name="products">
            {() => (
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
                onDeleteProduct={data.deleteProduct}
                onRecalculateAll={data.recalculateAll}
                onRegisterProductMovement={data.registerProductMovement}
                onRegisterProductInitialStock={data.registerProductInitialStock}
                onRegisterProduction={data.registerProduction}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="raw-materials">
            {() => (
              <RawMaterialsManager
                materials={data.materials}
                focusMaterialId={
                  focusTarget?.refType === 'raw_material' ? focusTarget.refId : undefined
                }
                onFocusConsumed={() => setFocusTarget(null)}
                onSave={data.saveMaterial}
                onDelete={data.deleteMaterial}
                onStockChange={data.updateStock}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="warehouses">
            {() => (
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
          </Tab.Screen>
          <Tab.Screen name="settings">
            {() => <SettingsTab />}
          </Tab.Screen>
          <Tab.Screen name="menu">
            {() => (
              <AppMenuScreen activeTab={activeTab} onNavigate={navigateToTab} />
            )}
          </Tab.Screen>
          <Tab.Screen name="locations">
            {() => (
              <TabScreenScroll>
                <LocationsSettingsPanel
                  locations={data.locations}
                  onSave={data.saveLocation}
                  onDelete={data.deleteLocation}
                />
              </TabScreenScroll>
            )}
          </Tab.Screen>
          <Tab.Screen name="reconciliation">
            {() => (
              <TabScreenScroll>
                <ReconciliationPanel
                  locations={data.locations}
                  products={data.inventory}
                  sales={data.sales}
                  stockMovements={data.stockMovements}
                  onImportSales={data.addSales}
                />
              </TabScreenScroll>
            )}
          </Tab.Screen>
          <Tab.Screen name="exchange">
            {() => (
              <TabScreenScroll contentContainerStyle={{ gap: 12 }}>
                <ExchangeRatesPanel />
              </TabScreenScroll>
            )}
          </Tab.Screen>
          <Tab.Screen name="backup">
            {() => <BackupTab />}
          </Tab.Screen>
          <Tab.Screen name="account">
            {() => <AccountTab />}
          </Tab.Screen>
        </Tab.Navigator>
      </View>
    </UnitCatalogProvider>
  );
}

function NavigationRoot() {
  const { scheme, colors } = useTheme();
  const { storageScope } = useAuth();
  const [, setActiveTab] = useState<MobileTab>('home');
  const navTheme =
    scheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.background,
            card: colors.surface,
            border: colors.border,
            text: colors.foreground,
            primary: colors.brand,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: colors.background,
            card: colors.surface,
            border: colors.border,
            text: colors.foreground,
            primary: colors.brand,
          },
        };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <MobileAppDataProvider key={storageScope ?? 'guest'}>
        <ExchangeRatesBridge>
          <MainTabs onRouteChange={setActiveTab} />
        </ExchangeRatesBridge>
      </MobileAppDataProvider>
    </NavigationContainer>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  if (loading) {
    return <LoadingScreen message="Verificando sesión…" />;
  }

  if (!user) {
    if (authScreen === 'register') {
      return <RegisterScreen onBackToLogin={() => setAuthScreen('login')} />;
    }
    return <LoginScreen onRegister={() => setAuthScreen('register')} />;
  }

  if (user.role === 'super_admin') {
    return <AdminScreen />;
  }

  if (!user.workspaceId) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background, padding: 24 }]}>
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
          Negocio no asignado
        </Text>
        <Text style={{ color: colors.muted, marginTop: 8, textAlign: 'center' }}>
          Tu cuenta no tiene un espacio de trabajo asociado. Contacta al administrador.
        </Text>
      </View>
    );
  }

  return <NavigationRoot />;
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <DialogProvider>
            <AuthProvider>
              <AuthGate />
            </AuthProvider>
          </DialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  accountContent: { gap: 16 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
