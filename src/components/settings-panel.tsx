import type { SettingsState } from '../lib/settings';

import { useState } from 'react';

import { SETTINGS_DEFAULTS } from '../lib/settings';
import {
  IconBackgroundField,
  PaddingField,
  PresetsField,
} from './fields';

export interface SettingsPanelProps {
  /** Controlled value; omit for internal state starting at SPEC defaults. */
  value?: SettingsState;
  onChange?: (next: SettingsState) => void;
  /** When true, controls are non-interactive (no valid file yet — SPEC §5.2). */
  disabled?: boolean;
}

/**
 * Generator settings — SPEC §5.3.
 * Padding, background, presets.
 */
export function SettingsPanel({
  value,
  onChange,
  disabled = false,
}: SettingsPanelProps) {
  const [internal, setInternal] = useState<SettingsState>(SETTINGS_DEFAULTS);
  const state = value ?? internal;

  function commit(next: SettingsState) {
    if (value === undefined)
      setInternal(next);
    onChange?.(next);
  }

  function patch(partial: Partial<SettingsState>) {
    commit({ ...state, ...partial });
  }

  return (
    <fieldset
      disabled={disabled}
      aria-disabled={disabled}
      className="flex flex-col gap-5 disabled:opacity-60"
    >
      <legend className="sr-only">Icon generation settings</legend>

      <PaddingField
        value={state.padding}
        onChange={(padding) => patch({ padding })}
      />

      <IconBackgroundField
        transparent={state.transparent}
        backgroundHex={state.backgroundHex}
        onTransparentChange={(transparent) => patch({ transparent })}
        onBackgroundHexChange={(backgroundHex) =>
          patch({ backgroundHex, transparent: false })}
      />

      <PresetsField
        value={state.presets}
        onChange={(presets) => patch({ presets })}
      />
    </fieldset>
  );
}
