## 2025-03-05 - Problem Library Table Buttons
**Learning:** Icon-only action buttons in complex tables (like problem lists) often lack proper `aria-label` attributes and visible focus states, making them invisible and unusable for screen reader and keyboard-only users, especially when actions are hidden behind `group-hover`.
**Action:** Always verify that interactive elements in tables have descriptive `aria-label`s (e.g., incorporating the row's entity name) and ensure that `focus-visible:opacity-100` and `focus-visible:ring-2` are used to make actions apparent during keyboard navigation.
