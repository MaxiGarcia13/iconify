import { describe, expect, it } from 'vitest';

import {
  containDrawRect,
  contentBox,
  PREVIEW_DEBOUNCE_MS,
  PREVIEW_TARGETS,
  previewBackgroundFromSettings,
} from './preview';

describe('preview targets', () => {
  it('matches SPEC §5.3 preview sizes', () => {
    expect(PREVIEW_TARGETS.map((t) => [t.width, t.height])).toEqual([
      [16, 16],
      [32, 32],
      [180, 180],
      [192, 192],
      [512, 512],
      [1200, 630],
    ]);
  });
});

describe('preview debounce', () => {
  it('is at least 50 ms per SPEC §5.3', () => {
    expect(PREVIEW_DEBOUNCE_MS).toBeGreaterThanOrEqual(50);
  });
});

describe('contentBox', () => {
  it('fills the canvas when padding is 0', () => {
    expect(contentBox(192, 192, 0)).toEqual({
      innerW: 192,
      innerH: 192,
      left: 0,
      top: 0,
    });
  });

  it('insets 20% padding like Sharp renderIcon (content = size × 0.6)', () => {
    // padRatio 0.2 → 1 - 0.4 = 0.6 → contentSize 115 for 192
    expect(contentBox(192, 192, 20)).toEqual({
      innerW: 115,
      innerH: 115,
      left: 38,
      top: 38,
    });
  });

  it('computes OG inner box for padding 20', () => {
    expect(contentBox(1200, 630, 20)).toEqual({
      innerW: 720,
      innerH: 378,
      left: 240,
      top: 126,
    });
  });

  it('clamps padding to 0–50', () => {
    expect(contentBox(100, 100, -10).innerW).toBe(100);
    expect(contentBox(100, 100, 50)).toEqual({
      innerW: 1,
      innerH: 1,
      left: 49,
      top: 49,
    });
    expect(contentBox(100, 100, 99).innerW).toBe(1);
  });
});

describe('containDrawRect', () => {
  it('letterboxes a wide source into a square box', () => {
    expect(containDrawRect(200, 100, 100, 100)).toEqual({
      dx: 0,
      dy: 25,
      dw: 100,
      dh: 50,
    });
  });

  it('pillarboxes a tall source into a square box', () => {
    expect(containDrawRect(100, 200, 100, 100)).toEqual({
      dx: 25,
      dy: 0,
      dw: 50,
      dh: 100,
    });
  });

  it('fills when aspect matches', () => {
    expect(containDrawRect(50, 50, 100, 100)).toEqual({
      dx: 0,
      dy: 0,
      dw: 100,
      dh: 100,
    });
  });
});

describe('previewBackgroundFromSettings', () => {
  it('maps transparent toggle and hex', () => {
    expect(
      previewBackgroundFromSettings({
        transparent: true,
        backgroundHex: '#ff0000',
      }),
    ).toBe('transparent');
    expect(
      previewBackgroundFromSettings({
        transparent: false,
        backgroundHex: '#00ff00',
      }),
    ).toBe('#00ff00');
  });
});
