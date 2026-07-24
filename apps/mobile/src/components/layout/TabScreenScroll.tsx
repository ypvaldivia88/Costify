import type { ReactNode } from 'react';
import {
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useScreenInsets } from '@/hooks/use-screen-insets';

interface TabScreenScrollProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function TabScreenScroll({
  children,
  contentContainerStyle,
  padded = true,
  keyboardShouldPersistTaps = 'handled',
  ...rest
}: TabScreenScrollProps) {
  const { scrollPaddingBottom } = useScreenInsets();

  return (
    <ScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentContainerStyle={[
        padded ? { padding: 16, paddingBottom: scrollPaddingBottom } : { paddingBottom: scrollPaddingBottom },
        contentContainerStyle,
      ]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
