import { motion } from 'framer-motion';
import { MapPin, AlertCircle } from 'lucide-react';
import ConfidenceBar from './ConfidenceBar';
import RiskBadge from './RiskBadge';

export default function FindingCard({ finding, index = 0 }) {
  const { name, confidence, uncertainty, risk_level, anatomical_region, recommendation } = finding;
  const uncertaintyPct = Math.round((uncertainty || 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
      className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3 hover:border-slate-600 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-100">{name}</h3>
        <RiskBadge level={risk_level} size="sm" />
      </div>

      {/* Confidence bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Confidence</span>
          <span className="font-mono text-slate-500">±{uncertaintyPct}% uncertainty</span>
        </div>
        <ConfidenceBar confidence={confidence} />
      </div>

      {/* Region */}
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={2} />
        {anatomical_region}
      </div>

      {/* Recommendation */}
      <div className="flex items-start gap-2 rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2.5">
        <AlertCircle className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" strokeWidth={2} />
        <p className="text-xs text-slate-300 leading-relaxed">{recommendation}</p>
      </div>
    </motion.div>
  );
}