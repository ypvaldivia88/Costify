'use client';

import { CostifyMark } from '@/components/brand/CostifyLogo';

interface BrandSpinnerProps {
  message?: string;
}

export function BrandSpinner({ message = 'Cargando…' }: BrandSpinnerProps) {
  return (
    <div className="min-h-dvh mesh-bg flex flex-col items-center justify-center gap-4">
      <CostifyMark size={56} aria-label="Costify" />
      <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
