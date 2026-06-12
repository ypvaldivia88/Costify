import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Boxes,
  Calculator,
  LayoutList,
  Moon,
  Settings,
  Sun,
} from 'lucide-react-native';
import type { ProductCalculation } from '@/domain/types';
import { CostCalculator } from '@/components/calculator/CostCalculator';
import { InventoryList } from '@/components/inventory/InventoryList';
import { RawMaterialsManager } from '@/components/raw-materials/RawMaterialsManager';
import { SettingsView } from '@/components/settings/SettingsView';
import { AppDataProvider, useAppData } from '@/context/AppDataContext';
import { DialogProvider } from '@/context/DialogContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';

type RootTabParamList = {
  calculator: undefined;
  materials: undefined;
  inventory: undefined;
  settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_META = {
  calculator: { label: 'Calcular', title: 'Calcular precio', icon: Calculator },
  materials: { label: 'Insumos', title: 'Materias primas', icon: Boxes },
  inventory: { label: 'Historial', title: 'Historial', icon: LayoutList },
  settings: { label: 'Ajustes', title: 'Ajustes', icon: Settings },
} as const;

function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={{ color: colors.muted, marginTop: 12 }}>Cargando tus datos…</Text>
    </View>
  );
}

function AppHeader({ title }: { title: string }) {
  const { colors, scheme, toggleScheme } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
      <View style={styles.header}>
        <View>
          <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>
            COSTIFY
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800' }}>{title}</Text>
        </View>
        <Pressable
          onPress={toggleScheme}
          style={[styles.themeBtn, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
        >
          {scheme === 'dark' ? <Sun size={18} color={colors.foreground} /> : <Moon size={18} color={colors.foreground} />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function MainTabs({
  onRouteChange,
  navigationRef,
}: {
  onRouteChange: (route: keyof RootTabParamList) => void;
  navigationRef: ReturnType<typeof useNavigationContainerRef<RootTabParamList>>;
}) {
  const data = useAppData();
  const { colors } = useTheme();
  const [editingProduct, setEditingProduct] = useState<ProductCalculation | null>(null);
  const [activeTab, setActiveTab] = useState<keyof RootTabParamList>('calculator');

  if (!data.hydrated) return <LoadingScreen />;

  const screenTitle = TAB_META[activeTab].title;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={screenTitle} />
      <Tab.Navigator
        screenListeners={{
          state: (e) => {
            const route = e.data.state?.routes[e.data.state.index];
            if (route?.name) {
              const name = route.name as keyof RootTabParamList;
              setActiveTab(name);
              onRouteChange(name);
            }
          },
        }}
        screenOptions={({ route }) => {
          const meta = TAB_META[route.name as keyof RootTabParamList];
          const Icon = meta.icon;
          return {
            headerShown: false,
            tabBarActiveTintColor: colors.brand,
            tabBarInactiveTintColor: colors.muted,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              height: 64,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
            tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
          };
        }}
      >
        <Tab.Screen name="calculator" options={{ title: TAB_META.calculator.label }}>
          {() => (
            <CostCalculator
              inventory={data.inventory}
              rawMaterials={data.materials}
              globalIndirectCosts={data.globalCosts}
              globalFund={data.globalFund}
              taxSettings={data.taxSettings}
              editingProduct={editingProduct}
              onSave={(product) => {
                data.saveProduct(product);
                setEditingProduct(null);
                navigationRef.navigate('inventory');
              }}
              onCancelEdit={() => setEditingProduct(null)}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="materials" options={{ title: TAB_META.materials.label }}>
          {() => (
            <RawMaterialsManager
              materials={data.materials}
              onSave={data.saveMaterial}
              onDelete={data.deleteMaterial}
              onStockChange={data.updateStock}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="inventory" options={{ title: TAB_META.inventory.label }}>
          {() => (
            <InventoryList
              items={data.inventory}
              taxSettings={data.taxSettings}
              onDelete={data.deleteProduct}
              onEdit={(item) => {
                setEditingProduct(item);
                navigationRef.navigate('calculator');
              }}
              onRecalculateAll={data.recalculateAll}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="settings" options={{ title: TAB_META.settings.label }}>
          {() => (
            <SettingsView
              inventory={data.inventory}
              rawMaterials={data.materials}
              globalCosts={data.globalCosts}
              globalFund={data.globalFund}
              taxSettings={data.taxSettings}
              onSaveCosts={data.saveCosts}
              onUpdateGlobalFund={data.updateGlobalFund}
              onUpdateTaxSettings={data.updateTaxSettings}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}

function NavigationRoot() {
  const { scheme, colors } = useTheme();
  const navigationRef = useNavigationContainerRef<RootTabParamList>();
  const [, setActiveTab] = useState<keyof RootTabParamList>('calculator');
  const navTheme = scheme === 'dark'
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
      <MainTabs navigationRef={navigationRef} onRouteChange={setActiveTab} />
    </NavigationContainer>
  );
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <DialogProvider>
            <AppDataProvider>
              <NavigationRoot />
            </AppDataProvider>
          </DialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
