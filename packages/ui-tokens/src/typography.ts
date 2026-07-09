/** Font role constants for landing page typography */
export const landingFonts = {
  display: 'var(--font-newsreader), Georgia, "Times New Roman", serif',
  body: 'var(--font-source-sans), ui-sans-serif, system-ui, sans-serif',
  data: 'var(--font-ibm-plex-mono), ui-monospace, monospace',
} as const;

export type LandingFontRole = keyof typeof landingFonts;
