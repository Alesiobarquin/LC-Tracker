## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.
## 2023-11-20 - Icon-only Button Accessibility
**Learning:** Icon-only buttons (like Play/Pause or Dismiss X) need `aria-label` and `title` properties for screen readers and tooltips, plus visible focus rings (using Tailwind `focus-visible:ring-2` and `outline-none`) for keyboard navigation. Dynamic state (like `isRunning` for a timer) requires dynamically changing `aria-label` values.
**Action:** Always verify icon-only buttons have descriptive labels and clear keyboard focus indicators.
