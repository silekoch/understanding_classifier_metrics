function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function divideOr(num, den, fallback = 0) {
  return den > 0 ? num / den : fallback;
}

function computeConfusionCounts(threshold, all) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (const d of all) {
    const predPos = d.score >= threshold;
    if (predPos) {
      if (d.label === 1) {
        tp += 1;
      } else {
        fp += 1;
      }
      continue;
    }
    if (d.label === 0) {
      tn += 1;
    } else {
      fn += 1;
    }
  }

  return { tp, fp, tn, fn };
}

export function computeRocPoints(all) {
  const sorted = all.slice().sort((a, b) => b.score - a.score);
  const P = sorted.reduce((acc, d) => acc + (d.label === 1 ? 1 : 0), 0);
  const N = sorted.length - P;

  let tp = 0;
  let fp = 0;
  const points = [{ threshold: Infinity, tpr: 0, fpr: 0 }];

  let i = 0;
  while (i < sorted.length) {
    const s = sorted[i].score;
    let j = i;
    while (j < sorted.length && sorted[j].score === s) {
      if (sorted[j].label === 1) {
        tp += 1;
      } else {
        fp += 1;
      }
      j += 1;
    }
    points.push({ threshold: s, tpr: tp / P, fpr: fp / N });
    i = j;
  }

  const last = points[points.length - 1];
  if (last.tpr < 1 || last.fpr < 1) {
    points.push({ threshold: -Infinity, tpr: 1, fpr: 1 });
  }

  return points;
}

export function computePrPoints(all) {
  const sorted = all.slice().sort((a, b) => b.score - a.score);
  const P = sorted.reduce((acc, d) => acc + (d.label === 1 ? 1 : 0), 0);
  const N = sorted.length - P;

  let tp = 0;
  let fp = 0;
  const points = [{ threshold: Infinity, recall: 0, precision: 1 }];

  let i = 0;
  while (i < sorted.length) {
    const s = sorted[i].score;
    let j = i;
    while (j < sorted.length && sorted[j].score === s) {
      if (sorted[j].label === 1) {
        tp += 1;
      } else {
        fp += 1;
      }
      j += 1;
    }

    const recall = P > 0 ? tp / P : 0;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    points.push({ threshold: s, recall, precision });
    i = j;
  }

  const last = points[points.length - 1];
  const prevalence = P + N > 0 ? P / (P + N) : 0;
  if (last.recall < 1) {
    points.push({ threshold: -Infinity, recall: 1, precision: prevalence });
  }
  return { points, prevalence };
}

export function computeApTrapezoid(prPoints) {
  let ap = 0;
  for (let i = 1; i < prPoints.length; i += 1) {
    const x0 = prPoints[i - 1].recall;
    const x1 = prPoints[i].recall;
    const y0 = prPoints[i - 1].precision;
    const y1 = prPoints[i].precision;
    ap += Math.max(0, x1 - x0) * (y0 + y1) * 0.5;
  }
  return clamp(ap, 0, 1);
}

export function computeAucTrapezoid(points) {
  let auc = 0;
  for (let i = 1; i < points.length; i += 1) {
    const x0 = points[i - 1].fpr;
    const x1 = points[i].fpr;
    const y0 = points[i - 1].tpr;
    const y1 = points[i].tpr;
    auc += (x1 - x0) * (y0 + y1) * 0.5;
  }
  return auc;
}

export function computeAucRank(all) {
  const sorted = all.slice().sort((a, b) => a.score - b.score);
  const P = sorted.reduce((acc, d) => acc + (d.label === 1 ? 1 : 0), 0);
  const N = sorted.length - P;

  let rank = 1;
  let sumPosRanks = 0;

  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1].score === sorted[i].score) {
      j += 1;
    }

    const groupCount = j - i + 1;
    const avgRank = (rank + rank + groupCount - 1) / 2;
    for (let k = i; k <= j; k += 1) {
      if (sorted[k].label === 1) {
        sumPosRanks += avgRank;
      }
    }

    rank += groupCount;
    i = j + 1;
  }

  return (sumPosRanks - (P * (P + 1)) / 2) / (P * N);
}

export function computeOperatingPoint(threshold, all) {
  const { tp, fp, tn, fn } = computeConfusionCounts(threshold, all);

  const P = tp + fn;
  const N = tn + fp;
  const tpr = divideOr(tp, P);
  const fpr = divideOr(fp, N);
  const precision = divideOr(tp, tp + fp);
  const recall = tpr;
  const specificity = divideOr(tn, N);
  const f1 = divideOr(2 * precision * recall, precision + recall);
  const accuracy = divideOr(tp + tn, P + N);
  const mccDen = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = divideOr(tp * tn - fp * fn, mccDen);

  return { tp, fp, tn, fn, tpr, fpr, precision, recall, specificity, f1, accuracy, mcc, P, N };
}

export function computeMetricCurves(all, minThreshold, maxThreshold, sampleCount = 180) {
  const curves = {
    recall: [],
    precision: [],
    specificity: [],
    f1: [],
    mcc: [],
    accuracy: [],
  };
  if (!all || !all.length) {
    return curves;
  }

  const minT = Number.isFinite(minThreshold) ? minThreshold : Math.min(...all.map((d) => d.score));
  const maxT = Number.isFinite(maxThreshold) ? maxThreshold : Math.max(...all.map((d) => d.score));
  const span = Math.max(1e-9, maxT - minT);
  const steps = Math.max(20, Math.round(sampleCount));

  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const threshold = minT + u * span;
    const op = computeOperatingPoint(threshold, all);
    curves.recall.push({ u, v: op.tpr });
    curves.precision.push({ u, v: op.precision });
    curves.specificity.push({ u, v: op.specificity });
    curves.f1.push({ u, v: op.f1 });
    curves.mcc.push({ u, v: op.mcc });
    curves.accuracy.push({ u, v: op.accuracy });
  }

  return curves;
}
