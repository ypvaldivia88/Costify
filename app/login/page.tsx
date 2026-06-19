import { Suspense } from 'react';
import LoginPage from './page.client';

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-9 h-9 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
