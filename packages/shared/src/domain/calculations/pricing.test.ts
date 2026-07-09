import { describe, expect, it } from 'vitest';
import {
  calculateGrossMarginPercent,
  calculateSuggestedPrice,
} from './pricing';

describe('pricing calculations', () => {
  it('calculates suggested price with markup', () => {
    const price = calculateSuggestedPrice(100, 20, 'markup');
    expect(price).toBe(120);
  });

  it('calculates gross margin percent', () => {
    const margin = calculateGrossMarginPercent(125, 100);
    expect(margin).toBeCloseTo(20, 5);
  });
});
