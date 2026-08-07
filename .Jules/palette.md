## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.
## 2026-05-20 - Context-Aware ARIA Labels for Icon Buttons
**Learning:** Icon-only buttons repeated in lists (like a 'Play' button for multiple problems) need context-aware ARIA labels (e.g., `Start practice timer for ${problemTitle}`) to avoid ambiguity for screen reader users. Standard `focus-visible` utility classes ensure keyboard users can track their navigation path.
**Action:** When adding or updating icon-only buttons in mapped arrays, always dynamically inject the item's context into the `aria-label` and apply `focus-visible:ring-2` for keyboard accessibility.
