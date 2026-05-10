## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.
## 2024-04-07 - ARIA labels for functional inputs
**Learning:** Icon-only buttons used for configuration inputs (e.g., adding dates or events, syncing data) lack context for screen readers when they don't have visual text.
**Action:** Always add descriptive `aria-label`s to icon-only action buttons (e.g. `aria-label="Add blackout date"` for a `+` button).
