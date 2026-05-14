import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import OfflineBanner from "./OfflineBanner";
import AnalyzingOverlay from "./AnalyzingOverlay";
import useScanStore from "../store/useScanStore";

export default function AppLayout({ children }) {
  const location    = useLocation();
  const isAnalyzing = useScanStore((s) => s.isAnalyzing);

  return (
    <div className="min-h-screen bg-bg-base text-slate-100">
      {/* Global overlays */}
      <OfflineBanner />
      <AnalyzingOverlay visible={isAnalyzing} />

      {/* Nav */}
      <Navbar />

      {/* Page transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y: -10 }}
          transition={{ duration: 0.28 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color:      "#f1f5f9",
            border:     "1px solid #334155",
            fontSize:   "13px",
          },
        }}
      />
    </div>
  );
}

