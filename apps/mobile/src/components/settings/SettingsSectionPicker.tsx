import { useMemo } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
  getSettingsSectionGroups,
  type SettingsSectionId,
} from '@costify/client-data';
import { Select } from '@/components/ui/Select';

interface SettingsSectionPickerProps {
  value: SettingsSectionId;
  onChange: (section: SettingsSectionId) => void;
  includeSubscription?: boolean;
}

export function SettingsSectionPicker({
  value,
  onChange,
  includeSubscription = false,
}: SettingsSectionPickerProps) {
  const groups = useMemo(
    () => getSettingsSectionGroups({ includeSubscription }),
    [includeSubscription]
  );
  const groupLabel = useMemo(() => {
    for (const group of groups) {
      if (group.sections.some((section) => section.id === value)) {
        return group.label;
      }
    }
    return '';
  }, [groups, value]);

  return (
    <Select
      label={`Sección · ${groupLabel}`}
      value={value}
      onValueChange={(next) => onChange(next as SettingsSectionId)}
    >
      {groups.map((group) =>
        group.sections.map((section) => (
          <Picker.Item
            key={section.id}
            label={`${group.label} · ${section.label}`}
            value={section.id}
          />
        ))
      )}
    </Select>
  );
}
