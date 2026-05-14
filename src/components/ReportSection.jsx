import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Edit3, Check, X } from "lucide-react";
import { cn } from "../lib/utils";

export default function ReportSection({ section, index, onUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(section.content);

  function handleSave() {
    onUpdate(section.id, draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(section.content);
    setEditing(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="rounded-xl bg-bg-surface border border-slate-700 shadow-card overflow-hidden"
    >
      {/* ── Section header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none group"
        onClick={() => !editing && setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500 w-5">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            {section.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(true); setEditing(true); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-all"
              title="Edit section"
            >
              <Edit3 size={14} />
            </button>
          )}
          <span className="text-slate-500">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </div>

      {/* ── Section body ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-slate-700/60 pt-4">
              {editing ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={6}
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-600 focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm text-slate-200 font-mono leading-relaxed resize-y outline-none transition-colors"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      <X size={13} /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-blue-500/20 border border-blue-500/50 text-blue-300 hover:bg-blue-500/30 transition-colors"
                    >
                      <Check size={13} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

