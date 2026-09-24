import type { Buffer } from 'node:buffer';

import type { GenerateOptions } from '../icons/types';

export type PreviewOptions = Pick<
  GenerateOptions,
  'background' | 'padding' | 'cornerRadius' | 'monochrome'
>;

export type ParseGenerateFormResult
  = | {
    ok: true;
    file: Buffer;
    sourceIsSvg: boolean;
    sourceFilename: string;
    options: GenerateOptions;
  }
  | {
    ok: false;
    message: string;
    details?: Record<string, unknown>;
  };

export type ParsePreviewFormResult
  = | {
    ok: true;
    file: Buffer;
    options: PreviewOptions;
  }
  | {
    ok: false;
    message: string;
    details?: Record<string, unknown>;
  };

export type ParsedUpload
  = | {
    ok: true;
    file: Buffer;
    sourceIsSvg: boolean;
    sourceFilename: string;
    options: PreviewOptions;
  }
  | {
    ok: false;
    message: string;
    details?: Record<string, unknown>;
  };
