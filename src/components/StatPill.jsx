import { motion } from 'framer-motion';

export default function StatPill({ icon: Icon, label, value, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-bg-surface border border-slate-700"
    >
      {Icon && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-slate-100">{value}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
    </motion.div>
  );
}
