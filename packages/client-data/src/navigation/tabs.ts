export type AppTab =
  | 'home'
  | 'products'
  | 'raw-materials'
  | 'warehouses'
  | 'locations'
  | 'reconciliation'
  | 'exchange'
  | 'backup'
  | 'settings'
  | 'account';

export interface NavItemMeta {
  id: AppTab;
  label: string;
  title: string;
  description: string;
}

export interface NavGroupMeta {
  id: 'principal' | 'inventory' | 'operations' | 'business' | 'account';
  label: string;
  items: AppTab[];
}

export const NAV_ITEMS: NavItemMeta[] = [
  {
    id: 'home',
    label: 'Inicio',
    title: 'Inicio',
    description: 'Resumen del negocio, alertas y accesos rápidos',
  },
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
    label: 'Almacenes',
    title: 'Almacenes',
    description: 'Stock actual, movimientos y alertas de inventario',
  },
  {
    id: 'locations',
    label: 'Locales',
    title: 'Locales',
    description: 'Sucursales y puntos de venta de tu negocio',
  },
  {
    id: 'reconciliation',
    label: 'Conciliación',
    title: 'Conciliación',
    description: 'Ventas POS vs movimientos de inventario',
  },
  {
    id: 'exchange',
    label: 'Tasas',
    title: 'Tasas de cambio',
    description: 'Tipos de cambio para costos y precios',
  },
  {
    id: 'backup',
    label: 'Respaldo',
    title: 'Respaldo y sincronización',
    description: 'Exportar, importar y sincronizar con la nube',
  },
  {
    id: 'settings',
    label: 'Parámetros de costo',
    title: 'Parámetros de costo',
    description: 'Impuestos, fondo, salarios, gastos y unidades para el cálculo',
  },
  {
    id: 'account',
    label: 'Cuenta',
    title: 'Cuenta',
    description: 'Perfil, suscripción y acceso al negocio',
  },
];

export const NAV_GROUPS: NavGroupMeta[] = [
  {
    id: 'principal',
    label: 'Principal',
    items: ['home'],
  },
  {
    id: 'inventory',
    label: 'Inventario',
    items: ['products', 'raw-materials', 'warehouses'],
  },
  {
    id: 'operations',
    label: 'Operaciones',
    items: ['locations', 'reconciliation'],
  },
  {
    id: 'business',
    label: 'Negocio',
    items: ['exchange', 'settings', 'backup'],
  },
  {
    id: 'account',
    label: 'Cuenta',
    items: ['account'],
  },
];

/** Bottom bar — primary destinations only; rest live in the sidebar / Más menu. */
export const PRIMARY_BOTTOM_TAB_IDS: AppTab[] = ['home', 'products', 'warehouses'];

export const NAV_BY_ID = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item])) as Record<
  AppTab,
  NavItemMeta
>;

export function getNavItemsForAccess(
  _accessLevel?: import('../auth/types').AccessLevel
): NavItemMeta[] {
  return NAV_ITEMS;
}

export function getNavGroupsForAccess(
  accessLevel?: import('../auth/types').AccessLevel
): NavGroupMeta[] {
  const items = getNavItemsForAccess(accessLevel);
  const visible = new Set(items.map((item) => item.id));
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((id) => visible.has(id)),
  })).filter((group) => group.items.length > 0);
}

/** Groups shown in the main sidebar scroll area (account rendered in footer). */
export function getMainNavGroupsForAccess(
  accessLevel?: import('../auth/types').AccessLevel
): NavGroupMeta[] {
  return getNavGroupsForAccess(accessLevel).filter((group) => group.id !== 'account');
}

export function getAccountNavGroupForAccess(
  accessLevel?: import('../auth/types').AccessLevel
): NavGroupMeta | null {
  return getNavGroupsForAccess(accessLevel).find((group) => group.id === 'account') ?? null;
}
