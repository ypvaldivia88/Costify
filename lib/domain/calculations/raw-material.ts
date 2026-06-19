import type { RawMaterial, RawMaterialInput, UnitType } from '../types';
import { calculateUnitDirectCost } from './direct-cost';

type LegacyRawMaterial = Partial<RawMaterialInput> & {
  unitsPerPackage?: number;
  stockUnits?: number;
};

export function migrateRawMaterialInput(material: LegacyRawMaterial): RawMaterialInput {
  return {
    name: material.name ?? '',
    purchasePrice: material.purchasePrice ?? 0,
    unitType: material.unitType ?? 'kg',
    packageQuantity: material.packageQuantity ?? material.unitsPerPackage ?? 1,
    stockQuantity: material.stockQuantity ?? material.stockUnits ?? 0,
  };
}

export function isValidUnitType(value: unknown): value is UnitType {
  return value === 'ud' || value === 'gr' || value === 'kg' || value === 'lb' || value === 'lt' || value === 'ml';
}

export function calculateRawMaterialUnitCost(
  purchasePrice: number,
  packageQuantity: number
): number {
  return calculateUnitDirectCost(purchasePrice, packageQuantity);
}

export function buildRawMaterial(
  input: RawMaterialInput,
  id?: string,
  timestamp?: number
): RawMaterial {
  return {
    ...input,
    id: id ?? crypto.randomUUID(),
    unitCost: calculateRawMaterialUnitCost(input.purchasePrice, input.packageQuantity),
    timestamp: timestamp ?? Date.now(),
  };
}

export function recalculateRawMaterial(material: RawMaterial): RawMaterial {
  return {
    ...material,
    unitCost: calculateRawMaterialUnitCost(material.purchasePrice, material.packageQuantity),
  };
}
