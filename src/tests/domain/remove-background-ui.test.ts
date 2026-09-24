import { describe, expect, it } from 'vitest';

import {
  REMOVE_BACKGROUND_ERROR_FAILED,
  REMOVE_BACKGROUND_ERROR_UNSUPPORTED,
  REMOVE_BACKGROUND_LIVE_PENDING,
  applyRemoveBackgroundResult,
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
    expect(removeBackgroundLiveStatus(false, REMOVE_BACKGROUND_ERROR_FAILED))
      .toBe(REMOVE_BACKGROUND_ERROR_FAILED);
  });

  it('is empty when idle with no error', () => {
    expect(removeBackgroundLiveStatus(false, null)).toBe('');
  });
});

describe('applyRemoveBackgroundResult', () => {
  function file(name: string): File {
    return new File([new Uint8Array([1])], name, { type: 'image/png' });
  }

  it('replaces the file on success and clears error', () => {
    const previous = file('logo.jpg');
    const next = file('logo.png');
    expect(applyRemoveBackgroundResult(previous, { ok: true, file: next }))
      .toEqual({ file: next, error: null });
  });

  it('keeps the prior file and maps the message on failure', () => {
    const previous = file('logo.jpg');
    const applied = applyRemoveBackgroundResult(previous, {
      ok: false,
      message: REMOVE_BACKGROUND_ERROR_FAILED,
    });
    expect(applied.file).toBe(previous);
    expect(applied.error).toBe(REMOVE_BACKGROUND_ERROR_FAILED);
    expect(removeBackgroundLiveStatus(false, applied.error))
      .toBe(REMOVE_BACKGROUND_ERROR_FAILED);
  });

  it('maps unsupported sources the same way', () => {
    const previous = file('mark.svg');
    const applied = applyRemoveBackgroundResult(previous, {
      ok: false,
      message: REMOVE_BACKGROUND_ERROR_UNSUPPORTED,
    });
    expect(applied.file).toBe(previous);
    expect(applied.error).toBe(REMOVE_BACKGROUND_ERROR_UNSUPPORTED);
  });
});
