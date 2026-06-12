const NUMERIC_PARTIAL_PATTERN = /^-?\d*\.?\d*$/;

/** Permite vacío, "0.", "0.025", etc. mientras se escribe. */
export function isNumericPartial(raw: string): boolean {
  const normalized = raw.replace(',', '.');
  return normalized === '' || NUMERIC_PARTIAL_PATTERN.test(normalized);
}

/** Convierte texto a número; valores parciales devuelven 0 para cálculos. */
export function parseNumericInput(raw: string): number {
  const normalized = raw.replace(',', '.').trim();
  if (normalized === '' || normalized === '.' || normalized === '-' || normalized === '-.') {
    return 0;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Formatea un número para mostrar cuando el campo no tiene foco. */
export function formatNumericDisplay(value: number): string {
  if (value === 0) return '';
  return String(value);
}

/** @deprecated Usar NumericInput con estado de texto interno. */
export function formatNumericInput(value: number): string {
  return formatNumericDisplay(value);
}
