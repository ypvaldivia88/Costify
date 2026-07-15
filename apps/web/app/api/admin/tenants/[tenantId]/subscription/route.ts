import { NextResponse } from 'next/server';
import { requireSuperAdmin, AuthError } from '@/lib/auth/guards';
import { updateTenantSubscription } from '@/lib/auth/tenants';
import { ensureSuperAdmin } from '@/lib/auth/users';
import type { SubscriptionAdminAction, SubscriptionPlan } from '@costify/shared/domain/subscription';

interface RouteContext {
  params: Promise<{ tenantId: string }>;
}

const VALID_ACTIONS: SubscriptionAdminAction[] = [
  'activate',
  'renew',
  'expire',
  'pending',
  'set_plan',
];

const VALID_PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await ensureSuperAdmin();
    await requireSuperAdmin();
    const { tenantId } = await context.params;
    const body = (await request.json()) as {
      action?: SubscriptionAdminAction;
      plan?: SubscriptionPlan;
      locationCount?: number;
    };

    if (!body.action || !VALID_ACTIONS.includes(body.action)) {
      return NextResponse.json({ error: 'Acción de suscripción inválida.' }, { status: 400 });
    }

    if (body.plan && !VALID_PLANS.includes(body.plan)) {
      return NextResponse.json({ error: 'Plan de suscripción inválido.' }, { status: 400 });
    }

    if (body.action === 'set_plan' && !body.plan) {
      return NextResponse.json({ error: 'Indica el plan a asignar.' }, { status: 400 });
    }

    const tenant = await updateTenantSubscription(
      tenantId,
      body.action,
      body.plan,
      body.locationCount
    );
    if (!tenant) {
      return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[admin tenant subscription PATCH]', error);
    return NextResponse.json({ error: 'No se pudo actualizar la suscripción.' }, { status: 500 });
  }
}
