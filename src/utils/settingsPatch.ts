import type { AppSettings } from '../types';

/** Apply only fields the user changed, preserving other devices' unrelated edits. */
export function applySettingsPatch(base: AppSettings, current: AppSettings, patch: Partial<AppSettings>): AppSettings {
  function merge(before: Record<string, unknown>, latest: Record<string, unknown>, changes: Record<string, unknown>) {
    const next = { ...latest };
    for (const [key, value] of Object.entries(changes)) {
      if (JSON.stringify(value) === JSON.stringify(before[key])) continue;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        next[key] = merge((before[key] ?? {}) as Record<string, unknown>,
          (latest[key] ?? {}) as Record<string, unknown>, value as Record<string, unknown>);
      } else {
        if (JSON.stringify(latest[key]) !== JSON.stringify(before[key]) && JSON.stringify(latest[key]) !== JSON.stringify(value)) {
          throw Object.assign(new Error('This setting changed on another device. Refresh and try again.'), { code: '40001' });
        }
        next[key] = value;
      }
    }
    return next;
  }
  return merge(base as unknown as Record<string, unknown>, current as unknown as Record<string, unknown>,
    patch as Record<string, unknown>) as unknown as AppSettings;
}
