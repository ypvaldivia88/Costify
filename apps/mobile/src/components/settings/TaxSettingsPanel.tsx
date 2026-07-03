import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Plus, Receipt, Trash2 } from 'lucide-react-native';
import type { TaxLine, TaxLineBase, TaxSector, TaxSettings } from '@costify/shared/domain/types';
import {
  TAX_LINE_BASE_LABELS,
  TAX_SECTOR_DESCRIPTIONS,
  TAX_SECTOR_LABELS,
  createTaxSettingsForSector,
} from '@costify/shared/domain/tax-presets';
import { Card } from '@/components/ui/Card';
import { NumericField } from '@/components/ui/NumericField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useTheme } from '@/context/ThemeContext';

interface TaxSettingsPanelProps {
  settings: TaxSettings;
  onChange: (updates: Partial<TaxSettings>) => void;
}

const SECTOR_OPTIONS: TaxSector[] = ['none', 'tcp', 'mipyme', 'cna', 'custom'];

function updateLine(lines: TaxLine[], id: string, patch: Partial<TaxLine>): TaxLine[] {
  return lines.map((line) => (line.id === id ? { ...line, ...patch } : line));
}

export function TaxSettingsPanel({ settings, onChange }: TaxSettingsPanelProps) {
  const { colors } = useTheme();

  const handleSectorChange = (sector: TaxSector) => {
    onChange(createTaxSettingsForSector(sector, settings));
  };

  const handleLineChange = (id: string, patch: Partial<TaxLine>) => {
    onChange({
      lines: updateLine(settings.lines, id, patch),
      sector: 'custom',
    });
  };

  const addCustomLine = () => {
    const newLine: TaxLine = {
      id: `custom-${Date.now()}`,
      name: 'Impuesto adicional',
      enabled: true,
      ratePercent: 0,
      base: 'revenue',
    };
    onChange({ sector: 'custom', lines: [...settings.lines, newLine] });
  };

  const removeLine = (id: string) => {
    onChange({
      sector: 'custom',
      lines: settings.lines.filter((line) => line.id !== id),
    });
  };

  const showLines = settings.enabled && settings.sector !== 'none';

  return (
    <Card>
      <SectionHeader
        icon={Receipt}
        title="Impuestos (Cuba)"
        description="Sector tributario y tasas editables según normativa vigente"
      />

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>
            Incluir estimación de impuestos
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
            Desactiva para omitir impuestos en proyecciones y precios.
          </Text>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={(enabled) => {
            if (enabled && settings.sector === 'none') {
              onChange(createTaxSettingsForSector('mipyme'));
              return;
            }
            onChange({ enabled });
          }}
          trackColor={{ true: colors.brand, false: colors.border }}
        />
      </View>

      {settings.enabled ? (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Sector / forma de gestión</Text>
          <View style={[styles.pickerWrap, { borderColor: colors.border }]}>
            <Picker
              selectedValue={settings.sector}
              onValueChange={(value) => handleSectorChange(value as TaxSector)}
              style={{ color: colors.foreground }}
            >
              {SECTOR_OPTIONS.map((sector) => (
                <Picker.Item key={sector} label={TAX_SECTOR_LABELS[sector]} value={sector} />
              ))}
            </Picker>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
            {TAX_SECTOR_DESCRIPTIONS[settings.sector]}
          </Text>

          {showLines ? (
            <View style={styles.lines}>
              <Text style={[styles.linesTitle, { color: colors.muted }]}>Líneas de impuesto</Text>
              {settings.lines.map((line) => (
                <View
                  key={line.id}
                  style={[styles.lineCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                >
                  <View style={styles.lineHeader}>
                    <Switch
                      value={line.enabled}
                      onValueChange={(enabled) => handleLineChange(line.id, { enabled })}
                      trackColor={{ true: colors.brand, false: colors.border }}
                    />
                    <TextInput
                      value={line.name}
                      onChangeText={(name) => handleLineChange(line.id, { name })}
                      style={[styles.lineName, { color: colors.foreground, borderColor: colors.border }]}
                    />
                    {settings.sector === 'custom' && settings.lines.length > 1 ? (
                      <Pressable onPress={() => removeLine(line.id)}>
                        <Trash2 size={18} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={styles.lineGrid}>
                    <View style={styles.half}>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>Tasa (%)</Text>
                      <NumericField
                        value={line.ratePercent}
                        onChange={(ratePercent) => handleLineChange(line.id, { ratePercent })}
                      />
                    </View>
                    <View style={styles.half}>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>Base de cálculo</Text>
                      <View style={[styles.pickerWrap, { borderColor: colors.border }]}>
                        <Picker
                          selectedValue={line.base}
                          onValueChange={(value) =>
                            handleLineChange(line.id, { base: value as TaxLineBase })
                          }
                          style={{ color: colors.foreground }}
                        >
                          {(Object.entries(TAX_LINE_BASE_LABELS) as [TaxLineBase, string][]).map(
                            ([value, label]) => (
                              <Picker.Item key={value} label={label} value={value} />
                            )
                          )}
                        </Picker>
                      </View>
                    </View>
                  </View>
                  {line.base === 'revenueExcess' ? (
                    <View>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>Umbral mensual (CUP)</Text>
                      <NumericField
                        value={line.monthlyThresholdCup ?? 0}
                        onChange={(monthlyThresholdCup) =>
                          handleLineChange(line.id, { monthlyThresholdCup })
                        }
                      />
                    </View>
                  ) : null}
                </View>
              ))}
              {settings.sector === 'custom' ? (
                <Pressable onPress={addCustomLine} style={styles.addLine}>
                  <Plus size={16} color={colors.brand} />
                  <Text style={{ color: colors.brand, fontWeight: '700' }}>Añadir línea de impuesto</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}

      <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 12 }}>
        Referencias: Res. 306/2023 (MIPYME/CNA), Res. 271/2024 (TCP). Tasas orientativas — consulta con tu
        contador para declaraciones oficiales.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  pickerWrap: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginTop: 6 },
  lines: { marginTop: 16, gap: 10 },
  linesTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  lineCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  lineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineName: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  lineGrid: { flexDirection: 'row', gap: 8 },
  half: { flex: 1, gap: 4 },
  addLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
});
