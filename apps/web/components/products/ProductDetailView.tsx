'use client';

import { useState } from 'react';
import { ArrowLeft, Edit2, Factory } from 'lucide-react';
import type {
  MovementType,
  ProductCalculation,
  RawMaterial,
  StockLevel,
  TaxSettings,
  UnitSettings,
  Warehouse,
} from '@costify/shared/domain/types';
import { calculateMonthlyTaxProjection, hasActiveTaxes } from '@costify/shared/domain/calculations/taxes';
import { DISTRIBUTION_CRITERIA_SHORT, PRODUCT_TYPE_LABELS } from '@costify/shared/domain/constants';
import { useUnitCatalog } from '@/hooks/use-unit-catalog';
import { formatCurrency, formatPercent } from '@costify/shared/format/currency';
import { CurrencyEquivalentsOnly } from '@/components/ui/CurrencyEquivalents';
import { MarginSensitivityTable } from '@/components/ui/MarginSensitivityTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProductionSection } from '@/components/products/ProductionSection';
import { ProductStockSection } from '@/components/products/ProductStockSection';

type DetailSection = 'costos' | 'stock' | 'produccion';

interface ProductDetailViewProps {
  product: ProductCalculation;
  taxSettings: TaxSettings;
  materials: RawMaterial[];
  warehouses: Warehouse[];
  stockLevels: StockLevel[];
  unitSettings: UnitSettings;
  onBack: () => void;
  onEdit: () => void;
  onRegisterMovement: (input: {
    type: MovementType;
    warehouseId: string;
    sourceWarehouseId?: string;
    quantity: number;
    note?: string;
  }) => void;
  onRegisterProduction: (
    quantity: number,
    warehouseId: string,
    note?: string
  ) => void;
}

const SECTIONS: { id: DetailSection; label: string }[] = [
  { id: 'costos', label: 'Costos' },
  { id: 'stock', label: 'Stock' },
  { id: 'produccion', label: 'Producción' },
];

export function ProductDetailView({
  product,
  taxSettings,
  materials,
  warehouses,
  stockLevels,
  unitSettings,
  onBack,
  onEdit,
  onRegisterMovement,
  onRegisterProduction,
}: ProductDetailViewProps) {
  const unitCatalog = useUnitCatalog();
  const [section, setSection] = useState<DetailSection>('costos');
  const monthlyRevenue = product.suggestedPrice * product.productionUnits;
  const monthlyGross = product.profitPerUnit * product.productionUnits;
  const taxes = calculateMonthlyTaxProjection(monthlyRevenue, monthlyGross, taxSettings);
  const canProduce =
    product.productType === 'elaborated' && product.recipe && product.recipe.length > 0;

  const visibleSections = SECTIONS.filter((s) => s.id !== 'produccion' || canProduce);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onEdit} className="ml-auto">
          <Edit2 className="w-4 h-4" />
          Editar ficha
        </Button>
      </div>

      <Card className="!p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted bg-surface-muted px-2 py-0.5 rounded-full">
                {PRODUCT_TYPE_LABELS[product.productType ?? 'simple']}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted">
              <span>
                Costo:{' '}
                <strong className="text-foreground">{formatCurrency(product.totalUnitCost)}</strong>
              </span>
              <span>
                Margen:{' '}
                <strong className="text-brand">{formatPercent(product.grossMarginPercent)}</strong>
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-semibold uppercase text-muted">Precio sugerido</p>
            <p className="text-2xl font-black text-brand tabular-nums">
              {formatCurrency(product.suggestedPrice)}
            </p>
            <CurrencyEquivalentsOnly cupAmount={product.suggestedPrice} className="mt-0.5" />
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleSections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            aria-current={section === id ? 'true' : undefined}
            className={`shrink-0 min-h-11 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors active:scale-[0.98] ${
              section === id
                ? 'border-brand bg-brand-muted text-brand-foreground'
                : 'border-border text-muted hover:text-foreground'
            }`}
          >
            {id === 'produccion' && <Factory className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
            {label}
          </button>
        ))}
      </div>

      {section === 'costos' && (
        <Card className="!p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
              Desglose de costos
            </p>
            <div className="space-y-1.5 text-sm">
              {product.recipeBreakdown?.map((rm) => (
                <div key={rm.rawMaterialId} className="flex justify-between gap-2">
                  <span className="text-muted truncate">
                    {rm.name}{' '}
                    <span className="text-xs">
                      ({rm.quantity}{' '}
                      {rm.unitType ? unitCatalog.getShortLabel(rm.unitType) : ''} ×{' '}
                      {formatCurrency(rm.unitCost)})
                    </span>
                  </span>
                  <span className="font-medium tabular-nums shrink-0">
                    {formatCurrency(rm.lineCost)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted">Costo directo unitario</span>
                <span className="font-medium">{formatCurrency(product.unitCost)}</span>
              </div>
              {product.indirectBreakdown.map((ic, idx) => (
                <div key={idx} className="flex justify-between gap-2">
                  <span className="text-muted truncate">
                    {ic.name}{' '}
                    <span className="text-xs">({DISTRIBUTION_CRITERIA_SHORT[ic.criteria]})</span>
                  </span>
                  <span className="font-medium tabular-nums shrink-0">
                    {formatCurrency(ic.perUnit)}
                  </span>
                </div>
              ))}
              {product.laborShareBreakdown.map((item) => (
                <div key={item.roleId} className="flex justify-between gap-2">
                  <span className="text-muted truncate">
                    {item.name}{' '}
                    <span className="text-xs">({formatPercent(item.percentOfSale)} venta)</span>
                  </span>
                  <span className="font-medium tabular-nums shrink-0">
                    {formatCurrency(item.perUnit)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t border-border">
                <span>Costo total unitario</span>
                <span>{formatCurrency(product.totalUnitCost)}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
              Sensibilidad al tipo de cambio
            </p>
            <p className="text-xs text-muted mb-3">
              Escenarios si varía la referencia TRMI del USD. Tu tasa real de compra puede diferir.
            </p>
            <MarginSensitivityTable product={product} materials={materials} />
          </div>

          {product.productionUnits > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                Proyección mensual ({product.productionUnits} uds./mes)
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Ingresos proyectados</span>
                  <span className="font-medium text-brand">{formatCurrency(monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Utilidad bruta</span>
                  <span className="font-medium text-brand">{formatCurrency(monthlyGross)}</span>
                </div>
                {hasActiveTaxes(taxSettings) && taxes.totalTaxes > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Después de impuestos estimados</span>
                    <span className="font-medium">{formatCurrency(taxes.netProfit)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {section === 'stock' && (
        <ProductStockSection
          product={product}
          warehouses={warehouses}
          stockLevels={stockLevels}
          onRegisterMovement={onRegisterMovement}
        />
      )}

      {section === 'produccion' && canProduce && (
        <ProductionSection
          product={product}
          materials={materials}
          warehouses={warehouses}
          unitSettings={unitSettings}
          onProduce={onRegisterProduction}
        />
      )}
    </div>
  );
}
