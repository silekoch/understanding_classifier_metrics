import { bindReactiveNumericControls } from "./control-bindings.js";
import {
  attachConfusionMatrixHandlers,
  attachDistThresholdHandlers,
  attachMetricTrendHandlers,
  attachPrDragHandler,
  attachPrClickHandler,
  attachRocDragHandler,
  attachRocClickHandler,
} from "./chart-interactions.js";

export function initHandlers({ ids, state, view, actions, applyByKey, deps }) {
  const {
    applyPreset,
    applyThreshold,
    applySeed,
    applyMetricTrendHoverState,
    applyMatrixHoverCell,
    toggleMatrixPinnedCell,
  } = actions;
  const { scheduleUrlSync, metricTrendHoverKeyFromPointer, getControl } = deps;

  bindReactiveNumericControls({ ids, applyByKey });

  ids.resample.addEventListener("click", () => {
    applySeed(getControl("seed") + 1);
  });

  ids.preset.addEventListener("change", (e) => {
    applyPreset(e.target.value);
  });

  ids.advancedDetails.addEventListener("toggle", () => {
    scheduleUrlSync();
  });

  attachRocClickHandler({ ids, state, view, setThreshold: applyThreshold });
  attachRocDragHandler({
    ids,
    state,
    view,
    setThreshold: applyThreshold,
    getThreshold: () => getControl("threshold"),
  });
  attachPrClickHandler({ ids, state, view, setThreshold: applyThreshold });
  attachPrDragHandler({
    ids,
    state,
    view,
    setThreshold: applyThreshold,
    getThreshold: () => getControl("threshold"),
  });
  attachConfusionMatrixHandlers({
    ids,
    setMatrixHoverCell: applyMatrixHoverCell,
    toggleMatrixPinnedCell,
  });
  attachMetricTrendHandlers({
    ids,
    state,
    view,
    setThreshold: applyThreshold,
    getThreshold: () => getControl("threshold"),
    setMetricTrendHoverState: applyMetricTrendHoverState,
    metricTrendHoverKeyFromPointer,
  });
  attachDistThresholdHandlers({
    ids,
    state,
    view,
    setThreshold: applyThreshold,
    getThreshold: () => getControl("threshold"),
  });
}
