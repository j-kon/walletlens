const EXPLORER_BASE_URL = 'https://blockstream.info/testnet';

function encodeRouteSegment(value) {
  return encodeURIComponent(String(value ?? '').trim());
}

export function getHomeRoute() {
  return '/';
}

export function getAddressRoute(address) {
  return `/address/${encodeRouteSegment(address)}`;
}

export function getTransactionRoute(txid) {
  return `/tx/${encodeRouteSegment(txid)}`;
}

export function getBlockRoute(blockId) {
  return `/block/${encodeRouteSegment(blockId)}`;
}

export function getAddressExplorerUrl(address) {
  return `${EXPLORER_BASE_URL}/address/${address}`;
}

export function getTransactionExplorerUrl(txid) {
  return `${EXPLORER_BASE_URL}/tx/${txid}`;
}

export function getBlockExplorerUrl(blockHash) {
  return `${EXPLORER_BASE_URL}/block/${blockHash}`;
}
