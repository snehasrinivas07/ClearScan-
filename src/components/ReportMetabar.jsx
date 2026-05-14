import { motion } from "framer-motion";
import { Calendar, Hash, Stethoscope, FileType } from "lucide-react";
import { formatDate } from "../lib/utils";

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider">
        <Icon size={11} />
        {label}
      </span>
      <span className="text-sm font-mono text-slate-200">{value}</span>
    </div>
  );
}

export default function ReportMetaBar({ report }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl bg-bg-surface border border-slate-700 shadow-card px-5 py-4"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetaItem icon={Hash}        label="Report ID"   value={report.id ?? "RPT-0001"} />
        <MetaItem icon={Calendar}    label="Generated"   value={formatDate(report.generated_at ?? new Date().toISOString())} />
        <MetaItem icon={FileType}    label="Scan type"   value={report.scan_type ?? "Chest X-Ray"} />
        <MetaItem icon={Stethoscope} label="Standard"    value="RADLEX v4.1" />
      </div>
    </motion.div>
  );
}

