'use client';

import {
  Boxes,
  Database,
  DollarSign,
  LayoutDashboard,
  MapPin,
  Package,
  Scale,
  Settings,
  User,
  Warehouse,
} from 'lucide-react';
import {
  NAV_ITEMS as NAV_META,
  NAV_BY_ID as NAV_META_BY_ID,
  type AppTab,
  type NavItemMeta,
} from '@costify/client-data';

export type { AppTab };

const ICONS: Record<AppTab, typeof Package> = {
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
};

export interface NavItem extends NavItemMeta {
  icon: typeof Package;
}

export const NAV_ITEMS: NavItem[] = NAV_META.map((item) => ({
  ...item,
  icon: ICONS[item.id],
}));

export const NAV_BY_ID = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item])) as Record<
  AppTab,
  NavItem
>;

export { NAV_META, NAV_META_BY_ID };
