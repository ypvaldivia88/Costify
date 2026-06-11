'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolved, toggle, ready } = useTheme();

  if (!ready) {
    return <div className={cn('w-10 h-10', className)} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'p-2.5 min-w-10 min-h-10 flex items-center justify-center rounded-xl transition-colors',
        'text-muted hover:text-foreground hover:bg-surface-muted',
        className
      )}
      aria-label={resolved === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {resolved === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
