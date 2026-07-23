import type { ChangeEvent } from 'react';

import { cn } from '@maxigarcia/js-utils';
import { useId } from 'react';

import { clampPadding } from '@/lib/settings';
import { Field } from './field';
import { fieldHintClass, fieldInputClass, fieldRangeClass } from './field-styles';

export interface PaddingFieldProps {
  value: number;
  onChange: (padding: number) => void;
  id?: string;
}

/** Padding % range + number — SPEC §5.3 (0–50). */
export function PaddingField({ value, onChange, id }: PaddingFieldProps) {
  const autoId = useId();
  const rangeId = id ?? `${autoId}-padding`;
  const numberId = `${rangeId}-num`;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(clampPadding(Number(e.target.value)));
  }

  return (
    <Field
      label="Padding"
      htmlFor={rangeId}
      meta={(
        <>
          {value}
          %
        </>
      )}
    >
      <input
        id={rangeId}
        type="range"
        min={0}
        max={50}
        step={1}
        value={value}
        onChange={handleChange}
        className={fieldRangeClass}
        aria-valuemin={0}
        aria-valuemax={50}
        aria-valuenow={value}
        aria-valuetext={`${value} percent`}
      />
      <div className="flex items-center gap-2">
        <input
          id={numberId}
          type="number"
          min={0}
          max={50}
          step={1}
          value={value}
          onChange={handleChange}
          className={cn(fieldInputClass, 'max-w-24')}
          aria-label="Padding percent"
        />
        <span className={fieldHintClass}>%</span>
      </div>
    </Field>
  );
}
