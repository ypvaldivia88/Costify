import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PRIMARY_BOTTOM_TAB_IDS, type AppTab } from '@/navigation/tabs';

const VISIBLE_TAB_NAMES = new Set<string>([...PRIMARY_BOTTOM_TAB_IDS, 'menu']);

export function PrimaryTabBar(props: BottomTabBarProps) {
  const { state, ...rest } = props;
  const currentRoute = state.routes[state.index];
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TAB_NAMES.has(route.name));

  const currentIsVisible = VISIBLE_TAB_NAMES.has(currentRoute.name);
  const visibleIndex = currentIsVisible
    ? visibleRoutes.findIndex((route) => route.key === currentRoute.key)
    : visibleRoutes.findIndex((route) => route.name === 'menu');

  const filteredState = {
    ...state,
    routes: visibleRoutes,
    index: visibleIndex >= 0 ? visibleIndex : 0,
  };

  return <BottomTabBar {...rest} state={filteredState} />;
}

export function isSecondaryTabRoute(routeName: string): routeName is AppTab {
  return !VISIBLE_TAB_NAMES.has(routeName);
}
