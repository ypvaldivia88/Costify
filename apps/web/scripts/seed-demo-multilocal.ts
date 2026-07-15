import { runDemoMultilocalSeed } from '../lib/admin/seed-demo-multilocal';
import { DEMO } from './seed-demo-tenant';

async function main() {
  const result = await runDemoMultilocalSeed();

  console.log('');
  console.log('=== Seed multi-local demo listo ===');
  console.log(`Negocio: ${DEMO.tenantName}`);
  console.log(`Tenant: ${result.tenantId}`);
  console.log(`Workspace: ${result.workspaceId}`);
  console.log(`Productos: ${result.inventoryCount}`);
  console.log(`Locales: ${result.locationCount}`);
  console.log('');
  console.log('Credenciales:');
  console.log(`  ${DEMO.adminEmail} / ${DEMO.adminPassword}`);
  console.log('');
  console.log('SKUs POS: REFRESCO_355, PAN_SOBAO, PASTEL_QUESO');

  process.exit(0);
}

function isDirectScriptRun(scriptSuffix: string): boolean {
  const entry = process.argv[1]?.replace(/\\/g, '/');
  return Boolean(entry?.endsWith(scriptSuffix));
}

if (isDirectScriptRun('seed-demo-multilocal.ts')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
