import type { SettingsState } from '@/domain/settings';

import { useState } from 'react';

import { SETTINGS_DEFAULTS } from '@/domain/settings';
import { buildHeadHtml } from '@/domain/snippet';
import { isSourceSvg } from '@/domain/upload-constraints';
import { Dropzone } from './dropzone';
import { GenerateButton } from './generate-button';
import { HtmlSnippet } from './html-snippet';
import { SettingsPanel } from './settings-panel';

export function Generator() {
  const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<SettingsState>(SETTINGS_DEFAULTS);
  const [snippetHtml, setSnippetHtml] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onGenerateSuccess() {
    if (!file)
      return;
    setSnippetHtml(buildHeadHtml(isSourceSvg(file)));
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
      <div className="grid min-w-0 gap-6 md:grid-cols-2 md:gap-10">
        <section aria-label="Upload source image" className="min-w-0">
          <h2 className="mb-3 text-sm font-medium tracking-wide uppercase">
            Dropzone
          </h2>
          <Dropzone onFileChange={setFile} disabled={pending} />
        </section>

        <section aria-label="Generation settings" className="min-w-0">
          <h2 className="mb-3 text-sm font-medium tracking-wide uppercase">
            Settings
          </h2>
          <SettingsPanel
            value={settings}
            onChange={setSettings}
            disabled={!file || pending}
          />
        </section>
      </div>

      <section aria-label="Download package" className="min-w-0">
        <GenerateButton
          file={file}
          settings={settings}
          onSuccess={onGenerateSuccess}
          onPendingChange={setPending}
        />
      </section>

      <section aria-label="HTML head snippet" className="min-w-0">
        <HtmlSnippet html={snippetHtml} />
      </section>
    </div>
  );
}
