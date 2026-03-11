export function fmt(num, digits = 4) {
  if (!Number.isFinite(num)) {
    return "NaN";
  }
  return num.toFixed(digits);
}

export function fmtPct(value, digits = 1) {
  return `${fmt(value * 100, digits)}%`;
}
