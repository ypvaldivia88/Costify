'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calculator, LayoutDashboard, Settings, HelpCircle } from 'lucide-react';
import CostCalculator, { ProductCalculation, IndirectCost } from '@/components/CostCalculator';
import InventoryList from '@/components/InventoryList';
import IndirectCostsSettings from '@/components/IndirectCostsSettings';

export default function Home() {
  const [inventory, setInventory] = useState<ProductCalculation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('costify_inventory');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse inventory', e);
        }
      }
    }
    return [];
  });

  const [globalIndirectCosts, setGlobalIndirectCosts] = useState<IndirectCost[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('costify_global_costs');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse global costs', e);
        }
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'calculator' | 'inventory' | 'settings'>('calculator');

  // Save to localStorage when inventory changes
  useEffect(() => {
    localStorage.setItem('costify_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Save to localStorage when global costs change
  useEffect(() => {
    localStorage.setItem('costify_global_costs', JSON.stringify(globalIndirectCosts));
  }, [globalIndirectCosts]);

  const handleSaveProduct = (product: ProductCalculation) => {
    setInventory([product, ...inventory]);
    setActiveTab('inventory');
  };

  const handleDeleteProduct = (id: string) => {
    setInventory(inventory.filter((item) => item.id !== id));
  };

  const handleSaveGlobalCosts = (costs: IndirectCost[]) => {
    setGlobalIndirectCosts(costs);
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Costify</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('calculator')}
              className={`text-sm font-medium transition-colors ${activeTab === 'calculator' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              Calculadora
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              Historial
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`text-sm font-medium transition-colors ${activeTab === 'settings' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              Configuración
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`p-2 transition-colors ${activeTab === 'settings' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero / Title Section */}
        <div className="mb-12">
          <motion.h2 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-2"
          >
            {activeTab === 'calculator' ? 'Calculadora de Ficha de Costos' : 
             activeTab === 'inventory' ? 'Historial de Cálculos' : 
             'Configuración General'}
          </motion.h2>
          <motion.p 
            key={`p-${activeTab}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 max-w-2xl"
          >
            {activeTab === 'calculator' 
              ? 'Determina el precio de venta ideal para tus productos considerando costos directos, indirectos y margen de beneficio.'
              : activeTab === 'inventory'
              ? 'Revisa el registro detallado de todos los cálculos realizados para tus productos.'
              : 'Configura los costos indirectos globales que se aplican recurrentemente en tu negocio.'}
          </motion.p>
        </div>

        {/* Tab Switcher (Mobile) */}
        <div className="flex md:hidden bg-zinc-200/50 p-1 rounded-xl mb-8">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'calculator' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            Calc
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'inventory' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            Historial
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            Config
          </button>
        </div>

        {/* Main Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'calculator' ? (
            <CostCalculator onSave={handleSaveProduct} globalIndirectCosts={globalIndirectCosts} />
          ) : activeTab === 'inventory' ? (
            <InventoryList items={inventory} onDelete={handleDeleteProduct} />
          ) : (
            <IndirectCostsSettings costs={globalIndirectCosts} onSave={handleSaveGlobalCosts} />
          )}
        </motion.div>
      </div>

      {/* Footer Stats (Desktop) */}
      <footer className="mt-20 border-t border-zinc-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Productos</p>
            <p className="text-3xl font-light">{inventory.length}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Margen Promedio</p>
            <p className="text-3xl font-light">
              {inventory.length > 0 
                ? (inventory.reduce((acc, item) => acc + item.profitMargin, 0) / inventory.length).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Valor de Inventario (Sugerido)</p>
            <p className="text-3xl font-light">
              ${inventory.reduce((acc, item) => acc + item.suggestedPrice, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
