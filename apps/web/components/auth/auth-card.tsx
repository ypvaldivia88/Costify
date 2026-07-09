'use client';

import type { ReactNode } from 'react';
import { CostifyLogo } from '@/components/brand/CostifyLogo';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <div className={cn('w-full max-w-[440px] mx-auto space-y-6', className)}>
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <CostifyLogo size="xl" className="justify-center" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
          ) : null}
        </div>
      </div>

      <Card className="shadow-elevated">{children}</Card>

      {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
