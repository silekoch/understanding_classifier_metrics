import { REACTIVE_NUMERIC_CONTROL_KEYS, sanitizeControlValue } from "../core/control-specs.js";

export function readControls({ ids, store }) {
  store.set("preset", ids.preset.value, { silent: true });
  for (const key of REACTIVE_NUMERIC_CONTROL_KEYS) {
    store.set(key, sanitizeControlValue(key, ids[key].value), { silent: true });
  }
}
