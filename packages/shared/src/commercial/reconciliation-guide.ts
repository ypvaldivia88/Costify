/** In-app guidance for sales reconciliation (replaces client discovery checklist). */
export const RECONCILIATION_GUIDE_ITEMS = [
  {
    title: 'Configura locales y SKU',
    description:
      'En cada producto, completa el campo SKU POS. Debe coincidir con el código que exporta tu caja.',
  },
  {
    title: 'Importa ventas del POS',
    description:
      'Pega o importa un CSV con columnas fecha, local, SKU y cantidad vendida. Usa la plantilla del panel.',
  },
  {
    title: 'Registra salidas de inventario',
    description:
      'Cada venta debería tener un movimiento de salida en almacén. Regístralos en Almacenes → Movimientos.',
  },
  {
    title: 'Revisa diferencias',
    description:
      'La tabla compara unidades vendidas (POS) vs salidas de stock. Diferencias en rojo requieren revisión.',
  },
  {
    title: 'Ventana de 30 días',
    description:
      'La conciliación analiza los últimos 30 días. Importa ventas recientes para mantener el cuadre al día.',
  },
] as const;
