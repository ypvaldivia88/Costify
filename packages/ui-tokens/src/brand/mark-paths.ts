/** Canonical Costify mark geometry — shared by web, mobile, and static SVG exports. */

export const COSTIFY_MARK_VIEWBOX = '0 0 64 64';

/** Thick C arc opening right; bars read as cost → margin inside the curve. */
export const COSTIFY_C_ARC =
  'M38 14C26 14 18 22 18 32c0 10 8 18 20 18';

export const COSTIFY_MARK_BARS = [
  { x: 30, y: 40, width: 4.5, height: 10, rx: 1.25, opacity: 0.55 },
  { x: 36.5, y: 34, width: 4.5, height: 16, rx: 1.25, opacity: 0.8 },
  { x: 43, y: 26, width: 4.5, height: 24, rx: 1.25, opacity: 1 },
] as const;

/** Copper margin tick — signature accent on the tallest bar. */
export const COSTIFY_MARGIN_TICK = { x: 41, y: 22, width: 12, height: 3.5, rx: 1.75 } as const;

export const COSTIFY_APP_ICON_BG = { x: 2, y: 2, width: 60, height: 60, rx: 14 } as const;

export const COSTIFY_ICON_GRADIENT = {
  start: '#10B981',
  end: '#047857',
} as const;

export type CostifyMarkPalette = {
  arc: string;
  arcWidth: number;
  bars: readonly string[];
  barOpacities: readonly number[];
  margin: string;
  onBrand: string;
};

export function getCostifyMarkPalette(isDark: boolean): CostifyMarkPalette {
  if (isDark) {
    return {
      arc: '#34D399',
      arcWidth: 5,
      bars: ['#6EE7B7', '#34D399', '#A7F3D0'],
      barOpacities: [0.7, 0.85, 1],
      margin: '#FBBF24',
      onBrand: '#FFFFFF',
    };
  }
  return {
    arc: '#059669',
    arcWidth: 5,
    bars: ['#6EE7B7', '#10B981', '#047857'],
    barOpacities: [0.65, 0.85, 1],
    margin: '#D97706',
    onBrand: '#FFFFFF',
  };
}

export function getCostifyAppIconPalette() {
  return {
    gradientStart: COSTIFY_ICON_GRADIENT.start,
    gradientEnd: COSTIFY_ICON_GRADIENT.end,
    arc: '#FFFFFF',
    bars: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
    barOpacities: [0.55, 0.8, 1] as const,
    margin: '#FBBF24',
  };
}
