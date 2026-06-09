## 2025-02-28 - Context-Aware ARIA Labels on Icon Buttons
**Learning:** Mapped icon-only buttons need context-aware ARIA labels (e.g. `aria-label={`Skip ${prob.title}`}`) to avoid screen reader ambiguity in loops. Explicit focus styling like `focus-visible:ring-2` with appropriate ring colors is essential for keyboard navigation.
**Action:** Always include loop variables in `aria-label`s for mapped icon buttons and apply `focus-visible:ring-2 outline-none` to ensure keyboard accessibility.
