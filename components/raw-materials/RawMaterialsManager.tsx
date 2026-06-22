'use client';

import { useState } from 'react';
import { Boxes } from 'lucide-react';
import type { RawMaterial, StockLevel, Warehouse } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/format/currency';
import { Card } from '@/components/ui/Card';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { RawMaterialForm } from './RawMaterialForm';
import { RawMaterialItem } from './RawMaterialItem';

interface RawMaterialsManagerProps {
  materials: RawMaterial[];
  warehouses: Warehouse[];
  stockLevels: StockLevel[];
  defaultWarehouse?: Warehouse;
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
  warehouses,
  stockLevels,
  defaultWarehouse,
  onSave,
  onDelete,
  onStockChange,
}: RawMaterialsManagerProps) {
  const { confirm } = useConfirm();
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  const totalStockValue = materials.reduce((sum, m) => sum + m.unitCost * m.stockQuantity, 0);

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (material: RawMaterial) => {
    const confirmed = await confirm({
      title: 'Eliminar materia prima',
      message: `¿Eliminar "${material.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;
    onDelete(material.id);
    if (editingMaterial?.id === material.id) setEditingMaterial(null);
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
              <StatCard label="Valor en almacén" value={formatCurrency(totalStockValue)} />
            </Card>
          </div>
        )}

        {materials.length === 0 ? (
          <Card variant="muted" className="text-center py-10">
            <Boxes className="w-10 h-10 text-muted/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Sin materias primas</p>
            <p className="text-sm text-muted mt-1 max-w-xs mx-auto">
              Agrega la primera para confeccionar productos elaborados.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <RawMaterialItem
                key={material.id}
                material={material}
                warehouses={warehouses}
                stockLevels={stockLevels}
                defaultWarehouse={defaultWarehouse}
                onEdit={() => handleEdit(material)}
                onDelete={() => handleDelete(material)}
                onStockChange={(stock) => onStockChange(material.id, stock)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
