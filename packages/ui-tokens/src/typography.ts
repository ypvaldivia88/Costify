export const appTypography = {
  bodyMin: '0.9375rem',
  labelMin: '0.8125rem',
  captionMin: '0.75rem',
} as const;

export const landingFonts = {
  display: 'var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif',
  body: 'var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif',
  data: 'var(--font-ibm-plex-mono), ui-monospace, monospace',
} as const;

export type LandingFontRole = keyof typeof landingFonts;
