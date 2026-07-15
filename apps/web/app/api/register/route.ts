import { NextResponse } from 'next/server';
import { registerPendingTenant } from '@/lib/auth/tenants';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';
import {
  buildWhatsAppPaymentMessage,
  buildWhatsAppPaymentUrl,
  getSubscriptionPlanPriceUsd,
  normalizeLocationCount,
  SUBSCRIPTION_PLAN_LABELS,
} from '@costify/shared/domain/subscription';

const VALID_PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      businessName?: string;
      contactEmail?: string;
      adminName?: string;
      adminEmail?: string;
      adminPassword?: string;
      plan?: SubscriptionPlan;
      locationCount?: number;
    };

    if (!body.businessName?.trim()) {
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
    if (!body.plan || !VALID_PLANS.includes(body.plan)) {
      return NextResponse.json({ error: 'Selecciona un plan de suscripción válido.' }, { status: 400 });
    }

    const locationCount = normalizeLocationCount(body.locationCount);

    const result = await registerPendingTenant({
      name: body.businessName,
      contactEmail: body.contactEmail || body.adminEmail,
      adminName: body.adminName,
      adminEmail: body.adminEmail,
      adminPassword: body.adminPassword,
      plan: body.plan,
      locationCount,
    });

    const priceUsd = getSubscriptionPlanPriceUsd(body.plan, locationCount);
    const whatsappMessage = buildWhatsAppPaymentMessage({
      businessName: body.businessName.trim(),
      contactName: body.adminName.trim(),
      email: body.adminEmail.trim().toLowerCase(),
      plan: body.plan,
      priceUsd,
      locationCount,
    });

    return NextResponse.json(
      {
        tenant: result.tenant,
        planLabel: SUBSCRIPTION_PLAN_LABELS[body.plan],
        priceUsd,
        whatsappUrl: buildWhatsAppPaymentUrl(whatsappMessage),
        message:
          'Registro recibido. Escríbenos por WhatsApp para completar el pago y activar tu cuenta.',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('correo')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('[register POST]', error);
    return NextResponse.json({ error: 'No se pudo completar el registro.' }, { status: 500 });
  }
}
