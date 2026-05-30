## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.
## 2025-04-11 - Add ARIA label to dismiss catch up banner button
**Learning:** Found an icon-only button without an ARIA label in the catch-up banner, which makes it inaccessible to screen readers.
**Action:** Always add  to icon-only buttons to ensure they are accessible.
## 2025-04-11 - Add ARIA label to dismiss catch up banner button
**Learning:** Found an icon-only button without an ARIA label in the catch-up banner, which makes it inaccessible to screen readers.
**Action:** Always add aria-label to icon-only buttons to ensure they are accessible.
