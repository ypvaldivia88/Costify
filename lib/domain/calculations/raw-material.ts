import type { RawMaterial, RawMaterialInput } from '../types';
import { calculateUnitDirectCost } from './direct-cost';

export function calculateRawMaterialUnitCost(
  purchasePrice: number,
  unitsPerPackage: number
): number {
  return calculateUnitDirectCost(purchasePrice, unitsPerPackage);
}

export function buildRawMaterial(
  input: RawMaterialInput,
  id?: string,
  timestamp?: number
): RawMaterial {
  return {
    ...input,
    id: id ?? crypto.randomUUID(),
    unitCost: calculateRawMaterialUnitCost(input.purchasePrice, input.unitsPerPackage),
    timestamp: timestamp ?? Date.now(),
  };
}

export function recalculateRawMaterial(material: RawMaterial): RawMaterial {
  return {
    ...material,
    unitCost: calculateRawMaterialUnitCost(material.purchasePrice, material.unitsPerPackage),
  };
}
