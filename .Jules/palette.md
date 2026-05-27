## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2024-05-15 - ARIA Labels and Focus States for Icon Buttons and Repetitive Links
**Learning:** Icon-only buttons (like the catch-up banner dismiss button) and repetitive action links (like the "Open on LeetCode" external links in lists) can be completely invisible to screen readers without an `aria-label` or `title` attribute. Furthermore, missing focus ring styling makes keyboard navigation (tabbing) extremely confusing.
**Action:** Always provide an explicit, contextual `aria-label` (and `title` for mouse users) for icon-only actions. Add visible focus indicators using Tailwind classes like `focus-visible:ring-2 focus-visible:ring-{color}-500 outline-none` to ensure keyboard accessibility.
