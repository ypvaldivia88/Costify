export const RESTAURANT_DISCOVERY_CHECKLIST = [
  'Foto de un ticket de venta real (con productos visibles)',
  'Foto o export del cierre Z / reporte diario de caja',
  '¿La caja permite ventas libres o solo catálogo cerrado?',
  'Marca y modelo de la registradora en cada local',
  '¿Los 3 locales usan la misma marca de caja?',
  '¿Con qué frecuencia hacen conteo físico de inventario?',
  '¿Quién tiene llave para anular ventas o abrir caja?',
  '¿Cuántos locales quiere bajo una misma cuenta Costify?',
  '¿Qué productos son los más afectados por fuga (bebidas, snacks, etc.)?',
] as const;

export function formatDiscoveryChecklistMarkdown(): string {
  return [
    '# Checklist — reunión control de caja (restaurante / bar)',
    '',
    ...RESTAURANT_DISCOVERY_CHECKLIST.map((item, index) => `${index + 1}. ${item}`),
    '',
    'Traer muestras ayuda a definir si importamos CSV, foto del Z o integración directa.',
  ].join('\n');
}
