export interface DropzoneClearBarProps {
  fileName: string;
  disabled: boolean;
  onClear: () => void;
}

/** Ready-state row with filename and Clear action. */
export function DropzoneClearBar({ fileName, disabled, onClear }: DropzoneClearBarProps) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground min-w-0 truncate">
        {`Ready: ${fileName}`}
      </span>
      <button
        type="button"
        disabled={disabled}
        className="text-foreground focus-visible:outline-accent inline-flex min-h-11 shrink-0 touch-manipulation items-center underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  );
}
