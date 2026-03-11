import { CONTROL_SPECS } from "./control-specs.js";

const CONTROL_DEFAULTS = Object.fromEntries(
  Object.entries(CONTROL_SPECS).map(([key, spec]) => [key, spec.default])
);

export function createInitialState() {
  return {
    preset: "separated",
    ...CONTROL_DEFAULTS,
    threshold: 1,
    rocClickBox: null,
    prClickBox: null,
    metricTrendBox: null,
    metricTrendHoverKey: null,
    distView: null,
    draggingThreshold: false,
    draggingMetricThreshold: false,
    urlSyncTimer: null,
    data: null,
    roc: null,
    pr: null,
    metricCurves: null,
  };
}
