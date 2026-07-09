import { Suspense } from 'react';
import RegisterPage from './page.client';
import { BrandSpinner } from '@/components/brand/BrandSpinner';

export default function RegisterRoute() {
  return (
    <Suspense fallback={<BrandSpinner />}>
      <RegisterPage />
    </Suspense>
  );
}
