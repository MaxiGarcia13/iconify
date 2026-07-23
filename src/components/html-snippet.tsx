import { useId, useState } from 'react';

export interface HtmlSnippetProps {
  /** Generated `<head>` markup, or `null` before first successful generate. */
  html: string | null;
}

/**
 * HTML `<head>` snippet panel + copy — SPEC §5.1 / §5.3.
 * Copy uses `navigator.clipboard.writeText`.
 */
export function HtmlSnippet({ html }: HtmlSnippetProps) {
  const statusId = useId();
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const canCopy = Boolean(html);

  async function onCopy() {
    if (!html)
      return;

    try {
      await navigator.clipboard.writeText(html);
      setCopyStatus('Copied to clipboard.');
    } catch {
      setCopyStatus('Could not copy. Select the snippet and copy manually.');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">
          HTML
          {' '}
          <span className="normal-case">&lt;head&gt;</span>
          {' '}
          snippet
        </h2>
        <button
          type="button"
          disabled={!canCopy}
          aria-describedby={statusId}
          onClick={() => {
            void onCopy();
          }}
          className={[
            'border border-surface-border px-3 py-1.5 text-sm font-medium transition-colors',
            'bg-muted text-foreground',
            'hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-surface-border',
          ].join(' ')}
        >
          Copy
        </button>
      </div>

      <pre
        tabIndex={0}
        className={[
          'max-h-64 overflow-auto border border-surface-border bg-muted/40 p-4',
          'text-xs leading-relaxed text-foreground whitespace-pre-wrap break-all',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        ].join(' ')}
        aria-label="Generated HTML head snippet"
      >
        {html ?? 'Generate a package to see the <head> snippet here.'}
      </pre>

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={copyStatus ? 'text-muted-foreground text-sm' : 'sr-only'}
      >
        {copyStatus ?? ''}
      </p>
    </div>
  );
}
