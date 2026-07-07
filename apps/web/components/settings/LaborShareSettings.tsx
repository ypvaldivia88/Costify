'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Edit2, Plus, Trash2, Users, X } from 'lucide-react';
import type { LaborRole, LaborShareSettings, ProductionArea } from '@costify/shared/domain/types';
import { randomId } from '@costify/shared/random-id';
import { fieldClassNameCompact } from '@/lib/ui/field-styles';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { NumericField } from '@/components/ui/NumericField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

interface LaborShareSettingsPanelProps {
  settings: LaborShareSettings;
  onChange: (updates: Partial<LaborShareSettings>) => void;
}

export function LaborShareSettingsPanel({ settings, onChange }: LaborShareSettingsPanelProps) {
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
      id: randomId(),
      name: 'Nueva área',
      roles: [],
    };
    const areas = [...localAreas, area];
    persistAreas(areas);
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
      id: randomId(),
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

      <label className="flex items-start gap-3 cursor-pointer py-2 mb-4">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="mt-1 w-5 h-5 rounded border-border text-brand focus:ring-brand"
        />
        <div>
          <p className="text-sm font-medium text-foreground">Activar participación salarial</p>
          <p className="text-xs text-muted mt-0.5">
            Opcional. Permite asignar % del precio de venta a roles por producto elaborado.
          </p>
        </div>
      </label>

      {settings.enabled && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Áreas de producción</p>
            <Button type="button" variant="outline" size="sm" onClick={addArea}>
              <Plus className="w-4 h-4" />
              Área
            </Button>
          </div>

          {localAreas.length === 0 ? (
            <p className="text-sm text-muted">
              Crea áreas como Parrilla, Bar o Cantina con los roles y porcentajes por defecto.
            </p>
          ) : (
            <div className="space-y-2">
              {localAreas.map((area) => {
                const expanded = expandedAreaId === area.id;
                const totalPercent = area.roles.reduce((sum, role) => sum + role.percentOfSale, 0);
                return (
                  <div key={area.id} className="rounded-xl border border-border bg-surface-muted/40">
                    <div className="flex items-center gap-2 p-3">
                      <button
                        type="button"
                        onClick={() => setExpandedAreaId(expanded ? null : area.id)}
                        className="p-1 rounded-lg text-muted hover:text-foreground"
                        aria-label={expanded ? 'Contraer área' : 'Expandir área'}
                      >
                        {expanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        value={area.name}
                        onChange={(e) => updateAreaName(area.id, e.target.value)}
                        className={cn(fieldClassNameCompact, 'flex-1')}
                      />
                      <span className="text-xs font-semibold text-muted shrink-0">
                        {totalPercent.toFixed(0)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => void deleteArea(area)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                        aria-label="Eliminar área"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {expanded && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
                        {area.roles.map((role) => {
                          const isEditing =
                            editingRole?.areaId === area.id && editingRole.roleId === role.id;
                          return (
                            <div
                              key={role.id}
                              className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2"
                            >
                              {isEditing ? (
                                <>
                                  <input
                                    value={roleDraft.name ?? ''}
                                    onChange={(e) =>
                                      setRoleDraft((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    className={cn(fieldClassNameCompact, 'flex-1')}
                                  />
                                  <NumericField
                                    value={roleDraft.percentOfSale ?? 0}
                                    onChange={(percentOfSale) =>
                                      setRoleDraft((prev) => ({ ...prev, percentOfSale }))
                                    }
                                    className="w-20"
                                    placeholder="%"
                                  />
                                  <button
                                    type="button"
                                    onClick={saveEditRole}
                                    className="p-2 rounded-lg text-brand hover:bg-brand-muted"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditRole}
                                    className="p-2 rounded-lg text-muted hover:bg-surface-muted"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {role.name}
                                    </p>
                                    <p className="text-xs text-muted">{role.percentOfSale}% venta</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => startEditRole(area.id, role)}
                                    className="p-2 rounded-lg text-muted hover:text-foreground"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void deleteRole(area.id, role)}
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                        <Button type="button" variant="outline" size="sm" onClick={() => addRole(area.id)}>
                          <Plus className="w-4 h-4" />
                          Rol
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
