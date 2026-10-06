/** Preference storage can be unavailable in private/restricted browsers. */
export const preferenceStorage = {
  getItem(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* Preferences remain in component state. */ }
  },
};

const memory = new Map<string, string>();
/** Keep the active timer usable if browser session storage is restricted/full. */
export const timerStorage = {
  getItem(key: string) {
    try { return sessionStorage.getItem(key); } catch { return memory.get(key) ?? null; }
  },
  setItem(key: string, value: string) {
    memory.set(key, value);
    try { sessionStorage.setItem(key, value); } catch { /* Keep the current tab usable. */ }
  },
  removeItem(key: string) {
    memory.delete(key);
    try { sessionStorage.removeItem(key); } catch { /* Memory state was cleared. */ }
  },
};
export function canPersistTimer() {
  try { sessionStorage.setItem('lc-tracker-storage-check', '1'); sessionStorage.removeItem('lc-tracker-storage-check'); return true; }
  catch { return false; }
}
