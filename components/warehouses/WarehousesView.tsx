'use client';

import { useMemo, useState } from 'react';
import type {
  ProductCalculation,
  RawMaterial,
  StockAlert,
  StockLevel,
  StockMovement,
  StockThreshold,
  Warehouse,
} from '@/lib/domain/types';
import { WarehouseSubNav, type WarehouseSubview } from './WarehouseSubNav';
import { WarehouseList } from './WarehouseList';
import { StockOverview } from './StockOverview';
import { MovementForm } from './MovementForm';
import { MovementHistory } from './MovementHistory';
import { StockAlertsPanel } from './StockAlertsPanel';

interface WarehousesViewProps {
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  stockThresholds: StockThreshold[];
  stockLevels: StockLevel[];
  stockAlerts: StockAlert[];
  stockValuation: { rawMaterialsValue: number; productsValue: number; totalValue: number };
  materials: RawMaterial[];
  products: ProductCalculation[];
  onSaveWarehouse: (
    input: Omit<Warehouse, 'id' | 'timestamp'>,
    id?: string,
    timestamp?: number
  ) => void;
  onDeleteWarehouse: (id: string) => void;
  onRegisterMovement: (input: Omit<StockMovement, 'id' | 'timestamp'>) => void;
  onSaveThreshold: (input: Omit<StockThreshold, 'id'>, id?: string) => void;
  onDeleteThreshold: (id: string) => void;
}

export function WarehousesView({
  warehouses,
  stockMovements,
  stockThresholds,
  stockLevels,
  stockAlerts,
  stockValuation,
  materials,
  products,
  onSaveWarehouse,
  onDeleteWarehouse,
  onRegisterMovement,
  onSaveThreshold,
  onDeleteThreshold,
}: WarehousesViewProps) {
  const [subview, setSubview] = useState<WarehouseSubview>('stock');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>();

  const getItemName = useMemo(() => {
    const materialMap = new Map(materials.map((m) => [m.id, m.name]));
    const productMap = new Map(products.map((p) => [p.id, p.name]));
    return (refType: 'raw_material' | 'product', refId: string) =>
      refType === 'raw_material'
        ? (materialMap.get(refId) ?? 'Insumo')
        : (productMap.get(refId) ?? 'Producto');
  }, [materials, products]);

  return (
    <div className="space-y-4 pb-4">
      <WarehouseSubNav
        active={subview}
        onChange={setSubview}
        alertCount={stockAlerts.length}
      />

      {subview === 'stock' && (
        <StockOverview
          stockLevels={stockLevels}
          warehouses={warehouses}
          materials={materials}
          products={products}
          valuation={stockValuation}
          selectedWarehouseId={selectedWarehouseId}
          onWarehouseChange={setSelectedWarehouseId}
        />
      )}

      {subview === 'movements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MovementForm
            warehouses={warehouses}
            materials={materials}
            products={products}
            onSubmit={onRegisterMovement}
          />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted">Kardex reciente</h3>
            <MovementHistory
              movements={stockMovements.slice(0, 50)}
              warehouses={warehouses}
              getItemName={getItemName}
            />
          </div>
        </div>
      )}

      {subview === 'warehouses' && (
        <WarehouseList
          warehouses={warehouses}
          onSave={onSaveWarehouse}
          onDelete={onDeleteWarehouse}
        />
      )}

      {subview === 'alerts' && (
        <StockAlertsPanel
          alerts={stockAlerts}
          thresholds={stockThresholds}
          warehouses={warehouses}
          materials={materials}
          products={products}
          onSaveThreshold={onSaveThreshold}
          onDeleteThreshold={onDeleteThreshold}
        />
      )}
    </div>
  );
}
