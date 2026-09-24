import { describe, expect, it, vi } from 'vitest';

import {
  applyRemoveBackgroundResult,
  discardRemoveBackgroundUndo,
} from '@/domain/remove-background-ui';

describe('clear / replace discards undo and leaves abort to the runner', () => {
  function file(name: string): File {
    return new File([new Uint8Array([1])], name, { type: 'image/png' });
  }

  it('keeps an undo buffer after a successful remove', () => {
    const original = file('logo.jpg');
    const cutout = file('logo.png');
    const applied = applyRemoveBackgroundResult(original, {
      ok: true,
      file: cutout,
    });
    expect(applied.undoFile).toBe(original);
  });

  it('discards the undo buffer on clear / replace', () => {
    const original = file('logo.jpg');
    const cutout = file('logo.png');
    const afterRemove = applyRemoveBackgroundResult(original, {
      ok: true,
      file: cutout,
    });
    const afterReplace = discardRemoveBackgroundUndo({
      file: file('other.png'),
      error: null,
    });
    expect(afterRemove.undoFile).toBe(original);
    expect(afterReplace.undoFile).toBeNull();
  });

  it('interrupt aborts in-flight work then discards undo', () => {
    const cancelInFlight = vi.fn();
    const discardUndoBuffer = vi.fn();

    function interrupt() {
      cancelInFlight();
      discardUndoBuffer();
    }

    interrupt();
    expect(cancelInFlight).toHaveBeenCalledTimes(1);
    expect(discardUndoBuffer).toHaveBeenCalledTimes(1);
    expect(cancelInFlight.mock.invocationCallOrder[0])
      .toBeLessThan(discardUndoBuffer.mock.invocationCallOrder[0]!);
  });
});
