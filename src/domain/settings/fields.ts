const HEX6 = /^#?[0-9a-f]{6}$/i;

function clampPercent0to50(value: number): number {
  if (!Number.isFinite(value))
    return 0;
  return Math.min(50, Math.max(0, Math.round(value)));
}

function clampPercent0to100(value: number): number {
  if (!Number.isFinite(value))
    return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function clampPadding(value: number): number {
  return clampPercent0to50(value);
}

export function clampCornerRadius(value: number): number {
  return clampPercent0to100(value);
}

/** Normalize user hex input to `#rrggbb`, or `null` if invalid. */
export function normalizeHex6(raw: string): `#${string}` | null {
  const trimmed = raw.trim();
  if (!HEX6.test(trimmed))
    return null;
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return withHash.toLowerCase() as `#${string}`;
}
