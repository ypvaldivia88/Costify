import type { AccessLevel } from '../auth/types';
import {
  canAddProduct,
  canAddRawMaterial,
  canManageWarehouses,
  canSyncToCloud,
  canWriteWorkspaceData,
  TRIAL_PRODUCT_LIMIT,
  TRIAL_RAW_MATERIAL_LIMIT,
} from '@costify/shared/domain/access';

export function createWorkspaceAccessGates(accessLevel?: AccessLevel) {
  const level: AccessLevel = accessLevel ?? 'full';

  return {
    level,
    isReadOnly: level === 'readonly',
    canSync: canSyncToCloud(level),
    canWrite: canWriteWorkspaceData(level),
    canManageWarehouses: canManageWarehouses(level),
    canAddProduct: (currentCount: number, productLimit = TRIAL_PRODUCT_LIMIT) =>
      canAddProduct(level, currentCount, productLimit),
    canAddRawMaterial: (currentCount: number, materialLimit = TRIAL_RAW_MATERIAL_LIMIT) =>
      canAddRawMaterial(level, currentCount, materialLimit),
    readonlyMessage:
      'Tu cuenta está en modo solo lectura. Activa o renueva tu suscripción para editar datos.',
    trialProductLimitMessage: (limit = TRIAL_PRODUCT_LIMIT) =>
      `Alcanzaste el límite de ${limit} productos del periodo de prueba. Activa tu suscripción para continuar.`,
    trialMaterialLimitMessage: (limit = TRIAL_RAW_MATERIAL_LIMIT) =>
      `Alcanzaste el límite de ${limit} materias primas del periodo de prueba. Activa tu suscripción para continuar.`,
    warehousesMessage:
      'Los almacenes y movimientos de stock requieren una suscripción activa.',
  };
}

export type WorkspaceAccessGates = ReturnType<typeof createWorkspaceAccessGates>;
