import { REACTIVE_NUMERIC_CONTROL_KEYS } from "../core/control-specs.js";

export function writeControls({ ids, store }) {
  ids.preset.value = store.get("preset");
  for (const key of REACTIVE_NUMERIC_CONTROL_KEYS) {
    ids[key].value = String(store.get(key));
  }
}
