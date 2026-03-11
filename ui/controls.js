import { bindReactiveNumericControls } from "./control-bindings.js";
import {
  attachDistThresholdHandlers,
  attachMetricTrendHandlers,
  attachPrClickHandler,
  attachRocClickHandler,
} from "./chart-interactions.js";

export { bindReactiveNumericControls } from "./control-bindings.js";

export function initHandlers({
  ids,
  state,
  applyPreset,
  scheduleUrlSync,
  applyThreshold,
  applyMuNeg,
  applySdNeg,
  applyMuPos,
  applySdPos,
  applyLogSigma,
  applyDfNeg,
  applyDfPos,
  applyMixWeight,
  applyMixOffset,
  applyMixSdMult,
  applyP0Neg,
  applyP0Pos,
  applyZeroValue,
  applyAlphaNeg,
  applyBetaNeg,
  applyAlphaPos,
  applyBetaPos,
  applyEpsPos,
  applyEpsNeg,
  applyConfSharpness,
  applyNPerClass,
  applySamplePosFrac,
  applyOutlierFrac,
  applySeed,
  applyMetricTrendHoverKey,
  metricTrendHoverKeyFromPointer,
}) {
  const setThreshold = applyThreshold;
  const setMetricTrendHoverKey = applyMetricTrendHoverKey;

  bindReactiveNumericControls({
    ids,
    applyByKey: {
      muNeg: applyMuNeg,
      sdNeg: applySdNeg,
      muPos: applyMuPos,
      sdPos: applySdPos,
      logSigma: applyLogSigma,
      dfNeg: applyDfNeg,
      dfPos: applyDfPos,
      mixWeight: applyMixWeight,
      mixOffset: applyMixOffset,
      mixSdMult: applyMixSdMult,
      p0Neg: applyP0Neg,
      p0Pos: applyP0Pos,
      zeroValue: applyZeroValue,
      alphaNeg: applyAlphaNeg,
      betaNeg: applyBetaNeg,
      alphaPos: applyAlphaPos,
      betaPos: applyBetaPos,
      epsPos: applyEpsPos,
      epsNeg: applyEpsNeg,
      confSharpness: applyConfSharpness,
      nPerClass: applyNPerClass,
      samplePosFrac: applySamplePosFrac,
      outlierFrac: applyOutlierFrac,
      seed: applySeed,
    },
  });

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
