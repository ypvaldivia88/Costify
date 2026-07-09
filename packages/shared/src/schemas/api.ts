import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).email(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const workspaceIdSchema = z
  .string()
  .min(8, 'workspaceId must be at least 8 characters')
  .max(128, 'workspaceId must be at most 128 characters');

export const workspaceSyncPutSchema = z
  .object({
    workspaceId: workspaceIdSchema,
    updatedAt: z.number().finite(),
  })
  .passthrough();

export type WorkspaceSyncPutInput = z.infer<typeof workspaceSyncPutSchema>;

export const appBackupV1Schema = z.object({
  v: z.literal(1),
  at: z.number().finite(),
  inventory: z.array(z.record(z.string(), z.unknown())),
  rawMaterials: z.array(z.record(z.string(), z.unknown())),
  globalCosts: z.array(z.record(z.string(), z.unknown())),
  globalFund: z.record(z.string(), z.unknown()),
  laborShareSettings: z.record(z.string(), z.unknown()).optional(),
  taxSettings: z.record(z.string(), z.unknown()),
  unitSettings: z.record(z.string(), z.unknown()).optional(),
  warehouses: z.array(z.record(z.string(), z.unknown())).optional(),
  stockMovements: z.array(z.record(z.string(), z.unknown())).optional(),
  stockThresholds: z.array(z.record(z.string(), z.unknown())).optional(),
  exchangeRateSettings: z.record(z.string(), z.unknown()).optional(),
});

export type AppBackupV1Input = z.infer<typeof appBackupV1Schema>;

export function parseJsonBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join('; ');
    return { success: false, error: message || 'Invalid request body.' };
  }
  return { success: true, data: result.data };
}
