import type {
  LaborShareSettings,
  MarginType,
  ProductInput,
  ProductLaborRole,
  ProductLaborShare,
  ProductionArea,
} from '../types';
import { randomId } from '../../random-id';

export const DEFAULT_PRODUCT_LABOR_SHARE: ProductLaborShare = {
  enabled: false,
  roles: [],
};

export function migrateLaborShareSettings(
  settings?: Partial<LaborShareSettings> | null
): LaborShareSettings {
  return {
    enabled: settings?.enabled ?? false,
    areas: (settings?.areas ?? []).map((area) => ({
      id: area.id ?? randomId(),
      name: area.name?.trim() ?? '',
      roles: (area.roles ?? []).map((role) => ({
        id: role.id ?? randomId(),
        name: role.name?.trim() ?? '',
        percentOfSale: Math.max(0, role.percentOfSale ?? 0),
      })),
    })),
  };
}

export function migrateProductLaborShare(
  share?: Partial<ProductLaborShare> | null
): ProductLaborShare | undefined {
  if (!share) return undefined;
  return {
    enabled: share.enabled ?? false,
    areaId: share.areaId,
    roles: (share.roles ?? []).map((role) => ({
      id: role.id ?? randomId(),
      name: role.name?.trim() ?? '',
      percentOfSale: Math.max(0, role.percentOfSale ?? 0),
    })),
  };
}

export function getActiveLaborRoles(
  product: ProductInput,
  laborShareSettings?: LaborShareSettings
): ProductLaborRole[] {
  if (!laborShareSettings?.enabled) return [];
  if (!product.laborShare?.enabled) return [];
  return product.laborShare.roles.filter((role) => role.percentOfSale > 0 && role.name.trim());
}

export function getTotalLaborSharePercent(roles: ProductLaborRole[]): number {
  return roles.reduce((sum, role) => sum + role.percentOfSale, 0);
}

export function copyRolesFromArea(area: ProductionArea): ProductLaborRole[] {
  return area.roles.map((role) => ({
    id: role.id,
    name: role.name,
    percentOfSale: role.percentOfSale,
  }));
}

/** Añade roles de un área al producto sin borrar los ya importados (evita duplicados exactos). */
export function appendRolesFromArea(
  existingRoles: ProductLaborRole[],
  area: ProductionArea
): ProductLaborRole[] {
  const roleKey = (name: string, percentOfSale: number) =>
    `${name.trim().toLowerCase()}|${percentOfSale}`;

  const existingKeys = new Set(
    existingRoles.map((role) => roleKey(role.name, role.percentOfSale))
  );

  const toAdd = area.roles
    .filter((role) => role.name.trim() && role.percentOfSale > 0)
    .filter((role) => !existingKeys.has(roleKey(role.name, role.percentOfSale)))
    .map((role) => ({
      id: randomId(),
      name: role.name,
      percentOfSale: role.percentOfSale,
    }));

  return [...existingRoles, ...toAdd];
}

export function validateProductLaborShare(
  laborShare: ProductLaborShare
): { valid: boolean; error?: string } {
  if (!laborShare.enabled) return { valid: true };
  const activeRoles = laborShare.roles.filter(
    (role) => role.percentOfSale > 0 && role.name.trim().length > 0
  );
  if (activeRoles.length === 0) {
    return {
      valid: false,
      error: 'Agrega al menos un rol con nombre y porcentaje mayor a cero.',
    };
  }
  return { valid: true };
}

export function validateLaborSharePricing(
  laborSharePercent: number,
  profitMargin: number,
  marginType: MarginType
): { valid: boolean; warning?: string; error?: string } {
  const labor = laborSharePercent / 100;
  const margin = profitMargin / 100;

  if (marginType === 'margin') {
    if (labor + margin >= 1) {
      return {
        valid: false,
        error: 'La suma de participación salarial y margen no puede ser 100% o más.',
      };
    }
  } else if (labor >= 1) {
    return {
      valid: false,
      error: 'La participación salarial no puede ser 100% o más.',
    };
  }

  if (laborSharePercent > 40) {
    return {
      valid: true,
      warning: 'La participación salarial supera el 40% del precio de venta.',
    };
  }

  return { valid: true };
}
