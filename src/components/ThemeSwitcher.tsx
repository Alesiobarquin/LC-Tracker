import { ChevronDown, Monitor, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from './ThemeProvider';
import type { ThemePreference } from '../lib/theme';

export function ThemeSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { preference, setPreference } = useTheme();
  const Icon = preference === 'system' ? Monitor : preference === 'dark' ? Moon : Sun;

  return (
    <label className={clsx('relative inline-flex shrink-0 items-center text-muted', className)}>
      <Icon className="pointer-events-none absolute left-2.5 h-4 w-4" aria-hidden="true" />
      <select
        aria-label="Color theme"
        value={preference}
        onChange={event => setPreference(event.target.value as ThemePreference)}
        className={clsx(
          'h-9 cursor-pointer appearance-none rounded-md border border-line bg-surface pl-8 pr-6 text-xs font-medium text-body hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          compact ? 'w-[96px]' : 'w-[104px]',
        )}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3" aria-hidden="true" />
    </label>
  );
}
