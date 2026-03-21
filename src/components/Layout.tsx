import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Library, LineChart, Code2, Menu, X, Settings, Calendar, BookOpen, LogOut } from 'lucide-react';
import { FloatingSessionIndicator } from './FloatingSessionIndicator';
import { clsx } from 'clsx';
import { differenceInDays } from 'date-fns';
import { getPhase } from '../utils/dateUtils';
import { motion } from 'motion/react';
import { useUserSettings } from '../hooks/useUserData';
import { useAuth } from './AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const { targetInterviewDate, targetEvents } = useUserSettings();
  const daysUntilInterview = differenceInDays(new Date(targetInterviewDate), new Date());
  const phase = getPhase();
  const phaseProgress = phase === 1 ? 'Phase 1 (Foundations)' : phase === 2 ? 'Phase 2 (Internship)' : 'Phase 3 (Grind)';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Problem Library', icon: Library },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'mock', label: 'Mock Interview', icon: Code2 },
    { id: 'syntax', label: 'Syntax Reference', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col md:flex-row relative z-0">
      {/* Environmental Lighting */}
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(255,255,255,0))] pointer-events-none" />
      <div className="fixed inset-0 z-[-1] opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="font-bold text-xl tracking-tight text-emerald-400">LC Tracker</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-400 hover:text-zinc-100">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:block">
          <div className="font-bold text-2xl tracking-tight text-emerald-400">LC Tracker</div>
        </div>

        <nav className="mt-2 px-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium relative",
                  activeTab === item.id
                    ? "bg-zinc-800/50 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"
                )}
              >
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} className={activeTab === item.id ? "text-emerald-400" : ""} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/50 space-y-4">
          <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Calendar size={12} />
              <span>Next Target</span>
            </div>
            <div className="text-lg font-semibold text-zinc-100">
              {daysUntilInterview > 0 ? `${daysUntilInterview} days` : 'It\'s time!'}
            </div>
            <div className="text-xs text-emerald-400/80 mt-1">
              {phaseProgress}
            </div>
          </div>

          {targetEvents.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">Target Timeline</div>
              <div className="relative pl-3 space-y-3 before:absolute before:inset-y-2 before:left-[5px] before:w-[2px] before:bg-zinc-800">
                {targetEvents.map((event) => {
                  const isNext = event.date === targetInterviewDate;
                  const isPast = new Date(event.date) < new Date(targetInterviewDate);
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

          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-zinc-800/80 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        {children}
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Floating active session indicator — visible on every page */}
      <FloatingSessionIndicator setActiveTab={setActiveTab} />
    </div>
  );
};
