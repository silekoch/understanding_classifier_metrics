import { SHAPE_CONTROL_KEYS } from "../core/control-specs.js";
import { buildApplyByKey, subscribeRegenerateKeys } from "./reactive-control-wiring.js";

// Shape controls are grouped to keep mode-specific parameter wiring separate
// from global control behavior managed in wireReactiveControls.
export function wireShapeControls({ store, state, ids, regenerateAndRender }) {
  subscribeRegenerateKeys({
    store,
    keys: SHAPE_CONTROL_KEYS,
    state,
    ids,
    regenerateAndRender,
  });

  const applyByKey = buildApplyByKey({
    store,
    keys: SHAPE_CONTROL_KEYS,
  });

  return {
    applyByKey,
  };
}
