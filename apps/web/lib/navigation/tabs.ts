'use client';

import { Boxes, Package, Settings, Warehouse, type LucideIcon } from 'lucide-react';
import {
  NAV_ITEMS as NAV_META,
  NAV_BY_ID as NAV_META_BY_ID,
  type AppTab,
  type NavItemMeta,
} from '@costify/client-data';

export type { AppTab };

const ICONS: Record<AppTab, LucideIcon> = {
  products: Package,
  'raw-materials': Boxes,
  warehouses: Warehouse,
  settings: Settings,
};

export interface NavItem extends NavItemMeta {
  icon: LucideIcon;
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
