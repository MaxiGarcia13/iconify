import type { SettingsState } from '@/domain/settings';

import { debounce } from '@maxigarcia/js-utils';

import { postPreview } from './preview';

/** Debounce delay for visual settings → preview (SPEC §5.3.1). */
export const PREVIEW_DEBOUNCE_MS = 250;

export type LivePreviewCallbacks = {
  onUrl: (url: string | null) => void;
  onError?: (message: string | null) => void;
};

export type LivePreviewControllerDeps = {
  postPreviewFn?: typeof postPreview;
  debounceMs?: number;
  debounceFn?: typeof debounce;
  createObjectURL?: (blob: Blob) => string;
  revokeObjectURL?: (url: string) => void;
};

export type LivePreviewController = {
  /** File select / replace — abort prior, fetch immediately. */
  requestImmediate: (file: File, settings: SettingsState) => void;
  /** Visual option change — abort prior, debounce next fetch. */
  requestDebounced: (file: File, settings: SettingsState) => void;
  /** Clear file — abort pending, hide preview. */
  clear: () => void;
  dispose: () => void;
};

/**
 * Orchestrates debounced preview fetches and AbortController cancellation
 * (SPEC §5.3.1 / AC13). Preset changes are the caller's duty to ignore.
 */
export function createLivePreviewController(
  callbacks: LivePreviewCallbacks,
  deps: LivePreviewControllerDeps = {},
): LivePreviewController {
  const postPreviewFn = deps.postPreviewFn ?? postPreview;
  const debounceMs = deps.debounceMs ?? PREVIEW_DEBOUNCE_MS;
  const debounceFn = deps.debounceFn ?? debounce;
  const createObjectURL
    = deps.createObjectURL
      ?? ((blob: Blob) => URL.createObjectURL(blob));
  const revokeObjectURL
    = deps.revokeObjectURL
      ?? ((url: string) => URL.revokeObjectURL(url));

  let generation = 0;
  let inFlight: AbortController | null = null;
  let objectUrl: string | null = null;
  let disposed = false;

  function revokeCurrentUrl() {
    if (objectUrl) {
      revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }

  function abortInFlight() {
    if (inFlight) {
      inFlight.abort();
      inFlight = null;
    }
  }

  function setUrl(url: string | null) {
    if (disposed)
      return;
    callbacks.onUrl(url);
  }

  function setError(message: string | null) {
    if (disposed)
      return;
    callbacks.onError?.(message);
  }

  async function runFetch(
    file: File,
    settings: SettingsState,
    gen: number,
  ): Promise<void> {
    if (disposed || gen !== generation)
      return;

    abortInFlight();
    const ac = new AbortController();
    inFlight = ac;

    const result = await postPreviewFn(file, settings, { signal: ac.signal });

    if (inFlight === ac)
      inFlight = null;

    if (disposed || gen !== generation || result.aborted)
      return;

    if (!result.ok) {
      setError(result.message);
      return;
    }

    revokeCurrentUrl();
    const url = createObjectURL(result.blob);
    objectUrl = url;
    setError(null);
    setUrl(url);
  }

  const debouncedFetch = debounceFn(
    (file: File, settings: SettingsState, gen: number) => runFetch(file, settings, gen),
    debounceMs,
  );

  function bumpGeneration(): number {
    abortInFlight();
    generation += 1;
    return generation;
  }

  return {
    requestImmediate(file, settings) {
      if (disposed)
        return;
      const gen = bumpGeneration();
      void runFetch(file, settings, gen);
    },

    requestDebounced(file, settings) {
      if (disposed)
        return;
      const gen = bumpGeneration();
      void debouncedFetch(file, settings, gen);
    },

    clear() {
      if (disposed)
        return;
      bumpGeneration();
      revokeCurrentUrl();
      setError(null);
      setUrl(null);
    },

    dispose() {
      if (disposed)
        return;
      disposed = true;
      bumpGeneration();
      revokeCurrentUrl();
    },
  };
}
