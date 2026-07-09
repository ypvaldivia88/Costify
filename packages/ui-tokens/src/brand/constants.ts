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
