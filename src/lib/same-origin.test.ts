import { describe, expect, it } from 'vitest';

import { isSameOriginRequest } from './same-origin';

describe('isSameOriginRequest (SPEC §3.3 / AC12)', () => {
  it('returns true when Origin matches request URL origin', () => {
    const request = new Request('http://localhost:4321/api/v1/generate', {
      method: 'POST',
      headers: { Origin: 'http://localhost:4321' },
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it('returns false when Origin is missing', () => {
    const request = new Request('http://localhost:4321/api/v1/generate', {
      method: 'POST',
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it('returns false when Origin is a different origin', () => {
    const request = new Request('http://localhost:4321/api/v1/generate', {
      method: 'POST',
      headers: { Origin: 'https://evil.example' },
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it('returns false when Origin differs only by port', () => {
    const request = new Request('http://localhost:4321/api/v1/generate', {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });
});
