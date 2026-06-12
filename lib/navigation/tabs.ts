import type { LucideIcon } from 'lucide-react';
import { Boxes, Calculator, LayoutList, Settings } from 'lucide-react';

export type AppTab = 'calculator' | 'raw-materials' | 'inventory' | 'settings';

export interface NavItem {
  id: AppTab;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'calculator',
    label: 'Calcular',
    title: 'Calcular precio',
    description: 'Crea fichas de costos y obtén el precio de venta sugerido',
    icon: Calculator,
  },
  {
    id: 'raw-materials',
    label: 'Insumos',
    title: 'Materias primas',
    description: 'Registra insumos y controla el stock disponible',
    icon: Boxes,
  },
  {
    id: 'inventory',
    label: 'Historial',
    title: 'Historial',
    description: 'Productos guardados y resumen del negocio',
    icon: LayoutList,
  },
  {
    id: 'settings',
    label: 'Ajustes',
    title: 'Ajustes',
    description: 'Respaldo, gastos globales, fondo e impuestos',
    icon: Settings,
  },
];

export const NAV_BY_ID = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item])) as Record<
  AppTab,
  NavItem
>;
