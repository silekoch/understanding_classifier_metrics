import { CONTROL_SPECS } from "./control-specs.js";

const CONTROL_DEFAULTS = Object.fromEntries(
  Object.entries(CONTROL_SPECS).map(([key, spec]) => [key, spec.default])
);

export function createInitialState() {
  return {
    controls: {
      preset: "separated",
      ...CONTROL_DEFAULTS,
      threshold: 1,
    },
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
    view: {
      rocClickBox: null,
      prClickBox: null,
      metricTrendBox: null,
      distView: null,
    },
  };
}
