/** Sections that stay inside the Ajustes tab (calculation preferences only). */
export type SettingsSectionId = 'taxes' | 'fund' | 'labor' | 'indirect' | 'units';

export interface SettingsSectionMeta {
  id: SettingsSectionId;
  label: string;
}

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  { id: 'taxes', label: 'Impuestos' },
  { id: 'fund', label: 'Fondo' },
  { id: 'labor', label: 'Salarios' },
  { id: 'indirect', label: 'Gastos' },
  { id: 'units', label: 'Unidades' },
];

export function getDefaultSettingsSection(): SettingsSectionId {
  return 'taxes';
}
