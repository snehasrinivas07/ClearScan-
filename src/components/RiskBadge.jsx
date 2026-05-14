import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const config = {
  CRITICAL: {
    classes: 'bg-red-600 text-white border-red-500',
    pulse: true,
  },
  HIGH: {
    classes: 'bg-red-500/20 text-red-400 border-red-500/40',
    pulse: false,
  },
  MEDIUM: {
    classes: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    pulse: false,
  },
  LOW: {
    classes: 'bg-green-500/20 text-green-400 border-green-500/40',
    pulse: false,
  },
};

export default function RiskBadge({ level, size = 'sm' }) {
  const key = (level || 'LOW').toUpperCase();
  const { classes, pulse } = config[key] || config.LOW;

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider',
        size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-[11px]',
        classes
      )}
    >
      {pulse && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {key}
    </motion.span>
  );
}