## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2026-04-28 - Keyboard Accessibility for Icon-only Interactive Elements
**Learning:** Icon-only buttons and links lack visible focus states by default and are not screen-reader friendly without an accessible name.
**Action:** Always provide an `aria-label` and add `focus-visible:ring-2 outline-none` with an appropriate ring color (e.g., `focus-visible:ring-zinc-500` or `focus-visible:ring-emerald-500`) to interactive icon-only elements.
