import type { LucideIcon } from 'lucide-react';
import { Boxes, Calculator, LayoutList, Settings, Warehouse } from 'lucide-react';

export type AppTab = 'calculator' | 'raw-materials' | 'warehouses' | 'inventory' | 'settings';

export interface NavItem {
  id: AppTab;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'warehouses',
    label: 'Almacén',
    title: 'Almacenes',
    description: 'Stock actual, movimientos y alertas de inventario',
    icon: Warehouse,
  },
  {
    id: 'raw-materials',
    label: 'Insumos',
    title: 'Materias primas',
    description: 'Registra insumos y controla el stock disponible',
    icon: Boxes,
  },
  {
    id: 'calculator',
    label: 'Calcular',
    title: 'Calcular precio',
    description: 'Crea fichas de costos y obtén el precio de venta sugerido',
    icon: Calculator,
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
    description: 'Impuestos, gastos, unidades de medida y respaldo',
    icon: Settings,
  },
];

export const NAV_BY_ID = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item])) as Record<
  AppTab,
  NavItem
>;
