import { describe, expect, it } from 'vitest';

import {
  REMOVE_BACKGROUND_LIVE_PENDING,
  removeBackgroundLiveStatus,
  removeBackgroundProgressLabel,
} from '@/domain/remove-background-ui';

describe('removeBackgroundProgressLabel', () => {
  it('returns pending copy when total is not usable', () => {
    expect(removeBackgroundProgressLabel(0, 0)).toBe(REMOVE_BACKGROUND_LIVE_PENDING);
    expect(removeBackgroundProgressLabel(1, -1)).toBe(REMOVE_BACKGROUND_LIVE_PENDING);
  });

  it('includes a clamped percent when total is known', () => {
    expect(removeBackgroundProgressLabel(1, 4)).toBe(
      `${REMOVE_BACKGROUND_LIVE_PENDING} 25%`,
    );
    expect(removeBackgroundProgressLabel(4, 4)).toBe(
      `${REMOVE_BACKGROUND_LIVE_PENDING} 100%`,
    );
    expect(removeBackgroundProgressLabel(5, 4)).toBe(
      `${REMOVE_BACKGROUND_LIVE_PENDING} 100%`,
    );
  });
});

describe('removeBackgroundLiveStatus', () => {
  it('announces progress while pending', () => {
    expect(removeBackgroundLiveStatus(true, null)).toBe(
      REMOVE_BACKGROUND_LIVE_PENDING,
    );
    expect(removeBackgroundLiveStatus(true, 'stale', 'Removing background… 50%'))
      .toBe('Removing background… 50%');
  });

  it('announces error when idle', () => {
    expect(removeBackgroundLiveStatus(false, 'Background removal failed.'))
      .toBe('Background removal failed.');
  });

  it('is empty when idle with no error', () => {
    expect(removeBackgroundLiveStatus(false, null)).toBe('');
  });
});
