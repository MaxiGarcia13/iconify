import type { ParsedUpload } from './types';

import { Buffer } from 'node:buffer';

import { GENERATE_OPTION_DEFAULTS } from '../generate-defaults';
import {
  isSourceSvg,
  MAX_UPLOAD_BYTES,
  validateSourceFile,
} from '../upload-constraints';
import {
  parseBackground,
  parseMonochrome,
  stringField,
} from './fields';

export async function parseUpload(form: FormData): Promise<ParsedUpload> {
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
    },
  };
}
