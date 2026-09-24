import type { SettingsState } from '@/domain/settings';

import { useEffect, useRef, useState } from 'react';

import { visualPreviewKey } from '@/domain/settings';
import { createLivePreviewController } from '@/services/live-preview';

export interface LivePreviewState {
  url: string | null;
  error: string | null;
  pending: boolean;
}

/**
 * Live dropzone preview from `POST /api/v1/preview` (SPEC §5.3.1).
 * Debounces visual settings; aborts in-flight on newer change; ignores presets.
 */
export function useLivePreview(
  file: File | null,
  settings: SettingsState,
): LivePreviewState {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const controllerRef = useRef<ReturnType<typeof createLivePreviewController> | null>(null);
  const fileRef = useRef<File | null>(null);
  const visualKeyRef = useRef<string>('');

  useEffect(() => {
    const controller = createLivePreviewController({
      onUrl: setUrl,
      onError: setError,
      onPending: setPending,
    });
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  const visualKey = visualPreviewKey(settings);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller)
      return;

    if (!file) {
      fileRef.current = null;
      visualKeyRef.current = '';
      controller.clear();
      return;
    }

    const fileChanged = file !== fileRef.current;
    const visualChanged = visualKey !== visualKeyRef.current;

    fileRef.current = file;
    visualKeyRef.current = visualKey;

    if (fileChanged)
      controller.requestImmediate(file, settings);
    else if (visualChanged)
      controller.requestDebounced(file, settings);
  }, [file, visualKey, settings]);

  return { url, error, pending };
}
