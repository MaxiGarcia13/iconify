import type { ChangeEvent } from 'react';

import { useId } from 'react';

import { Field } from './field';
import { fieldInputClass } from './field-styles';

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  maxLength?: number;
  autoComplete?: string;
}

/** Labeled text input. */
export function TextField({
  label,
  value,
  onChange,
  onBlur,
  id,
  maxLength,
  autoComplete = 'off',
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    onChange(maxLength === undefined ? next : next.slice(0, maxLength));
  }

  return (
    <Field label={label} htmlFor={inputId}>
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        maxLength={maxLength}
        className={fieldInputClass}
        autoComplete={autoComplete}
      />
    </Field>
  );
}
