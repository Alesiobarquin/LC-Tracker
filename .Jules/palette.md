## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2024-05-21 - Context-Aware Aria Labels for Repeated Icon Buttons
**Learning:** Generic `aria-label`s on icon buttons within lists/tables (e.g., "Remove item") lack context for screen reader users, making it impossible to know *which* item is being removed when navigating by buttons.
**Action:** Always interpolate unique row data (like a title or date range) into the `aria-label` for repeated icon buttons to ensure full context for assistive technologies.
