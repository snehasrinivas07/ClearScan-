import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

function getBarColor(confidence) {
  if (confidence > 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ConfidenceBar({ confidence }) {
  const pct = Math.round(confidence * 100);
  const color = getBarColor(confidence);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <span
        className={cn(
          'font-mono text-xs font-semibold w-9 text-right shrink-0',
          confidence > 0.8
            ? 'text-green-400'
            : confidence >= 0.6
            ? 'text-amber-400'
            : 'text-red-400'
        )}
      >
        {pct}%
      </span>
    </div>
  );
}