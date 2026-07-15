export type SettingsSectionId =
  | 'taxes'
  | 'fund'
  | 'labor'
  | 'indirect'
  | 'units'
  | 'exchange'
  | 'locations'
  | 'reconciliation'
  | 'sync'
  | 'account'
  | 'subscription';

export interface SettingsSectionMeta {
  id: SettingsSectionId;
  label: string;
}

export interface SettingsSectionGroup {
  id: 'calculation' | 'operations' | 'account';
  label: string;
  sections: SettingsSectionMeta[];
}

const CALCULATION_SECTIONS: SettingsSectionMeta[] = [
  { id: 'taxes', label: 'Impuestos' },
  { id: 'fund', label: 'Fondo' },
  { id: 'labor', label: 'Salarios' },
  { id: 'indirect', label: 'Gastos' },
  { id: 'units', label: 'Unidades' },
  { id: 'exchange', label: 'Tasas' },
];

const OPERATIONS_SECTIONS: SettingsSectionMeta[] = [
  { id: 'locations', label: 'Locales' },
  { id: 'reconciliation', label: 'Conciliación' },
  { id: 'sync', label: 'Respaldo' },
];

const ACCOUNT_SECTIONS: SettingsSectionMeta[] = [
  { id: 'subscription', label: 'Suscripción' },
  { id: 'account', label: 'Cuenta' },
];

export function getSettingsSectionGroups(options?: {
  includeSubscription?: boolean;
}): SettingsSectionGroup[] {
  const includeSubscription = options?.includeSubscription ?? false;
  const accountSections = includeSubscription
    ? ACCOUNT_SECTIONS
    : ACCOUNT_SECTIONS.filter((section) => section.id !== 'subscription');

  return [
    { id: 'calculation', label: 'Cálculo y costos', sections: CALCULATION_SECTIONS },
    { id: 'operations', label: 'Operaciones', sections: OPERATIONS_SECTIONS },
    { id: 'account', label: 'Cuenta', sections: accountSections },
  ];
}

export function flattenSettingsSections(groups: SettingsSectionGroup[]): SettingsSectionMeta[] {
  return groups.flatMap((group) => group.sections);
}

export function getDefaultSettingsSection(includeSubscription?: boolean): SettingsSectionId {
  return includeSubscription ? 'subscription' : 'taxes';
}
