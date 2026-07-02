## 2024-05-18 - Missing ARIA labels and focus states on icon-only buttons
**Learning:** Icon-only buttons without ARIA labels or clear text are inaccessible to screen readers. Focus states are essential for keyboard navigation visibility. Context-aware ARIA labels in mapped arrays (like `${prob.title}`) solve screen reader ambiguity.
**Action:** Always verify icon-only interactive elements (buttons, links) have descriptive `aria-label`s and `focus-visible:ring-2 outline-none` classes for keyboard focus visibility.
