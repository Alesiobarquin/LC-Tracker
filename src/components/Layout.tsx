import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Library, LineChart, Code2, Menu, X, Settings, Calendar, BookOpen, BookKey, LogOut, LogIn, MessageSquarePlus, Shield, Sparkles, Lock } from 'lucide-react';
import { FloatingSessionIndicator } from './FloatingSessionIndicator';
import { clsx } from 'clsx';
import { differenceInDays } from 'date-fns';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { getPhase } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { useUserSettings } from '../hooks/useUserData';
import { useUser, useClerk } from '@clerk/react';
import { FeedbackModal } from './FeedbackModal';
import { FeaturesModal } from './FeaturesModal';
import { Logo } from './Logo';
import { FEATURES_MODAL_STORAGE_KEY, FEATURES_MODAL_VERSION } from '../constants/featuresModal';
import { BRAND } from '../constants/brand';
import { isAdminUser } from '../utils/adminAuth';
import { supabase } from '../lib/supabase';
import { isMissingRelationError } from '../utils/supabaseErrors';

interface FeedbackRow {
  id: string;
}

interface FeedbackReadRow {
  feedback_id: string;
}

interface LayoutProps {
  children: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModalTarget, setAuthModalTarget] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTabFromPath = (pathname: string) => {
    const path = pathname.replace(/\/+$/, '');
    const segments = path.split('/');
    // Extract base tab from path (e.g. /patterns/two-pointer -> patterns)
    return segments[1] || 'dashboard'; 
  };
  
  const activeTab = getActiveTabFromPath(location.pathname);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [unreadAdminTicketCount, setUnreadAdminTicketCount] = useState(0);
  const featuresAutoOpenRef = useRef(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const isAdmin = isAdminUser(user);
  const { targetInterviewDate, targetEvents } = useUserSettings();
  const daysUntilInterview = differenceInDays(new Date(targetInterviewDate), new Date());
  const phase = getPhase(new Date(), targetInterviewDate);
  const phaseProgress = phase === 1 ? 'Build pattern coverage' : phase === 2 ? 'Practice integration' : 'Independent interview practice';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    if (featuresAutoOpenRef.current) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(FEATURES_MODAL_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (stored === FEATURES_MODAL_VERSION) return;
    featuresAutoOpenRef.current = true;
    setIsFeaturesOpen(true);
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;

    const loadUnreadAdminCount = async () => {
      if (!isAdmin || !user?.id) {
        if (!cancelled) {
          setUnreadAdminTicketCount(0);
        }
        return;
      }

      const { data: feedbackRows, error: feedbackError } = await supabase
        .from('user_feedback')
        .select('id');

      if (feedbackError) {
        console.error('Failed to load feedback ticket count:', feedbackError);
        return;
      }

      const ticketRows = (feedbackRows ?? []) as FeedbackRow[];

      const { data: readRows, error: readError } = await supabase
        .from('admin_feedback_reads')
        .select('feedback_id')
        .eq('admin_user_id', user.id);

      if (readError) {
        // Table missing in prod (PGRST205) — treat every ticket as unread, don't crash boot.
        if (isMissingRelationError(readError)) {
          if (!cancelled) {
            setUnreadAdminTicketCount(ticketRows.length);
          }
          return;
        }

        console.error('Failed to load admin read markers:', readError);
        return;
      }

      const viewedSet = new Set(((readRows ?? []) as FeedbackReadRow[]).map((row) => row.feedback_id));
      const unreadCount = ticketRows.reduce((count, row) => count + (viewedSet.has(row.id) ? 0 : 1), 0);

      if (!cancelled) {
        setUnreadAdminTicketCount(unreadCount);
      }
    };

    void loadUnreadAdminCount();

    const intervalId = window.setInterval(() => {
      void loadUnreadAdminCount();
    }, 45000);

    const onFocus = () => {
      void loadUnreadAdminCount();
    };

    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAdmin, user?.id]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, protected: true },
    { id: 'library', label: 'Problem Library', icon: Library },
    { id: 'patterns', label: 'Patterns', icon: BookKey },
    { id: 'analytics', label: 'Analytics', icon: LineChart, protected: true },
    { id: 'syntax', label: 'Syntax Reference', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings, protected: true },
  ];

  return (
    <div className="brand-shell min-h-screen text-zinc-50 font-sans flex flex-col md:flex-row relative z-0">
      {/* Environmental Lighting */}
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(255,255,255,0))] pointer-events-none" />
      <div className="fixed inset-0 z-[-1] opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur sticky top-0 z-50">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <Logo className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={24} />
          <div className="font-semibold text-lg tracking-[0.02em] text-emerald-300">{BRAND.name}</div>
        </Link>
        <button
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="app-sidebar"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        id="app-sidebar"
        className={clsx(
        "fixed inset-y-0 left-0 z-40 w-[15rem] bg-zinc-900/95 border-r border-zinc-800/90 backdrop-blur transform transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 hidden md:block">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3">
            <Logo className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={32} />
            <div className="font-semibold text-lg tracking-[0.03em] text-emerald-300">{BRAND.name}</div>
          </Link>
        </div>

        <nav className="mt-1 px-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={`/${item.id}`}
                onClick={(e) => {
                  if (!user && item.protected) {
                    e.preventDefault();
                    setAuthModalTarget(item.label);
                  }
                  setIsMobileMenuOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative border",
                  activeTab === item.id
                    ? "bg-emerald-500/[0.08] border-emerald-500/35 text-zinc-100"
                    : "text-zinc-400 border-transparent hover:bg-zinc-800/30 hover:text-zinc-200"
                )}
              >
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-emerald-400 rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} className={activeTab === item.id ? "text-emerald-400" : ""} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800/50 space-y-4">
          {user ? (
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <Calendar size={12} />
                <span>Next Target</span>
              </div>
              <div className="text-lg font-semibold text-zinc-100">
                {Number.isFinite(daysUntilInterview) && daysUntilInterview >= 0 ? `${daysUntilInterview} days` : 'No upcoming interview'}
              </div>
              <div className="text-xs text-emerald-400/80 mt-1">
                {phaseProgress}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <Calendar size={12} />
                <span>Interview target</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Sign in to set your interview date and personal study plan.
              </p>
            </div>
          )}

          {user && targetEvents.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">Target Timeline</div>
              <div className="relative pl-3 space-y-3 before:absolute before:inset-y-2 before:left-[5px] before:w-[2px] before:bg-zinc-800">
                {targetEvents.map((event) => {
                  const isNext = event.date === targetInterviewDate;
                  const isPast = event.date < new Date().toISOString().slice(0, 10);
                  return (
                    <div key={event.id} className="relative">
                      <div className={clsx(
                        "absolute -left-[14px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900",
                        isNext ? "bg-emerald-500" : isPast ? "bg-zinc-600" : "bg-zinc-400"
                      )} />
                      <div className={clsx("text-sm font-medium", isNext ? "text-emerald-400" : isPast ? "text-zinc-600 line-through" : "text-zinc-300")}>
                        {event.title}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => window.location.href = '/admin'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
              >
                <Shield size={16} />
                <span>Admin Panel</span>
                {unreadAdminTicketCount > 0 && (
                  <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-amber-300 text-amber-950 text-[11px] font-black px-1.5 leading-none">
                    {unreadAdminTicketCount > 99 ? '99+' : unreadAdminTicketCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsFeaturesOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-colors"
            >
              <Sparkles size={16} />
              {BRAND.shell.featuresButton}
            </button>

            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
            >
              <MessageSquarePlus size={16} />
              {BRAND.shell.feedbackButton}
            </button>
            
            {user ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-zinc-800/80 transition-colors"
              >
                <LogOut size={16} />
                {BRAND.shell.logoutButton}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
              >
                <LogIn size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden w-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[120] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-emerald-500 focus:text-zinc-950"
        >
          Skip to content
        </a>
        <div id="main-content" className="page-container pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — primary destinations */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-zinc-800/90 bg-zinc-950/95 backdrop-blur-xl"
      >
        <div className="grid grid-cols-4 gap-1 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {(
            [
              { id: 'dashboard', label: 'Today', icon: LayoutDashboard, protected: true },
              { id: 'library', label: 'Library', icon: Library, protected: false },
              { id: 'patterns', label: 'Patterns', icon: BookKey, protected: false },
              { id: 'syntax', label: 'Syntax', icon: BookOpen, protected: false },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={`/${item.id}`}
                onClick={(e) => {
                  if (!user && item.protected) {
                    e.preventDefault();
                    setAuthModalTarget(item.label);
                  }
                }}
                className={clsx(
                  'flex flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl text-[10px] font-semibold transition-colors',
                  active ? 'text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <Icon size={18} className={active ? 'text-emerald-400' : ''} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Floating active session indicator — visible on every page */}
      <FloatingSessionIndicator />
      
      {/* Absolute Viewport Modal (fixes scrolling issues) */}
      {createPortal(
        <>
          <FeaturesModal
            isOpen={isFeaturesOpen}
            onClose={() => setIsFeaturesOpen(false)}
          />
          <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

          {/* Auth Prompt Modal */}
          <AnimatePresence>
            {authModalTarget && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setAuthModalTarget(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="auth-prompt-title"
                    className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 flex flex-col items-center text-center overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

                    <button
                      onClick={() => setAuthModalTarget(null)}
                      aria-label="Close sign-in prompt"
                      className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <X size={20} />
                    </button>

                    <div className="w-12 h-12 rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4 relative z-10">
                      <Lock className="w-5 h-5 text-emerald-400" />
                    </div>

                    <h3 id="auth-prompt-title" className="text-xl font-bold text-zinc-100 mb-2 relative z-10">Create an Account</h3>
                    <p className="text-zinc-400 text-[15px] leading-relaxed mb-6 relative z-10">
                      Sign in or create a free account to access <strong className="text-zinc-200">{authModalTarget}</strong> and start securely saving your progress.
                    </p>

                    <div className="flex w-full gap-3 relative z-10">
                      <button
                        onClick={() => setAuthModalTarget(null)}
                        className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-zinc-300 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-colors"
                      >
                        Maybe Later
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
                      >
                        Sign In
                      </button>
                    </div>
                  </motion.div>
               </div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
};
