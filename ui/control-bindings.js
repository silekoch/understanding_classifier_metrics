import { REACTIVE_NUMERIC_CONTROL_KEYS } from "./control-specs.js";

function bindInputAndChange(el, handler) {
  if (!el) {
    return;
  }
  el.addEventListener("input", handler);
  el.addEventListener("change", handler);
}

function bindNumericInputAndChange(el, onValue) {
  bindInputAndChange(el, () => {
    onValue(Number(el.value));
  });
}

export function bindReactiveNumericControls({ ids, applyByKey }) {
  for (const key of REACTIVE_NUMERIC_CONTROL_KEYS) {
    const el = ids[key];
    if (!el) {
      throw new Error(`Missing reactive control element: ${key}`);
    }
    const apply = applyByKey[key];
    if (typeof apply !== "function") {
      throw new Error(`Missing reactive control handler: ${key}`);
    }
    bindNumericInputAndChange(el, apply);
  }
}
