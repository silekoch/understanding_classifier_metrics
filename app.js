import { PRESETS } from "./presets.js";
import { createInitialState } from "./core/state.js";
import { createStateStore } from "./core/state-store.js";
import { fmt, fmtPct } from "./core/format.js";
import { computeMetricCurves, computeOperatingPoint } from "./core/metrics.js";
import { computeCurveState, computeThresholdBounds } from "./core/derived-state.js";
import { generateData } from "./core/data.js";
import { drawRoc } from "./viz/roc.js";
import { drawPr } from "./viz/pr.js";
import { drawDist } from "./viz/dist.js";
import { drawConfusionMatrix } from "./viz/matrix.js";
import { drawMetricTrend, metricTrendHoverKeyFromPointer } from "./viz/metric-trend.js";
import { initHandlers } from "./ui/controls.js";
import { restoreStateFromUrl, saveStateToUrl, scheduleUrlSync } from "./ui/url-state.js";
import { applyPresetValues, syncControlOutputs } from "./ui/preset-controls.js";
import { getIds } from "./ui/dom-ids.js";
import { readControls } from "./ui/control-values.js";
import { URL_BOOL_KEYS, URL_NUM_KEYS } from "./ui/url-state-keys.js";
import { renderMetricsText } from "./ui/metrics-text.js";
import { runStartupRender } from "./ui/startup.js";
import { wireShapeControls } from "./ui/reactive-shape-controls.js";
import { wireReactiveControls } from "./ui/reactive-controls.js";

const state = createInitialState();
const view = {
  rocClickBox: null,
  prClickBox: null,
  metricTrendBox: null,
  distView: null,
};
const ids = getIds(document);
const store = createStateStore({
  ...state.controls,
  metricTrendHoverKey: state.ui.metricTrendHoverKey,
});

function syncControlsFromStore() {
  for (const key of Object.keys(state.controls)) {
    state.controls[key] = store.get(key);
  }
}

const readControlValues = () => {
  readControls({ ids, store });
  syncControlsFromStore();
};

const { applyByKey: shapeApplyByKey } = wireShapeControls({
  store,
  state,
  ids,
  regenerateAndRender,
});

const {
  applyByKey: nonShapeApplyByKey,
  applyThreshold,
  applyMetricTrendHoverKey,
  applyPreset,
} = wireReactiveControls({
  store,
  state,
  ids,
  presets: PRESETS,
  applyPresetValues,
  regenerateAndRender,
  renderThresholdViews,
  drawMetricTrend: renderMetricTrend,
});

const applyByKey = {
  ...nonShapeApplyByKey,
  ...shapeApplyByKey,
};

function getActivePreset() {
  return PRESETS[state.controls.preset] || PRESETS.separated;
}

function computeEverything() {
  const { roc, pr } = computeCurveState({
    samples: state.computed.data.all,
    threshold: state.controls.threshold,
  });
  state.computed.roc = roc;
  state.computed.pr = pr;
}

function updateOperatingPoint() {
  if (!state.computed.data || !state.computed.roc || !state.computed.pr) {
    return;
  }
  const op = computeOperatingPoint(state.controls.threshold, state.computed.data.all);
  state.computed.roc.op = op;
  state.computed.pr.op = { recall: op.recall, precision: op.precision };
}

function updateThresholdRange() {
  const bounds = computeThresholdBounds({
    data: state.computed.data,
    threshold: state.controls.threshold,
  });
  state.computed.thresholdMin = bounds.thresholdMin;
  state.computed.thresholdMax = bounds.thresholdMax;
  state.computed.thresholdStep = bounds.thresholdStep;
  store.set("threshold", bounds.threshold, { silent: true });
  state.controls.threshold = store.get("threshold");
}

function persistUrlState() {
  saveStateToUrl({
    state,
    ids,
    urlNumKeys: URL_NUM_KEYS,
    urlBoolKeys: URL_BOOL_KEYS,
  });
}

function schedulePersistUrlState() {
  scheduleUrlSync({
    state,
    saveStateToUrl: persistUrlState,
    delayMs: 120,
  });
}

function renderMetricTrend() {
  view.metricTrendBox = drawMetricTrend({
    svg: ids.metricTrendSvg,
    curves: state.computed.metricCurves,
    hoveredKey: state.ui.metricTrendHoverKey,
    threshold: state.controls.threshold,
    thresholdMin: state.computed.thresholdMin,
    thresholdMax: state.computed.thresholdMax,
    fmt,
  });
}

function renderThresholdViews() {
  updateOperatingPoint();
  view.distView = drawDist({
    svg: ids.distSvg,
    data: state.computed.data,
    threshold: state.controls.threshold,
    fmt,
  });
  drawConfusionMatrix({
    svg: ids.confusionSvg,
    op: state.computed.roc.op,
    fmtPct,
  });
  view.rocClickBox = drawRoc({
    svg: ids.rocSvg,
    roc: state.computed.roc,
    threshold: state.controls.threshold,
    fmt,
  });
  view.prClickBox = drawPr({
    svg: ids.prSvg,
    pr: state.computed.pr,
    threshold: state.controls.threshold,
    fmt,
  });
  renderMetricsText({
    metricsTextEl: ids.metricsText,
    op: state.computed.roc.op,
    fmt,
  });
  renderMetricTrend();
  schedulePersistUrlState();
}

function renderAll() {
  syncControlOutputs({ ids, state, presets: PRESETS, fmt, fmtPct });
  renderThresholdViews();
}

function regenerateAndRender() {
  state.computed.data = generateData(state.controls, getActivePreset());
  updateThresholdRange();
  computeEverything();
  state.computed.metricCurves = computeMetricCurves(
    state.computed.data.all,
    state.computed.thresholdMin,
    state.computed.thresholdMax
  );
  renderAll();
}

function initAppHandlers() {
  initHandlers({
    ids,
    state,
    view,
    actions: {
      applyPreset,
      applyThreshold,
      applySeed: applyByKey.seed,
      applyMetricTrendHoverKey,
    },
    applyByKey,
    deps: {
      scheduleUrlSync: schedulePersistUrlState,
      metricTrendHoverKeyFromPointer,
    },
  });
}

function init() {
  initAppHandlers();
  restoreStateFromUrl({
    ids,
    presets: PRESETS,
    applyPresetValues: (name) => applyPresetValues({ ids, presets: PRESETS, name }),
    urlNumKeys: URL_NUM_KEYS,
    urlBoolKeys: URL_BOOL_KEYS,
  });
  readControlValues();
  runStartupRender({
    regenerateAndRender,
  });
}

init();
