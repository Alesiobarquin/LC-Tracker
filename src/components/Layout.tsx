import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Library, LineChart, Code2, Menu, X, Bell, Settings, Calendar, RefreshCw, CheckCircle, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../store/useStore';
import { differenceInDays } from 'date-fns';
import { getPhase } from '../utils/dateUtils';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const leetcodeUsername = useStore((state) => state.leetcodeUsername);
  const setLeetCodeUsername = useStore((state) => state.setLeetCodeUsername);
  const syncLeetCode = useStore((state) => state.syncLeetCode);
  const lastSync = useStore((state) => state.lastSync);
  const lastSyncCount = useStore((state) => state.lastSyncCount);
  const syncError = useStore((state) => state.syncError);
  const targetInterviewDate = useStore((state) => state.targetInterviewDate);
  const setTargetInterviewDate = useStore((state) => state.setTargetInterviewDate);

  const [tempUsername, setTempUsername] = useState(leetcodeUsername || '');
  const [tempDate, setTempDate] = useState(targetInterviewDate);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setTempUsername(leetcodeUsername || '');
  }, [leetcodeUsername]);

  useEffect(() => {
    setTempDate(targetInterviewDate);
  }, [targetInterviewDate]);

  useEffect(() => {
    const savedTime = localStorage.getItem('reminderTime');
    const savedEnabled = localStorage.getItem('reminderEnabled');
    if (savedTime) setReminderTime(savedTime);
    if (savedEnabled) setReminderEnabled(savedEnabled === 'true');
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('reminderTime', reminderTime);
    localStorage.setItem('reminderEnabled', reminderEnabled.toString());
    if (reminderEnabled && 'Notification' in window) {
      Notification.requestPermission();
    }
    setTargetInterviewDate(tempDate);
    if (tempUsername !== leetcodeUsername) {
      setLeetCodeUsername(tempUsername);
    }
    setIsSettingsOpen(false);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncLeetCode();
    setIsSyncing(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Problem Library', icon: Library },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'mock', label: 'Mock Interview', icon: Code2 },
    { id: 'syntax', label: 'Syntax Reference', icon: BookOpen },
  ];

  const daysUntilInterview = differenceInDays(new Date(targetInterviewDate), new Date());
  const phase = getPhase();
  const phaseProgress = phase === 1 ? 'Phase 1 (Foundations)' : phase === 2 ? 'Phase 2 (Internship)' : 'Phase 3 (Grind)';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col md:flex-row">
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

        <div className="p-4 border-t border-zinc-800/50">
          <div className="mb-4 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Calendar size={12} />
              <span>Target: {targetInterviewDate}</span>
            </div>
            <div className="text-lg font-semibold text-zinc-100">
              {daysUntilInterview > 0 ? `${daysUntilInterview} days` : 'It\'s time!'}
            </div>
            <div className="text-xs text-emerald-400/80 mt-1">
              {phaseProgress}
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 transition-colors text-sm font-medium"
          >
            <Settings size={18} />
            <span>Settings</span>
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                <Settings size={20} className="text-emerald-400" />
                Settings
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-400 hover:text-zinc-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Target Interview Date</label>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">LeetCode Username</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    placeholder="e.g., neetcode"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing || !tempUsername}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl text-zinc-300 transition-colors flex items-center justify-center"
                  >
                    <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                  </button>
                </div>
                {syncError && <p className="text-red-400 text-xs mt-2">{syncError}</p>}
                {lastSync && !syncError && (
                  <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                    <CheckCircle size={12} /> Last synced: {new Date(lastSync).toLocaleString()}
                    {lastSyncCount !== null && ` (${lastSyncCount} new added)`}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-800/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-300 font-medium">Enable Reminders</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className={clsx("transition-opacity", reminderEnabled ? "opacity-100" : "opacity-50 pointer-events-none")}>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Reminder Time</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold py-3 rounded-xl transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
