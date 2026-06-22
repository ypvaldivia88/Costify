'use client';

import { useState } from 'react';
import { Building2, Trash2 } from 'lucide-react';
import type { Warehouse, WarehouseType } from '@/lib/domain/types';
import { WAREHOUSE_TYPE_LABELS } from '@/lib/domain/constants';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

interface WarehouseListProps {
  warehouses: Warehouse[];
  onSave: (input: Omit<Warehouse, 'id' | 'timestamp'>, id?: string, timestamp?: number) => void;
  onDelete: (id: string) => void;
}

const WAREHOUSE_TYPES: WarehouseType[] = ['principal', 'venta', 'produccion'];

export function WarehouseList({ warehouses, onSave, onDelete }: WarehouseListProps) {
  const { confirm } = useConfirm();
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<WarehouseType>('principal');

  const resetForm = () => {
    setEditing(null);
    setName('');
    setType('principal');
  };

  const startEdit = (warehouse: Warehouse) => {
    setEditing(warehouse);
    setName(warehouse.name);
    setType(warehouse.type);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editing) {
      onSave({ name: name.trim(), type, active: editing.active }, editing.id, editing.timestamp);
    } else {
      onSave({ name: name.trim(), type, active: true });
    }
    resetForm();
  };

  const handleDelete = async (warehouse: Warehouse) => {
    const confirmed = await confirm({
      title: 'Eliminar almacén',
      message: `¿Eliminar "${warehouse.name}"? Los movimientos asociados se conservarán.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;
    onDelete(warehouse.id);
    if (editing?.id === warehouse.id) resetForm();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <SectionHeader
          icon={Building2}
          title={editing ? `Editando: ${editing.name}` : 'Nuevo almacén'}
          description="Organiza tu inventario por bodega, punto de venta o área de producción"
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Bodega principal"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {WAREHOUSE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-semibold border transition-colors',
                    type === t
                      ? 'border-brand bg-brand-muted text-brand-foreground'
                      : 'border-border text-muted hover:bg-surface-muted'
                  )}
                >
                  {WAREHOUSE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editing ? 'Guardar cambios' : 'Crear almacén'}</Button>
            {editing && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {warehouses.length === 0 ? (
          <Card variant="muted" className="text-center py-10">
            <Building2 className="w-10 h-10 text-muted/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Sin almacenes</p>
            <p className="text-sm text-muted mt-1">Crea el primero para empezar a registrar movimientos.</p>
          </Card>
        ) : (
          warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-foreground">{warehouse.name}</h3>
                  <p className="text-sm text-muted mt-0.5">
                    {WAREHOUSE_TYPE_LABELS[warehouse.type]}
                    {!warehouse.active && ' · Inactivo'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => startEdit(warehouse)}>
                    Editar
                  </Button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(warehouse)}
                    className="p-2 text-muted hover:text-red-600 dark:hover:text-red-400 rounded-xl"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
