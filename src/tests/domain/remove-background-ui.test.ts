import { describe, expect, it } from 'vitest';

import {
  applyRemoveBackgroundResult,
  discardRemoveBackgroundUndo,
  isRemoveBackgroundDisabled,
  REMOVE_BACKGROUND_BUTTON_LABEL,
  REMOVE_BACKGROUND_BUTTON_PENDING_LABEL,
  REMOVE_BACKGROUND_ERROR_FAILED,
  REMOVE_BACKGROUND_ERROR_UNSUPPORTED,
  REMOVE_BACKGROUND_LIVE_PENDING,
  removeBackgroundButtonLabel,
  removeBackgroundLiveStatus,
  undoRemoveBackground,
} from '@/domain/remove-background-ui';

describe('removeBackgroundButtonLabel', () => {
  it('switches idle ↔ pending copy', () => {
    expect(removeBackgroundButtonLabel(false)).toBe(REMOVE_BACKGROUND_BUTTON_LABEL);
    expect(removeBackgroundButtonLabel(true)).toBe(
      REMOVE_BACKGROUND_BUTTON_PENDING_LABEL,
    );
  });
});

describe('removeBackgroundLiveStatus', () => {
  it('announces pending copy while in flight', () => {
    expect(removeBackgroundLiveStatus(true, null)).toBe(
      REMOVE_BACKGROUND_LIVE_PENDING,
    );
    expect(removeBackgroundLiveStatus(true, 'stale')).toBe(
      REMOVE_BACKGROUND_LIVE_PENDING,
    );
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

  it('replaces the file on success and stores the prior file for undo', () => {
    const previous = file('logo.jpg');
    const next = file('logo.png');
    expect(applyRemoveBackgroundResult(previous, { ok: true, file: next }))
      .toEqual({ file: next, error: null, undoFile: previous });
  });

  it('keeps the prior file and maps the message on failure', () => {
    const previous = file('logo.jpg');
    const priorUndo = file('earlier.jpg');
    const applied = applyRemoveBackgroundResult(previous, {
      ok: false,
      message: REMOVE_BACKGROUND_ERROR_FAILED,
    }, priorUndo);
    expect(applied.file).toBe(previous);
    expect(applied.error).toBe(REMOVE_BACKGROUND_ERROR_FAILED);
    expect(applied.undoFile).toBe(priorUndo);
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
    expect(applied.undoFile).toBeNull();
  });

  it('replaces the undo buffer on another successful remove', () => {
    const original = file('logo.jpg');
    const firstCut = file('logo.png');
    const secondCut = file('logo-2.png');
    const afterFirst = applyRemoveBackgroundResult(original, {
      ok: true,
      file: firstCut,
    });
    const afterSecond = applyRemoveBackgroundResult(afterFirst.file, {
      ok: true,
      file: secondCut,
    }, afterFirst.undoFile);
    expect(afterSecond.file).toBe(secondCut);
    expect(afterSecond.undoFile).toBe(firstCut);
  });
});

describe('undoRemoveBackground', () => {
  function file(name: string): File {
    return new File([new Uint8Array([1])], name, { type: 'image/png' });
  }

  it('restores the pre-removal file and clears undo', () => {
    const original = file('logo.jpg');
    const cutout = file('logo.png');
    const state = applyRemoveBackgroundResult(original, {
      ok: true,
      file: cutout,
    });
    expect(undoRemoveBackground(state)).toEqual({
      file: original,
      error: null,
      undoFile: null,
    });
  });

  it('is a no-op when there is nothing to undo', () => {
    const current = file('logo.png');
    const state = { file: current, error: null, undoFile: null };
    expect(undoRemoveBackground(state)).toBe(state);
  });
});

describe('discardRemoveBackgroundUndo', () => {
  it('drops the undo buffer on clear or replace', () => {
    const current = new File([new Uint8Array([1])], 'logo.png', {
      type: 'image/png',
    });
    expect(discardRemoveBackgroundUndo({
      file: current,
      error: 'stale',
    })).toEqual({ file: current, error: 'stale', undoFile: null });
    expect(discardRemoveBackgroundUndo({
      file: current,
      error: null,
    }).undoFile).toBeNull();
  });
});

describe('isRemoveBackgroundDisabled', () => {
  function file(name: string, type: string): File {
    return new File([new Uint8Array([1])], name, { type });
  }

  it('disables when there is no file or the source is SVG', () => {
    expect(isRemoveBackgroundDisabled({ file: null })).toBe(true);
    expect(isRemoveBackgroundDisabled({
      file: file('mark.svg', 'image/svg+xml'),
    })).toBe(true);
  });

  it('enables for an idle raster source', () => {
    expect(isRemoveBackgroundDisabled({
      file: file('logo.png', 'image/png'),
    })).toBe(false);
    expect(isRemoveBackgroundDisabled({
      file: file('photo.jpg', 'image/jpeg'),
    })).toBe(false);
  });

  it('disables while removal, generate, or preview is pending', () => {
    const raster = file('logo.png', 'image/png');
    expect(isRemoveBackgroundDisabled({
      file: raster,
      removalPending: true,
    })).toBe(true);
    expect(isRemoveBackgroundDisabled({
      file: raster,
      generatePending: true,
    })).toBe(true);
    expect(isRemoveBackgroundDisabled({
      file: raster,
      previewPending: true,
    })).toBe(true);
  });
});
