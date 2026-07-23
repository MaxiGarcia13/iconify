import type { GenerateOptions, PresetId } from './icons/types';

import { Buffer } from 'node:buffer';

import { PRESET_IDS } from './icons/matrix';

/** Max upload size — SPEC §3.2. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Option defaults from SPEC §3 `GenerateRequest`. */
export const GENERATE_OPTION_DEFAULTS: GenerateOptions = {
  background: 'transparent',
  padding: 0,
  presets: ['all'],
  appName: 'App',
  themeColor: '#ffffff',
  backgroundColor: '#ffffff',
};

const ALLOWED_MIME = new Set([
  'image/svg+xml',
  'image/png',
  'image/jpeg',
]);

const ALLOWED_EXTENSIONS = new Set(['.svg', '.png', '.jpg', '.jpeg']);

const HEX6 = /^#[0-9a-f]{6}$/i;
const HEX_BG = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;

export type ParseGenerateFormResult
  = | {
    ok: true;
    file: Buffer;
    sourceIsSvg: boolean;
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

  const mime = normalizeMime(fileEntry.type);
  const ext = extensionOf(fileEntry.name);

  if (!ALLOWED_MIME.has(mime) || !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      message: 'Unsupported file type. Allowed: SVG, PNG, JPG.',
      details: { field: 'file' },
    };
  }

  if (fileEntry.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      message: 'File exceeds maximum size of 10MB.',
      details: { field: 'file', maxBytes: MAX_UPLOAD_BYTES },
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

  const presetsRaw = presetsField(form);
  const presets
    = presetsRaw === null
      ? [...GENERATE_OPTION_DEFAULTS.presets]
      : parsePresets(presetsRaw);
  if (presets === null) {
    return {
      ok: false,
      message: 'Invalid presets. Allowed: favicon, apple, android, og, all.',
      details: { field: 'presets' },
    };
  }

  const appName
    = stringField(form, 'appName') ?? GENERATE_OPTION_DEFAULTS.appName;
  if (appName.length === 0 || appName.length > 64) {
    return {
      ok: false,
      message: 'Invalid appName. Expected 1–64 characters.',
      details: { field: 'appName' },
    };
  }

  const themeColor
    = stringField(form, 'themeColor') ?? GENERATE_OPTION_DEFAULTS.themeColor;
  if (!HEX6.test(themeColor)) {
    return {
      ok: false,
      message: 'Invalid themeColor. Expected #RRGGBB.',
      details: { field: 'themeColor' },
    };
  }

  const backgroundColor
    = stringField(form, 'backgroundColor')
      ?? GENERATE_OPTION_DEFAULTS.backgroundColor;
  if (!HEX6.test(backgroundColor)) {
    return {
      ok: false,
      message: 'Invalid backgroundColor. Expected #RRGGBB.',
      details: { field: 'backgroundColor' },
    };
  }

  return {
    ok: true,
    file: buffer,
    sourceIsSvg: mime === 'image/svg+xml' || ext === '.svg',
    options: {
      background,
      padding,
      presets,
      appName,
      themeColor,
      backgroundColor,
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

function normalizeMime(type: string): string {
  return type.trim().toLowerCase().split(';')[0] ?? '';
}

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf('.');
  if (i < 0)
    return '';
  return filename.slice(i).toLowerCase();
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
