import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Inbox, ChevronRight } from 'lucide-react';
import { cn, formatDate, getRiskBadgeClasses } from '../lib/utils';
import  useScanStore  from '../store/useScanStore';
import { mockHistory } from '../lib/mockData';

export default function RecentScansSidebar() {
  const navigate = useNavigate();
  const history = useScanStore((s) => s.history);

  // Use real history if present, otherwise show mock data so the demo is never empty
  const items = (history.length > 0 ? history : mockHistory).slice(0, 5);

  return (
    <aside className="rounded-2xl border border-slate-700 bg-bg-surface shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">Recent Scans</h2>
        </div>
        <button
          onClick={() => navigate('/history')}
          className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-0.5"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Inbox className="h-8 w-8 text-slate-600 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-slate-400">No scans yet</p>
          <p className="text-xs text-slate-500 mt-1">Your history will appear here</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-700">
          {items.map((scan, idx) => (
            <motion.li
              key={scan.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <button
                onClick={() => navigate('/history')}
                className="w-full text-left px-5 py-3.5 hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-sm font-medium text-slate-100 truncate group-hover:text-accent transition-colors">
                    {scan.primary_finding}
                  </p>
                  <span
                    className={cn(
                      'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider',
                      getRiskBadgeClasses(scan.risk_level)
                    )}
                  >
                    {scan.risk_level}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">{scan.scan_type}</span>
                  <span>{formatDate(scan.date)}</span>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </aside>
  );
}