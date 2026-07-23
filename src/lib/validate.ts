import type { GenerateOptions, PresetId } from './icons/types';

import { Buffer } from 'node:buffer';

import { GENERATE_OPTION_DEFAULTS } from './generate-defaults';
import { PRESET_IDS } from './icons/matrix';
import {
  isSourceSvg,
  MAX_UPLOAD_BYTES,
  validateSourceFile,
} from './upload-constraints';

export { GENERATE_OPTION_DEFAULTS } from './generate-defaults';
export { MAX_UPLOAD_BYTES } from './upload-constraints';

const HEX_BG = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;

export type ParseGenerateFormResult
  = | {
    ok: true;
    file: Buffer;
    sourceIsSvg: boolean;
    /** Upload basename for §2.5 original ZIP naming. */
    sourceFilename: string;
    options: GenerateOptions;
  }
  | {
    ok: false;
    message: string;
    details?: Record<string, unknown>;
  };

/**
 * Parse multipart `FormData` for `POST /api/v1/generate`.
 * Applies SPEC §3 defaults and validates MIME, size, and option fields.
 */
export async function parseGenerateForm(
  form: FormData,
): Promise<ParseGenerateFormResult> {
  const fileEntry = form.get('file');
  if (fileEntry === null || fileEntry === '') {
    return {
      ok: false,
      message: 'Missing file upload.',
      details: { field: 'file' },
    };
  }

  if (!(fileEntry instanceof File)) {
    return {
      ok: false,
      message: 'Unsupported file type. Allowed: SVG, PNG, JPG.',
      details: { field: 'file' },
    };
  }

  const sourceCheck = validateSourceFile(fileEntry);
  if (!sourceCheck.ok) {
    const details: Record<string, unknown> = { field: 'file' };
    if (sourceCheck.message.includes('10MB'))
      details.maxBytes = MAX_UPLOAD_BYTES;
    return {
      ok: false,
      message: sourceCheck.message,
      details,
    };
  }

  const buffer = Buffer.from(await fileEntry.arrayBuffer());
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      message: 'File exceeds maximum size of 10MB.',
      details: { field: 'file', maxBytes: MAX_UPLOAD_BYTES },
    };
  }

  const backgroundRaw
    = stringField(form, 'background') ?? GENERATE_OPTION_DEFAULTS.background;
  const background = parseBackground(backgroundRaw);
  if (background === null) {
    return {
      ok: false,
      message: 'Invalid background. Use `transparent` or #RRGGBB / #RRGGBBAA.',
      details: { field: 'background' },
    };
  }

  const paddingRaw = stringField(form, 'padding');
  const padding
    = paddingRaw === null
      ? GENERATE_OPTION_DEFAULTS.padding
      : Number(paddingRaw);
  if (!Number.isFinite(padding) || padding < 0 || padding > 50) {
    return {
      ok: false,
      message: 'Invalid padding. Expected a number from 0 to 50.',
      details: { field: 'padding' },
    };
  }

  const cornerRadiusRaw = stringField(form, 'cornerRadius');
  const cornerRadius
    = cornerRadiusRaw === null
      ? GENERATE_OPTION_DEFAULTS.cornerRadius
      : Number(cornerRadiusRaw);
  if (!Number.isFinite(cornerRadius) || cornerRadius < 0 || cornerRadius > 100) {
    return {
      ok: false,
      message: 'Invalid cornerRadius. Expected a number from 0 to 100.',
      details: { field: 'cornerRadius' },
    };
  }

  const monochromeRaw = stringField(form, 'monochrome');
  const monochrome
    = monochromeRaw === null
      ? GENERATE_OPTION_DEFAULTS.monochrome
      : parseMonochrome(monochromeRaw);
  if (monochrome === null) {
    return {
      ok: false,
      message: 'Invalid monochrome. Expected `true` or `false`.',
      details: { field: 'monochrome' },
    };
  }

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
    file: buffer,
    sourceIsSvg: isSourceSvg(fileEntry),
    sourceFilename: fileEntry.name,
    options: {
      background,
      padding,
      cornerRadius,
      monochrome,
      presets,
    },
  };
}

function stringField(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (value === null)
    return null;
  if (typeof value !== 'string')
    return null;
  return value;
}

/** Comma-separated or repeated `presets` fields — SPEC §2.5. */
function presetsField(form: FormData): string | null {
  const values = form
    .getAll('presets')
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
  if (values.length === 0)
    return null;
  return values.join(',');
}

function parseBackground(
  value: string,
): GenerateOptions['background'] | null {
  if (value === 'transparent')
    return 'transparent';
  if (HEX_BG.test(value))
    return value as `#${string}`;
  return null;
}

/** Multipart literals `true` / `false` only — SPEC §3 `monochrome`. */
function parseMonochrome(value: string): boolean | null {
  if (value === 'true')
    return true;
  if (value === 'false')
    return false;
  return null;
}

function parsePresets(raw: string): PresetId[] | null {
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0)
    return null;

  const allowed = new Set<string>(PRESET_IDS);
  const presets: PresetId[] = [];

  for (const part of parts) {
    if (!allowed.has(part))
      return null;
    presets.push(part as PresetId);
  }

  return presets;
}
