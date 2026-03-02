'use client';

import React from 'react';
import { Package, Trash2, TrendingUp, Clock, Edit2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCalculation } from './CostCalculator';

interface InventoryListProps {
  items: ProductCalculation[];
  onDelete: (id: string) => void;
  onEdit: (item: ProductCalculation) => void;
  onRecalculateAll: () => void;
}

export default function InventoryList({ items, onDelete, onEdit, onRecalculateAll }: InventoryListProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const monthlySummary = React.useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        totalRevenue: acc.totalRevenue + item.suggestedPrice * item.productionUnits,
        totalProfit: acc.totalProfit + item.profitPerUnit * item.productionUnits,
        totalIndirectBurden: acc.totalIndirectBurden + (item.totalUnitCost - item.unitCost) * item.productionUnits,
      }),
      { totalRevenue: 0, totalProfit: 0, totalIndirectBurden: 0 }
    );
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
        <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium">No hay registros en el historial</p>
        <p className="text-zinc-400 text-sm">Usa la calculadora para generar tu primer registro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-zinc-900 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Historial de Cálculos
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onRecalculateAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            title="Recalcular costos de todos los productos con el inventario actual"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Recalcular Inventario
          </button>
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
            {items.length} REGISTROS
          </span>
        </div>
      </div>

      {/* Monthly business summary */}
      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 mb-6">
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">Resumen Mensual del Negocio</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-0.5">Ingresos proyectados</p>
            <p className="text-xl font-bold text-emerald-900">
              ${monthlySummary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-0.5">Costos fijos cubiertos</p>
            <p className="text-xl font-bold text-amber-700">
              ${monthlySummary.totalIndirectBurden.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-0.5">Ganancia neta mensual</p>
            <p className={`text-xl font-bold ${monthlySummary.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {monthlySummary.totalProfit >= 0 ? '+' : ''}${monthlySummary.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <p className="text-[9px] text-zinc-400 italic mt-3">
          * Proyección basada en las unidades de producción/venta configuradas en cada producto.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
            >
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-zinc-900 text-lg">{item.name}</h3>
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-bold rounded uppercase">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                    <p>Costo Directo: <span className="font-semibold text-zinc-700">${item.unitCost.toFixed(2)}</span></p>
                    <p>Margen: <span className="font-semibold text-emerald-600">{item.profitMargin}%</span></p>
                    {item.productionUnits > 0 && (
                      <p>Ingreso mensual: <span className="font-semibold text-zinc-700">${(item.suggestedPrice * item.productionUnits).toFixed(2)}</span></p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Precio Sugerido</p>
                    <p className="text-2xl font-black text-emerald-600">${item.suggestedPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors"
                    >
                      {expandedId === item.id ? 'Cerrar' : 'Detalles'}
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-zinc-300 hover:text-emerald-600 transition-colors"
                      title="Editar cálculo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-zinc-100 bg-zinc-50/50"
                  >
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Desglose de Costos</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Costo Directo (Compra)</span>
                            <span className="font-medium text-zinc-900">${item.unitCost.toFixed(2)}</span>
                          </div>
                          {item.indirectCosts.map((ic) => {
                            const criteria = ic.distributionCriteria || 'manual';
                            return (
                              <div key={ic.id} className="flex justify-between text-sm">
                                <span className="text-zinc-500">
                                  {ic.name}
                                  {' '}
                                  <span className="text-[10px] text-zinc-400">
                                    ({
                                      criteria === 'units' ? 'por unidades' :
                                      criteria === 'direct-cost' ? 'por costo directo' :
                                      criteria === 'weight' ? 'por peso' :
                                      `$${ic.amount.toFixed(2)} / ${ic.distributionUnits || 1}u`
                                    })
                                  </span>
                                </span>
                                <span className="font-medium text-zinc-900">${(ic.amount / (ic.distributionUnits || 1)).toFixed(2)}</span>
                              </div>
                            );
                          })}
                          <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-bold">
                            <span className="text-zinc-900">Costo Total Unitario</span>
                            <span className="text-zinc-900">${item.totalUnitCost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Proyección de Ganancia</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Precio de Venta</span>
                            <span className="font-medium text-emerald-600">${item.suggestedPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Margen Aplicado</span>
                            <span className="font-medium text-zinc-900">{item.profitMargin}%</span>
                          </div>
                          <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-bold">
                            <span className="text-zinc-900">Ganancia Neta / Unidad</span>
                            <span className="text-emerald-600">+${item.profitPerUnit.toFixed(2)}</span>
                          </div>
                          {item.productionUnits > 0 && (
                            <div className="pt-2 mt-1 border-t border-zinc-100 space-y-1">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Proyección ({item.productionUnits}u/mes)</p>
                              <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Ingresos mensuales</span>
                                <span className="font-semibold text-emerald-700">${(item.suggestedPrice * item.productionUnits).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">Ganancia mensual neta</span>
                                <span className="font-semibold text-emerald-600">+${(item.profitPerUnit * item.productionUnits).toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 p-3 bg-white rounded-xl border border-zinc-200 text-[10px] text-zinc-400 leading-relaxed italic">
                          * Este cálculo se realizó el {new Date(item.timestamp).toLocaleString()}. Los costos indirectos reflejan los valores configurados en ese momento.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
