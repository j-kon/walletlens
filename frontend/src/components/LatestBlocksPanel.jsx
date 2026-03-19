import { motion } from 'framer-motion';
import { Blocks, ExternalLink } from 'lucide-react';
import Badge from './UI/Badge';
import Card from './UI/Card';
import { Skeleton } from './UI/Loader';
import { formatTimestampWithRelative } from '../utils/formatDate';
import { getBlockExplorerUrl } from '../utils/explorerLinks';
import { formatBytes, formatNumber } from '../utils/formatNumber';
import { fadeUp, hoverLift, listItemReveal, softStagger } from '../utils/motion';

function LatestBlocksPanel({ blocks, loading, error }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
      <Card className="h-full p-6 lg:p-7">
        <div className="flex flex-col gap-4 border-b border-white/6 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Latest Blocks</p>
            <h2 className="mt-2 font-display text-[2rem] tracking-[-0.04em] text-slate-50">
              Recent chain tips
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Follow the newest testnet blocks with height, transaction count, and timing context.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="accent">{blocks.length || 6} slots</Badge>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-brand-sky">
              <Blocks className="h-5 w-5" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-[24px] border border-amber-400/15 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
            {error}
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={softStagger} className="mt-6 space-y-3">
            {blocks.map((block) => (
              <motion.a
                key={block.id}
                variants={listItemReveal}
                whileHover={hoverLift}
                href={getBlockExplorerUrl(block.id)}
                target="_blank"
                rel="noreferrer"
                className="block rounded-[24px] border border-white/8 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-white/12 hover:bg-white/[0.05]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="subtle">Height {formatNumber(block.height)}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View block
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {formatTimestampWithRelative(block.timestamp)}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-2 lg:text-right">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Transactions</p>
                      <p className="mt-1 text-slate-200">{formatNumber(block.txCount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Block Size</p>
                      <p className="mt-1 text-slate-200">{formatBytes(block.size)}</p>
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

export default LatestBlocksPanel;
