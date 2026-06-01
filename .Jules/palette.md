## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2024-04-07 - Context-Aware ARIA Labels for Table Buttons
**Learning:** Repetitive icon-only buttons inside data tables need context-aware `aria-label` attributes to avoid ambiguity for screen reader users.
**Action:** Always include the row's entity name in the `aria-label` (e.g., `aria-label={\`Start practice timer for \${prob.title}\`}`) and add `focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none` for visible keyboard focus.
