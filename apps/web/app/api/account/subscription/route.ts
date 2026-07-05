import { NextResponse } from 'next/server';
import { requestSubscriptionPlanChange } from '@/lib/auth/account';
import { AuthError, requireSession } from '@/lib/auth/guards';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';

const VALID_PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as { plan?: SubscriptionPlan };

    if (!body.plan || !VALID_PLANS.includes(body.plan)) {
      return NextResponse.json({ error: 'Selecciona un plan de suscripción válido.' }, { status: 400 });
    }

    const account = await requestSubscriptionPlanChange(session.userId, body.plan);
    return NextResponse.json(account);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[account subscription PATCH]', error);
    return NextResponse.json({ error: 'No se pudo actualizar la suscripción.' }, { status: 500 });
  }
}
