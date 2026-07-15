import {
  Boxes,
  Database,
  DollarSign,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Package,
  Scale,
  Settings,
  User,
  Warehouse,
} from 'lucide-react-native';
import {
  NAV_ITEMS as NAV_META,
  NAV_BY_ID as NAV_META_BY_ID,
  NAV_GROUPS,
  PRIMARY_BOTTOM_TAB_IDS,
  getNavGroupsForAccess,
  type AppTab,
  type NavItemMeta,
} from '@costify/client-data';

export type { AppTab };

const ICONS = {
  home: LayoutDashboard,
  products: Package,
  'raw-materials': Boxes,
  warehouses: Warehouse,
  locations: MapPin,
  reconciliation: Scale,
  exchange: DollarSign,
  backup: Database,
  settings: Settings,
  account: User,
  menu: LayoutGrid,
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

export { NAV_ITEMS as NAV_META, NAV_BY_ID as NAV_META_BY_ID };
export {
  NAV_GROUPS,
  PRIMARY_BOTTOM_TAB_IDS,
  getNavGroupsForAccess,
  getNavItemsForAccess,
} from '@costify/client-data';
