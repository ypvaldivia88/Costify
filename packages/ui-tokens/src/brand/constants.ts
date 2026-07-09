/** Shared brand color constants for logo rendering */
export const brandMarkColors = {
  cover: '#059669',
  coverDark: '#047857',
  pageLight: '#F7F4ED',
  pageDark: '#292524',
  lineLight: '#D6D3D1',
  lineDark: '#44403C',
  copper: '#B45309',
  copperDark: '#F59E0B',
  ink: '#1C1917',
  inkDark: '#FAFAF9',
} as const;

export type CostifyLogoSize = 'sm' | 'md' | 'lg' | 'xl';

export const costifyLogoSizes: Record<
  CostifyLogoSize,
  { mark: number; wordmarkClass: string }
> = {
  sm: { mark: 32, wordmarkClass: 'text-xl' },
  md: { mark: 44, wordmarkClass: 'text-2xl' },
  lg: { mark: 56, wordmarkClass: 'text-3xl' },
  xl: { mark: 72, wordmarkClass: 'text-4xl' },
};

/** Geometric Costify mark v2 — C arc with ascending bars (cost → margin) */
export const COSTIFY_MARK_VIEWBOX = '0 0 64 64';

export const costifyMarkColors = {
  brand: '#059669',
  brandDark: '#047857',
  brandLight: '#34d399',
  barMuted: '#6ee7b7',
  barMid: '#10b981',
  barStrong: '#059669',
} as const;
