import type { SettingsState } from '../lib/settings';

import { useState } from 'react';

import { previewBackgroundFromSettings } from '../lib/preview';
import { SETTINGS_DEFAULTS } from '../lib/settings';
import { Dropzone } from './dropzone';
import { GenerateButton } from './generate-button';
import { PreviewGrid } from './preview-grid';
import { SettingsPanel } from './settings-panel';

/**
 * Client island composing dropzone, settings, preview, and download — SPEC §5.1 / §5.2.
 * Holds shared file + settings so previews update when padding / background change.
 */
export function Generator() {
  const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<SettingsState>(SETTINGS_DEFAULTS);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 md:grid-cols-2 md:gap-10">
        <section aria-label="Upload source image" className="min-w-0">
          <h2 className="mb-3 text-sm font-medium tracking-wide uppercase">
            Dropzone
          </h2>
          <Dropzone onFileChange={setFile} />
        </section>

        <section aria-label="Generation settings" className="min-w-0">
          <h2 className="mb-3 text-sm font-medium tracking-wide uppercase">
            Settings
          </h2>
          <SettingsPanel
            value={settings}
            onChange={setSettings}
            disabled={!file}
          />
        </section>
      </div>

      <section aria-label="Live preview" className="min-w-0">
        <h2 className="mb-3 text-sm font-medium tracking-wide uppercase">
          Live Preview
        </h2>
        <PreviewGrid
          file={file}
          padding={settings.padding}
          background={previewBackgroundFromSettings(settings)}
        />
      </section>

      <section aria-label="Download package" className="min-w-0">
        <GenerateButton file={file} settings={settings} />
      </section>
    </div>
  );
}
