import { NextResponse } from 'next/server';
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards';
import { createTenantWithAdmin, listTenants } from '@/lib/auth/tenants';
import { ensureSuperAdmin } from '@/lib/auth/users';

export async function GET() {
  try {
    await ensureSuperAdmin();
    await requireSuperAdmin();
    const tenants = await listTenants();
    return NextResponse.json({ tenants });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin tenants GET]', error);
    return NextResponse.json({ error: 'No se pudieron listar los clientes.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSuperAdmin();
    await requireSuperAdmin();

    const body = (await request.json()) as {
      name?: string;
      contactEmail?: string;
      adminName?: string;
      adminEmail?: string;
      adminPassword?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'El nombre del negocio es obligatorio.' }, { status: 400 });
    }
    if (!body.adminName?.trim() || !body.adminEmail?.trim() || !body.adminPassword) {
      return NextResponse.json(
        { error: 'Nombre, correo y contraseña del administrador son obligatorios.' },
        { status: 400 }
      );
    }
    if (body.adminPassword.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      );
    }

    const result = await createTenantWithAdmin({
      name: body.name,
      contactEmail: body.contactEmail || body.adminEmail,
      adminName: body.adminName,
      adminEmail: body.adminEmail,
      adminPassword: body.adminPassword,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.includes('correo')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('[admin tenants POST]', error);
    return NextResponse.json({ error: 'No se pudo registrar el cliente.' }, { status: 500 });
  }
}
