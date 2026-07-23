import { describe, expect, it } from 'vitest';

import { solidPng } from '../test/fixtures';
import {
  GENERATE_OPTION_DEFAULTS,
  parseGenerateForm,
} from './validate';

async function formWithFile(
  overrides?: Record<string, string>,
  file?: File,
): Promise<FormData> {
  const png = await solidPng();
  const form = new FormData();
  form.set(
    'file',
    file
      ?? new File([Uint8Array.from(png)], 'logo.png', { type: 'image/png' }),
  );
  if (overrides) {
    for (const [key, value] of Object.entries(overrides))
      form.set(key, value);
  }
  return form;
}

describe('parseGenerateForm', () => {
  it('applies SPEC §3 defaults when option fields are omitted', async () => {
    const form = await formWithFile();
    const parsed = await parseGenerateForm(form);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok)
      return;

    expect(parsed.options).toEqual(GENERATE_OPTION_DEFAULTS);
    expect(parsed.sourceIsSvg).toBe(false);
    expect(parsed.file.byteLength).toBeGreaterThan(0);
  });

  it('parses explicit option overrides from multipart fields', async () => {
    const form = await formWithFile({
      background: '#112233',
      padding: '20',
      presets: 'favicon,apple',
      appName: 'Iconify',
      themeColor: '#0a0a0a',
      backgroundColor: '#f5f5f5',
    });

    const parsed = await parseGenerateForm(form);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok)
      return;

    expect(parsed.options).toEqual({
      background: '#112233',
      padding: 20,
      presets: ['favicon', 'apple'],
      appName: 'Iconify',
      themeColor: '#0a0a0a',
      backgroundColor: '#f5f5f5',
    });
  });

  it('accepts repeated presets fields (SPEC §2.5)', async () => {
    const form = await formWithFile();
    form.append('presets', 'favicon');
    form.append('presets', 'og');

    const parsed = await parseGenerateForm(form);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok)
      return;

    expect(parsed.options.presets).toEqual(['favicon', 'og']);
  });

  it('marks SVG uploads via MIME or extension', async () => {
    const svg = new File(
      [new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')],
      'mark.svg',
      { type: 'image/svg+xml' },
    );
    const form = await formWithFile(undefined, svg);

    const parsed = await parseGenerateForm(form);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok)
      return;

    expect(parsed.sourceIsSvg).toBe(true);
  });
});
