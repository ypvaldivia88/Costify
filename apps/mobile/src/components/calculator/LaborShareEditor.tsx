import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Plus, Trash2 } from 'lucide-react-native';
import type { LaborShareSettings, ProductLaborRole, ProductLaborShare } from '@costify/shared/domain/types';
import { copyRolesFromArea, validateLaborSharePricing } from '@costify/shared/domain/calculations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
      roles: copyRolesFromArea(area),
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

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>
            Incluir participación salarial
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
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
          <Button variant="outline" onPress={importFromArea} disabled={!laborShare.areaId}>
            Importar plantilla
          </Button>

          {laborShare.roles.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              Agrega roles o importa una plantilla desde un área de producción.
            </Text>
          ) : (
            laborShare.roles.map((role) => (
              <View key={role.id} style={styles.roleRow}>
                <Input
                  value={role.name}
                  onChangeText={(name) => updateRole(role.id, { name })}
                  placeholder="Rol"
                  style={{ flex: 1 }}
                />
                <NumericField
                  value={role.percentOfSale}
                  onChange={(percentOfSale) => updateRole(role.id, { percentOfSale })}
                  placeholder="%"
                  style={{ width: 72 }}
                />
                <Pressable onPress={() => deleteRole(role.id)} style={styles.deleteBtn}>
                  <Trash2 size={18} color="#ef4444" />
                </Pressable>
              </View>
            ))
          )}

          <Button variant="outline" size="sm" onPress={addRole}>
            <Plus size={16} color={colors.foreground} />
            Rol
          </Button>

          {totalPercent > 0 ? (
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Total participación salarial: {totalPercent.toFixed(1)}% del precio de venta
            </Text>
          ) : null}

          {!validation.valid && validation.error ? (
            <Text style={{ color: '#ef4444', fontSize: 12 }}>{validation.error}</Text>
          ) : null}
          {validation.warning ? (
            <Text style={{ color: '#d97706', fontSize: 12 }}>{validation.warning}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { gap: 10 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: { padding: 8 },
});
