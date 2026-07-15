/** Shared brand color constants for logo rendering */
export const brandMarkColors = {
  cover: '#059669',
  coverDark: '#047857',
  gradientStart: '#10B981',
  gradientEnd: '#047857',
  pageLight: '#F7F4ED',
  pageDark: '#292524',
  lineLight: '#D6D3D1',
  lineDark: '#44403C',
  copper: '#B45309',
  copperLight: '#FBBF24',
  copperDark: '#F59E0B',
  ink: '#1C1917',
  inkDark: '#FAFAF9',
} as const;

export type CostifyLogoSize = 'sm' | 'md' | 'lg' | 'xl';

export const costifyLogoSizes: Record<
  CostifyLogoSize,
  { mark: number; wordmarkClass: string }
> = {
  sm: { mark: 32, wordmarkClass: 'text-lg' },
  md: { mark: 40, wordmarkClass: 'text-xl' },
  lg: { mark: 48, wordmarkClass: 'text-2xl' },
  xl: { mark: 56, wordmarkClass: 'text-3xl' },
};

export {
  COSTIFY_MARK_VIEWBOX,
  COSTIFY_C_ARC,
  COSTIFY_MARK_BARS,
  COSTIFY_MARGIN_TICK,
  COSTIFY_APP_ICON_BG,
  getCostifyMarkPalette,
  getCostifyAppIconPalette,
} from './mark-paths';

export const costifyMarkColors = {
  brand: '#059669',
  brandDark: '#047857',
  brandLight: '#34d399',
  barMuted: '#6ee7b7',
  barMid: '#10b981',
  barStrong: '#047857',
  margin: '#D97706',
  marginDark: '#FBBF24',
} as const;
