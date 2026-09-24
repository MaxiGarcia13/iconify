import { describe, expect, it } from 'vitest';

import {
  clampCornerRadius,
  clampPadding,
  normalizeHex6,
} from '@/domain/settings';

describe('clampPadding / clampCornerRadius', () => {
  it('clampPadding clamps to 0–50 and rounds', () => {
    expect(clampPadding(-1)).toBe(0);
    expect(clampPadding(0)).toBe(0);
    expect(clampPadding(20.4)).toBe(20);
    expect(clampPadding(20.6)).toBe(21);
    expect(clampPadding(50)).toBe(50);
    expect(clampPadding(99)).toBe(50);
    expect(clampPadding(Number.NaN)).toBe(0);
  });

  it('clampCornerRadius clamps to 0–100 and rounds', () => {
    expect(clampCornerRadius(-1)).toBe(0);
    expect(clampCornerRadius(0)).toBe(0);
    expect(clampCornerRadius(50.4)).toBe(50);
    expect(clampCornerRadius(50.6)).toBe(51);
    expect(clampCornerRadius(100)).toBe(100);
    expect(clampCornerRadius(150)).toBe(100);
    expect(clampCornerRadius(Number.NaN)).toBe(0);
  });
});

describe('normalizeHex6', () => {
  it('accepts #RRGGBB and RRGGBB', () => {
    expect(normalizeHex6('#AaBbCc')).toBe('#aabbcc');
    expect(normalizeHex6('ff00aa')).toBe('#ff00aa');
  });

  it('rejects invalid values', () => {
    expect(normalizeHex6('#fff')).toBeNull();
    expect(normalizeHex6('transparent')).toBeNull();
    expect(normalizeHex6('#gg0000')).toBeNull();
  });
});
