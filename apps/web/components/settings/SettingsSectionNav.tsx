'use client';

import { useMemo, useState } from 'react';
import {
  getDefaultSettingsSection,
  getSettingsSectionGroups,
  type SettingsSectionId,
} from '@costify/client-data';
import { cn } from '@/lib/utils';

interface SettingsSectionPickerProps {
  value: SettingsSectionId;
  onChange: (section: SettingsSectionId) => void;
  includeSubscription?: boolean;
  className?: string;
}

export function SettingsSectionPicker({
  value,
  onChange,
  includeSubscription = false,
  className,
}: SettingsSectionPickerProps) {
  const groups = useMemo(
    () => getSettingsSectionGroups({ includeSubscription }),
    [includeSubscription]
  );

  return (
    <label className={cn('block lg:hidden', className)}>
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">Sección</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SettingsSectionId)}
        className="w-full min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium"
      >
        {groups.map((group) => (
          <optgroup key={group.id} label={group.label}>
            {group.sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

interface SettingsSectionNavProps {
  value: SettingsSectionId;
  onChange: (section: SettingsSectionId) => void;
  includeSubscription?: boolean;
  icons: Record<SettingsSectionId, React.ComponentType<{ className?: string }>>;
  className?: string;
}

export function SettingsSectionNav({
  value,
  onChange,
  includeSubscription = false,
  icons,
  className,
}: SettingsSectionNavProps) {
  const groups = useMemo(
    () => getSettingsSectionGroups({ includeSubscription }),
    [includeSubscription]
  );

  return (
    <nav className={cn('hidden lg:flex flex-col gap-5', className)} aria-label="Secciones de ajustes">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-col gap-1">
            {group.sections.map((section) => {
              const Icon = icons[section.id];
              const active = value === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onChange(section.id)}
                  className={cn(
                    'w-full min-h-10 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-muted text-brand-foreground border border-brand/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function useSettingsSections(includeSubscription: boolean) {
  const groups = useMemo(
    () => getSettingsSectionGroups({ includeSubscription }),
    [includeSubscription]
  );
  const defaultSection = getDefaultSettingsSection(includeSubscription);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(defaultSection);
  return { groups, defaultSection, activeSection, setActiveSection };
}
