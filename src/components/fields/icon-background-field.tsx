import type { ChangeEvent } from 'react';

import { useId } from 'react';

import { Field } from './field';
import { fieldCheckRowClass } from './field-styles';
import { HexColorInput } from './hex-color-input';

export interface IconBackgroundFieldProps {
  transparent: boolean;
  backgroundHex: `#${string}`;
  onTransparentChange: (transparent: boolean) => void;
  onBackgroundHexChange: (hex: `#${string}`) => void;
  id?: string;
}

/** Icon pad fill: transparent toggle + color — SPEC §5.3. */
export function IconBackgroundField({
  transparent,
  backgroundHex,
  onTransparentChange,
  onBackgroundHexChange,
  id,
}: IconBackgroundFieldProps) {
  const autoId = useId();
  const labelId = id ?? `${autoId}-bg-label`;
  const colorId = `${labelId}-color`;

  function onToggle(e: ChangeEvent<HTMLInputElement>) {
    onTransparentChange(e.target.checked);
  }

  return (
    <Field label="Background" labelId={labelId}>
      <label className={fieldCheckRowClass}>
        <input
          type="checkbox"
          checked={transparent}
          onChange={onToggle}
          aria-describedby={labelId}
          className="size-4 shrink-0"
        />
        Transparent
      </label>
      <HexColorInput
        id={colorId}
        value={backgroundHex}
        disabled={transparent}
        onCommit={onBackgroundHexChange}
        colorAriaLabel="Icon background color"
        textAriaLabel="Icon background hex"
      />
    </Field>
  );
}
