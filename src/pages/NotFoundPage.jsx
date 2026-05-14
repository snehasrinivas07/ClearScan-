import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Scan, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Scan size={36} className="text-slate-500" />
        </div>
        <p className="text-7xl font-black text-slate-700 font-mono mb-4">404</p>
        <h1 className="text-xl font-bold text-slate-100 mb-2">Page not found</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          This route doesn't exist. Head back to the upload page to start a new scan.
        </p>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back to upload
        </motion.button>
      </motion.div>
    </div>
  );
}

