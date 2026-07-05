export type AppTab = 'products' | 'raw-materials' | 'warehouses' | 'settings';

export interface NavItemMeta {
  id: AppTab;
  label: string;
  title: string;
  description: string;
}

export const NAV_ITEMS: NavItemMeta[] = [
  {
    id: 'products',
    label: 'Productos',
    title: 'Productos',
    description: 'Fichas de costo, precios sugeridos y stock por almacén',
  },
  {
    id: 'raw-materials',
    label: 'Insumos',
    title: 'Materias primas',
    description: 'Registra insumos y controla el stock disponible',
  },
  {
    id: 'warehouses',
    label: 'Almacén',
    title: 'Almacenes',
    description: 'Stock actual, movimientos y alertas de inventario',
  },
  {
    id: 'settings',
    label: 'Ajustes',
    title: 'Ajustes',
    description: 'Impuestos, gastos, unidades de medida y respaldo',
  },
];

export const NAV_BY_ID = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item])) as Record<
  AppTab,
  NavItemMeta
>;

export function getNavItemsForAccess(accessLevel?: import('../auth/types').AccessLevel): NavItemMeta[] {
  if (!accessLevel || accessLevel === 'full') {
    return NAV_ITEMS;
  }
  return NAV_ITEMS.filter((item) => item.id !== 'warehouses');
}
