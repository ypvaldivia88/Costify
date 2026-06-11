/** Display value for controlled number inputs (allows clearing while editing). */
export function formatNumericInput(value: number): string {
  return value === 0 ? '' : String(value);
}

/** Parse raw input without min/max coercion so the field can be cleared. */
export function parseNumericInput(raw: string): number {
  if (raw === '') return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
