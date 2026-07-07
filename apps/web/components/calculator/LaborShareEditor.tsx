'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { LaborShareSettings, ProductLaborRole, ProductLaborShare } from '@costify/shared/domain/types';
import { appendRolesFromArea, validateLaborSharePricing } from '@costify/shared/domain/calculations';
import { randomId } from '@costify/shared/random-id';
import { fieldClassNameCompact } from '@/lib/ui/field-styles';
import { Button } from '@/components/ui/Button';
import { NumericField } from '@/components/ui/NumericField';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

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
    updateRoles([
      ...laborShare.roles,
      { id: randomId(), name: 'Nuevo rol', percentOfSale: 0 },
    ]);
  };

  const updateRole = (roleId: string, updates: Partial<ProductLaborRole>) => {
    updateRoles(
      laborShare.roles.map((role) => (role.id === roleId ? { ...role, ...updates } : role))
    );
  };

  const deleteRole = (roleId: string) => {
    updateRoles(laborShare.roles.filter((role) => role.id !== roleId));
  };

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={laborShare.enabled}
          onChange={(e) => onChange({ ...laborShare, enabled: e.target.checked })}
          className="mt-1 w-5 h-5 rounded border-border text-brand focus:ring-brand"
        />
        <div>
          <p className="text-sm font-medium text-foreground">Incluir participación salarial</p>
          <p className="text-xs text-muted mt-0.5">
            Reparte un % del precio de venta entre los roles involucrados.
          </p>
        </div>
      </label>

      {laborShare.enabled && (
        <div className="space-y-3 pl-1">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <Select
              value={laborShare.areaId ?? ''}
              onChange={(e) =>
                onChange({
                  ...laborShare,
                  areaId: e.target.value || undefined,
                })
              }
            >
              <option value="">Seleccionar área (opcional)</option>
              {laborShareSettings.areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={importFromArea}
              disabled={!laborShare.areaId}
            >
              Importar roles del área
            </Button>
          </div>

          {laborShare.roles.length === 0 ? (
            <p className="text-sm text-muted">
              Agrega roles o importa una plantilla desde un área de producción.
            </p>
          ) : (
            <div className="space-y-2">
              {laborShare.roles.map((role) => (
                <div key={role.id} className="flex items-center gap-2">
                  <input
                    value={role.name}
                    onChange={(e) => updateRole(role.id, { name: e.target.value })}
                    placeholder="Rol"
                    className={cn(fieldClassNameCompact, 'flex-1')}
                  />
                  <NumericField
                    value={role.percentOfSale}
                    onChange={(percentOfSale) => updateRole(role.id, { percentOfSale })}
                    className="w-24"
                    placeholder="%"
                  />
                  <button
                    type="button"
                    onClick={() => deleteRole(role.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                    aria-label="Eliminar rol"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" size="sm" onClick={addRole}>
            <Plus className="w-4 h-4" />
            Rol
          </Button>

          {totalPercent > 0 && (
            <p className="text-xs text-muted">
              Total participación salarial: <strong>{totalPercent.toFixed(1)}%</strong> del precio
              de venta
            </p>
          )}

          {!validation.valid && validation.error && (
            <p className="text-xs text-red-600 dark:text-red-400">{validation.error}</p>
          )}
          {validation.warning && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{validation.warning}</p>
          )}
        </div>
      )}
    </div>
  );
}
