const MIN_SCORE_SPAN = 1e-6;
export const SCORE_VIEW_PADDING_FRACTION = 0.08;

export function computePaddedScoreRange(minScore, maxScore, paddingFraction = SCORE_VIEW_PADDING_FRACTION) {
  const span = Math.max(MIN_SCORE_SPAN, maxScore - minScore);
  return {
    span,
    minX: minScore - paddingFraction * span,
    maxX: maxScore + paddingFraction * span,
  };
}
