import { useCallback, useEffect, useState } from 'react';
import { onSyncReload } from '../sync/sync-events';

export function useStorageReload(reload: () => void | Promise<void>): void {
  useEffect(() => {
    return onSyncReload(() => {
      void reload();
    });
  }, [reload]);
}

export function useAsyncPersistedResource<T>({
  load,
  save,
  initialValue,
}: {
  load: () => Promise<T>;
  save: (value: T) => Promise<void>;
  initialValue: T;
}) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(async () => {
    setValue(await load());
  }, [load]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const loaded = await load();
      if (mounted) {
        setValue(loaded);
        setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydrated) return;
    void save(value);
  }, [value, hydrated, save]);

  return { value, setValue, hydrated, reload };
}
