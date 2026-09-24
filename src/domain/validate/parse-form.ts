import type { ParseGenerateFormResult, ParsePreviewFormResult } from './types';

import { GENERATE_OPTION_DEFAULTS } from '../generate-defaults';
import { parsePresets, presetsField } from './fields';
import { parseUpload } from './parse-upload';

export async function parseGenerateForm(
  form: FormData,
): Promise<ParseGenerateFormResult> {
  const parsed = await parseUpload(form);
  if (!parsed.ok)
    return parsed;

  const presetsRaw = presetsField(form);
  const presets
    = presetsRaw === null
      ? [...GENERATE_OPTION_DEFAULTS.presets]
      : parsePresets(presetsRaw);
  if (presets === null) {
    return {
      ok: false,
      message:
        'Invalid presets. Allowed: favicon, apple, android, og, original, all.',
      details: { field: 'presets' },
    };
  }

  return {
    ok: true,
    file: parsed.file,
    sourceIsSvg: parsed.sourceIsSvg,
    sourceFilename: parsed.sourceFilename,
    options: {
      ...parsed.options,
      presets,
    },
  };
}

/** Visual fields only. `presets` is ignored (ZIP membership is generate-only). */
export async function parsePreviewForm(
  form: FormData,
): Promise<ParsePreviewFormResult> {
  const parsed = await parseUpload(form);
  if (!parsed.ok)
    return parsed;

  return {
    ok: true,
    file: parsed.file,
    options: parsed.options,
  };
}
