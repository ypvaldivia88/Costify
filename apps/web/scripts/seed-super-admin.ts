import { ensureSuperAdmin, isSuperAdminBootstrapConfigured } from '../lib/auth/users';

async function main() {
  if (!isSuperAdminBootstrapConfigured()) {
    console.error(
      'Faltan SUPER_ADMIN_EMAIL y/o SUPER_ADMIN_PASSWORD en las variables de entorno.'
    );
    process.exit(1);
  }

  const admin = await ensureSuperAdmin();
  if (!admin) {
    console.error('No se pudo crear o actualizar el super administrador.');
    process.exit(1);
  }

  console.log(`Super admin listo: ${admin.email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
