import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Library, LineChart, Menu, X, Settings, Calendar, BookOpen, BookKey, LogOut, LogIn, MessageSquarePlus, Shield, Sparkles, Lock } from 'lucide-react';
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
import { ThemeSwitcher } from './ThemeSwitcher';
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
    { id: 'dashboard', label: 'Today', icon: LayoutDashboard, protected: true },
    { id: 'library', label: 'Problem Library', icon: Library },
    { id: 'patterns', label: 'Patterns', icon: BookKey },
    { id: 'analytics', label: 'Learning evidence', icon: LineChart, protected: true },
    { id: 'syntax', label: 'Syntax Reference', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings, protected: true },
  ];

  const currentSection = navItems.find((item) => item.id === activeTab)?.label
    ?? (activeTab === 'timer' || activeTab === 'recall' ? 'Study session' : 'Workspace');
  const isStudySession = activeTab === 'timer' || activeTab === 'recall';

  return (
    <div className="brand-shell min-h-screen text-foreground font-sans flex flex-col md:flex-row relative z-0">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between gap-2 px-4 py-3 border-b border-line bg-surface sticky top-0 z-50">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0">
          <Logo className="text-accent" size={22} />
          <div className="font-semibold text-base tracking-tight text-foreground">{BRAND.name}</div>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeSwitcher compact />
          <button
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="app-sidebar"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="min-h-10 min-w-10 inline-flex items-center justify-center text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
          >
            {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        id="app-sidebar"
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-[15rem] bg-surface border-r border-line transform transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:visible flex flex-col pt-20 pb-20 md:pt-0 md:pb-0 overflow-y-auto shrink-0",
          isMobileMenuOpen ? "translate-x-0 visible" : "-translate-x-full invisible"
        )}
      >
        <div className="px-5 py-6 hidden md:block">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
            <Logo className="text-accent" size={25} />
            <div className="font-semibold text-lg tracking-tight text-foreground">{BRAND.name}</div>
          </Link>
        </div>

        <nav aria-label="Workspace" className="mt-1 px-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id || (item.id === 'dashboard' && isStudySession);
            return (
              <Link
                key={item.id}
                to={`/${item.id}`}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  if (!user && item.protected) {
                    e.preventDefault();
                    setAuthModalTarget(item.label);
                  }
                  setIsMobileMenuOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm relative",
                  active
                    ? "bg-muted-surface text-foreground font-semibold"
                    : "text-muted hover:bg-muted-surface hover:text-foreground"
                )}
              >
                <Icon size={17} className={active ? "text-accent" : ""} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-line space-y-4">
          {user ? (
            <details className="px-3 text-xs">
              <summary className="text-muted cursor-pointer hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md">
                {Number.isFinite(daysUntilInterview) && daysUntilInterview >= 0
                  ? `Interview in ${daysUntilInterview} days`
                  : 'No upcoming interview'}
              </summary>
              <div className="pt-3 space-y-3">
                <p className="text-muted">{phaseProgress}</p>
                {targetEvents.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-medium text-body flex items-center gap-2"><Calendar size={12} aria-hidden="true" /> Target timeline</p>
                    {targetEvents.map((event) => {
                      const isNext = event.date === targetInterviewDate;
                      const isPast = event.date < new Date().toISOString().slice(0, 10);
                      return (
                        <div key={event.id}>
                          <p className={clsx("text-xs", isNext ? "text-accent font-medium" : isPast ? "text-subtle line-through" : "text-body")}>
                            {event.title}
                          </p>
                          <p className="text-xs text-subtle mt-0.5">
                            {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                <Link to="/settings#section-schedule" onClick={() => setIsMobileMenuOpen(false)} className="block text-muted underline underline-offset-4 hover:text-foreground">
                  Edit study schedule
                </Link>
              </div>
            </details>
          ) : (
            <p className="px-3 text-xs text-muted leading-relaxed">
              Sign in to save your study plan and interview target.
            </p>
          )}
          <div className="space-y-0.5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => window.location.href = '/admin'}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs text-muted hover:bg-muted-surface hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Shield size={15} aria-hidden="true" />
                <span>Admin Panel</span>
                {unreadAdminTicketCount > 0 && (
                  <span className="ml-auto inline-flex min-w-5 h-5 items-center justify-center rounded-md bg-warning/10 text-warning text-[11px] font-semibold px-1.5 leading-none">
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
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs text-muted hover:bg-muted-surface hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Sparkles size={15} aria-hidden="true" />
              {BRAND.shell.featuresButton}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFeedbackOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs text-muted hover:bg-muted-surface hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <MessageSquarePlus size={15} aria-hidden="true" />
              {BRAND.shell.feedbackButton}
            </button>
            {user ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs text-muted hover:bg-muted-surface hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <LogOut size={15} aria-hidden="true" />
                {BRAND.shell.logoutButton}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium text-accent hover:bg-muted-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <LogIn size={15} aria-hidden="true" /> Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 w-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[120] focus:px-4 focus:py-2 focus:rounded-md focus:bg-accent focus:text-on-accent"
        >
          Skip to content
        </a>
        <div className="hidden md:flex items-center justify-between gap-4 px-8 py-3 border-b border-line bg-canvas">
          <p className="text-xs text-subtle flex items-center gap-2">
            Workspace <span aria-hidden="true">/</span> <span className="text-body">{currentSection}</span>
          </p>
          <ThemeSwitcher />
        </div>
        <div id="main-content" className="page-container px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — primary destinations */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-line bg-surface"
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
            const active = activeTab === item.id || (item.id === 'dashboard' && isStudySession);
            return (
              <Link
                key={item.id}
                to={`/${item.id}`}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  if (!user && item.protected) {
                    e.preventDefault();
                    setAuthModalTarget(item.label);
                  }
                }}
                className={clsx(
                  'flex flex-col items-center justify-center gap-0.5 min-h-12 rounded-md text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  active ? 'text-accent' : 'text-subtle hover:text-body'
                )}
              >
                <Icon size={18} className={active ? 'text-accent' : ''} />
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
                    className="relative w-full max-w-sm bg-surface border border-line rounded-2xl p-6 shadow-2xl z-10 flex flex-col items-center text-center overflow-hidden"
                  >

                    <button
                      onClick={() => setAuthModalTarget(null)}
                      aria-label="Close sign-in prompt"
                      className="absolute top-4 right-4 p-1 rounded-lg text-muted hover:text-foreground hover:bg-muted-surface transition-colors z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <X size={20} />
                    </button>

                    <div className="w-12 h-12 rounded-full bg-muted-surface/50 border border-line-strong/50 flex items-center justify-center mb-4 relative z-10">
                      <Lock className="w-5 h-5 text-accent" />
                    </div>

                    <h3 id="auth-prompt-title" className="text-xl font-bold text-foreground mb-2 relative z-10">Create an Account</h3>
                    <p className="text-muted text-[15px] leading-relaxed mb-6 relative z-10">
                      Sign in or create a free account to access <strong className="text-body">{authModalTarget}</strong> and start securely saving your progress.
                    </p>

                    <div className="flex w-full gap-3 relative z-10">
                      <button
                        onClick={() => setAuthModalTarget(null)}
                        className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-body bg-muted-surface/50 hover:bg-hover-surface/50 border border-line-strong/50 transition-colors"
                      >
                        Maybe Later
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-on-accent bg-accent hover:bg-accent transition-colors"
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
