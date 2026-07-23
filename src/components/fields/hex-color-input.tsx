import type { ChangeEvent } from 'react';

import { useEffect, useState } from 'react';

import { normalizeHex6 } from '../../lib/settings';
import { colorSwatchClass, fieldInputClass } from './field-styles';

export interface HexColorInputProps {
  id?: string;
  value: `#${string}`;
  onCommit: (hex: `#${string}`) => void;
  disabled?: boolean;
  colorAriaLabel: string;
  textAriaLabel: string;
  describedBy?: string;
}

/** Color picker + hex text fallback — SPEC §5.4. */
export function HexColorInput({
  id,
  value,
  onCommit,
  disabled = false,
  colorAriaLabel,
  textAriaLabel,
  describedBy,
}: HexColorInputProps) {
  const [draft, setDraft] = useState<string>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function onPickerChange(e: ChangeEvent<HTMLInputElement>) {
    const next = normalizeHex6(e.target.value);
    if (!next)
      return;
    setDraft(next);
    onCommit(next);
  }

  function onTextChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setDraft(raw);
    const next = normalizeHex6(raw);
    if (next)
      onCommit(next);
  }

  function onTextBlur() {
    const next = normalizeHex6(draft);
    if (next) {
      setDraft(next);
      onCommit(next);
      return;
    }
    setDraft(value);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        id={id}
        type="color"
        value={value}
        onChange={onPickerChange}
        disabled={disabled}
        className={colorSwatchClass}
        aria-label={colorAriaLabel}
        aria-describedby={describedBy}
      />
      <input
        type="text"
        value={draft}
        onChange={onTextChange}
        onBlur={onTextBlur}
        disabled={disabled}
        spellCheck={false}
        className={[fieldInputClass, 'max-w-36 font-mono'].join(' ')}
        aria-label={textAriaLabel}
        placeholder="#ffffff"
      />
    </div>
  );
}
