import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Trash2, Search, SlidersHorizontal,
  Activity, ChevronRight, AlertTriangle, RotateCcw,
  FileText, X,
} from "lucide-react";
import toast from "react-hot-toast";
import useScanStore from "../store/useScanStore";
import { mockHistory } from "../lib/mockData";
import { cn, getRiskBadgeClasses, formatDate, formatConfidence } from "../lib/utils";

// ─── Risk filter options ──────────────────────────────────────────────────────
const RISK_FILTERS = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

// ─── Single history row card ──────────────────────────────────────────────────
function HistoryCard({ scan, index, onDelete, onReload }) {
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick(e) {
    e.stopPropagation();
    if (confirming) {
      onDelete(scan.id);
      toast.success("Scan removed from history");
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 2500);
    }
  }

  const topFinding = scan.findings?.[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="group rounded-xl bg-bg-surface border border-slate-700 shadow-card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-500 transition-colors cursor-pointer"
      onClick={() => onReload(scan)}
    >
      {/* ── Scan type icon ── */}
      <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
        <Activity size={18} className="text-blue-400" />
      </div>

      {/* ── Main info ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-100 truncate">
            {topFinding?.name ?? "Unknown finding"}
          </span>
          {scan.findings?.length > 1 && (
            <span className="text-xs text-slate-500 font-mono">
              +{scan.findings.length - 1} more
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs font-mono text-slate-500">{scan.scan_type}</span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500">{formatDate(scan.date)}</span>
          <span className="text-slate-700">·</span>
          <span className="text-xs font-mono text-slate-500">{scan.id}</span>
        </div>
      </div>

      {/* ── Confidence + risk ── */}
      <div className="flex items-center gap-3 shrink-0">
        {topFinding && (
          <span className="text-xs font-mono text-slate-400">
            {formatConfidence(topFinding.confidence)}
          </span>
        )}
        <span className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-full",
          getRiskBadgeClasses(scan.overall_risk)
        )}>
          {scan.overall_risk}
        </span>
      </div>

      {/* ── Actions ── */}
      <div
        className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onReload(scan); }}
          className="p-1.5 rounded-md hover:bg-slate-700 text-slate-500 hover:text-blue-400 transition-colors"
          title="Load this scan"
        >
          <ChevronRight size={15} />
        </button>
        <button
          onClick={handleDeleteClick}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            confirming
              ? "bg-red-500/20 text-red-400 border border-red-500/50"
              : "hover:bg-slate-700 text-slate-500 hover:text-red-400"
          )}
          title={confirming ? "Click again to confirm" : "Remove"}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClear }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
        <Clock size={24} className="text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">
        {hasFilters ? "No matching scans" : "No scan history yet"}
      </h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
        {hasFilters
          ? "Try adjusting your search or risk filter."
          : "Upload and analyse a scan to start building your history."}
      </p>
      {hasFilters ? (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <X size={14} /> Clear filters
        </button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Activity size={15} /> Upload a scan
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ scans }) {
  const total    = scans.length;
  const critical = scans.filter((s) => s.overall_risk === "CRITICAL").length;
  const high     = scans.filter((s) => s.overall_risk === "HIGH").length;
  const safe     = scans.filter((s) => s.overall_risk === "LOW").length;

  const stats = [
    { label: "Total scans",   value: total,    color: "text-slate-200" },
    { label: "Critical",      value: critical, color: "text-risk-critical" },
    { label: "High risk",     value: high,     color: "text-risk-danger"  },
    { label: "Low risk",      value: safe,     color: "text-risk-safe"    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl bg-bg-surface border border-slate-700 px-4 py-3 text-center"
        >
          <p className={cn("text-2xl font-bold font-mono", s.color)}>{s.value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const navigate         = useNavigate();
  const history          = useScanStore((s) => s.history);
  const removeFromHistory = useScanStore((s) => s.removeFromHistory);
  const clearHistory     = useScanStore((s) => s.clearHistory);
  const setCurrentScan   = useScanStore((s) => s.setCurrentScan);
  const setCurrentAnalysis = useScanStore((s) => s.setCurrentAnalysis);

  const [search, setSearch]       = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [confirmClear, setConfirmClear] = useState(false);

  // Use real history if available, fall back to mock
  const source = history.length > 0 ? history : mockHistory;

  // Filter
  const filtered = source.filter((scan) => {
    const matchesRisk   = riskFilter === "ALL" || scan.overall_risk === riskFilter;
    const searchLower   = search.toLowerCase();
    const matchesSearch = !search
      || scan.id?.toLowerCase().includes(searchLower)
      || scan.scan_type?.toLowerCase().includes(searchLower)
      || scan.findings?.some((f) => f.name.toLowerCase().includes(searchLower));
    return matchesRisk && matchesSearch;
  });

  const hasFilters = search !== "" || riskFilter !== "ALL";

  function handleClearFilters() {
    setSearch("");
    setRiskFilter("ALL");
  }

  function handleReload(scan) {
    setCurrentScan({ previewUrl: null, name: scan.scan_type, id: scan.id });
    setCurrentAnalysis({
      findings:     scan.findings ?? [],
      overall_risk: scan.overall_risk,
      scan_type:    scan.scan_type,
      heatmap_base64: null,
    });
    toast.success(`Loaded: ${scan.id}`);
    navigate("/results");
  }

  function handleClearAll() {
    if (confirmClear) {
      clearHistory();
      toast.success("History cleared");
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 2500);
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Scan History</h1>
            <p className="text-slate-400 mt-1 text-sm">
              All previously analysed scans — click any row to reload
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
            >
              <Activity size={14} /> New scan
            </motion.button>
            {source.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleClearAll}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  confirmClear
                    ? "bg-red-500/20 border border-red-500/50 text-red-400"
                    : "bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400"
                )}
              >
                <Trash2 size={14} />
                {confirmClear ? "Confirm clear?" : "Clear all"}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Stats bar ── */}
      <div className="mb-6">
        <StatsBar scans={source} />
      </div>

      {/* ── Search + filter toolbar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-5"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, type, or finding…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Risk filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal size={14} className="text-slate-500 shrink-0" />
          {RISK_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                riskFilter === r
                  ? r === "ALL"
                    ? "bg-blue-500/20 border-blue-500 text-blue-300"
                    : cn(getRiskBadgeClasses(r), "border-current")
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Result count ── */}
      {hasFilters && filtered.length > 0 && (
        <p className="text-xs text-slate-500 mb-3 font-mono">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* ── History list ── */}
      {filtered.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onClear={handleClearFilters} />
      ) : (
        <motion.div layout className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((scan, i) => (
              <HistoryCard
                key={scan.id}
                scan={scan}
                index={i}
                onDelete={removeFromHistory}
                onReload={handleReload}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Bottom hint ── */}
      {filtered.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-slate-600 mt-8"
        >
          Click any row to reload the scan into the results viewer
        </motion.p>
      )}
    </div>
  );
}

