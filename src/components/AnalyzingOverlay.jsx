import { motion, AnimatePresence } from "framer-motion";
import { Activity, Brain, Scan, FileText, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

const STEPS = [
  { icon: Scan, label: "Preprocessing image…" },
  { icon: Brain, label: "Running DenseNet-121 inference…" },
  { icon: Activity, label: "Generating Grad-CAM heatmap…" },
  { icon: Activity, label: "Scoring pathology confidence…" },
  { icon: FileText, label: "Drafting RADLEX report…" },
];

export default function AnalyzingOverlay({ visible }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!visible) { setActiveStep(0); return; }
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="analyzing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center"
          >
            {/* Pulsing ring + icon */}
            <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-blue-500/30"
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-blue-500/20"
              />
              <div className="relative w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <Activity size={28} className="text-blue-400" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-100 mb-1">Analysing scan</h2>
            <p className="text-slate-400 text-sm mb-6">
              ClearScan AI is processing your image
            </p>

            {/* Animated step list */}
            <div className="text-left flex flex-col gap-2.5 mb-6">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isDone = i < activeStep;
                const isActive = i === activeStep;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: i <= activeStep ? 1 : 0.3, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="flex items-center gap-2.5 text-xs font-mono"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                    ) : isActive ? (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-3.5 h-3.5 rounded-full bg-blue-400 shrink-0"
                      />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span className={
                      isDone ? 'text-green-400 line-through opacity-60' :
                        isActive ? 'text-blue-300' :
                          'text-slate-500'
                    }>
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
              />
            </div>

            <p className="text-xs text-slate-500 mt-3 font-mono">
              Step {activeStep + 1} of {STEPS.length}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}