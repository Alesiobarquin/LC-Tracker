## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2024-06-18 - Missing Focus Indication on Icon-only Settings Actions
**Learning:** Icon-only secondary actions like "Add Blackout Date" or "Add Target Event" in lists or setting sections often lack visible focus states, making them extremely difficult to locate for keyboard navigation users.
**Action:** Always combine `focus-visible:ring-2` with `outline-none` and a context-appropriate color (like `focus-visible:ring-emerald-500`) when creating icon-only action buttons.
