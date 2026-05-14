import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, RefreshCw, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';

import HeatmapViewer from '../components/HeatmapViewer';
import FindingCard from '../components/FindingCard';
import RiskBadge from '../components/RiskBadge';
import useScanStore from '../store/useScanStore';
import { mockAnalysis } from '../lib/mockData';

const RISK_GLOW = {
  CRITICAL: 'shadow-[0_0_24px_rgba(220,38,38,0.35)]  border-red-500/40',
  HIGH: 'shadow-[0_0_24px_rgba(239,68,68,0.3)]   border-red-400/30',
  MODERATE: 'shadow-[0_0_24px_rgba(245,158,11,0.3)]  border-yellow-500/30',
  MEDIUM: 'shadow-[0_0_24px_rgba(245,158,11,0.3)]  border-yellow-500/30',
  LOW: 'shadow-[0_0_24px_rgba(34,197,94,0.25)]  border-green-500/30',
};

export default function ResultsPage() {
  const navigate = useNavigate();
  const currentScan = useScanStore((s) => s.currentScan);
  const currentAnalysis = useScanStore((s) => s.currentAnalysis);

  const analysis = currentAnalysis || mockAnalysis;
  const findings = analysis.findings || [];
  const riskGlow = RISK_GLOW[analysis.overall_risk] ?? '';

  const handleGenerateReport = () => {
    toast.success('Opening report editor…');
    navigate('/report');
  };

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Analysis Results</h1>
            {currentScan && (
              <p className="text-xs text-slate-500 font-mono mt-0.5">{currentScan.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Cpu className="h-3 w-3" />
            DenseNet-121 · NIH ChestX-ray14
          </span>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            New scan
          </button>
        </div>
      </motion.div>

      {/* ── Risk banner with glow ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`flex items-center justify-between gap-4 px-5 py-4 rounded-xl border bg-slate-800/60 ${riskGlow} transition-shadow`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Overall Risk Assessment
          </p>
          <p className="text-sm text-slate-300">
            {findings.length} finding{findings.length !== 1 ? 's' : ''} detected ·{' '}
            <span className="text-slate-200 font-medium">
              {findings.filter((f) => f.confidence > 0.7).length} high-confidence
            </span>
          </p>
        </div>
        <motion.div
          animate={analysis.overall_risk === 'HIGH' || analysis.overall_risk === 'CRITICAL'
            ? { scale: [1, 1.05, 1] }
            : {}
          }
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <RiskBadge level={analysis.overall_risk} size="lg" />
        </motion.div>
      </motion.div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Heatmap viewer */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <HeatmapViewer
            previewUrl={currentScan?.previewUrl}
            findings={findings}
            heatmapBase64={analysis.heatmap_base64}
          />
        </motion.div>

        {/* Findings + CTA */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Detected Findings
            </h2>
            <span className="text-xs font-mono text-slate-500">Sorted by confidence</span>
          </div>

          <div className="space-y-3">
            {[...findings]
              .sort((a, b) => b.confidence - a.confidence)
              .map((finding, idx) => (
                <FindingCard key={finding.name ?? finding.label} finding={finding} index={idx} />
              ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: findings.length * 0.1 + 0.3 }}
            className="mt-2"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateReport}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition-colors shadow-glow-blue"
            >
              <FileText className="h-4 w-4" />
              Generate Radiology Report
            </motion.button>
            <p className="text-center text-xs text-slate-500 mt-2">
              AI-drafted report · Gemini 2.5 Flash · RADLEX-compliant structure
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}