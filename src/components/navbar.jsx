import { NavLink, Link } from 'react-router-dom';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const navLinks = [
  { to: '/', label: 'Upload' },
  { to: '/results', label: 'Results' },
  { to: '/report', label: 'Report' },
  { to: '/history', label: 'History' },
];

export default function Navbar() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <nav className="glass-nav sticky top-0 z-40 w-full">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent shadow-glow-blue"
          >
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </motion.div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-slate-100">
              ClearScan <span className="text-accent">AI</span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Diagnostic Assistant
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Online/offline indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border',
            isOnline
              ? 'bg-risk-safe/10 text-risk-safe border-risk-safe/30'
              : 'bg-risk-warning/10 text-risk-warning border-risk-warning/30'
          )}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span className="hidden sm:inline">Offline</span>
            </>
          )}
        </motion.div>
      </div>
    </nav>
  );
}