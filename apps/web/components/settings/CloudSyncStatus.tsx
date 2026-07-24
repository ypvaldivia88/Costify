'use client';

import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import type { SyncDirection, SyncStatus } from '@/lib/sync/sync-service';
import { cn } from '@/lib/utils';

interface CloudSyncStatusProps {
  status: SyncStatus;
  direction: SyncDirection;
  pending: boolean;
  lastSyncedAt: number;
  errorMessage: string | null;
  onSync: () => void;
  compact?: boolean;
}

function formatLastSync(timestamp: number): string {
  if (!timestamp) return 'Aún no sincronizado';
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function statusLabel(status: SyncStatus, pending: boolean, direction: SyncDirection): string {
  if (status === 'offline') return 'Sin conexión';
  if (status === 'syncing') return 'Sincronizando…';
  if (status === 'error') return 'Error al sincronizar';
  if (pending) return 'Cambios pendientes';
  if (direction === 'pull') return 'Descargado de la nube';
  if (direction === 'push') return 'Guardado en la nube';
  return 'Sincronizado';
}

export function CloudSyncStatus({
  status,
  direction,
  pending,
  lastSyncedAt,
  errorMessage,
  onSync,
  compact = false,
}: CloudSyncStatusProps) {
  const offline = status === 'offline';
  const syncing = status === 'syncing';
  const errored = status === 'error';
  const Icon = syncing ? RefreshCw : offline ? CloudOff : errored ? AlertCircle : Cloud;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onSync}
        disabled={syncing}
        title={statusLabel(status, pending, direction)}
        className={cn(
          'inline-flex items-center justify-center min-w-11 min-h-11 rounded-xl border transition-colors active:scale-[0.97]',
          offline
            ? 'border-amber-300/60 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30'
            : pending
              ? 'border-brand/40 text-brand bg-brand-muted'
              : 'border-border text-muted hover:text-foreground hover:bg-surface-muted',
          syncing && 'opacity-70'
        )}
        aria-label={statusLabel(status, pending, direction)}
      >
        <Icon className={cn('w-4 h-4', syncing && 'animate-spin')} />
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-muted/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              offline ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-brand-muted'
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                offline ? 'text-amber-700 dark:text-amber-300' : 'text-brand',
                syncing && 'animate-pulse'
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {statusLabel(status, pending, direction)}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {offline
                ? 'Puedes seguir trabajando. Los cambios se subirán al reconectar.'
                : `Última sincronización: ${formatLastSync(lastSyncedAt)}`}
            </p>
            {errorMessage && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errorMessage}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          className={cn(
            'inline-flex items-center gap-1.5 shrink-0 min-h-11 px-3 rounded-lg text-xs font-semibold border transition-colors',
            syncing
              ? 'border-border text-muted cursor-not-allowed'
              : 'border-brand/30 text-brand hover:bg-brand-muted'
          )}
        >
          <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
          Sincronizar
        </button>
      </div>
    </div>
  );
}
