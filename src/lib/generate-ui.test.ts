import { describe, expect, it } from 'vitest';

import {
  GENERATE_BUTTON_IDLE_LABEL,
  GENERATE_BUTTON_PENDING_LABEL,
  GENERATE_LIVE_PENDING,
  generateButtonLabel,
  generateLiveStatus,
  isGenerateDisabled,
} from './generate-ui';

describe('generateButtonLabel', () => {
  it('switches idle ↔ pending copy', () => {
    expect(generateButtonLabel(false)).toBe(GENERATE_BUTTON_IDLE_LABEL);
    expect(generateButtonLabel(true)).toBe(GENERATE_BUTTON_PENDING_LABEL);
  });
});

describe('generateLiveStatus', () => {
  it('announces progress while pending (SPEC §5.2 step 5)', () => {
    expect(generateLiveStatus(true, null)).toBe(GENERATE_LIVE_PENDING);
    expect(generateLiveStatus(true, 'stale error')).toBe(GENERATE_LIVE_PENDING);
  });

  it('announces error message when idle (SPEC §5.2 step 7 / §5.4)', () => {
    expect(generateLiveStatus(false, 'File too large.')).toBe('File too large.');
  });

  it('is empty when idle with no error', () => {
    expect(generateLiveStatus(false, null)).toBe('');
  });
});

describe('isGenerateDisabled', () => {
  it('disables without file and while pending (SPEC §5.4)', () => {
    expect(isGenerateDisabled(false, false)).toBe(true);
    expect(isGenerateDisabled(false, true)).toBe(true);
    expect(isGenerateDisabled(true, true)).toBe(true);
    expect(isGenerateDisabled(true, false)).toBe(false);
  });
});
