import type { PresetId } from '../../lib/icons/types';

import {
  isPresetChecked,
  SELECTABLE_PRESETS,
  togglePreset,
} from '../../lib/settings';
import { fieldLabelClass } from './field-styles';

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
    <fieldset className="flex flex-col gap-2">
      <legend className={fieldLabelClass}>Presets</legend>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPresetChecked(value, 'all')}
          onChange={(e) => onToggle('all', e.target.checked)}
        />
        {PRESET_LABELS.all}
      </label>
      <div className="flex flex-col gap-1.5 ps-1">
        {SELECTABLE_PRESETS.map((id) => (
          <label key={id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPresetChecked(value, id)}
              onChange={(e) => onToggle(id, e.target.checked)}
            />
            {PRESET_LABELS[id]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
