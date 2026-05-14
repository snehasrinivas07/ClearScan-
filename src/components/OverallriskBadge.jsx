import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, ShieldX, Shield } from "lucide-react";
import { cn } from "../lib/utils";

const RISK_CONFIG = {
  LOW: {
    label:      "Low Risk",
    icon:       ShieldCheck,
    classes:    "bg-risk-safe/10 border-risk-safe text-risk-safe",
    glow:       "shadow-[0_0_20px_rgba(34,197,94,0.25)]",
    pulse:      false,
  },
  MEDIUM: {
    label:      "Moderate Risk",
    icon:       Shield,
    classes:    "bg-risk-warning/10 border-risk-warning text-risk-warning",
    glow:       "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    pulse:      false,
  },
  HIGH: {
    label:      "High Risk",
    icon:       ShieldAlert,
    classes:    "bg-risk-danger/10 border-risk-danger text-risk-danger",
    glow:       "shadow-[0_0_24px_rgba(239,68,68,0.3)]",
    pulse:      false,
  },
  CRITICAL: {
    label:      "Critical Risk",
    icon:       ShieldX,
    classes:    "bg-risk-critical/10 border-risk-critical text-risk-critical",
    glow:       "shadow-[0_0_30px_rgba(220,38,38,0.4)]",
    pulse:      true,
  },
};

export default function OverallRiskBadge({ riskLevel }) {
  const cfg  = RISK_CONFIG[riskLevel] ?? RISK_CONFIG.LOW;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-5 py-4",
        cfg.classes,
        cfg.glow,
        cfg.pulse && "animate-pulse-slow"
      )}
    >
      <Icon size={28} strokeWidth={1.8} />
      <div>
        <p className="text-xs uppercase tracking-widest opacity-70 mb-0.5">Overall Assessment</p>
        <p className="text-xl font-bold tracking-tight">{cfg.label}</p>
      </div>
      {cfg.pulse && (
        <span className="ml-auto text-xs font-semibold bg-risk-critical/20 border border-risk-critical/50 rounded-full px-2.5 py-1 animate-pulse">
          URGENT
        </span>
      )}
    </motion.div>
  );
}


