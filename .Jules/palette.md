## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2026-06-03 - Context-Aware ARIA and Focus for Icon Buttons
**Learning:** Repetitive icon-only actions (like "Skip" or "Play" in a mapped list) are ambiguous to screen readers without context-aware labels (e.g. including the entity title). Furthermore, lacking explicit focus rings makes keyboard navigation invisible.
**Action:** Always add dynamic `aria-label`s incorporating loop variables (e.g., `aria-label={`Skip ${item.title}`}`) and use Tailwind's `focus-visible:ring-2 outline-none` for explicit focus states.
