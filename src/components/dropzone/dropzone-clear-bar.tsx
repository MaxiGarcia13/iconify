import { REMOVE_BACKGROUND_BUTTON_LABEL } from '@/domain/remove-background-ui';

const actionButtonClassName
  = 'inline-flex min-h-11 shrink-0 touch-manipulation items-center text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50';

export interface DropzoneClearBarProps {
  fileName: string;
  disabled: boolean;
  onClear: () => void;
  onRemoveBackground: () => void;
  removeBackgroundDisabled?: boolean;
}

export function DropzoneClearBar({
  fileName,
  disabled,
  onClear,
  onRemoveBackground,
  removeBackgroundDisabled = false,
}: DropzoneClearBarProps) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
      <span className="min-w-0 truncate text-muted-foreground">
        {`Ready: ${fileName}`}
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          disabled={disabled || removeBackgroundDisabled}
          className={actionButtonClassName}
          onClick={onRemoveBackground}
        >
          {REMOVE_BACKGROUND_BUTTON_LABEL}
        </button>
        <button
          type="button"
          disabled={disabled}
          className={actionButtonClassName}
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
