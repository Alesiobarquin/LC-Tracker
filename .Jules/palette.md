## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.
## 2024-03-21 - Added accessibility attributes to Dashboard icon buttons
**Learning:** In a dashboard with multiple icon-only interactive elements (like dismiss banners, external links, and action buttons), it's easy to overlook screen reader compatibility and keyboard navigation. Using `aria-label`, `title`, and Tailwind's `focus-visible` utility significantly enhances accessibility without altering the visual design.
**Action:** Proactively check all icon-only buttons and links across the app to ensure they have descriptive `aria-label`s and visible focus states for keyboard users.
