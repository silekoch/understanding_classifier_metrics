import { PRESETS } from "./presets.js";
import { createInitialState } from "./core/state.js";
import { createStateStore } from "./core/state-store.js";
import { fmt, fmtPct } from "./core/format.js";
import { computeMetricCurves } from "./core/metrics.js";
import {
  computeCurveState as computeCurveStateCore,
  computeThresholdBounds as computeThresholdBoundsCore,
} from "./core/derived-state.js";
import { generateData as generateSampleData } from "./core/data.js";
import { drawRoc as drawRocView } from "./viz/roc.js";
import { drawPr as drawPrView } from "./viz/pr.js";
import { drawDist as drawDistView } from "./viz/dist.js";
import { drawConfusionMatrix as drawConfusionMatrixView } from "./viz/matrix.js";
import {
  drawMetricTrend as drawMetricTrendView,
  metricTrendHoverKeyFromPointer as metricTrendHoverKeyFromPointerView,
} from "./viz/metric-trend.js";
import { initHandlers as initControlHandlers } from "./ui/controls.js";
import {
  restoreStateFromUrl as restoreStateFromUrlImpl,
  saveStateToUrl as saveStateToUrlImpl,
  scheduleUrlSync as scheduleUrlSyncImpl,
} from "./ui/url-state.js";
import {
  applyPresetValues as applyPresetValuesUi,
  syncControlOutputs as syncControlOutputsUi,
} from "./ui/preset-controls.js";
import { getIds } from "./ui/dom-ids.js";
import { readControls as readControlsImpl } from "./ui/control-values.js";
import { URL_BOOL_KEYS, URL_NUM_KEYS } from "./ui/url-state-keys.js";
import { renderMetricsText as renderMetricsTextView } from "./ui/metrics-text.js";
import { runStartupRender } from "./ui/startup.js";
import { wireShapeControls } from "./ui/reactive-shape-controls.js";
import { wireReactiveControls } from "./ui/reactive-controls.js";

const state = createInitialState();
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

const readControls = () => {
  readControlsImpl({ ids, store });
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
  applyPresetValues: applyPresetValuesUi,
  regenerateAndRender,
  renderThresholdViews,
  drawMetricTrend,
});

const applyByKey = {
  ...nonShapeApplyByKey,
  ...shapeApplyByKey,
};

function getActivePreset() {
  return PRESETS[state.controls.preset] || PRESETS.separated;
}

function computeEverything() {
  const { roc, pr } = computeCurveStateCore({
    samples: state.computed.data.all,
    threshold: state.controls.threshold,
  });
  state.computed.roc = roc;
  state.computed.pr = pr;
}

function updateThresholdRange() {
  const bounds = computeThresholdBoundsCore({
    data: state.computed.data,
    threshold: state.controls.threshold,
  });
  state.computed.thresholdMin = bounds.thresholdMin;
  state.computed.thresholdMax = bounds.thresholdMax;
  state.computed.thresholdStep = bounds.thresholdStep;
  store.set("threshold", bounds.threshold, { silent: true });
  state.controls.threshold = store.get("threshold");
}

function saveStateToUrl() {
  saveStateToUrlImpl({
    state,
    ids,
    urlNumKeys: URL_NUM_KEYS,
    urlBoolKeys: URL_BOOL_KEYS,
  });
}

function scheduleUrlSync() {
  scheduleUrlSyncImpl({
    state,
    saveStateToUrl,
    delayMs: 120,
  });
}

function drawMetricTrend() {
  state.view.metricTrendBox = drawMetricTrendView({
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
  computeEverything();
  state.view.distView = drawDistView({
    svg: ids.distSvg,
    data: state.computed.data,
    threshold: state.controls.threshold,
    fmt,
  });
  drawConfusionMatrixView({
    svg: ids.confusionSvg,
    op: state.computed.roc.op,
    fmtPct,
  });
  state.view.rocClickBox = drawRocView({
    svg: ids.rocSvg,
    roc: state.computed.roc,
    threshold: state.controls.threshold,
    fmt,
  });
  state.view.prClickBox = drawPrView({
    svg: ids.prSvg,
    pr: state.computed.pr,
    threshold: state.controls.threshold,
    fmt,
  });
  renderMetricsTextView({
    metricsTextEl: ids.metricsText,
    op: state.computed.roc.op,
    fmt,
  });
  drawMetricTrend();
  scheduleUrlSync();
}

function renderAll() {
  syncControlOutputsUi({ ids, state, presets: PRESETS, fmt, fmtPct });
  renderThresholdViews();
}

function regenerateAndRender() {
  state.computed.data = generateSampleData(state.controls, getActivePreset());
  updateThresholdRange();
  state.computed.metricCurves = computeMetricCurves(
    state.computed.data.all,
    state.computed.thresholdMin,
    state.computed.thresholdMax
  );
  renderAll();
}

function initHandlers() {
  initControlHandlers({
    ids,
    state,
    actions: {
      applyPreset,
      applyThreshold,
      applySeed: applyByKey.seed,
      applyMetricTrendHoverKey,
    },
    applyByKey,
    deps: {
      scheduleUrlSync,
      metricTrendHoverKeyFromPointer: metricTrendHoverKeyFromPointerView,
    },
  });
}

function init() {
  initHandlers();
  const restored = restoreStateFromUrlImpl({
    ids,
    presets: PRESETS,
    applyPresetValues: (name) => applyPresetValuesUi({ ids, presets: PRESETS, name }),
    urlNumKeys: URL_NUM_KEYS,
    urlBoolKeys: URL_BOOL_KEYS,
  });
  readControls();
  runStartupRender({
    restored,
    setPresetFromControls: () => store.set("preset", ids.preset.value),
    regenerateAndRender,
  });
}

init();
