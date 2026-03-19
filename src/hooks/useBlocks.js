import { useEffect, useState } from 'react';
import { fetchLatestBlocks } from '../services/bitcoinApi';

const CACHE_TTL_MS = 30_000;
const blocksCache = new Map();

export function useBlocks(limit = 6) {
  const cachedEntry = blocksCache.get(limit);
  const [data, setData] = useState(() => {
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      return cachedEntry.data;
    }

    return null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState('');

  useEffect(() => {
    const nextCachedEntry = blocksCache.get(limit);

    if (nextCachedEntry && Date.now() - nextCachedEntry.timestamp < CACHE_TTL_MS) {
      setData(nextCachedEntry.data);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchLatestBlocks(controller.signal, limit)
      .then((blocks) => {
        if (controller.signal.aborted) {
          return;
        }

        const nextData = {
          blocks,
          lastUpdatedAt: new Date().toISOString(),
        };

        blocksCache.set(limit, {
          timestamp: Date.now(),
          data: nextData,
        });
        setData(nextData);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(requestError?.kind === 'network' ? 'Unable to fetch recent blocks' : 'Recent blocks unavailable');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [limit]);

  return {
    blocks: data?.blocks ?? [],
    blocksLoading: loading,
    blocksError: error,
  };
}
