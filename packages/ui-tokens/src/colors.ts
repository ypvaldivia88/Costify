export type ColorScheme = 'light' | 'dark';

export const brandColors = {
  light: '#059669',
  dark: '#34d399',
} as const;

export const colors = {
  light: {
    background: '#f4f4f5',
    foreground: '#18181b',
    muted: '#71717a',
    border: '#e4e4e7',
    surface: '#ffffff',
    surfaceMuted: '#fafafa',
    brand: brandColors.light,
    brandMuted: '#d1fae5',
    brandForeground: '#064e3b',
    accentSurface: '#ecfdf5',
    accentBorder: '#a7f3d0',
    danger: '#dc2626',
    dangerMuted: '#fef2f2',
    warning: '#d97706',
  },
  dark: {
    background: '#09090b',
    foreground: '#fafafa',
    muted: '#a1a1aa',
    border: '#3f3f46',
    surface: '#18181b',
    surfaceMuted: '#27272a',
    brand: brandColors.dark,
    brandMuted: '#064e3b',
    brandForeground: '#d1fae5',
    accentSurface: '#052e16',
    accentBorder: '#065f46',
    danger: '#f87171',
    dangerMuted: '#450a0a',
    warning: '#fbbf24',
  },
} as const;

export type ThemeColors = (typeof colors)[ColorScheme];

export const cssVariables = {
  light: {
    '--color-brand': brandColors.light,
    '--color-brand-muted': colors.light.brandMuted,
    '--color-brand-foreground': colors.light.brandForeground,
  },
  dark: {
    '--color-brand': brandColors.dark,
    '--color-brand-muted': colors.dark.brandMuted,
    '--color-brand-foreground': colors.dark.brandForeground,
  },
} as const;

/** Landing page — "Libreta de Costos" palette (scoped via .landing-theme) */
export const landingColors = {
  light: {
    paper: '#F7F4ED',
    ink: '#1C1917',
    brand: brandColors.light,
    copper: '#B45309',
    sea: '#0E7490',
    rule: '#E7E0D4',
    muted: '#78716C',
    surface: '#FFFFFF',
  },
  dark: {
    paper: '#0C0A09',
    ink: '#FAFAF9',
    brand: brandColors.dark,
    copper: '#F59E0B',
    sea: '#22D3EE',
    rule: '#292524',
    muted: '#A8A29E',
    surface: '#1C1917',
  },
} as const;

export type LandingColors = (typeof landingColors)[ColorScheme];

export const landingCssVariables = {
  light: {
    '--landing-paper': landingColors.light.paper,
    '--landing-ink': landingColors.light.ink,
    '--landing-brand': landingColors.light.brand,
    '--landing-copper': landingColors.light.copper,
    '--landing-sea': landingColors.light.sea,
    '--landing-rule': landingColors.light.rule,
    '--landing-muted': landingColors.light.muted,
    '--landing-surface': landingColors.light.surface,
  },
  dark: {
    '--landing-paper': landingColors.dark.paper,
    '--landing-ink': landingColors.dark.ink,
    '--landing-brand': landingColors.dark.brand,
    '--landing-copper': landingColors.dark.copper,
    '--landing-sea': landingColors.dark.sea,
    '--landing-rule': landingColors.dark.rule,
    '--landing-muted': landingColors.dark.muted,
    '--landing-surface': landingColors.dark.surface,
  },
} as const;
