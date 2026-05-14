import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function PagePlaceholder({ title, subtitle, icon: Icon, accent = 'accent' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-2xl mb-6 border',
          'bg-bg-surface border-slate-700 shadow-card'
        )}
      >
        {Icon && <Icon className={cn('h-10 w-10', `text-${accent}`)} strokeWidth={1.5} />}
      </motion.div>

      <h1 className="text-4xl font-bold tracking-tight text-slate-100 mb-3">
        {title}
      </h1>
      <p className="text-slate-400 max-w-md text-balance">
        {subtitle}
      </p>

      <div className="mt-8 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700 text-xs font-medium text-slate-500 uppercase tracking-wider">
        Screen scaffold — full UI builds next
      </div>
    </div>
  );
}