import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, Edit2, Plus, Trash2, Users, X } from 'lucide-react-native';
import type { LaborRole, LaborShareSettings, ProductionArea } from '@costify/shared/domain/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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

  const fieldStyle = [
    styles.field,
    { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
  ];

  return (
    <Card style={styles.card}>
      <SectionHeader
        icon={Users}
        title="Participación salarial por producto"
        description="Plantillas por área (parrilla, bar, etc.) con % del precio de venta"
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>
            Activar participación salarial
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
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
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Áreas de producción</Text>
            <Button variant="outline" size="sm" onPress={addArea} style={styles.addAreaBtn}>
              <Plus size={16} color={colors.foreground} />
              Área
            </Button>
          </View>

          {localAreas.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
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
                    <Pressable
                      onPress={() => setExpandedAreaId(expanded ? null : area.id)}
                      style={styles.iconBtn}
                      hitSlop={8}
                    >
                      {expanded ? (
                        <ChevronUp size={18} color={colors.muted} />
                      ) : (
                        <ChevronDown size={18} color={colors.muted} />
                      )}
                    </Pressable>
                    <TextInput
                      value={area.name}
                      onChangeText={(name) => updateAreaName(area.id, name)}
                      placeholder="Nombre del área"
                      placeholderTextColor={colors.muted}
                      style={[fieldStyle, styles.areaNameInput]}
                    />
                    <View style={[styles.percentBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
                        {totalPercent.toFixed(0)}%
                      </Text>
                    </View>
                    <Pressable onPress={() => void deleteArea(area)} style={styles.iconBtn} hitSlop={8}>
                      <Trash2 size={18} color="#ef4444" />
                    </Pressable>
                  </View>

                  {expanded ? (
                    <View style={[styles.rolesList, { borderTopColor: colors.border }]}>
                      {area.roles.map((role) => {
                        const isEditing =
                          editingRole?.areaId === area.id && editingRole.roleId === role.id;
                        return (
                          <View
                            key={role.id}
                            style={[styles.roleCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
                          >
                            {isEditing ? (
                              <View style={styles.roleEditForm}>
                                <TextInput
                                  value={roleDraft.name ?? ''}
                                  onChangeText={(name) => setRoleDraft((prev) => ({ ...prev, name }))}
                                  placeholder="Nombre del rol"
                                  placeholderTextColor={colors.muted}
                                  style={fieldStyle}
                                />
                                <View style={styles.percentRow}>
                                  <NumericField
                                    value={roleDraft.percentOfSale ?? 0}
                                    onChange={(percentOfSale) =>
                                      setRoleDraft((prev) => ({ ...prev, percentOfSale }))
                                    }
                                    placeholder="% venta"
                                    style={styles.percentInput}
                                  />
                                  <Text style={{ color: colors.muted, fontSize: 13 }}>% venta</Text>
                                </View>
                                <View style={styles.editActions}>
                                  <Button variant="secondary" size="sm" onPress={saveEditRole} style={styles.actionBtn}>
                                    <Check size={16} color={colors.brandForeground} />
                                    Guardar
                                  </Button>
                                  <Button variant="outline" size="sm" onPress={cancelEditRole} style={styles.actionBtn}>
                                    <X size={16} color={colors.muted} />
                                    Cancelar
                                  </Button>
                                </View>
                              </View>
                            ) : (
                              <View style={styles.roleViewRow}>
                                <View style={styles.roleCopy}>
                                  <Text
                                    style={{ color: colors.foreground, fontWeight: '600' }}
                                    numberOfLines={2}
                                  >
                                    {role.name}
                                  </Text>
                                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                                    {role.percentOfSale}% del precio de venta
                                  </Text>
                                </View>
                                <View style={styles.roleActions}>
                                  <Pressable
                                    onPress={() => startEditRole(area.id, role)}
                                    style={styles.iconBtn}
                                    hitSlop={8}
                                  >
                                    <Edit2 size={18} color={colors.muted} />
                                  </Pressable>
                                  <Pressable
                                    onPress={() => void deleteRole(area.id, role)}
                                    style={styles.iconBtn}
                                    hitSlop={8}
                                  >
                                    <Trash2 size={18} color="#ef4444" />
                                  </Pressable>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}
                      <Button variant="outline" size="sm" onPress={() => addRole(area.id)} style={styles.fullWidthBtn}>
                        <Plus size={16} color={colors.foreground} />
                        Añadir rol
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
  card: { overflow: 'hidden' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  toggleCopy: { flex: 1, minWidth: 0 },
  body: { gap: 12, paddingTop: 8 },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionLabel: { fontWeight: '600', fontSize: 15, flexShrink: 1 },
  addAreaBtn: { flexShrink: 0 },
  areaCard: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8, overflow: 'hidden' },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  areaNameInput: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 10 },
  percentBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexShrink: 0,
  },
  rolesList: {
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 4,
  },
  roleCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    overflow: 'hidden',
  },
  roleEditForm: { gap: 10 },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  percentInput: { flex: 1, minWidth: 96, maxWidth: 160 },
  editActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionBtn: { flexGrow: 1, minWidth: 120 },
  roleViewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  roleCopy: { flex: 1, minWidth: 0 },
  roleActions: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  iconBtn: { padding: 4, justifyContent: 'center', alignItems: 'center' },
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
