import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Plus, Trash2 } from 'lucide-react-native';
import type { LaborShareSettings, ProductLaborRole, ProductLaborShare } from '@costify/shared/domain/types';
import { appendRolesFromArea, validateLaborSharePricing } from '@costify/shared/domain/calculations';
import { Button } from '@/components/ui/Button';
import { NumericField } from '@/components/ui/NumericField';
import { Select } from '@/components/ui/Select';
import { useTheme } from '@/context/ThemeContext';
import { createId } from '@/utils/uuid';

interface LaborShareEditorProps {
  laborShare: ProductLaborShare;
  laborShareSettings: LaborShareSettings;
  profitMargin: number;
  marginType: 'markup' | 'margin';
  onChange: (laborShare: ProductLaborShare) => void;
}

export function LaborShareEditor({
  laborShare,
  laborShareSettings,
  profitMargin,
  marginType,
  onChange,
}: LaborShareEditorProps) {
  const { colors } = useTheme();

  if (!laborShareSettings.enabled) return null;

  const totalPercent = laborShare.roles.reduce((sum, role) => sum + role.percentOfSale, 0);
  const validation =
    laborShare.enabled && totalPercent > 0
      ? validateLaborSharePricing(totalPercent, profitMargin, marginType)
      : { valid: true };

  const updateRoles = (roles: ProductLaborRole[]) => {
    onChange({ ...laborShare, roles });
  };

  const importFromArea = () => {
    const area = laborShareSettings.areas.find((item) => item.id === laborShare.areaId);
    if (!area) return;
    onChange({
      ...laborShare,
      enabled: true,
      roles: appendRolesFromArea(laborShare.roles, area),
    });
  };

  const addRole = () => {
    updateRoles([...laborShare.roles, { id: createId(), name: 'Nuevo rol', percentOfSale: 0 }]);
  };

  const updateRole = (roleId: string, updates: Partial<ProductLaborRole>) => {
    updateRoles(laborShare.roles.map((role) => (role.id === roleId ? { ...role, ...updates } : role)));
  };

  const deleteRole = (roleId: string) => {
    updateRoles(laborShare.roles.filter((role) => role.id !== roleId));
  };

  const fieldStyle = [
    styles.field,
    { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>
            Incluir participación salarial
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
            Reparte un % del precio de venta entre los roles involucrados.
          </Text>
        </View>
        <Switch
          value={laborShare.enabled}
          onValueChange={(enabled) => onChange({ ...laborShare, enabled })}
          trackColor={{ true: colors.brand, false: colors.border }}
        />
      </View>

      {laborShare.enabled ? (
        <View style={styles.body}>
          <Select
            label="Área (opcional)"
            value={laborShare.areaId ?? ''}
            onValueChange={(areaId) =>
              onChange({ ...laborShare, areaId: areaId || undefined })
            }
          >
            <Picker.Item label="Seleccionar área (opcional)" value="" />
            {laborShareSettings.areas.map((area) => (
              <Picker.Item key={area.id} label={area.name} value={area.id} />
            ))}
          </Select>

          <Button
            variant="outline"
            onPress={importFromArea}
            disabled={!laborShare.areaId}
            style={styles.fullWidthBtn}
          >
            Añadir roles del área
          </Button>

          {laborShare.roles.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
              Agrega roles o importa una plantilla desde un área de producción.
            </Text>
          ) : (
            <View style={styles.rolesList}>
              {laborShare.roles.map((role) => (
                <View
                  key={role.id}
                  style={[styles.roleCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                >
                  <TextInput
                    value={role.name}
                    onChangeText={(name) => updateRole(role.id, { name })}
                    placeholder="Nombre del rol"
                    placeholderTextColor={colors.muted}
                    style={fieldStyle}
                  />
                  <View style={styles.percentRow}>
                    <NumericField
                      value={role.percentOfSale}
                      onChange={(percentOfSale) => updateRole(role.id, { percentOfSale })}
                      placeholder="%"
                      style={styles.percentInput}
                    />
                    <Text style={{ color: colors.muted, fontSize: 13, flexShrink: 0 }}>% venta</Text>
                    <Pressable
                      onPress={() => deleteRole(role.id)}
                      style={styles.deleteBtn}
                      hitSlop={8}
                      accessibilityLabel="Eliminar rol"
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Button variant="outline" size="sm" onPress={addRole} style={styles.fullWidthBtn}>
            <Plus size={16} color={colors.foreground} />
            Añadir rol
          </Button>

          {totalPercent > 0 ? (
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
              Total participación salarial: {totalPercent.toFixed(1)}% del precio de venta
            </Text>
          ) : null}

          {!validation.valid && validation.error ? (
            <Text style={{ color: colors.danger, fontSize: 12, lineHeight: 18 }}>{validation.error}</Text>
          ) : null}
          {validation.warning ? (
            <Text style={{ color: '#d97706', fontSize: 12, lineHeight: 18 }}>{validation.warning}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, width: '100%' },
  toggleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  toggleCopy: { flex: 1, minWidth: 0 },
  body: { gap: 12 },
  rolesList: { gap: 8 },
  roleCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    overflow: 'hidden',
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  percentInput: { flex: 1, minWidth: 88, maxWidth: 140 },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  field: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
    width: '100%',
  },
  fullWidthBtn: { alignSelf: 'stretch' },
});
