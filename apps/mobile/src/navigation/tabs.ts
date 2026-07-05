import { Boxes, Package, Settings, Warehouse } from 'lucide-react-native';
import {
  NAV_ITEMS as NAV_META,
  NAV_BY_ID as NAV_META_BY_ID,
  type AppTab,
  type NavItemMeta,
} from '@costify/client-data';

export type { AppTab };

const ICONS = {
  products: Package,
  'raw-materials': Boxes,
  warehouses: Warehouse,
  settings: Settings,
} as const;

export interface NavItem extends NavItemMeta {
  icon: (typeof ICONS)[AppTab];
}

export const NAV_ITEMS: NavItem[] = NAV_META.map((item) => ({
  ...item,
  icon: ICONS[item.id],
}));

export const NAV_BY_ID = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item])) as Record<
  AppTab,
  NavItem
>;

export { getNavItemsForAccess } from '@costify/client-data';
