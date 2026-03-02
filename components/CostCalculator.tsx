'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Info, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface IndirectCost {
  id: string;
  name: string;
  amount: number;
  distributionCriteria: 'units' | 'direct-cost' | 'weight' | 'manual';
  distributionUnits?: number; // Only used when distributionCriteria === 'manual'
}

export interface ProductCalculation {
  id: string;
  name: string;
  purchasePrice: number;
  unitsPerPackage: number;
  productionUnits: number;
  productWeight?: number;
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
  inventory: ProductCalculation[];
  editingProduct?: ProductCalculation | null;
  onCancelEdit?: () => void;
}

/**
 * Calculates proportionally distributed indirect costs for a product,
 * taking into account ALL products in the inventory.
 */
function calculateProportionalIndirectCosts(
  currentProduct: {
    purchasePrice: number;
    productionUnits: number;
    productWeight?: number;
  },
  allProducts: ProductCalculation[],
  indirectCosts: IndirectCost[]
): { totalPerUnit: number; breakdown: Array<{ name: string; assigned: number; perUnit: number }> } {
  const breakdown: Array<{ name: string; assigned: number; perUnit: number }> = [];
  let totalPerUnit = 0;

  const allProductsIncludingCurrent: Array<{ purchasePrice: number; productionUnits: number; productWeight?: number }> = [
    ...allProducts.map(({ purchasePrice, productionUnits, productWeight }) => ({ purchasePrice, productionUnits, productWeight })),
    currentProduct,
  ];

  indirectCosts.forEach((cost) => {
    let assignedCost = 0;
    let costPerUnit = 0;
    const criteria = cost.distributionCriteria || 'manual';

    switch (criteria) {
      case 'units': {
        const totalUnits = allProductsIncludingCurrent.reduce(
          (sum, p) => sum + (p.productionUnits || 0),
          0
        );
        if (totalUnits > 0) {
          costPerUnit = cost.amount / totalUnits;
          assignedCost = costPerUnit * currentProduct.productionUnits;
        }
        break;
      }
      case 'direct-cost': {
        const totalDirectCosts = allProductsIncludingCurrent.reduce(
          (sum, p) => sum + (p.purchasePrice || 0) * (p.productionUnits || 0),
          0
        );
        const productDirectCost = currentProduct.purchasePrice * currentProduct.productionUnits;
        if (totalDirectCosts > 0) {
          const percentage = productDirectCost / totalDirectCosts;
          assignedCost = cost.amount * percentage;
          costPerUnit = currentProduct.productionUnits > 0 ? assignedCost / currentProduct.productionUnits : 0;
        }
        break;
      }
      case 'weight': {
        const totalWeight = allProductsIncludingCurrent.reduce(
          (sum, p) => sum + (p.productWeight || 0) * (p.productionUnits || 0),
          0
        );
        const productTotalWeight = (currentProduct.productWeight || 0) * currentProduct.productionUnits;
        if (totalWeight > 0) {
          const percentage = productTotalWeight / totalWeight;
          assignedCost = cost.amount * percentage;
          costPerUnit = currentProduct.productionUnits > 0 ? assignedCost / currentProduct.productionUnits : 0;
        }
        break;
      }
      case 'manual':
      default: {
        const units = cost.distributionUnits || 1;
        costPerUnit = cost.amount / units;
        assignedCost = costPerUnit * currentProduct.productionUnits;
        break;
      }
    }

    totalPerUnit += costPerUnit;
    breakdown.push({ name: cost.name, assigned: assignedCost, perUnit: costPerUnit });
  });

  return { totalPerUnit, breakdown };
}

export default function CostCalculator({ onSave, globalIndirectCosts, inventory, editingProduct, onCancelEdit }: CostCalculatorProps) {
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [unitsPerPackage, setUnitsPerPackage] = useState<number>(1);
  const [productionUnits, setProductionUnits] = useState<number>(100);
  const [productWeight, setProductWeight] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [indirectCosts, setIndirectCosts] = useState<IndirectCost[]>([]);

  // Populate form when entering edit mode; reset when leaving
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setPurchasePrice(editingProduct.purchasePrice);
      setUnitsPerPackage(editingProduct.unitsPerPackage);
      setProductionUnits(editingProduct.productionUnits || 100);
      setProductWeight(editingProduct.productWeight || 0);
      setProfitMargin(editingProduct.profitMargin);
      setIndirectCosts(editingProduct.indirectCosts);
    } else {
      setName('');
      setPurchasePrice(0);
      setUnitsPerPackage(1);
      setProductionUnits(100);
      setProductWeight(0);
      setProfitMargin(30);
      setIndirectCosts([]);
    }
  }, [editingProduct]);

  // Derived state
  const unitCost = purchasePrice / (unitsPerPackage || 1);
  const proportionalCosts = calculateProportionalIndirectCosts(
    { purchasePrice, productionUnits, productWeight },
    inventory,
    indirectCosts
  );
  const totalIndirect = proportionalCosts.totalPerUnit;
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

  // Monthly coverage metrics
  const totalMonthlyIndirectCosts = indirectCosts.reduce((sum, c) => sum + c.amount, 0);
  const monthlyIndirectBurden = totalIndirect * productionUnits;
  const indirectCoveragePercent =
    totalMonthlyIndirectCosts > 0
      ? Math.min((monthlyIndirectBurden / totalMonthlyIndirectCosts) * 100, 100)
      : 0;
  const monthlyGap = Math.max(totalMonthlyIndirectCosts - monthlyIndirectBurden, 0);

  const addIndirectCost = () => {
    setIndirectCosts([
      ...indirectCosts,
      { id: window.crypto.randomUUID(), name: '', amount: 0, distributionCriteria: 'manual', distributionUnits: 1 },
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
      distributionCriteria: c.distributionCriteria || 'manual',
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

  const handleCancelEdit = () => {
    setName('');
    setPurchasePrice(0);
    setUnitsPerPackage(1);
    setProductionUnits(100);
    setProductWeight(0);
    setProfitMargin(30);
    setIndirectCosts([]);
    if (onCancelEdit) onCancelEdit();
  };

  const handleSave = () => {
    if (!name) return alert('Por favor, ingresa un nombre para el producto');
    if (productionUnits <= 0) return alert('Por favor, ingresa las unidades de producción/venta');
    
    const calculation: ProductCalculation = {
      id: editingProduct ? editingProduct.id : window.crypto.randomUUID(),
      name,
      purchasePrice,
      unitsPerPackage,
      productionUnits,
      productWeight: productWeight || undefined,
      indirectCosts: [...indirectCosts],
      profitMargin,
      unitCost: results.unitCost,
      totalUnitCost: results.totalUnitCost,
      suggestedPrice: results.suggestedPrice,
      profitPerUnit: results.profitPerUnit,
      timestamp: editingProduct ? editingProduct.timestamp : Date.now(),
    };
    
    onSave(calculation);
    // Reset form
    setName('');
    setPurchasePrice(0);
    setUnitsPerPackage(1);
    setProductionUnits(100);
    setProductWeight(0);
    setIndirectCosts([]);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-semibold text-zinc-900">
              {editingProduct ? `Editando: ${editingProduct.name}` : 'Datos del Producto'}
            </h2>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">
                  Unidades de Producción/Venta (mensual)
                </label>
                <input
                  type="number"
                  value={productionUnits || ''}
                  onChange={(e) => setProductionUnits(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="Ej: 100"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  ¿Cuántas unidades produces o vendes en el período?
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">
                  Peso/Volumen por Unidad (opcional)
                </label>
                <input
                  type="number"
                  value={productWeight || ''}
                  onChange={(e) => setProductWeight(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="En kg o m³"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Para costos como transporte o almacenamiento
                </p>
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
                        {(!cost.distributionCriteria || cost.distributionCriteria === 'manual') && (
                          <>
                            <span className="text-zinc-400 text-xs">/</span>
                            <input
                              type="number"
                              placeholder="Unidades"
                              value={cost.distributionUnits || ''}
                              onChange={(e) => updateIndirectCost(cost.id, 'distributionUnits', Math.max(1, Number(e.target.value)))}
                              className="w-16 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:border-emerald-500"
                              title="Unidades entre las que se distribuye este costo"
                            />
                          </>
                        )}
                        {cost.distributionCriteria && cost.distributionCriteria !== 'manual' && (
                          <span className="text-[10px] text-emerald-600 font-semibold px-1 whitespace-nowrap">
                            {cost.distributionCriteria === 'units' ? 'Por Unidades' :
                             cost.distributionCriteria === 'direct-cost' ? 'Por Costo' :
                             'Por Peso'}
                          </span>
                        )}
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

          {editingProduct && (
            <button
              onClick={handleCancelEdit}
              className="w-full py-2 border border-zinc-300 text-zinc-600 rounded-xl font-medium hover:bg-zinc-50 transition-all text-sm"
            >
              Cancelar Edición
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!name || purchasePrice <= 0}
            className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-zinc-900/10"
          >
            <Save className="w-4 h-4" /> {editingProduct ? 'Actualizar en Inventario' : 'Guardar en Inventario'}
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

                {/* Detailed breakdown */}
                <div className="mt-3 pt-3 border-t border-zinc-50 space-y-1.5">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Desglose por Criterio</p>
                  {proportionalCosts.breakdown.length > 0 ? (
                    proportionalCosts.breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">{item.name || `Costo ${idx + 1}`}</span>
                        <span className="font-bold text-zinc-700">${item.perUnit.toFixed(2)}/u</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-zinc-300 italic">Sin costos indirectos aplicados</p>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-zinc-50">
                  <p className="text-[9px] text-zinc-400 italic">
                    * Calculado proporcionalmente considerando {inventory.length + 1} {inventory.length + 1 === 1 ? 'producto activo' : 'productos activos'}
                  </p>
                </div>

                {/* Monthly fixed cost coverage */}
                {totalMonthlyIndirectCosts > 0 && productionUnits > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cobertura Mensual</p>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">Total costos del período</span>
                      <span className="font-semibold text-zinc-700">${totalMonthlyIndirectCosts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">Cubierto por este producto ({productionUnits}u)</span>
                      <span className="font-semibold text-emerald-600">${monthlyIndirectBurden.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                          style={{ width: `${indirectCoveragePercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500">{indirectCoveragePercent.toFixed(0)}%</span>
                    </div>
                    {inventory.length > 0 && monthlyGap > 0 && (
                      <p className="text-[9px] text-zinc-400 italic">
                        El {(100 - indirectCoveragePercent).toFixed(0)}% restante (${monthlyGap.toFixed(2)}) lo cubren los otros {inventory.length} {inventory.length === 1 ? 'producto' : 'productos'} del inventario.
                      </p>
                    )}
                    {inventory.length === 0 && monthlyGap > 0 && (
                      <p className="text-[9px] text-amber-600 italic">
                        Quedan ${monthlyGap.toFixed(2)}/mes sin cubrir. Agrega más productos para distribuir la carga.
                      </p>
                    )}
                  </div>
                )}
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
                {productionUnits > 0 && (
                  <div className="mt-4 pt-4 border-t border-emerald-100 grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Ingresos mensuales</p>
                      <p className="text-lg font-bold text-emerald-900">${(results.suggestedPrice * productionUnits).toFixed(2)}</p>
                      <p className="text-[9px] text-emerald-600">{productionUnits}u × ${results.suggestedPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Ganancia mensual</p>
                      <p className="text-lg font-bold text-emerald-700">+${(results.profitPerUnit * productionUnits).toFixed(2)}</p>
                      <p className="text-[9px] text-emerald-600">{productionUnits}u × ${results.profitPerUnit.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-zinc-100 rounded-xl text-xs text-zinc-500 italic">
            * El precio sugerido considera el prorrateo proporcional de costos indirectos entre TODOS los productos activos en inventario. Cada costo indirecto se distribuye según su criterio configurado (unidades totales, costo directo, peso, etc.). Esto asegura que la suma de todos los productos cubra exactamente los gastos fijos totales.
          </div>
        </section>
      </div>
    </div>
  );
}
