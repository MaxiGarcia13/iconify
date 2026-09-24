import type { RemoveBackgroundFn, RemoveBackgroundResult } from './remove-background';

import { removeBackgroundFromSource } from './remove-background';

export interface RemoveBackgroundRunnerCallbacks {
  onPending: (pending: boolean) => void;
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
  }

  async function run(file: File) {
    const gen = ++generation;
    callbacks.onPending(true);

    const result = await removeFn(file, {
      removeBackground: deps.removeBackground,
    });

    if (gen !== generation)
      return;

    callbacks.onPending(false);
    callbacks.onResult(result);
  }

  return { run, cancel };
}
