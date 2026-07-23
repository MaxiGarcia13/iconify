import type { ChangeEvent } from 'react';

import { useId } from 'react';

import { clampCornerRadius } from '../../lib/settings';
import { Field } from './field';
import { fieldHintClass, fieldInputClass, fieldRangeClass } from './field-styles';

export interface CornerRadiusFieldProps {
  value: number;
  onChange: (cornerRadius: number) => void;
  id?: string;
}

/** Corner radius % range + number — SPEC §5.3 (0–100). */
export function CornerRadiusField({
  value,
  onChange,
  id,
}: CornerRadiusFieldProps) {
  const autoId = useId();
  const rangeId = id ?? `${autoId}-corner-radius`;
  const numberId = `${rangeId}-num`;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(clampCornerRadius(Number(e.target.value)));
  }

  return (
    <Field
      label="Corner radius"
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
        max={100}
        step={1}
        value={value}
        onChange={handleChange}
        className={fieldRangeClass}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value} percent`}
      />
      <div className="flex items-center gap-2">
        <input
          id={numberId}
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={handleChange}
          className={[fieldInputClass, 'max-w-24'].join(' ')}
          aria-label="Corner radius percent"
        />
        <span className={fieldHintClass}>%</span>
      </div>
    </Field>
  );
}
