import type { RemoveBackgroundResult } from '@/services/remove-background';

import { describe, expect, it } from 'vitest';
import {
  REMOVE_BACKGROUND_ERROR_FAILED,
  REMOVE_BACKGROUND_LIVE_PENDING,
} from '@/domain/remove-background-ui';
import { createRemoveBackgroundRunner } from '@/services/remove-background-runner';

function pngFile(name = 'logo.png'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/png' });
}

describe('createRemoveBackgroundRunner', () => {
  it('reports pending and progress, then the result', async () => {
    const pendingFlags: boolean[] = [];
    const progressLabels: Array<string | null> = [];
    const results: RemoveBackgroundResult[] = [];

    const cutout = new File([new Uint8Array([9])], 'logo.png', {
      type: 'image/png',
    });

    const runner = createRemoveBackgroundRunner(
      {
        onPending: (p) => pendingFlags.push(p),
        onProgress: (label) => progressLabels.push(label),
        onResult: (result) => results.push(result),
      },
      {
        removeBackgroundFromSourceFn: async (_file, options) => {
          options?.onProgress?.('compute:inference', 1, 4);
          return { ok: true, file: cutout };
        },
      },
    );

    await runner.run(pngFile());

    expect(pendingFlags).toEqual([true, false]);
    expect(progressLabels[0]).toBe(REMOVE_BACKGROUND_LIVE_PENDING);
    expect(progressLabels).toContain(`${REMOVE_BACKGROUND_LIVE_PENDING} 25%`);
    expect(progressLabels.at(-1)).toBeNull();
    expect(results).toEqual([{ ok: true, file: cutout }]);
  });

  it('ignores a superseded result after cancel', async () => {
    const results: RemoveBackgroundResult[] = [];
    let release!: (result: RemoveBackgroundResult) => void;
    const gate = new Promise<RemoveBackgroundResult>((resolve) => {
      release = resolve;
    });

    const runner = createRemoveBackgroundRunner(
      {
        onPending: () => {},
        onProgress: () => {},
        onResult: (result) => results.push(result),
      },
      {
        removeBackgroundFromSourceFn: async () => gate,
      },
    );

    const runPromise = runner.run(pngFile());
    runner.cancel();
    release({
      ok: false,
      message: REMOVE_BACKGROUND_ERROR_FAILED,
    });
    await runPromise;

    expect(results).toEqual([]);
  });

  it('ignores a superseded result when a newer run starts', async () => {
    const results: RemoveBackgroundResult[] = [];
    const resolvers: Array<(result: RemoveBackgroundResult) => void> = [];

    const runner = createRemoveBackgroundRunner(
      {
        onPending: () => {},
        onProgress: () => {},
        onResult: (result) => results.push(result),
      },
      {
        removeBackgroundFromSourceFn: async () =>
          new Promise<RemoveBackgroundResult>((resolve) => {
            resolvers.push(resolve);
          }),
      },
    );

    const first = runner.run(pngFile('a.png'));
    const second = runner.run(pngFile('b.png'));

    const firstCut = new File([new Uint8Array([1])], 'a.png', {
      type: 'image/png',
    });
    const secondCut = new File([new Uint8Array([2])], 'b.png', {
      type: 'image/png',
    });

    resolvers[0]!({ ok: true, file: firstCut });
    resolvers[1]!({ ok: true, file: secondCut });
    await Promise.all([first, second]);

    expect(results).toEqual([{ ok: true, file: secondCut }]);
  });
});
