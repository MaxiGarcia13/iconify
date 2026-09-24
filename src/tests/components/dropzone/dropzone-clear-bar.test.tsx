import { renderToStaticMarkup } from 'react-dom/server';

import { describe, expect, it } from 'vitest';

import { DropzoneClearBar } from '@/components/dropzone/dropzone-clear-bar';
import {
  REMOVE_BACKGROUND_BUTTON_LABEL,
  REMOVE_BACKGROUND_BUTTON_PENDING_LABEL,
} from '@/domain/remove-background-ui';

describe('dropzoneClearBar', () => {
  it('renders Remove background next to Clear', () => {
    const html = renderToStaticMarkup(
      <DropzoneClearBar
        fileName="logo.png"
        disabled={false}
        onClear={() => {}}
        onRemoveBackground={() => {}}
      />,
    );

    expect(html).toContain(REMOVE_BACKGROUND_BUTTON_LABEL);
    expect(html).toContain('Clear');
    expect(html).toContain('Ready: logo.png');
    expect(html.indexOf(REMOVE_BACKGROUND_BUTTON_LABEL))
      .toBeLessThan(html.indexOf('Clear'));
  });

  it('can disable Remove background independently of Clear', () => {
    const html = renderToStaticMarkup(
      <DropzoneClearBar
        fileName="logo.png"
        disabled={false}
        removeBackgroundDisabled
        onClear={() => {}}
        onRemoveBackground={() => {}}
      />,
    );

    expect(html).toContain(
      `>${REMOVE_BACKGROUND_BUTTON_LABEL}</button>`,
    );
    expect(html).toMatch(
      new RegExp(
        `disabled=""[^>]*>${REMOVE_BACKGROUND_BUTTON_LABEL}</button>`,
      ),
    );
    expect(html).toContain('>Clear</button>');
    expect(html).not.toMatch(/disabled=""[^>]*>Clear<\/button>/);
  });

  it('shows pending loading copy while removing background', () => {
    const html = renderToStaticMarkup(
      <DropzoneClearBar
        fileName="logo.png"
        disabled={false}
        removeBackgroundPending
        removeBackgroundDisabled
        onClear={() => {}}
        onRemoveBackground={() => {}}
      />,
    );

    expect(html).toContain(REMOVE_BACKGROUND_BUTTON_PENDING_LABEL);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Ready: logo.png');
    expect(html.match(new RegExp(REMOVE_BACKGROUND_BUTTON_PENDING_LABEL, 'g')))
      ?.toHaveLength(1);
  });
});
