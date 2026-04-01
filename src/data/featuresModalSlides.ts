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
    subtitle: 'Your daily execution view for retention-focused prep.',
    icon: LayoutDashboard,
    highlights: [
      'Daily plan with spaced repetition reviews',
      'Sprint pacing, timers, streaks, and session tracking',
      'Immediate next actions so sessions start without context switching',
    ],
    tabId: 'dashboard',
  },
  {
    id: 'library',
    title: 'Problem Library',
    subtitle: 'Find the right problem without interrupting your loop.',
    icon: Library,
    highlights: [
      'Browse and filter curated lists by topic and difficulty',
      'Open any problem on LeetCode in one click',
      'Progress state stays aligned with your review workflow',
    ],
    tabId: 'library',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    subtitle: 'Measure how your practice behavior is changing.',
    icon: LineChart,
    highlights: [
      'Charts, category mastery, and trend views',
      'Sprint history and long-term progress',
      'Spot strengths and weak areas so next sessions are targeted',
    ],
    tabId: 'analytics',
  },
  {
    id: 'mock',
    title: 'Mock Interview',
    subtitle: 'Timed practice with optional AI feedback.',
    icon: Code2,
    highlights: [
      'Code in-app with Python or JavaScript',
      'AI-powered feedback and solution analysis (Gemini) when your API key is set in Settings',
      'Run full rounds in one place without tab thrash',
    ],
    tabId: 'mock',
  },
  {
    id: 'syntax',
    title: 'Syntax Reference',
    subtitle: 'Fast refreshers to preserve momentum between problems.',
    icon: BookOpen,
    highlights: [
      'Flashcard-style cards for common DSA patterns',
      'Syntax and structure reminders between problems',
      'Optimized for quick lookup, not long-form reading',
    ],
    tabId: 'syntax',
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Configure goals, identity, and tooling in one place.',
    icon: Settings,
    highlights: [
      'Targets, LeetCode identity, and learning mode',
      'API keys and preferences (including Gemini for Mock Interview)',
      'Update as your timeline, role target, or focus changes',
    ],
    tabId: 'settings',
  },
];
