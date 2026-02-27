'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Info, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface IndirectCost {
  id: string;
  name: string;
  amount: number;
  distributionUnits: number; // How many units cover this cost
}

export interface ProductCalculation {
  id: string;
  name: string;
  purchasePrice: number;
  unitsPerPackage: number;
  indirectCosts: IndirectCost[];
  profitMargin: number; // percentage
  unitCost: number;
  totalUnitCost: number;
  suggestedPrice: number;
  profitPerUnit: number;
  timestamp: number;
}

interface CostCalculatorProps {
  onSave: (calc: ProductCalculation) => void;
  globalIndirectCosts: IndirectCost[];
}

export default function CostCalculator({ onSave, globalIndirectCosts }: CostCalculatorProps) {
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [unitsPerPackage, setUnitsPerPackage] = useState<number>(1);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [indirectCosts, setIndirectCosts] = useState<IndirectCost[]>([]);

  // Derived state
  const unitCost = purchasePrice / (unitsPerPackage || 1);
  const totalIndirect = indirectCosts.reduce((acc, cost) => {
    const units = cost.distributionUnits || 1;
    return acc + (cost.amount / units);
  }, 0);
  const totalUnitCost = unitCost + totalIndirect;
  const suggestedPrice = totalUnitCost * (1 + profitMargin / 100);
  const profitPerUnit = suggestedPrice - totalUnitCost;

  const results = {
    unitCost,
    totalIndirectCostPerUnit: totalIndirect,
    totalUnitCost,
    suggestedPrice,
    profitPerUnit,
  };

  const addIndirectCost = () => {
    setIndirectCosts([
      ...indirectCosts,
      { id: window.crypto.randomUUID(), name: '', amount: 0, distributionUnits: 1 },
    ]);
  };

  const importGlobalCosts = () => {
    // Merge global costs into current indirect costs, avoiding duplicates by name
    const currentNames = new Set(indirectCosts.map(c => c.name.toLowerCase()));
    const newCosts = globalIndirectCosts.filter(c => !currentNames.has(c.name.toLowerCase()));
    
    if (newCosts.length === 0) {
      alert('Todos los costos configurados ya están aplicados o no hay costos configurados.');
      return;
    }

    setIndirectCosts([...indirectCosts, ...newCosts.map(c => ({ 
      ...c, 
      id: window.crypto.randomUUID(),
      distributionUnits: c.distributionUnits || 1
    }))]);
  };

  const removeIndirectCost = (id: string) => {
    setIndirectCosts(indirectCosts.filter((c) => c.id !== id));
  };

  const updateIndirectCost = (id: string, field: keyof IndirectCost, value: string | number) => {
    setIndirectCosts(
      indirectCosts.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSave = () => {
    if (!name) return alert('Por favor, ingresa un nombre para el producto');
    
    const calculation: ProductCalculation = {
      id: window.crypto.randomUUID(),
      name,
      purchasePrice,
      unitsPerPackage,
      indirectCosts: [...indirectCosts],
      profitMargin,
      unitCost: results.unitCost,
      totalUnitCost: results.totalUnitCost,
      suggestedPrice: results.suggestedPrice,
      profitPerUnit: results.profitPerUnit,
      timestamp: Date.now(),
    };
    
    onSave(calculation);
    // Reset form
    setName('');
    setPurchasePrice(0);
    setUnitsPerPackage(1);
    setIndirectCosts([]);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-semibold text-zinc-900">Datos del Producto</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-500 mb-1">Nombre del Producto</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Galletas María"
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Precio de Compra ($)</label>
                <input
                  type="number"
                  value={purchasePrice || ''}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Unidades por Paquete</label>
                <input
                  type="number"
                  value={unitsPerPackage || ''}
                  onChange={(e) => setUnitsPerPackage(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-zinc-500">Costos Indirectos (por unidad)</label>
                <div className="flex gap-3">
                  {globalIndirectCosts.length > 0 && (
                    <button
                      onClick={importGlobalCosts}
                      className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Save className="w-3 h-3" /> Cargar Configurados
                    </button>
                  )}
                  <button
                    onClick={addIndirectCost}
                    className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Plus className="w-3 h-3" /> Agregar Costo
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {indirectCosts.map((cost) => (
                    <motion.div
                      key={cost.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Nombre (ej. Envío)"
                        value={cost.name}
                        onChange={(e) => updateIndirectCost(cost.id, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Monto Total"
                          value={cost.amount || ''}
                          onChange={(e) => updateIndirectCost(cost.id, 'amount', Number(e.target.value))}
                          className="w-20 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-zinc-400 text-xs">/</span>
                        <input
                          type="number"
                          placeholder="Unidades"
                          value={cost.distributionUnits || ''}
                          onChange={(e) => updateIndirectCost(cost.id, 'distributionUnits', Math.max(1, Number(e.target.value)))}
                          className="w-16 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:border-emerald-500"
                          title="Unidades entre las que se distribuye este costo"
                        />
                      </div>
                      <button
                        onClick={() => removeIndirectCost(cost.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-500 mb-1">
                Margen de Ganancia Deseado: <span className="text-emerald-600 font-bold">{profitMargin}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={profitMargin}
                onChange={(e) => setProfitMargin(Number(e.target.value))}
                className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!name || purchasePrice <= 0}
            className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-zinc-900/10"
          >
            <Save className="w-4 h-4" /> Guardar en Inventario
          </button>
        </section>

        {/* Results Section */}
        <section className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-zinc-400" />
              <h2 className="text-xl font-semibold text-zinc-900">Análisis de Costos</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">Costo Unitario (Directo)</p>
                <p className="text-2xl font-light text-zinc-900">${results.unitCost.toFixed(2)}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">Aporte a Gastos Indirectos</p>
                <p className="text-2xl font-light text-zinc-900">${results.totalIndirectCostPerUnit.toFixed(2)}</p>
                <div className="mt-2 pt-2 border-t border-zinc-50">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Análisis de Cobertura</p>
                  {indirectCosts.length > 0 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">Gastos Totales Listados:</span>
                        <span className="font-bold text-zinc-700">${indirectCosts.reduce((a, b) => a + b.amount, 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">Cobertura por Venta:</span>
                        <span className="font-bold text-emerald-600">
                          {((results.totalIndirectCostPerUnit / (indirectCosts.reduce((a, b) => a + b.amount, 0) || 1)) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-300 italic">Sin costos indirectos aplicados</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">Costo Total por Unidad</p>
                <p className="text-2xl font-bold text-zinc-900">${results.totalUnitCost.toFixed(2)}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <p className="text-sm text-emerald-700 font-medium mb-1">Precio de Venta Sugerido</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-emerald-900">${results.suggestedPrice.toFixed(2)}</p>
                  <span className="text-emerald-600 text-sm font-medium">({profitMargin}% margen)</span>
                </div>
                <p className="mt-2 text-sm text-emerald-600">
                  Ganancia neta por unidad: <span className="font-bold">${results.profitPerUnit.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-zinc-100 rounded-xl text-xs text-zinc-500 italic">
            * El precio sugerido se calcula sumando el costo directo más el aporte proporcional de cada gasto indirecto (Monto / Unidades a distribuir). Esto permite cubrir tus gastos fijos gradualmente con cada venta sin cargar el costo total a un solo producto.
          </div>
        </section>
      </div>
    </div>
  );
}
