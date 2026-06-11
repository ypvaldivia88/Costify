'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { ProductCalculation } from '@/lib/domain/types';
import { calculateBusinessSummary } from '@/lib/domain/calculations';
import { formatCurrency, formatPercent } from '@/lib/format/currency';
import { useInventory } from '@/hooks/use-inventory';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useGlobalCosts } from '@/hooks/use-global-costs';
import { useTaxSettings } from '@/hooks/use-tax-settings';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav, type AppTab } from '@/components/ui/BottomNav';
import { CostCalculator } from '@/components/calculator/CostCalculator';
import { InventoryList } from '@/components/inventory/InventoryList';
import { RawMaterialsManager } from '@/components/raw-materials/RawMaterialsManager';
import { IndirectCostsSettings } from '@/components/settings/IndirectCostsSettings';
import { TaxSettingsPanel } from '@/components/settings/TaxSettingsPanel';
import { StatCard } from '@/components/ui/StatCard';

const tabMeta: Record<AppTab, { title: string; description: string }> = {
  calculator: {
    title: 'Calculadora de costos',
    description:
      'Determina el precio de venta ideal considerando costos directos, gastos indirectos y tu margen de utilidad.',
  },
  'raw-materials': {
    title: 'Materias primas',
    description:
      'Registra tus insumos con costo unitario y stock. Úsalos para confeccionar productos elaborados.',
  },
  inventory: {
    title: 'Historial de productos',
    description: 'Revisa y gestiona las fichas de costos guardadas de tu negocio.',
  },
  settings: {
    title: 'Configuración',
    description: 'Define gastos fijos recurrentes y estimaciones de impuestos MIPYME.',
  },
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
  const { taxSettings, updateTaxSettings } = useTaxSettings();
  const [activeTab, setActiveTab] = useState<AppTab>('calculator');
  const [editingProduct, setEditingProduct] = useState<ProductCalculation | null>(null);

  const hydrated = inventoryHydrated && materialsHydrated;
  const summary = calculateBusinessSummary(inventory, taxSettings);
  const meta = tabMeta[activeTab];

  const handleSaveProduct = (product: ProductCalculation) => {
    saveProduct(product, materials);
    setEditingProduct(null);
    setActiveTab('inventory');
  };

  const handleEditProduct = (product: ProductCalculation) => {
    setEditingProduct(product);
    setActiveTab('calculator');
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-5xl mx-auto px-4 pt-5 pb-28 md:pb-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              {meta.title}
            </h2>
            <p className="text-sm sm:text-base text-zinc-500 mt-1 max-w-2xl">{meta.description}</p>
          </div>

          {activeTab === 'calculator' && (
            <CostCalculator
              inventory={inventory}
              rawMaterials={materials}
              globalIndirectCosts={globalCosts}
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
              onDelete={(id) => deleteProduct(id, materials)}
              onEdit={handleEditProduct}
              onRecalculateAll={() => recalculateAll(materials)}
            />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-2xl">
              <IndirectCostsSettings costs={globalCosts} onSave={saveCosts} />
              <TaxSettingsPanel settings={taxSettings} onChange={updateTaxSettings} />
            </div>
          )}
        </motion.div>

        {inventory.length > 0 && activeTab !== 'inventory' && (
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-zinc-200 p-3">
              <StatCard label="Productos" value={String(summary.productCount)} />
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-3">
              <StatCard
                label="Margen prom."
                value={formatPercent(summary.averageGrossMargin)}
              />
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-3">
              <StatCard
                label="Valor stock"
                value={formatCurrency(summary.totalStockValue)}
              />
            </div>
          </div>
        )}
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
