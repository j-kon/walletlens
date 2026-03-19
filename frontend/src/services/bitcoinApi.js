const BASE_URL = 'https://blockstream.info/testnet/api';
const TESTNET_ADDRESS_REGEX =
  /^tb1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{11,71}$/i;

function createApiError(message, status, path, kind = 'api') {
  const error = new Error(message);
  error.status = status;
  error.path = path;
  error.kind = kind;
  return error;
}

async function request(path, { signal, responseType = 'json' } = {}) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      signal,
      headers: {
        Accept: responseType === 'json' ? 'application/json' : 'text/plain',
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    throw createApiError('Unable to fetch data from network.', null, path, 'network');
  }

  if (!response.ok) {
    const kind = response.status >= 500 ? 'network' : 'api';
    throw createApiError(`Esplora request failed for ${path}.`, response.status, path, kind);
  }

  if (responseType === 'text') {
    return response.text();
  }

  return response.json();
}

function calculateConfirmations(status, tipHeight) {
  if (!status?.confirmed || !status.block_height || !tipHeight) {
    return status?.confirmed ? null : 0;
  }

  return Math.max(tipHeight - status.block_height + 1, 1);
}

function getValueFlowForAddress(collection, address, pickValue) {
  if (!address) {
    return 0;
  }

  return collection.reduce((sum, entry) => {
    const entryAddress =
      entry?.scriptpubkey_address ??
      entry?.prevout?.scriptpubkey_address;

    if (entryAddress !== address) {
      return sum;
    }

    return sum + pickValue(entry);
  }, 0);
}

export function validateTestnetAddress(address) {
  return TESTNET_ADDRESS_REGEX.test(address.trim().toLowerCase());
}

function getAddressPresence(collection, address) {
  if (!address) {
    return false;
  }

  return collection.some((entry) => {
    const entryAddress =
      entry?.scriptpubkey_address ??
      entry?.prevout?.scriptpubkey_address;

    return entryAddress === address;
  });
}

function getTransactionDirection({ hasAddressInputs, hasAddressOutputs }) {
  if (hasAddressInputs) {
    return 'outgoing';
  }

  if (hasAddressOutputs) {
    return 'incoming';
  }

  return 'neutral';
}

function getDisplayAmount({ direction, netValue, receivedValue }) {
  if (direction === 'incoming') {
    return receivedValue;
  }

  return Math.abs(netValue);
}

function getLargestUtxo(utxos) {
  return utxos[0]?.value ?? 0;
}

function getLastActivityTimestamp(transactions) {
  return (
    transactions.find((transaction) => transaction.status?.block_time)?.status?.block_time ??
    null
  );
}

function getNetFlow(transactions) {
  return transactions.reduce((sum, transaction) => sum + (transaction.netValue ?? 0), 0);
}

function getPaginationState(transactions) {
  const confirmedTransactions = transactions.filter((transaction) => transaction.status?.confirmed);
  const lastSeenTxid = confirmedTransactions.at(-1)?.txid ?? null;

  return {
    lastSeenTxid,
    hasMoreTransactions: confirmedTransactions.length === 25,
  };
}

function getAddressMetadata(address, transactions, utxos) {
  return {
    addressType: address.startsWith('tb1') ? 'SegWit (Bech32)' : 'Unknown',
    network: 'Testnet',
    utxoCount: utxos.length,
    largestUtxo: getLargestUtxo(utxos),
    lastActivityTimestamp: getLastActivityTimestamp(transactions),
  };
}

export function normalizeTransaction(tx, address, tipHeight) {
  const sentValue = getValueFlowForAddress(
    tx.vin ?? [],
    address,
    (entry) => entry?.prevout?.value ?? 0,
  );
  const receivedValue = getValueFlowForAddress(
    tx.vout ?? [],
    address,
    (entry) => entry?.value ?? 0,
  );
  const hasAddressInputs = getAddressPresence(tx.vin ?? [], address);
  const hasAddressOutputs = getAddressPresence(tx.vout ?? [], address);
  const netValue = receivedValue - sentValue;
  const direction = getTransactionDirection({
    hasAddressInputs,
    hasAddressOutputs,
  });
  const vsize = tx.vsize ?? (tx.weight ? Math.ceil(tx.weight / 4) : tx.size ?? null);
  const feeRate = tx.fee != null && vsize ? tx.fee / vsize : null;

  return {
    ...tx,
    vsize,
    feeRate,
    sentValue,
    receivedValue,
    netValue,
    direction,
    displayAmount: getDisplayAmount({ direction, netValue, receivedValue }),
    hasAddressInputs,
    hasAddressOutputs,
    confirmations: calculateConfirmations(tx.status, tipHeight),
  };
}

function normalizeUtxo(utxo, tipHeight) {
  return {
    ...utxo,
    confirmations: calculateConfirmations(utxo.status, tipHeight),
  };
}

function normalizeWalletSnapshot(address, addressInfo, transactions, utxos, tipHeight) {
  const chainStats = addressInfo?.chain_stats ?? {};
  const mempoolStats = addressInfo?.mempool_stats ?? {};
  const normalizedTransactions = (transactions ?? []).map((tx) =>
    normalizeTransaction(tx, address, tipHeight),
  );
  const normalizedUtxos = (utxos ?? [])
    .map((utxo) => normalizeUtxo(utxo, tipHeight))
    .sort((left, right) => right.value - left.value);
  const confirmedBalance =
    (chainStats.funded_txo_sum ?? 0) -
    (chainStats.spent_txo_sum ?? 0);
  const pendingDelta =
    (mempoolStats.funded_txo_sum ?? 0) -
    (mempoolStats.spent_txo_sum ?? 0);

  return {
    source: 'live',
    address,
    requestedAddress: address,
    network: 'Testnet',
    tipHeight,
    lastUpdatedAt: new Date().toISOString(),
    summary: {
      balance: confirmedBalance,
      confirmedBalance,
      pendingDelta,
      totalReceived: chainStats.funded_txo_sum ?? 0,
      totalSent: chainStats.spent_txo_sum ?? 0,
      transactionCount: (chainStats.tx_count ?? 0) + (mempoolStats.tx_count ?? 0),
      confirmedTransactions: chainStats.tx_count ?? 0,
      pendingTransactions: mempoolStats.tx_count ?? 0,
    },
    transactions: normalizedTransactions,
    netFlow: getNetFlow(normalizedTransactions),
    metadata: getAddressMetadata(address, normalizedTransactions, normalizedUtxos),
    pagination: getPaginationState(normalizedTransactions),
    utxos: normalizedUtxos,
  };
}

export async function fetchWalletSnapshot(address, signal) {
  const [addressInfo, transactions, utxos, tipHeightText] = await Promise.all([
    request(`/address/${address}`, { signal }),
    request(`/address/${address}/txs`, { signal }),
    request(`/address/${address}/utxo`, { signal }),
    request('/blocks/tip/height', { signal, responseType: 'text' }).catch(() => null),
  ]);

  const tipHeight = tipHeightText ? Number(tipHeightText) : null;

  return normalizeWalletSnapshot(address, addressInfo, transactions, utxos, tipHeight);
}

export async function fetchTransactionDetail(txid, signal, address) {
  const [transaction, tipHeightText] = await Promise.all([
    request(`/tx/${txid}`, { signal }),
    request('/blocks/tip/height', { signal, responseType: 'text' }).catch(() => null),
  ]);

  return normalizeTransaction(transaction, address, tipHeightText ? Number(tipHeightText) : null);
}

export async function fetchAddressTransactionsPage(address, lastSeenTxid, signal) {
  const [transactions, tipHeightText] = await Promise.all([
    request(`/address/${address}/txs/chain/${lastSeenTxid}`, { signal }),
    request('/blocks/tip/height', { signal, responseType: 'text' }).catch(() => null),
  ]);

  const tipHeight = tipHeightText ? Number(tipHeightText) : null;
  const normalizedTransactions = (transactions ?? []).map((transaction) =>
    normalizeTransaction(transaction, address, tipHeight),
  );

  return {
    transactions: normalizedTransactions,
    pagination: getPaginationState(normalizedTransactions),
  };
}

export function deriveWalletInsights(address, transactions, utxos) {
  const sortedUtxos = [...utxos].sort((left, right) => right.value - left.value);

  return {
    metadata: getAddressMetadata(address, transactions, sortedUtxos),
    netFlow: getNetFlow(transactions),
    pagination: getPaginationState(transactions),
    utxos: sortedUtxos,
  };
}
