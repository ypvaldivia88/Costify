import type { ProductCalculation, StockMovement } from '../types';
import type { SaleRecord } from '../sales';

export type ReconciliationSeverity = 'ok' | 'warning' | 'critical';

export interface ReconciliationVariance {
  productId: string;
  productName: string;
  posSku?: string;
  soldQty: number;
  stockOutQty: number;
  delta: number;
  severity: ReconciliationSeverity;
}

export interface ReconciliationReport {
  locationId: string;
  from: number;
  to: number;
  variances: ReconciliationVariance[];
  totalSoldQty: number;
  totalStockOutQty: number;
}

function severityForDelta(delta: number): ReconciliationSeverity {
  if (delta === 0) return 'ok';
  const abs = Math.abs(delta);
  if (abs <= 1) return 'warning';
  return 'critical';
}

export function calculateReconciliationReport(input: {
  sales: SaleRecord[];
  stockMovements: StockMovement[];
  products: ProductCalculation[];
  locationId: string;
  from: number;
  to: number;
}): ReconciliationReport {
  const { sales, stockMovements, products, locationId, from, to } = input;
  const productById = new Map(products.map((product) => [product.id, product]));

  const soldByProduct = new Map<string, number>();
  for (const sale of sales) {
    if (sale.locationId !== locationId) continue;
    if (sale.soldAt < from || sale.soldAt > to) continue;
    for (const line of sale.lines) {
      soldByProduct.set(line.productId, (soldByProduct.get(line.productId) ?? 0) + line.quantity);
    }
  }

  const stockOutByProduct = new Map<string, number>();
  for (const movement of stockMovements) {
    if (movement.locationId && movement.locationId !== locationId) continue;
    if (movement.timestamp < from || movement.timestamp > to) continue;
    const countsAsOut =
      movement.type === 'venta' || movement.type === 'salida' || movement.type === 'merma';
    if (!countsAsOut) continue;
    for (const line of movement.lines) {
      if (line.refType !== 'product') continue;
      stockOutByProduct.set(
        line.refId,
        (stockOutByProduct.get(line.refId) ?? 0) + Math.abs(line.quantity)
      );
    }
  }

  const productIds = new Set([...soldByProduct.keys(), ...stockOutByProduct.keys()]);
  const variances: ReconciliationVariance[] = [];

  for (const productId of productIds) {
    const soldQty = soldByProduct.get(productId) ?? 0;
    const stockOutQty = stockOutByProduct.get(productId) ?? 0;
    const delta = soldQty - stockOutQty;
    const product = productById.get(productId);
    variances.push({
      productId,
      productName: product?.name ?? productId,
      posSku: product?.posSku,
      soldQty,
      stockOutQty,
      delta,
      severity: severityForDelta(delta),
    });
  }

  variances.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    locationId,
    from,
    to,
    variances,
    totalSoldQty: variances.reduce((sum, item) => sum + item.soldQty, 0),
    totalStockOutQty: variances.reduce((sum, item) => sum + item.stockOutQty, 0),
  };
}
