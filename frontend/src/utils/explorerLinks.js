const EXPLORER_BASE_URL = 'https://blockstream.info/testnet';

export function getAddressExplorerUrl(address) {
  return `${EXPLORER_BASE_URL}/address/${address}`;
}

export function getTransactionExplorerUrl(txid) {
  return `${EXPLORER_BASE_URL}/tx/${txid}`;
}

export function getBlockExplorerUrl(blockHash) {
  return `${EXPLORER_BASE_URL}/block/${blockHash}`;
}
