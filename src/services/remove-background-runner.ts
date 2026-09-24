import type { RemoveBackgroundFn, RemoveBackgroundResult } from './remove-background';
import {
  REMOVE_BACKGROUND_LIVE_PENDING,
  removeBackgroundProgressLabel,
} from '@/domain/remove-background-ui';
import {

  removeBackgroundFromSource,

} from './remove-background';

export interface RemoveBackgroundRunnerCallbacks {
  onPending: (pending: boolean) => void;
  onProgress: (label: string | null) => void;
  /** Called only for the active run (not after cancel / supersede). */
  onResult: (result: RemoveBackgroundResult) => void;
}

export interface RemoveBackgroundRunnerDeps {
  removeBackgroundFromSourceFn?: typeof removeBackgroundFromSource;
  removeBackground?: RemoveBackgroundFn;
}

export interface RemoveBackgroundRunner {
  run: (file: File) => Promise<void>;
  /** Invalidate in-flight work so its result is ignored. */
  cancel: () => void;
}

/**
 * Runs client background removal with generation-based supersede
 * (clear / replace mid-run must not apply a stale result).
 */
export function createRemoveBackgroundRunner(
  callbacks: RemoveBackgroundRunnerCallbacks,
  deps: RemoveBackgroundRunnerDeps = {},
): RemoveBackgroundRunner {
  const removeFn
    = deps.removeBackgroundFromSourceFn ?? removeBackgroundFromSource;

  let generation = 0;

  function cancel() {
    generation += 1;
    callbacks.onPending(false);
    callbacks.onProgress(null);
  }

  async function run(file: File) {
    const gen = ++generation;
    callbacks.onPending(true);
    callbacks.onProgress(REMOVE_BACKGROUND_LIVE_PENDING);

    const result = await removeFn(file, {
      removeBackground: deps.removeBackground,
      onProgress: (_key, current, total) => {
        if (gen !== generation)
          return;
        callbacks.onProgress(removeBackgroundProgressLabel(current, total));
      },
    });

    if (gen !== generation)
      return;

    callbacks.onPending(false);
    callbacks.onProgress(null);
    callbacks.onResult(result);
  }

  return { run, cancel };
}
