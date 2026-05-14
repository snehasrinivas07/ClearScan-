import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

// Simulated hotspot positions per finding (x%, y% of image)
const heatmapPositions = {
  Pneumonia:        { cx: '65%', cy: '70%' },
  'Pleural Effusion': { cx: '30%', cy: '80%' },
  Cardiomegaly:     { cx: '50%', cy: '55%' },
  Atelectasis:      { cx: '60%', cy: '55%' },
  Pneumothorax:     { cx: '20%', cy: '30%' },
  Nodule:           { cx: '70%', cy: '40%' },
  default:          { cx: '50%', cy: '50%' },
};

export default function HeatmapViewer({ previewUrl, findings = [], heatmapBase64 }) {
  const [opacity, setOpacity] = useState(60);
  const [activeFinding, setActiveFinding] = useState(findings[0]?.name || null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const pos = heatmapPositions[activeFinding] || heatmapPositions.default;

  const heatmapGradient = `radial-gradient(
    ellipse 38% 32% at ${pos.cx} ${pos.cy},
    rgba(255,0,0,0.95) 0%,
    rgba(255,80,0,0.85) 18%,
    rgba(255,200,0,0.7) 38%,
    rgba(0,255,100,0.45) 60%,
    rgba(0,100,255,0.2) 80%,
    transparent 100%
  )`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `clearscan-heatmap-${activeFinding?.toLowerCase().replace(' ', '-') || 'scan'}.png`;
    link.href = previewUrl;
    link.click();
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-bg-surface overflow-hidden shadow-card">
      {/* Image + overlay */}
      <div className="relative bg-black" style={{ minHeight: 320 }}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Medical scan"
            className="w-full object-contain max-h-[420px] block"
          />
        ) : (
          <div className="flex items-center justify-center h-80 text-slate-500 text-sm">
            No scan image available
          </div>
        )}

        {/* Heatmap overlay */}
        {showHeatmap && previewUrl && (
          <motion.div
            key={activeFinding}
            initial={{ opacity: 0 }}
            animate={{ opacity: opacity / 100 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: heatmapBase64
                ? `url(data:image/png;base64,${heatmapBase64})`
                : heatmapGradient,
              backgroundSize: 'cover',
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Top-right controls */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => setShowHeatmap((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition backdrop-blur-sm"
          >
            {showHeatmap
              ? <><EyeOff className="h-3.5 w-3.5" /> Hide</>
              : <><Eye className="h-3.5 w-3.5" /> Heatmap</>
            }
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition backdrop-blur-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Save
          </button>
        </div>

        {/* Disclaimer */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-[10px] text-slate-400 bg-slate-900/75 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-700/50">
            ⚠️ Heatmap indicates model attention — not a clinical annotation
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-4 space-y-4 border-t border-slate-700">
        {/* Opacity slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-24 shrink-0">Heatmap opacity</span>
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            disabled={!showHeatmap}
            className="flex-1 h-1.5 appearance-none rounded-full bg-slate-700 accent-blue-500 cursor-pointer disabled:opacity-30"
          />
          <span className="text-xs font-mono text-slate-300 w-9 text-right shrink-0">
            {opacity}%
          </span>
        </div>

        {/* Per-finding toggles */}
        {findings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {findings.map((f) => (
              <button
                key={f.name}
                onClick={() => {
                  setActiveFinding(f.name);
                  setShowHeatmap(true);
                }}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                  activeFinding === f.name
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                )}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}