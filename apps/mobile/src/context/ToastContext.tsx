import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { TAB_BAR_CONTENT_HEIGHT } from '@/hooks/use-screen-insets';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const bg =
    toast?.type === 'success'
      ? colors.brand
      : toast?.type === 'error'
        ? colors.danger
        : colors.foreground;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          style={[
            styles.container,
            { bottom: TAB_BAR_CONTENT_HEIGHT + insets.bottom + 12 },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.toast, { backgroundColor: bg }]}>
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
