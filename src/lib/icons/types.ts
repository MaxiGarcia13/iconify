import type { Buffer } from 'node:buffer';

import type { PresetId } from './matrix';

export type { PresetId };

/** Processing / API options — SPEC §4.2. */
export interface GenerateOptions {
  background: 'transparent' | `#${string}`;
  padding: number; // 0–50
  presets: PresetId[];
}

export interface AssetEntry {
  /** Path inside ZIP. */
  name: string;
  buffer: Buffer;
  contentType: string;
}

export interface ProcessResult {
  assets: AssetEntry[];
}
