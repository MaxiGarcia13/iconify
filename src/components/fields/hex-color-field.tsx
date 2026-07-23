import { useId } from 'react';

import { Field } from './field';
import { HexColorInput } from './hex-color-input';

export interface HexColorFieldProps {
  label: string;
  value: `#${string}`;
  onChange: (hex: `#${string}`) => void;
  hint?: string;
  id?: string;
  colorAriaLabel: string;
  textAriaLabel: string;
}

/** Hex color control (picker + text) — SPEC §5.3 / §5.4. */
export function HexColorField({
  label,
  value,
  onChange,
  hint,
  id,
  colorAriaLabel,
  textAriaLabel,
}: HexColorFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <Field label={label} htmlFor={inputId} hint={hint} hintId={hintId}>
      <HexColorInput
        id={inputId}
        value={value}
        onCommit={onChange}
        colorAriaLabel={colorAriaLabel}
        textAriaLabel={textAriaLabel}
        describedBy={hintId}
      />
    </Field>
  );
}
