import type { ChangeEvent } from 'react';

import { useId } from 'react';

import { Field } from './field';
import { fieldCheckRowClass } from './field-styles';

export interface MonochromeFieldProps {
  value: boolean;
  onChange: (monochrome: boolean) => void;
  id?: string;
}

/** Monochrome toggle — SPEC §5.3 (greyscale raster content). */
export function MonochromeField({
  value,
  onChange,
  id,
}: MonochromeFieldProps) {
  const autoId = useId();
  const labelId = id ?? `${autoId}-monochrome-label`;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked);
  }

  return (
    <Field label="Monochrome" labelId={labelId}>
      <label className={fieldCheckRowClass}>
        <input
          type="checkbox"
          checked={value}
          onChange={handleChange}
          aria-describedby={labelId}
          className="size-4 shrink-0"
        />
        Greyscale
      </label>
    </Field>
  );
}
