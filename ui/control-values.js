import { REACTIVE_NUMERIC_CONTROL_KEYS, sanitizeControlValue } from "../core/control-specs.js";

export function readControls({ ids, state }) {
  state.preset = ids.preset.value;
  for (const key of REACTIVE_NUMERIC_CONTROL_KEYS) {
    state[key] = sanitizeControlValue(key, ids[key].value);
  }
}
