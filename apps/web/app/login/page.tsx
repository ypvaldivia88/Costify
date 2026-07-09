import { Suspense } from 'react';
import LoginPage from './page.client';
import { BrandSpinner } from '@/components/brand/BrandSpinner';

export default function LoginRoute() {
  return (
    <Suspense fallback={<BrandSpinner />}>
      <LoginPage />
    </Suspense>
  );
}
