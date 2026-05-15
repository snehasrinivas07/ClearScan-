import { motion } from 'framer-motion';
import { MapPin, AlertCircle } from 'lucide-react';
import ConfidenceBar from './ConfidenceBar';
import RiskBadge from './RiskBadge';

const UNCERTAINTY_COLORS = {
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function FindingCard({ finding, index = 0 }) {
  const { name, confidence, uncertainty, risk_level, anatomical_region, recommendation } = finding;

  const uncertaintyLabel = typeof uncertainty === 'string'
    ? uncertainty
    : uncertainty > 0.15 ? 'High' : uncertainty > 0.08 ? 'Medium' : 'Low';

  const uncertaintyClass = UNCERTAINTY_COLORS[uncertaintyLabel] ?? UNCERTAINTY_COLORS.Medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.01, borderColor: 'rgb(99 102 241 / 0.5)' }}
      className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3 transition-colors cursor-default"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-100">{name}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${uncertaintyClass}`}>
            {uncertaintyLabel} uncertainty
          </span>
          <RiskBadge level={risk_level} size="sm" />
        </div>
      </div>

      {/* Confidence bar — animates from 0 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Confidence</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            className="font-mono text-slate-200 font-semibold"
          >
            {Math.round(confidence * 100)}%
          </motion.span>
        </div>
        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence * 100}%` }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${confidence > 0.7 ? 'bg-red-500' :
                confidence > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
          />
        </div>
      </div>

      {/* Region */}
      {anatomical_region && (
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={2} />
          {anatomical_region}
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="flex items-start gap-2 rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2.5">
          <AlertCircle className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" strokeWidth={2} />
          <p className="text-xs text-slate-300 leading-relaxed">{recommendation}</p>
        </div>
      )}
    </motion.div>
  );
}