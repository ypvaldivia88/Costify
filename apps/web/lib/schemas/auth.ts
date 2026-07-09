import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    businessName: z.string().min(2, 'Nombre del negocio demasiado corto'),
    contactEmail: z.union([z.literal(''), z.string().email('Correo de contacto inválido')]),
    adminName: z.string().min(2, 'Nombre del administrador demasiado corto'),
    adminEmail: z.string().email('Correo del administrador inválido'),
    adminPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
    plan: z.enum(['monthly', 'semiannual', 'annual']),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: 'La confirmación de contraseña no coincide',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
