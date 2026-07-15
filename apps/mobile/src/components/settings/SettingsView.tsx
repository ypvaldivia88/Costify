import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Percent, ChevronDown, ChevronUp, PiggyBank, Receipt, Ruler, Users } from 'lucide-react-native';
import type {
  GlobalFundSettings,
  IndirectCost,
  LaborShareSettings,
  ProductCalculation,
  RawMaterial,
  TaxSettings,
  UnitSettings,
} from '@costify/shared/domain/types';
import { SETTINGS_SECTIONS, type SettingsSectionId } from '@costify/client-data';
import { GlobalFundSettingsPanel } from '@/components/settings/GlobalFundSettings';
import { LaborShareSettingsPanel } from '@/components/settings/LaborShareSettings';
import { IndirectCostsSettings } from '@/components/settings/IndirectCostsSettings';
import { TaxSettingsPanel } from '@/components/settings/TaxSettingsPanel';
import { UnitSettingsPanel } from '@/components/settings/UnitSettingsPanel';
import { useTheme } from '@/context/ThemeContext';

const SETTINGS_ICONS: Record<SettingsSectionId, typeof Receipt> = {
  taxes: Receipt,
  fund: PiggyBank,
  labor: Users,
  indirect: Percent,
  units: Ruler,
};

interface SettingsViewProps {
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  laborShareSettings: LaborShareSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
  onSaveCosts: (costs: IndirectCost[]) => void;
  onUpdateGlobalFund: (updates: Partial<GlobalFundSettings>) => void;
  onUpdateLaborShareSettings: (updates: Partial<LaborShareSettings>) => void;
  onUpdateTaxSettings: (updates: Partial<TaxSettings>) => void;
  onSaveUnitSettings: (settings: UnitSettings) => void;
  onResetUnitSettings: () => void;
  initialSection?: SettingsSectionId;
  onInitialSectionConsumed?: () => void;
}

function AccordionSection({
  id,
  label,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  id: SettingsSectionId;
  label: string;
  icon: typeof Receipt;
  open: boolean;
  onToggle: (id: SettingsSectionId) => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { borderColor: colors.border }]}>
      <Pressable
        onPress={() => onToggle(id)}
        style={({ pressed }) => [
          styles.sectionTrigger,
          pressed ? { backgroundColor: colors.surfaceMuted } : null,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Icon size={18} color={colors.muted} />
        <Text style={[styles.sectionLabel, { color: colors.foreground, flex: 1 }]}>{label}</Text>
        {open ? (
          <ChevronUp size={18} color={colors.muted} />
        ) : (
          <ChevronDown size={18} color={colors.muted} />
        )}
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

export function SettingsView({
  inventory,
  rawMaterials,
  globalCosts,
  globalFund,
  laborShareSettings,
  taxSettings,
  unitSettings,
  onSaveCosts,
  onUpdateGlobalFund,
  onUpdateLaborShareSettings,
  onUpdateTaxSettings,
  onSaveUnitSettings,
  onResetUnitSettings,
  initialSection,
  onInitialSectionConsumed,
}: SettingsViewProps) {
  const { colors } = useTheme();
  const [openSection, setOpenSection] = useState<SettingsSectionId | null>(
    initialSection ?? 'taxes'
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!initialSection) return;
    setOpenSection(initialSection);
    onInitialSectionConsumed?.();
  }, [initialSection, onInitialSectionConsumed]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const toggleSection = (id: SettingsSectionId) => {
    setOpenSection((current) => (current === id ? null : id));
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        keyboardHeight > 0 ? { paddingBottom: keyboardHeight + 24 } : null,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={[styles.intro, { color: colors.muted }]}>
        Estos valores se aplican al calcular costos de todos los productos.
      </Text>

      <View style={[styles.accordion, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = SETTINGS_ICONS[section.id];
          const open = openSection === section.id;
          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              label={section.label}
              icon={Icon}
              open={open}
              onToggle={toggleSection}
            >
              {section.id === 'taxes' ? (
                <TaxSettingsPanel settings={taxSettings} onChange={onUpdateTaxSettings} />
              ) : null}
              {section.id === 'fund' ? (
                <GlobalFundSettingsPanel settings={globalFund} onChange={onUpdateGlobalFund} />
              ) : null}
              {section.id === 'labor' ? (
                <LaborShareSettingsPanel
                  settings={laborShareSettings}
                  onChange={onUpdateLaborShareSettings}
                />
              ) : null}
              {section.id === 'indirect' ? (
                <IndirectCostsSettings costs={globalCosts} onSave={onSaveCosts} />
              ) : null}
              {section.id === 'units' ? (
                <UnitSettingsPanel
                  settings={unitSettings}
                  rawMaterials={rawMaterials}
                  inventory={inventory}
                  onSave={onSaveUnitSettings}
                  onReset={onResetUnitSettings}
                />
              ) : null}
            </AccordionSection>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  intro: { fontSize: 14, lineHeight: 20 },
  accordion: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  section: { borderBottomWidth: 1 },
  sectionTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
  },
  sectionLabel: { fontSize: 15, fontWeight: '600' },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 16 },
});
