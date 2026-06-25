## 2024-06-25 - Context-Aware ARIA Labels
**Learning:** Icon-only buttons mapped from lists often lack accessible names. Adding dynamic `aria-label` attributes using the loop item's title (e.g., `Start practice session for ${prob.title}`) dramatically improves screen reader clarity compared to generic labels or no labels.
**Action:** Always include context-specific variables in `aria-label` and `title` attributes when mapping over datasets to generate icon-only interactive elements, and pair them with visible keyboard focus styles (`focus-visible:ring-2 outline-none`).
