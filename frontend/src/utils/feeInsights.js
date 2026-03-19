function average(values) {
  const resolvedValues = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));

  if (resolvedValues.length === 0) {
    return null;
  }

  return resolvedValues.reduce((sum, value) => sum + value, 0) / resolvedValues.length;
}

function getEstimateValue(estimates, blocks) {
  return estimates?.[String(blocks)] ?? null;
}

export function deriveFeeEstimateBands(estimates) {
  if (!estimates) {
    return {
      fast: null,
      medium: null,
      slow: null,
    };
  }

  const fast = getEstimateValue(estimates, 1) ?? getEstimateValue(estimates, 2);
  const medium = average([
    getEstimateValue(estimates, 3),
    getEstimateValue(estimates, 4),
    getEstimateValue(estimates, 5),
    getEstimateValue(estimates, 6),
  ]);
  const slow =
    getEstimateValue(estimates, 10) ??
    average([
      getEstimateValue(estimates, 12),
      getEstimateValue(estimates, 20),
      getEstimateValue(estimates, 24),
      getEstimateValue(estimates, 144),
    ]);

  return {
    fast,
    medium,
    slow,
  };
}

export function getFeeInsight(feeRate, estimateBands) {
  if (feeRate == null || Number.isNaN(feeRate) || !estimateBands) {
    return {
      label: 'Unrated',
      variant: 'subtle',
      helper: 'Fee insight unavailable',
    };
  }

  const fastTarget = estimateBands.fast ?? 0;
  const mediumTarget = estimateBands.medium ?? fastTarget;

  if (fastTarget > 0 && feeRate >= fastTarget * 1.08) {
    return {
      label: 'High fee',
      variant: 'warning',
      helper: 'Priced above the current fast-block target.',
    };
  }

  if (mediumTarget > 0 && feeRate >= mediumTarget * 0.92) {
    return {
      label: 'Normal fee',
      variant: 'success',
      helper: 'Aligned with the current medium confirmation band.',
    };
  }

  return {
    label: 'Low fee',
    variant: 'danger',
    helper: 'Below current medium estimates and may confirm more slowly.',
  };
}
