'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IndirectCost } from './CostCalculator';

interface IndirectCostsSettingsProps {
  costs: IndirectCost[];
  onSave: (costs: IndirectCost[]) => void;
}

export default function IndirectCostsSettings({ costs, onSave }: IndirectCostsSettingsProps) {
  const [localCosts, setLocalCosts] = useState<IndirectCost[]>(costs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editUnits, setEditUnits] = useState<number>(1);

  const handleAdd = () => {
    const id = window.crypto.randomUUID();
    const newCost: IndirectCost = {
      id,
      name: 'Nuevo Costo',
      amount: 0,
      distributionUnits: 1,
    };
    const updated = [...localCosts, newCost];
    setLocalCosts(updated);
    startEditing(newCost);
  };

  const startEditing = (cost: IndirectCost) => {
    setEditingId(cost.id);
    setEditName(cost.name);
    setEditAmount(cost.amount);
    setEditUnits(cost.distributionUnits || 1);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = () => {
    if (!editingId) return;
    const updated = localCosts.map((c) =>
      c.id === editingId ? { ...c, name: editName, amount: editAmount, distributionUnits: editUnits } : c
    );
    setLocalCosts(updated);
    setEditingId(null);
    onSave(updated);
  };

  const handleDelete = (id: string) => {
    const updated = localCosts.filter((c) => c.id !== id);
    setLocalCosts(updated);
    onSave(updated);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Configuración de Costos Indirectos</h2>
          <p className="text-sm text-zinc-500">Define costos fijos que se aplicarán a tus cálculos.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Añadir Costo
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {localCosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-zinc-400 italic text-sm"
            >
              No hay costos indirectos configurados.
            </motion.div>
          ) : (
            localCosts.map((cost) => (
              <motion.div
                key={cost.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 group"
              >
                {editingId === cost.id ? (
                  <>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:border-emerald-500"
                        placeholder="Nombre"
                        autoFocus
                      />
                      <input
                        type="number"
                        value={editAmount || ''}
                        onChange={(e) => setEditAmount(Number(e.target.value))}
                        className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:border-emerald-500"
                        placeholder="Monto Total"
                      />
                      <input
                        type="number"
                        value={editUnits || ''}
                        onChange={(e) => setEditUnits(Math.max(1, Number(e.target.value)))}
                        className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:border-emerald-500"
                        placeholder="Unidades"
                        title="Unidades estimadas para cubrir este costo"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={saveEditing}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-semibold text-zinc-900">{cost.name}</p>
                      <div className="flex gap-4 mt-1">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total: ${cost.amount.toFixed(2)}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Distribución: {cost.distributionUnits || 1}u</p>
                        <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold">Por Unidad: ${((cost.amount || 0) / (cost.distributionUnits || 1)).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(cost)}
                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cost.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-700">
        <p className="font-bold mb-1 flex items-center gap-1">
          <Save className="w-3 h-3" /> Nota sobre el guardado
        </p>
        Los cambios realizados aquí se guardan automáticamente y estarán disponibles para ser aplicados en la calculadora de costos.
      </div>
    </div>
  );
}
