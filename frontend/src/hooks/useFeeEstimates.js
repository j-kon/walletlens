import { useEffect, useState } from 'react';
import { deriveFeeEstimateBands } from '../utils/feeInsights';
import { fetchFeeEstimates } from '../services/bitcoinApi';

const CACHE_TTL_MS = 30_000;
const feeEstimatesCache = {
  timestamp: 0,
  data: null,
};

export function useFeeEstimates() {
  const [data, setData] = useState(() => {
    if (Date.now() - feeEstimatesCache.timestamp < CACHE_TTL_MS) {
      return feeEstimatesCache.data;
    }

    return null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Date.now() - feeEstimatesCache.timestamp < CACHE_TTL_MS && feeEstimatesCache.data) {
      setData(feeEstimatesCache.data);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchFeeEstimates(controller.signal)
      .then((estimates) => {
        if (controller.signal.aborted) {
          return;
        }

        const nextData = {
          estimates,
          bands: deriveFeeEstimateBands(estimates),
          lastUpdatedAt: new Date().toISOString(),
        };

        feeEstimatesCache.timestamp = Date.now();
        feeEstimatesCache.data = nextData;
        setData(nextData);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(requestError?.kind === 'network' ? 'Unable to fetch fee estimates' : 'Fee estimates unavailable');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return {
    feeEstimates: data?.estimates ?? null,
    feeBands: data?.bands ?? null,
    feeEstimatesLoading: loading,
    feeEstimatesError: error,
  };
}
