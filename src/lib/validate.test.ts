import { describe, expect, it } from 'vitest';

import { solidPng } from '../test/fixtures';
import {
  GENERATE_OPTION_DEFAULTS,
  MAX_UPLOAD_BYTES,
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
    });

    const parsed = await parseGenerateForm(form);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok)
      return;

    expect(parsed.options).toEqual({
      background: '#112233',
      padding: 20,
      cornerRadius: 0,
      monochrome: false,
      presets: ['favicon', 'apple'],
    });
  });

  it('parses cornerRadius from multipart fields', async () => {
    const form = await formWithFile({ cornerRadius: '25' });
    const parsed = await parseGenerateForm(form);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok)
      return;
    expect(parsed.options.cornerRadius).toBe(25);
  });

  it('rejects cornerRadius outside 0–100', async () => {
    for (const cornerRadius of ['-1', '101', 'abc']) {
      const form = await formWithFile({ cornerRadius });
      const parsed = await parseGenerateForm(form);
      expect(parsed.ok).toBe(false);
      if (parsed.ok)
        continue;
      expect(parsed.message).toBe(
        'Invalid cornerRadius. Expected a number from 0 to 100.',
      );
      expect(parsed.details).toEqual({ field: 'cornerRadius' });
    }
  });

  it('accepts cornerRadius boundary values 0 and 100', async () => {
    for (const cornerRadius of ['0', '100']) {
      const form = await formWithFile({ cornerRadius });
      const parsed = await parseGenerateForm(form);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok)
        return;
      expect(parsed.options.cornerRadius).toBe(Number(cornerRadius));
    }
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

  it('rejects disallowed MIME types (SPEC §3.2 / AC3)', async () => {
    const form = await formWithFile(
      undefined,
      new File([new Uint8Array([0x47, 0x49, 0x46])], 'anim.gif', {
        type: 'image/gif',
      }),
    );

    const parsed = await parseGenerateForm(form);
    expect(parsed).toEqual({
      ok: false,
      message: 'Unsupported file type. Allowed: SVG, PNG, JPG.',
      details: { field: 'file' },
    });
  });

  it('rejects disallowed extensions even with an allowed MIME', async () => {
    const png = await solidPng();
    const form = await formWithFile(
      undefined,
      new File([Uint8Array.from(png)], 'logo.webp', { type: 'image/png' }),
    );

    const parsed = await parseGenerateForm(form);
    expect(parsed.ok).toBe(false);
    if (parsed.ok)
      return;
    expect(parsed.message).toBe(
      'Unsupported file type. Allowed: SVG, PNG, JPG.',
    );
    expect(parsed.details).toEqual({ field: 'file' });
  });

  it('rejects uploads larger than 10 MB (SPEC §3.2 / AC3)', async () => {
    const form = await formWithFile(
      undefined,
      new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], 'huge.png', {
        type: 'image/png',
      }),
    );

    const parsed = await parseGenerateForm(form);
    expect(parsed).toEqual({
      ok: false,
      message: 'File exceeds maximum size of 10MB.',
      details: { field: 'file', maxBytes: MAX_UPLOAD_BYTES },
    });
  });

  it('rejects padding outside 0–50', async () => {
    for (const padding of ['-1', '51', 'abc']) {
      const form = await formWithFile({ padding });
      const parsed = await parseGenerateForm(form);
      expect(parsed.ok).toBe(false);
      if (parsed.ok)
        continue;
      expect(parsed.message).toBe(
        'Invalid padding. Expected a number from 0 to 50.',
      );
      expect(parsed.details).toEqual({ field: 'padding' });
    }
  });

  it('accepts padding boundary values 0 and 50', async () => {
    for (const padding of ['0', '50']) {
      const form = await formWithFile({ padding });
      const parsed = await parseGenerateForm(form);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok)
        return;
      expect(parsed.options.padding).toBe(Number(padding));
    }
  });

  it('rejects invalid hex colors for background', async () => {
    const cases: Array<{ field: string; value: string; message: string }> = [
      {
        field: 'background',
        value: '#gg0000',
        message:
          'Invalid background. Use `transparent` or #RRGGBB / #RRGGBBAA.',
      },
      {
        field: 'background',
        value: '#fff',
        message:
          'Invalid background. Use `transparent` or #RRGGBB / #RRGGBBAA.',
      },
    ];

    for (const { field, value, message } of cases) {
      const form = await formWithFile({ [field]: value });
      const parsed = await parseGenerateForm(form);
      expect(parsed.ok).toBe(false);
      if (parsed.ok)
        continue;
      expect(parsed.message).toBe(message);
      expect(parsed.details).toEqual({ field });
    }
  });

  it('accepts transparent and 8-digit hex backgrounds', async () => {
    for (const background of ['transparent', '#11223344'] as const) {
      const form = await formWithFile({ background });
      const parsed = await parseGenerateForm(form);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok)
        return;
      expect(parsed.options.background).toBe(background);
    }
  });
});
