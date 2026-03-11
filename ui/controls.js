import { bindReactiveNumericControls } from "./control-bindings.js";
import {
  attachDistThresholdHandlers,
  attachMetricTrendHandlers,
  attachPrClickHandler,
  attachRocClickHandler,
} from "./chart-interactions.js";

export function initHandlers({ ids, state, view, actions, applyByKey, deps }) {
  const { applyPreset, applyThreshold, applySeed, applyMetricTrendHoverKey } = actions;
  const { scheduleUrlSync, metricTrendHoverKeyFromPointer } = deps;

  bindReactiveNumericControls({ ids, applyByKey });

  ids.resample.addEventListener("click", () => {
    applySeed(state.controls.seed + 1);
  });

  ids.preset.addEventListener("change", (e) => {
    applyPreset(e.target.value);
  });

  ids.advancedDetails.addEventListener("toggle", () => {
    scheduleUrlSync();
  });

  attachRocClickHandler({ ids, state, view, setThreshold: applyThreshold });
  attachPrClickHandler({ ids, state, view, setThreshold: applyThreshold });
  attachMetricTrendHandlers({
    ids,
    state,
    view,
    setThreshold: applyThreshold,
    setMetricTrendHoverKey: applyMetricTrendHoverKey,
    metricTrendHoverKeyFromPointer,
  });
  attachDistThresholdHandlers({ ids, state, view, setThreshold: applyThreshold });
}
