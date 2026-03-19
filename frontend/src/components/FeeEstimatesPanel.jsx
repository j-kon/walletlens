import { motion } from 'framer-motion';
import { Gauge, TimerReset } from 'lucide-react';
import Badge from './UI/Badge';
import Card from './UI/Card';
import { Skeleton } from './UI/Loader';
import { formatFeeRate } from '../utils/formatBTC';
import { fadeUp, listItemReveal, softStagger } from '../utils/motion';

function FeeBandCard({ label, target, helper, tone }) {
  return (
    <motion.div
      variants={listItemReveal}
      className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
        <div className={`rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${tone}`}>
          {helper}
        </div>
      </div>
      <p className="mt-4 font-display text-[1.9rem] tracking-[-0.04em] text-slate-50">
        {formatFeeRate(target)}
      </p>
    </motion.div>
  );
}

function FeeEstimatesPanel({ feeBands, loading, error }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
      <Card className="h-full p-6 lg:p-7">
        <div className="flex flex-col gap-4 border-b border-white/6 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Fee Estimates</p>
            <h2 className="mt-2 font-display text-[2rem] tracking-[-0.04em] text-slate-50">
              Confirmation pricing
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Live feerate guidance from Esplora to benchmark wallet sends and transaction urgency.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="accent">sat/vB</Badge>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-brand-sky">
              <Gauge className="h-5 w-5" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-4 h-10 w-24" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-[24px] border border-amber-400/15 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
            {error}
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={softStagger} className="mt-6 grid gap-3 sm:grid-cols-3">
            <FeeBandCard label="Fast" target={feeBands?.fast} helper="1 block" tone="text-emerald-300" />
            <FeeBandCard label="Medium" target={feeBands?.medium} helper="3-6 blocks" tone="text-brand-sky" />
            <FeeBandCard label="Slow" target={feeBands?.slow} helper="10+ blocks" tone="text-brand-amber" />
          </motion.div>
        )}

        <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
          <TimerReset className="h-4 w-4 text-slate-500" />
          These estimates are useful as a benchmark, not a guarantee of confirmation timing.
        </div>
      </Card>
    </motion.div>
  );
}

export default FeeEstimatesPanel;
