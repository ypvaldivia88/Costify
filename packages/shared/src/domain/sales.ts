export interface SaleLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export type SaleSource = 'manual' | 'import';

export interface SaleRecord {
  id: string;
  locationId: string;
  lines: SaleLine[];
  soldAt: number;
  source: SaleSource;
  note?: string;
}

export interface SaleCsvRow {
  date: string;
  locationCode: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface ParsedSaleImport {
  rows: SaleCsvRow[];
  errors: string[];
}

const CSV_HEADER = 'date,location_code,sku,quantity,unit_price';

export function getSaleCsvTemplate(): string {
  return `${CSV_HEADER}\n2026-07-14,MAIN,CERVEZA_350,12,250`;
}

export function parseSaleCsv(content: string): ParsedSaleImport {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ['El archivo está vacío.'] };
  }

  const header = lines[0]!.toLowerCase().replace(/\s+/g, '');
  const expected = CSV_HEADER.replace(/\s+/g, '');
  if (header !== expected) {
    return {
      rows: [],
      errors: [`Encabezado inválido. Se esperaba: ${CSV_HEADER}`],
    };
  }

  const rows: SaleCsvRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(',').map((part) => part.trim());
    if (parts.length < 5) {
      errors.push(`Línea ${i + 1}: faltan columnas.`);
      continue;
    }
    const [date, locationCode, sku, quantityRaw, unitPriceRaw] = parts;
    const quantity = Number(quantityRaw);
    const unitPrice = Number(unitPriceRaw);
    if (!date || !locationCode || !sku) {
      errors.push(`Línea ${i + 1}: fecha, local o SKU vacíos.`);
      continue;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push(`Línea ${i + 1}: cantidad inválida.`);
      continue;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      errors.push(`Línea ${i + 1}: precio inválido.`);
      continue;
    }
    rows.push({ date, locationCode, sku, quantity, unitPrice });
  }

  return { rows, errors };
}

export function groupSaleCsvRowsIntoRecords(
  rows: SaleCsvRow[],
  resolveLocationId: (locationCode: string) => string | undefined,
  resolveProductId: (sku: string) => string | undefined,
  createId: () => string
): { records: SaleRecord[]; errors: string[] } {
  const errors: string[] = [];
  const groups = new Map<string, SaleRecord>();

  for (const row of rows) {
    const locationId = resolveLocationId(row.locationCode);
    if (!locationId) {
      errors.push(`Local desconocido: ${row.locationCode}`);
      continue;
    }
    const productId = resolveProductId(row.sku);
    if (!productId) {
      errors.push(`SKU sin producto: ${row.sku}`);
      continue;
    }
    const soldAt = Date.parse(row.date);
    if (!Number.isFinite(soldAt)) {
      errors.push(`Fecha inválida: ${row.date}`);
      continue;
    }
    const dayKey = `${locationId}:${row.date}`;
    let record = groups.get(dayKey);
    if (!record) {
      record = {
        id: createId(),
        locationId,
        lines: [],
        soldAt,
        source: 'import',
      };
      groups.set(dayKey, record);
    }
    record.lines.push({
      productId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
    });
  }

  return { records: Array.from(groups.values()), errors };
}
