import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, Zap, WifiOff, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import useScanStore from "../store/useScanStore";
import { mockAnalysis, generateScanId } from "../lib/mockData";
import UploadDropZone from "../components/UploadDropZone";
import RecentScansSidebar from "../components/RecentScansSidebar";
import StatPill from "../components/StatPill";

export default function UploadPage() {
  const navigate          = useNavigate();
  const setCurrentScan    = useScanStore((s) => s.setCurrentScan);
  const setCurrentAnalysis = useScanStore((s) => s.setCurrentAnalysis);
  const setIsAnalyzing    = useScanStore((s) => s.setIsAnalyzing);
  const addToHistory      = useScanStore((s) => s.addToHistory);
  const isAnalyzing       = useScanStore((s) => s.isAnalyzing);

  async function handleAnalyze(file, previewUrl) {
    const scanId = generateScanId();

    // 1. Save scan to store
    setCurrentScan({
      id:         scanId,
      name:       file.name,
      previewUrl,
      size:       file.size,
      type:       file.type,
    });

    // 2. Simulate analysis
    setIsAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1600));

    const analysis = { ...mockAnalysis };
    setCurrentAnalysis(analysis); // also auto-sets currentReport

    // 3. Add to history with the shape HistoryPage expects
    addToHistory({
      id:           scanId,
      scan_type:    analysis.scan_type,
      overall_risk: analysis.overall_risk,
      findings:     analysis.findings,
      date:         new Date().toISOString(),
      previewUrl,
    });

    setIsAnalyzing(false);
    toast.success("Analysis complete");
    navigate("/results");
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-10 text-center"
      >
        <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 uppercase tracking-widest">
          <Cpu size={12} />
          AI-Powered Diagnostic Imaging
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 leading-tight mb-4">
          Radiological findings,{" "}
          <span className="text-blue-400">in seconds</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Upload a chest X-ray or CT scan. ClearScan AI detects pathologies,
          generates Grad-CAM heatmaps, and produces a RADLEX-structured report —
          entirely offline.
        </p>
      </motion.div>

      {/* ── Stat pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-wrap justify-center gap-3 mb-10"
      >
        <StatPill icon={Cpu}        value="14+"    label="Pathologies detected" />
        <StatPill icon={Zap}        value="<2s"    label="Avg. analysis time"   />
        <StatPill icon={WifiOff}    value="100%"   label="Offline capable"      />
        <StatPill icon={ShieldCheck} value="HIPAA" label="Privacy-aware"        />
      </motion.div>

      {/* ── Main layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="lg:col-span-2"
        >
          <UploadDropZone onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <RecentScansSidebar />
        </motion.div>
      </div>
    </div>
  );
}

