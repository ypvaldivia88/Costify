import { describe, expect, it } from 'vitest';
import { groupSaleCsvRowsIntoRecords, parseSaleCsv } from './sales';

describe('sale csv import', () => {
  it('parses valid rows', () => {
    const csv = `date,location_code,sku,quantity,unit_price
2026-07-14,MAIN,CERVEZA_350,12,250`;
    const parsed = parseSaleCsv(csv);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.sku).toBe('CERVEZA_350');
  });

  it('groups rows into sale records', () => {
    const rows = [
      { date: '2026-07-14', locationCode: 'MAIN', sku: 'A', quantity: 2, unitPrice: 10 },
      { date: '2026-07-14', locationCode: 'MAIN', sku: 'B', quantity: 1, unitPrice: 5 },
    ];
    const result = groupSaleCsvRowsIntoRecords(
      rows,
      () => 'loc1',
      (sku) => (sku === 'A' ? 'p1' : sku === 'B' ? 'p2' : undefined),
      () => 'sale-1'
    );
    expect(result.errors).toHaveLength(0);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.lines).toHaveLength(2);
  });
});
