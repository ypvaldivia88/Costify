'use client';

import React from 'react';
import { Package, Trash2, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCalculation } from './CostCalculator';

interface InventoryListProps {
  items: ProductCalculation[];
  onDelete: (id: string) => void;
}

export default function InventoryList({ items, onDelete }: InventoryListProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

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
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
          {items.length} REGISTROS
        </span>
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
                          {item.indirectCosts.map((ic) => (
                            <div key={ic.id} className="flex justify-between text-sm">
                              <span className="text-zinc-500">{ic.name} (${ic.amount.toFixed(2)} / {ic.distributionUnits || 1}u)</span>
                              <span className="font-medium text-zinc-900">${(ic.amount / (ic.distributionUnits || 1)).toFixed(2)}</span>
                            </div>
                          ))}
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
