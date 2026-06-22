import { Suspense } from 'react';
import LoginPage from './page.client';

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen mesh-bg flex items-center justify-center">
          <div className="w-10 h-10 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-glow">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
