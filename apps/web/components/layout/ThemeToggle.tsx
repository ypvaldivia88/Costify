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
    return <div className={cn('w-11 h-11', className)} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'p-2.5 min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-all duration-200',
        'text-muted hover:text-foreground hover:bg-surface-muted active:scale-95',
        className
      )}
      aria-label={resolved === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {resolved === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
