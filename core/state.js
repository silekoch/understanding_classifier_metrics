import { CONTROL_SPECS } from "./control-specs.js";

const CONTROL_DEFAULTS = Object.fromEntries(
  Object.entries(CONTROL_SPECS).map(([key, spec]) => [key, spec.default])
);

export function createInitialControlValues() {
  return {
    preset: "separated",
    ...CONTROL_DEFAULTS,
    threshold: 1,
  };
}

export function createInitialState() {
  return {
    computed: {
      thresholdMin: 0,
      thresholdMax: 1,
      thresholdStep: 0.001,
      data: null,
      roc: null,
      pr: null,
      metricCurves: null,
    },
    ui: {
      metricTrendHoverKey: null,
      draggingThreshold: false,
      draggingMetricThreshold: false,
      suppressReactiveRegenerate: false,
      urlSyncTimer: null,
    },
  };
}
