import type { LucideIcon } from 'lucide-react';
import { BookOpen, Code2, LayoutDashboard, Library, LineChart, Settings } from 'lucide-react';

export type FeatureSlide = {
  id: string;
  title: string;
  /** Short line under the title — sets context */
  subtitle: string;
  /** Scannable bullets: what this area does for the user */
  highlights: string[];
  icon: LucideIcon;
  tabId?: 'dashboard' | 'library' | 'analytics' | 'mock' | 'syntax' | 'settings';
};

export const FEATURE_SLIDES: FeatureSlide[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Your daily command center for consistent prep.',
    icon: LayoutDashboard,
    highlights: [
      'Daily plan with spaced repetition reviews',
      'Sprint pacing, timers, streaks, and session tracking',
      'Quick links to what to study next—less decision fatigue',
    ],
    tabId: 'dashboard',
  },
  {
    id: 'library',
    title: 'Problem Library',
    subtitle: 'Find the right problem without leaving your flow.',
    icon: Library,
    highlights: [
      'Browse and filter curated lists by topic and difficulty',
      'Open any problem on LeetCode in one click',
      'Progress stays synced with how LC Tracker tracks you',
    ],
    tabId: 'library',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    subtitle: 'See patterns in how you actually practice.',
    icon: LineChart,
    highlights: [
      'Charts, category mastery, and trend views',
      'Sprint history and long-term progress',
      'Spot strengths and weak spots to guide what to do next',
    ],
    tabId: 'analytics',
  },
  {
    id: 'mock',
    title: 'Mock Interview',
    subtitle: 'Timed practice with feedback when you want it.',
    icon: Code2,
    highlights: [
      'Code in-app with Python or JavaScript',
      'AI-powered feedback and solution analysis (Gemini) when your API key is set in Settings',
      'Treat it like a real round—without tab chaos',
    ],
    tabId: 'mock',
  },
  {
    id: 'syntax',
    title: 'Syntax Reference',
    subtitle: 'Fast refreshers so you don’t break momentum.',
    icon: BookOpen,
    highlights: [
      'Flashcard-style cards for common DSA patterns',
      'Syntax and structure reminders between problems',
      'Built for quick lookups, not deep reading sessions',
    ],
    tabId: 'syntax',
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Connect goals, identity, and tools in one place.',
    icon: Settings,
    highlights: [
      'Targets, LeetCode identity, and learning mode',
      'API keys and preferences (including Gemini for Mock Interview)',
      'Adjust anytime as your timeline or focus changes',
    ],
    tabId: 'settings',
  },
];
