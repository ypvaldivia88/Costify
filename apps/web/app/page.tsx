import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { AuthenticatedHome } from '@/components/landing/AuthenticatedHome';
import { MarketingPage } from '@/components/marketing/marketing-page';

export default async function Home() {
  const session = await getServerSession();

  if (session?.role === 'super_admin') {
    redirect('/admin');
  }

  if (session) {
    if (
      (session.role === 'tenant_admin' || session.role === 'tenant_user') &&
      !session.workspaceId
    ) {
      redirect('/login');
    }
    return <AuthenticatedHome />;
  }

  return <MarketingPage />;
}
