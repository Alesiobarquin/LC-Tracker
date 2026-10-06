import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Library,
  LineChart,
  Menu,
  X,
  Settings,
  Calendar,
  BookOpen,
  BookKey,
  LogOut,
  LogIn,
  MessageSquarePlus,
  Shield,
  CircleHelp,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { FloatingSessionIndicator } from "./FloatingSessionIndicator";
import { clsx } from "clsx";
import { differenceInDays } from "date-fns";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { getPhase } from "../utils/dateUtils";
import { useUserSettings } from "../hooks/useUserData";
import { useUser, useClerk } from "@clerk/react";
import { FeedbackModal } from "./FeedbackModal";
import { FeaturesModal } from "./FeaturesModal";
import { Logo } from "./Logo";
import { Modal } from "./ui/Modal";
import { ThemeSwitcher } from "./ThemeSwitcher";
import {
  FEATURES_MODAL_STORAGE_KEY,
  FEATURES_MODAL_VERSION,
} from "../constants/featuresModal";
import { BRAND } from "../constants/brand";
import { isAdminUser } from "../utils/adminAuth";
import { supabase } from "../lib/supabase";
import { isMissingRelationError } from "../utils/supabaseErrors";

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
    const path = pathname.replace(/\/+$/, "");
    const segments = path.split("/");
    // Extract base tab from path (e.g. /patterns/two-pointer -> patterns)
    return segments[1] || "dashboard";
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
  const daysUntilInterview = differenceInDays(
    new Date(targetInterviewDate),
    new Date(),
  );
  const phase = getPhase(new Date(), targetInterviewDate);
  const phaseProgress =
    phase === 1
      ? "Build pattern coverage"
      : phase === 2
        ? "Practice integration"
        : "Independent interview practice";

  useEffect(() => {
    if (activeTab !== "dashboard") return;
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
        .from("user_feedback")
        .select("id");

      if (feedbackError) {
        console.error("Failed to load feedback ticket count:", feedbackError);
        return;
      }

      const ticketRows = (feedbackRows ?? []) as FeedbackRow[];

      const { data: readRows, error: readError } = await supabase
        .from("admin_feedback_reads")
        .select("feedback_id")
        .eq("admin_user_id", user.id);

      if (readError) {
        // Table missing in prod (PGRST205) — treat every ticket as unread, don't crash boot.
        if (isMissingRelationError(readError)) {
          if (!cancelled) {
            setUnreadAdminTicketCount(ticketRows.length);
          }
          return;
        }

        console.error("Failed to load admin read markers:", readError);
        return;
      }

      const viewedSet = new Set(
        ((readRows ?? []) as FeedbackReadRow[]).map((row) => row.feedback_id),
      );
      const unreadCount = ticketRows.reduce(
        (count, row) => count + (viewedSet.has(row.id) ? 0 : 1),
        0,
      );

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

    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAdmin, user?.id]);

  const navItems = [
    { id: "dashboard", label: "Today", icon: LayoutDashboard, protected: true },
    { id: "library", label: "Library", icon: Library },
    { id: "patterns", label: "Patterns", icon: BookKey },
    { id: "analytics", label: "Evidence", icon: LineChart, protected: true },
    { id: "syntax", label: "Syntax", icon: BookOpen },
    { id: "settings", label: "Settings", icon: Settings, protected: true },
  ];

  const currentSection =
    navItems.find((item) => item.id === activeTab)?.label ??
    (activeTab === "timer" || activeTab === "recall"
      ? "Study session"
      : "Workspace");
  const isStudySession = activeTab === "timer" || activeTab === "recall";

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const navigation = (mobile = false) =>
    navItems
      .filter((item) => mobile || item.id !== "settings")
      .map((item) => {
        const Icon = item.icon;
        const active =
          activeTab === item.id || (item.id === "dashboard" && isStudySession);
        return (
          <Link
            key={item.id}
            to={`/${item.id}`}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              if (!user && item.protected) {
                event.preventDefault();
                setAuthModalTarget(item.label);
              }
              setIsMobileMenuOpen(false);
            }}
            className={clsx(
              "workspace-link",
              active && "workspace-link-active",
            )}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      });

  return (
    <div className="brand-shell workspace-shell min-h-screen text-foreground font-sans">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="workspace-header">
        <div className="workspace-header-inner">
          <Link to={user ? "/dashboard" : "/"} className="workspace-wordmark">
            <Logo className="text-accent" size={26} />
            <span>{BRAND.name}</span>
          </Link>
          <span
            className="workspace-divider hidden lg:block"
            aria-hidden="true"
          />
          <nav
            aria-label="Workspace"
            className="hidden lg:flex items-stretch gap-1 self-stretch"
          >
            {navigation()}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher compact />
            <Link
              to={user ? "/settings" : "/login"}
              aria-label="Settings"
              aria-current={activeTab === "settings" ? "page" : undefined}
              className="workspace-tool workspace-tool-desktop"
            >
              <Settings size={16} />
            </Link>
            <details className="workspace-more hidden lg:block">
              <summary
                className="workspace-tool"
                aria-label="Workspace options"
              >
                <ChevronDown size={16} />
              </summary>
              <div className="workspace-popover">
                {user && (
                  <p className="px-3 py-2 text-xs text-subtle border-b border-line mb-1">
                    {user.fullName || "Your workspace"}
                  </p>
                )}
                <button
                  onClick={(event) => {
                    const menu = event.currentTarget.closest("details");
                    if (menu) {
                      menu.open = false;
                      menu.querySelector("summary")?.focus();
                    }
                    setIsFeaturesOpen(true);
                  }}
                >
                  <CircleHelp size={15} />
                  {BRAND.shell.featuresButton}
                </button>
                <button
                  onClick={(event) => {
                    const menu = event.currentTarget.closest("details");
                    if (menu) {
                      menu.open = false;
                      menu.querySelector("summary")?.focus();
                    }
                    setIsFeedbackOpen(true);
                  }}
                >
                  <MessageSquarePlus size={15} />
                  {BRAND.shell.feedbackButton}
                </button>
                {isAdmin && (
                  <Link to="/admin">
                    <Shield size={15} />
                    Admin · {unreadAdminTicketCount} unread
                  </Link>
                )}
                {user ? (
                  <button onClick={() => void signOut()}>
                    <LogOut size={15} />
                    Sign out
                  </button>
                ) : (
                  <Link to="/login">
                    <LogIn size={15} />
                    Sign in
                  </Link>
                )}
              </div>
            </details>
            <button
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="app-sidebar"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="workspace-tool workspace-tool-mobile"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
      <div className="workspace-context">
        <span className="inline-flex items-center gap-2">
          <span className="status-node" aria-hidden="true" />
          Study workspace{" "}
          <span className="text-line-strong" aria-hidden="true">
            /
          </span>
          <span className="text-body">{currentSection}</span>
        </span>
        {user ? (
          <details className="schedule-context">
            <summary className="inline-flex items-center gap-2 cursor-pointer">
              {Number.isFinite(daysUntilInterview) && daysUntilInterview >= 0
                ? `${daysUntilInterview} days to interview`
                : "No upcoming interview"}
              <ChevronDown size={12} />
            </summary>
            <div className="workspace-popover">
              <p className="px-3 py-2 text-xs text-muted">{phaseProgress}</p>
              {targetEvents.map((event) => (
                <p key={event.id} className="px-3 py-2 text-xs text-body">
                  {event.title}
                  <span className="block mt-1 font-mono text-subtle">
                    {new Date(event.date + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )}
                  </span>
                </p>
              ))}
              <Link to="/settings#section-schedule">
                <Calendar size={14} />
                Edit schedule
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </details>
        ) : (
          <Link to="/login" className="text-muted hover:text-foreground">
            Sign in to save progress <span aria-hidden="true">↗</span>
          </Link>
        )}
      </div>
      {isMobileMenuOpen && (
        <>
          <button
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div id="app-sidebar" className="mobile-navigation lg:hidden">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono text-subtle">Navigation</span>
              <button
                aria-label="Close menu"
                className="workspace-tool"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <nav aria-label="Workspace">{navigation(true)}</nav>
            {user && (
              <details className="border-t border-line mt-4 pt-4 text-xs text-muted">
                <summary className="cursor-pointer">
                  {Number.isFinite(daysUntilInterview) &&
                  daysUntilInterview >= 0
                    ? `Interview in ${daysUntilInterview} days`
                    : "No upcoming interview"}
                </summary>
                <div className="space-y-3 mt-3">
                  <p>{phaseProgress}</p>
                  {targetEvents.map((event) => (
                    <p key={event.id}>
                      {event.title}
                      <span className="block font-mono text-[10px] mt-1">
                        {event.date}
                      </span>
                    </p>
                  ))}
                  <Link
                    to="/settings#section-schedule"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="quiet-action"
                  >
                    Edit study schedule
                  </Link>
                </div>
              </details>
            )}
            <div className="border-t border-line mt-4 pt-3 workspace-mobile-tools">
              <button
                onClick={() => {
                  setIsFeaturesOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <CircleHelp size={15} />
                Product tour
              </button>
              <button
                onClick={() => {
                  setIsFeedbackOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <MessageSquarePlus size={15} />
                Report issue
              </button>
              {isAdmin && (
                <Link to="/admin">
                  <Shield size={15} />
                  Admin · {unreadAdminTicketCount} unread
                </Link>
              )}
              {user ? (
                <button onClick={() => void signOut()}>
                  <LogOut size={15} />
                  Sign out
                </button>
              ) : (
                <Link to="/login">
                  <LogIn size={15} />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </>
      )}
      <main
        id="main-content"
        tabIndex={-1}
        className="page-container workspace-content"
      >
        {children}
      </main>
      <nav aria-label="Primary" className="mobile-dock lg:hidden">
        {navItems
          .filter((item) =>
            ["dashboard", "library", "patterns", "syntax"].includes(item.id),
          )
          .map((item) => {
            const Icon = item.icon;
            const active =
              activeTab === item.id ||
              (item.id === "dashboard" && isStudySession);
            return (
              <Link
                key={item.id}
                to={`/${item.id}`}
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  if (!user && item.protected) {
                    event.preventDefault();
                    setAuthModalTarget(item.label);
                  }
                }}
                className={clsx(active && "text-accent")}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* Floating active session indicator — visible on every page */}
      <FloatingSessionIndicator />

      {/* Absolute Viewport Modal (fixes scrolling issues) */}
      {createPortal(
        <>
          <FeaturesModal
            isOpen={isFeaturesOpen}
            onClose={() => setIsFeaturesOpen(false)}
          />
          <FeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
          />

          <Modal
            isOpen={!!authModalTarget}
            onClose={() => setAuthModalTarget(null)}
            title="Save your study progress"
            size="sm"
          >
            <p className="text-sm text-muted leading-relaxed">
              Sign in to access {authModalTarget} and keep your sessions and
              notes together.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAuthModalTarget(null)}
                className="brand-button-secondary flex-1 px-3 py-2.5 rounded-md text-xs"
              >
                Keep browsing
              </button>
              <button
                onClick={() => navigate("/login")}
                className="brand-button-primary flex-1 px-3 py-2.5 rounded-md text-xs"
              >
                Sign in
              </button>
            </div>
          </Modal>
        </>,
        document.body,
      )}
    </div>
  );
};
