## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2024-05-29 - Context-Aware ARIA Labels for List Item Action Buttons
**Learning:** Repetitive icon-only buttons in list views (e.g. `<X>` to delete a row) create severe ambiguity for screen reader users when multiple identical actions exist without context. Standard `aria-label="Remove"` is insufficient.
**Action:** For repetitive list actions, dynamically incorporate row-specific data into the `aria-label` (e.g., `aria-label={`Remove event: ${event.title}`}`) and ensure keyboard users have visible focus indicators.
