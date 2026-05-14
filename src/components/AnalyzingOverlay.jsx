import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";

const STEPS = [
  "Preprocessing image…",
  "Running CNN inference…",
  "Generating Grad-CAM heatmap…",
  "Scoring pathology confidence…",
  "Compiling RADLEX report…",
];

export default function AnalyzingOverlay({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="analyzing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{    opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1,    opacity: 1 }}
            exit={{    scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-bg-surface border border-slate-700 rounded-2xl shadow-glow-blue p-8 w-full max-w-sm text-center"
          >
            {/* Pulsing icon */}
            <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Activity size={28} className="text-blue-400 animate-pulse" />
            </div>

            <h2 className="text-lg font-bold text-slate-100 mb-1">Analysing scan</h2>
            <p className="text-slate-400 text-sm mb-6">
              ClearScan AI is processing your image
            </p>

            {/* Animated step list */}
            <div className="text-left flex flex-col gap-2 mb-6">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.28, duration: 0.3 }}
                  className="flex items-center gap-2 text-xs text-slate-400 font-mono"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.28 + 0.15 }}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
                  />
                  {step}
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

