## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2026-05-14 - Context-Aware ARIA Labels in Data Tables
**Learning:** In repetitive structures like data tables, generic `aria-label` attributes on icon-only buttons (e.g., "Start practice timer") create ambiguity for screen reader users because they cannot determine which row's entity the button affects without reading the surrounding context.
**Action:** Always include the row's entity name (e.g., `aria-label={\`Start practice timer for ${prob.title}\`}`) to provide explicit context and ensure screen reader clarity.
