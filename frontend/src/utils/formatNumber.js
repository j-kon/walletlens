const numberFormatter = new Intl.NumberFormat('en-US');

export function formatNumber(value) {
  return numberFormatter.format(Number(value ?? 0));
}

export function formatVBytes(value) {
  const numericValue = Number(value ?? 0);

  if (numericValue >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(2)} MVB`;
  }

  if (numericValue >= 1_000) {
    return `${(numericValue / 1_000).toFixed(1)} kVB`;
  }

  return `${formatNumber(numericValue)} vB`;
}

export function formatBytes(value) {
  const numericValue = Number(value ?? 0);

  if (numericValue >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(2)} MB`;
  }

  if (numericValue >= 1_000) {
    return `${(numericValue / 1_000).toFixed(1)} kB`;
  }

  return `${formatNumber(numericValue)} B`;
}
