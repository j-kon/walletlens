import { useEffect, useState } from 'react';
import { fetchMempoolOverview } from '../services/bitcoinApi';

const CACHE_TTL_MS = 30_000;
const mempoolCache = {
  timestamp: 0,
  data: null,
};

export function useMempoolData() {
  const [data, setData] = useState(() => {
    if (Date.now() - mempoolCache.timestamp < CACHE_TTL_MS) {
      return mempoolCache.data;
    }

    return null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Date.now() - mempoolCache.timestamp < CACHE_TTL_MS && mempoolCache.data) {
      setData(mempoolCache.data);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchMempoolOverview(controller.signal)
      .then((mempoolOverview) => {
        if (controller.signal.aborted) {
          return;
        }

        const nextData = {
          ...mempoolOverview,
          lastUpdatedAt: new Date().toISOString(),
        };

        mempoolCache.timestamp = Date.now();
        mempoolCache.data = nextData;
        setData(nextData);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(requestError?.kind === 'network' ? 'Unable to fetch mempool data' : 'Mempool data unavailable');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return {
    mempool: data,
    mempoolLoading: loading,
    mempoolError: error,
  };
}
