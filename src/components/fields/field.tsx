import type { ReactNode } from 'react';

import { fieldHintClass, fieldLabelClass } from './field-styles';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  labelId?: string;
  hint?: ReactNode;
  hintId?: string;
  /** Trailing meta beside the label (e.g. live value). */
  meta?: ReactNode;
  children: ReactNode;
}

/** Labeled field stack — label, optional hint, control(s). */
export function Field({
  label,
  htmlFor,
  labelId,
  hint,
  hintId,
  meta,
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        {htmlFor
          ? (
              <label htmlFor={htmlFor} className={fieldLabelClass} id={labelId}>
                {label}
              </label>
            )
          : (
              <span className={fieldLabelClass} id={labelId}>
                {label}
              </span>
            )}
        {meta
          ? (
              <span className={fieldHintClass} aria-hidden="true">
                {meta}
              </span>
            )
          : null}
      </div>
      {hint
        ? (
            <p className={fieldHintClass} id={hintId}>
              {hint}
            </p>
          )
        : null}
      {children}
    </div>
  );
}
