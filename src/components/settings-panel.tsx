import type { SettingsState } from '../lib/settings';

import { useState } from 'react';

import { SETTINGS_DEFAULTS } from '../lib/settings';
import {
  HexColorField,
  IconBackgroundField,
  PaddingField,
  PresetsField,
  TextField,
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
 * Padding, background, presets, app name, theme / background colors.
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

  function onAppNameBlur() {
    const trimmed = state.appName.trim();
    if (!trimmed)
      patch({ appName: SETTINGS_DEFAULTS.appName });
    else if (trimmed !== state.appName)
      patch({ appName: trimmed });
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

      <TextField
        label="App name"
        value={state.appName}
        onChange={(appName) => patch({ appName })}
        onBlur={onAppNameBlur}
        maxLength={64}
      />

      <HexColorField
        label="Theme color"
        value={state.themeColor}
        onChange={(themeColor) => patch({ themeColor })}
        colorAriaLabel="Theme color picker"
        textAriaLabel="Theme color hex"
      />

      <HexColorField
        label="Background color"
        value={state.backgroundColor}
        onChange={(backgroundColor) => patch({ backgroundColor })}
        hint="Manifest page chrome (distinct from icon pad fill)"
        colorAriaLabel="Manifest background color picker"
        textAriaLabel="Manifest background color hex"
      />
    </fieldset>
  );
}
