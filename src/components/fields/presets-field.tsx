import type { PresetId } from '../../lib/icons/types';

import {
  isPresetChecked,
  SELECTABLE_PRESETS,
  togglePreset,
} from '../../lib/settings';
import { fieldCheckRowClass, fieldLabelClass } from './field-styles';

export interface PresetsFieldProps {
  value: readonly PresetId[];
  onChange: (presets: PresetId[]) => void;
}

const PRESET_LABELS: Record<PresetId, string> = {
  all: 'All',
  favicon: 'Favicon',
  apple: 'Apple',
  android: 'Android',
  og: 'Open Graph',
};

/** Preset checkbox group — SPEC §5.3. */
export function PresetsField({ value, onChange }: PresetsFieldProps) {
  function onToggle(id: PresetId, checked: boolean) {
    onChange(togglePreset(value, id, checked));
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className={fieldLabelClass}>Presets</legend>
      <label className={fieldCheckRowClass}>
        <input
          type="checkbox"
          checked={isPresetChecked(value, 'all')}
          onChange={(e) => onToggle('all', e.target.checked)}
          className="size-4 shrink-0"
        />
        {PRESET_LABELS.all}
      </label>
      <div className="flex flex-col gap-1.5 ps-1">
        {SELECTABLE_PRESETS.map((id) => (
          <label key={id} className={fieldCheckRowClass}>
            <input
              type="checkbox"
              checked={isPresetChecked(value, id)}
              onChange={(e) => onToggle(id, e.target.checked)}
              className="size-4 shrink-0"
            />
            {PRESET_LABELS[id]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
