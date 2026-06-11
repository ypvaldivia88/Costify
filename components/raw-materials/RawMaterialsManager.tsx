'use client';

import { useState } from 'react';
import { Boxes } from 'lucide-react';
import type { RawMaterial } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/format/currency';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { RawMaterialForm } from './RawMaterialForm';
import { RawMaterialItem } from './RawMaterialItem';

interface RawMaterialsManagerProps {
  materials: RawMaterial[];
  onSave: (
    data: {
      name: string;
      purchasePrice: number;
      unitType: RawMaterial['unitType'];
      packageQuantity: number;
      stockQuantity: number;
    },
    id?: string,
    timestamp?: number
  ) => void;
  onDelete: (id: string) => void;
  onStockChange: (id: string, stockQuantity: number) => void;
}

export function RawMaterialsManager({
  materials,
  onSave,
  onDelete,
  onStockChange,
}: RawMaterialsManagerProps) {
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  const totalStockValue = materials.reduce(
    (sum, m) => sum + m.unitCost * m.stockQuantity,
    0
  );

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
      <Card>
        <SectionHeader
          icon={Boxes}
          title={editingMaterial ? `Editando: ${editingMaterial.name}` : 'Nueva materia prima'}
          description="Registra el costo de compra y calcula el precio unitario automáticamente"
        />
        <RawMaterialForm
          editingMaterial={editingMaterial}
          onSave={(data) => {
            if (editingMaterial) {
              onSave(data, editingMaterial.id, editingMaterial.timestamp);
            } else {
              onSave(data);
            }
            setEditingMaterial(null);
          }}
          onCancel={() => setEditingMaterial(null)}
        />
      </Card>

      <div className="space-y-4">
        {materials.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="!p-3">
              <StatCard label="Materias primas" value={String(materials.length)} />
            </Card>
            <Card className="!p-3">
              <StatCard label="Valor en stock" value={formatCurrency(totalStockValue)} />
            </Card>
          </div>
        )}

        {materials.length === 0 ? (
          <Card variant="muted" className="text-center py-8">
            <Boxes className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-muted">
              Aún no hay materias primas registradas.
              <br />
              Agrega la primera para confeccionar productos elaborados.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <RawMaterialItem
                key={material.id}
                material={material}
                onEdit={() => handleEdit(material)}
                onDelete={() => {
                  if (confirm(`¿Eliminar "${material.name}"?`)) {
                    onDelete(material.id);
                    if (editingMaterial?.id === material.id) setEditingMaterial(null);
                  }
                }}
                onStockChange={(stock) => onStockChange(material.id, stock)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
