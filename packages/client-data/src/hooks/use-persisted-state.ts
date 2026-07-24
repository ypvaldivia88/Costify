import { useCallback, useEffect, useRef, useState } from 'react';
import { onSyncReload } from '../sync/sync-events';

export function useStorageReload(reload: () => void | Promise<void>): void {
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    return onSyncReload(() => {
      void reloadRef.current();
    });
  }, []);
}

export function useAsyncPersistedResource<T>({
  load,
  save,
  initialValue,
  mergeOnReload,
}: {
  load: () => Promise<T>;
  save: (value: T) => Promise<void>;
  initialValue: T;
  mergeOnReload?: (loaded: T, current: T) => T;
}) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const loadRef = useRef(load);
  const saveRef = useRef(save);
  const mergeOnReloadRef = useRef(mergeOnReload);
  const valueRef = useRef(value);
  const hydratedRef = useRef(hydrated);

  loadRef.current = load;
  saveRef.current = save;
  mergeOnReloadRef.current = mergeOnReload;
  valueRef.current = value;
  hydratedRef.current = hydrated;

  const reload = useCallback(async () => {
    const loaded = await loadRef.current();
    setValue((current) => mergeOnReloadRef.current?.(loaded, current) ?? loaded);
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const loaded = await loadRef.current();
      if (mounted) {
        setValue(loaded);
        setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void saveRef.current(value).catch(() => {
      // Storage failures (quota, etc.) must not crash the app.
    });
  }, [value]);

  return { value, setValue, hydrated, reload };
}
