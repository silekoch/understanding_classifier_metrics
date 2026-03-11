import { bindReactiveNumericControls } from "./control-bindings.js";
import {
  attachDistThresholdHandlers,
  attachMetricTrendHandlers,
  attachPrClickHandler,
  attachRocClickHandler,
} from "./chart-interactions.js";

export { bindReactiveNumericControls } from "./control-bindings.js";

export function initHandlers({ ids, state, actions, applyByKey, deps }) {
  const { applyPreset, applyThreshold, applySeed, applyMetricTrendHoverKey } = actions;
  const { scheduleUrlSync, metricTrendHoverKeyFromPointer } = deps;
  const setThreshold = applyThreshold;
  const setMetricTrendHoverKey = applyMetricTrendHoverKey;

  bindReactiveNumericControls({ ids, applyByKey });

  ids.resample.addEventListener("click", () => {
    applySeed(state.seed + 1);
  });

  ids.preset.addEventListener("change", (e) => {
    applyPreset(e.target.value);
  });

  ids.advancedDetails.addEventListener("toggle", () => {
    scheduleUrlSync();
  });

  attachRocClickHandler({ ids, state, setThreshold });
  attachPrClickHandler({ ids, state, setThreshold });
  attachMetricTrendHandlers({
    ids,
    state,
    setThreshold,
    setMetricTrendHoverKey,
    metricTrendHoverKeyFromPointer,
  });
  attachDistThresholdHandlers({ ids, state, setThreshold });
}
