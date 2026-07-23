import type { PresetId } from '@/lib/icons/types';

import type { SelectablePreset } from '@/lib/settings';
import {
  isPresetChecked,
  SELECTABLE_PRESETS,

  togglePreset,
} from '@/lib/settings';
import { fieldCheckRowClass, fieldLabelClass } from './field-styles';

export interface PresetsFieldProps {
  value: readonly PresetId[];
  onChange: (presets: PresetId[]) => void;
}

const PRESET_LABELS: Record<SelectablePreset, string> = {
  favicon: 'Favicon',
  apple: 'Apple',
  android: 'Android',
  og: 'Open Graph',
  original: 'Original',
};

/** Preset checkbox group — SPEC §5.3. */
export function PresetsField({ value, onChange }: PresetsFieldProps) {
  function onToggle(id: SelectablePreset, checked: boolean) {
    onChange(togglePreset(value, id, checked));
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className={fieldLabelClass}>Presets</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
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
