export const spacing = {
  pageX: '1rem',
  pageXSm: '1.5rem',
  sectionY: '2rem',
  sectionYSm: '3rem',
  cardPadding: '1.25rem',
  cardPaddingSm: '1.5rem',
} as const;

export const spacingCssVariables = {
  '--space-page-x': spacing.pageX,
  '--space-page-x-sm': spacing.pageXSm,
  '--space-section-y': spacing.sectionY,
  '--space-section-y-sm': spacing.sectionYSm,
  '--space-card-p': spacing.cardPadding,
  '--space-card-p-sm': spacing.cardPaddingSm,
} as const;

export const radius = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1rem',
} as const;
