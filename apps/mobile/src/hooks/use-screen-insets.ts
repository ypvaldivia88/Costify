import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Visible tab bar content height (excluding safe-area inset). */
export const TAB_BAR_CONTENT_HEIGHT = 56;

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + insets.bottom;
  const scrollPaddingBottom = tabBarHeight + 16;

  return {
    insets,
    tabBarHeight,
    scrollPaddingBottom,
  };
}
