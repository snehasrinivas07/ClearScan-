import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockReport, generateScanId } from "../lib/mockData";

const useScanStore = create(
  persist(
    (set, get) => ({
      // ── Current session ──────────────────────────────────────────────────
      currentScan:     null,   // { id, name, previewUrl, size, type }
      currentAnalysis: null,   // { findings, overall_risk, scan_type, heatmap_base64 }
      currentReport:   null,   // RADLEX report object
      isAnalyzing:     false,

      // ── History (persisted) ──────────────────────────────────────────────
      history: [],

      // ── Setters ──────────────────────────────────────────────────────────
      setCurrentScan: (scan) => set({ currentScan: scan }),

      setCurrentAnalysis: (analysis) => {
        // Auto-generate a report stub from the analysis so ReportPage
        // always has data even if setCurrentReport is never called explicitly
        const autoReport = {
          ...mockReport,
          id:           generateScanId(),
          scan_type:    analysis?.scan_type ?? mockReport.scan_type,
          overall_risk: analysis?.overall_risk ?? mockReport.overall_risk,
          generated_at: new Date().toISOString(),
        };
        set({ currentAnalysis: analysis, currentReport: autoReport });
      },

      setCurrentReport:  (report)   => set({ currentReport: report }),
      setIsAnalyzing:    (val)      => set({ isAnalyzing: val }),

      // ── Clear current session (does NOT wipe history) ────────────────────
      clearCurrentScan: () => set({
        currentScan:     null,
        currentAnalysis: null,
        currentReport:   null,
        isAnalyzing:     false,
      }),

      // ── History actions ──────────────────────────────────────────────────
      addToHistory: (scan) => {
        const existing = get().history;
        // Prevent duplicates by ID
        if (existing.find((s) => s.id === scan.id)) return;
        set({ history: [scan, ...existing].slice(0, 50) }); // cap at 50
      },

      removeFromHistory: (id) =>
        set({ history: get().history.filter((s) => s.id !== id) }),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name:    "clearscan-store",
      // Only persist history — session data (currentScan etc.) resets on reload
      partialize: (state) => ({ history: state.history }),
    }
  )
);

export default useScanStore;

