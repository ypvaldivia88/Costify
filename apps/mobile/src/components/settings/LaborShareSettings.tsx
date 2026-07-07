import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, Edit2, Plus, Trash2, Users, X } from 'lucide-react-native';
import type { LaborRole, LaborShareSettings, ProductionArea } from '@costify/shared/domain/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { NumericField } from '@/components/ui/NumericField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useTheme } from '@/context/ThemeContext';
import { useConfirm } from '@/context/DialogContext';
import { createId } from '@/utils/uuid';

interface LaborShareSettingsPanelProps {
  settings: LaborShareSettings;
  onChange: (updates: Partial<LaborShareSettings>) => void;
}

export function LaborShareSettingsPanel({ settings, onChange }: LaborShareSettingsPanelProps) {
  const { colors } = useTheme();
  const { confirm } = useConfirm();
  const [localAreas, setLocalAreas] = useState<ProductionArea[]>(settings.areas);
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{ areaId: string; roleId: string } | null>(null);
  const [roleDraft, setRoleDraft] = useState<Partial<LaborRole>>({});

  useEffect(() => {
    setLocalAreas(settings.areas);
  }, [settings.areas]);

  const persistAreas = (areas: ProductionArea[]) => {
    setLocalAreas(areas);
    onChange({ areas });
  };

  const addArea = () => {
    const area: ProductionArea = {
      id: createId(),
      name: 'Nueva área',
      roles: [],
    };
    persistAreas([...localAreas, area]);
    setExpandedAreaId(area.id);
  };

  const updateAreaName = (areaId: string, name: string) => {
    persistAreas(localAreas.map((area) => (area.id === areaId ? { ...area, name } : area)));
  };

  const deleteArea = async (area: ProductionArea) => {
    const confirmed = await confirm({
      title: 'Eliminar área',
      message: `¿Eliminar el área "${area.name}" y sus roles?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;
    persistAreas(localAreas.filter((item) => item.id !== area.id));
    if (expandedAreaId === area.id) setExpandedAreaId(null);
  };

  const addRole = (areaId: string) => {
    const role: LaborRole = {
      id: createId(),
      name: 'Nuevo rol',
      percentOfSale: 0,
    };
    persistAreas(
      localAreas.map((area) =>
        area.id === areaId ? { ...area, roles: [...area.roles, role] } : area
      )
    );
    setEditingRole({ areaId, roleId: role.id });
    setRoleDraft({ ...role });
  };

  const startEditRole = (areaId: string, role: LaborRole) => {
    setEditingRole({ areaId, roleId: role.id });
    setRoleDraft({ ...role });
  };

  const cancelEditRole = () => {
    setEditingRole(null);
    setRoleDraft({});
  };

  const saveEditRole = () => {
    if (!editingRole) return;
    const { areaId, roleId } = editingRole;
    persistAreas(
      localAreas.map((area) =>
        area.id === areaId
          ? {
              ...area,
              roles: area.roles.map((role) =>
                role.id === roleId
                  ? {
                      ...role,
                      name: roleDraft.name?.trim() || role.name,
                      percentOfSale: roleDraft.percentOfSale ?? role.percentOfSale,
                    }
                  : role
              ),
            }
          : area
      )
    );
    cancelEditRole();
  };

  const deleteRole = async (areaId: string, role: LaborRole) => {
    const confirmed = await confirm({
      title: 'Eliminar rol',
      message: `¿Eliminar "${role.name}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;
    persistAreas(
      localAreas.map((area) =>
        area.id === areaId
          ? { ...area, roles: area.roles.filter((item) => item.id !== role.id) }
          : area
      )
    );
    if (editingRole?.roleId === role.id) cancelEditRole();
  };

  return (
    <Card>
      <SectionHeader
        icon={Users}
        title="Participación salarial por producto"
        description="Plantillas por área (parrilla, bar, etc.) con % del precio de venta"
      />

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>
            Activar participación salarial
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
            Opcional. Permite asignar % del precio de venta a roles por producto elaborado.
          </Text>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={(enabled) => onChange({ enabled })}
          trackColor={{ true: colors.brand, false: colors.border }}
        />
      </View>

      {settings.enabled ? (
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>Áreas de producción</Text>
            <Button variant="outline" size="sm" onPress={addArea}>
              <Plus size={16} color={colors.foreground} />
              Área
            </Button>
          </View>

          {localAreas.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              Crea áreas como Parrilla, Bar o Cantina con los roles y porcentajes por defecto.
            </Text>
          ) : (
            localAreas.map((area) => {
              const expanded = expandedAreaId === area.id;
              const totalPercent = area.roles.reduce((sum, role) => sum + role.percentOfSale, 0);
              return (
                <View
                  key={area.id}
                  style={[styles.areaCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                >
                  <View style={styles.areaHeader}>
                    <Pressable onPress={() => setExpandedAreaId(expanded ? null : area.id)}>
                      {expanded ? (
                        <ChevronUp size={18} color={colors.muted} />
                      ) : (
                        <ChevronDown size={18} color={colors.muted} />
                      )}
                    </Pressable>
                    <Input
                      value={area.name}
                      onChangeText={(name) => updateAreaName(area.id, name)}
                      style={{ flex: 1 }}
                    />
                    <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
                      {totalPercent.toFixed(0)}%
                    </Text>
                    <Pressable onPress={() => void deleteArea(area)}>
                      <Trash2 size={18} color="#ef4444" />
                    </Pressable>
                  </View>

                  {expanded ? (
                    <View style={styles.rolesList}>
                      {area.roles.map((role) => {
                        const isEditing =
                          editingRole?.areaId === area.id && editingRole.roleId === role.id;
                        return (
                          <View
                            key={role.id}
                            style={[styles.roleRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
                          >
                            {isEditing ? (
                              <>
                                <Input
                                  value={roleDraft.name ?? ''}
                                  onChangeText={(name) => setRoleDraft((prev) => ({ ...prev, name }))}
                                  style={{ flex: 1 }}
                                />
                                <NumericField
                                  value={roleDraft.percentOfSale ?? 0}
                                  onChange={(percentOfSale) =>
                                    setRoleDraft((prev) => ({ ...prev, percentOfSale }))
                                  }
                                  placeholder="%"
                                  style={{ width: 72 }}
                                />
                                <Pressable onPress={saveEditRole}>
                                  <Check size={18} color={colors.brand} />
                                </Pressable>
                                <Pressable onPress={cancelEditRole}>
                                  <X size={18} color={colors.muted} />
                                </Pressable>
                              </>
                            ) : (
                              <>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                                    {role.name}
                                  </Text>
                                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                                    {role.percentOfSale}% venta
                                  </Text>
                                </View>
                                <Pressable onPress={() => startEditRole(area.id, role)}>
                                  <Edit2 size={18} color={colors.muted} />
                                </Pressable>
                                <Pressable onPress={() => void deleteRole(area.id, role)}>
                                  <Trash2 size={18} color="#ef4444" />
                                </Pressable>
                              </>
                            )}
                          </View>
                        );
                      })}
                      <Button variant="outline" size="sm" onPress={() => addRole(area.id)}>
                        <Plus size={16} color={colors.foreground} />
                        Rol
                      </Button>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  body: { gap: 12, paddingTop: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  areaCard: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  areaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rolesList: { gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
});
