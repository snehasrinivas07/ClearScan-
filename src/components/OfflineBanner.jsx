import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline]     = useState(navigator.onLine);
  const [showBack,  setShowBack]    = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setShowBack(true);
      setTimeout(() => setShowBack(false), 2800);
    }
    function handleOffline() {
      setIsOnline(false);
      setShowBack(false);
    }

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const show = !isOnline || showBack;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={isOnline ? "back" : "offline"}
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className={`fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 py-2.5 text-sm font-semibold ${
            isOnline
              ? "bg-risk-safe/90 text-white"
              : "bg-risk-danger/90 text-white"
          } backdrop-blur-sm`}
        >
          {isOnline ? (
            <>
              <Wifi size={15} />
              Back online — all features restored
            </>
          ) : (
            <>
              <WifiOff size={15} />
              You're offline — AI analysis runs locally, reports still work
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

