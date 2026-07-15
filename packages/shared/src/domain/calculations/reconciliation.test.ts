import { describe, expect, it } from 'vitest';
import { calculateReconciliationReport } from './reconciliation';
import type { ProductCalculation } from '../types';
import type { SaleRecord } from '../sales';

const product: ProductCalculation = {
  id: 'p1',
  name: 'Cerveza',
  posSku: 'CERVEZA_350',
  productType: 'simple',
  purchasePrice: 100,
  purchaseUnit: 'unidad',
  packageQuantity: 1,
  productionUnits: 100,
  indirectCosts: [],
  profitMargin: 20,
  marginType: 'markup',
  unitCost: 100,
  totalIndirectPerUnit: 0,
  totalUnitCost: 100,
  totalLaborSharePerUnit: 0,
  totalLaborSharePercent: 0,
  laborShareBreakdown: [],
  suggestedPrice: 120,
  profitPerUnit: 20,
  grossMarginPercent: 16.67,
  indirectBreakdown: [],
  timestamp: 1,
};

describe('reconciliation', () => {
  it('flags when sales exceed stock outflows', () => {
    const sales: SaleRecord[] = [
      {
        id: 's1',
        locationId: 'loc1',
        soldAt: Date.parse('2026-07-14'),
        source: 'import',
        lines: [{ productId: 'p1', quantity: 10, unitPrice: 250 }],
      },
    ];

    const report = calculateReconciliationReport({
      sales,
      stockMovements: [],
      products: [product],
      locationId: 'loc1',
      from: Date.parse('2026-07-01'),
      to: Date.parse('2026-07-31'),
    });

    expect(report.variances[0]?.soldQty).toBe(10);
    expect(report.variances[0]?.stockOutQty).toBe(0);
    expect(report.variances[0]?.severity).toBe('critical');
  });
});
