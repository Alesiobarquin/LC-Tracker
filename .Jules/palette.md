## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.
## 2026-05-13 - Adding aria-labels and focus styles to icon buttons
**Learning:** Found several icon-only buttons and links in the Dashboard component that lacked proper accessibility labels and visual focus states, which makes keyboard navigation and screen reader usage difficult.
**Action:** Always add context-aware `aria-label` attributes and explicit `focus-visible:ring-2` utility classes to icon-only interactive elements to ensure they are accessible and visually clear when focused.
