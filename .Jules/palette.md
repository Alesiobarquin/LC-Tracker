## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.
## 2026-05-06 - Interactive Icon-Only Buttons Accessibility
**Learning:** Found that multiple interactive icon-only buttons (like Play icons in problem rows or X close icons in modals) lacked explicit `aria-label`s and visible keyboard focus states, making them challenging for screen reader and keyboard users to navigate. Specifically, data table actions lacked context in their labels.
**Action:** Always add an explicit, context-aware `aria-label` to icon-only buttons (e.g., `aria-label={"Start practice timer for " + prob.title}`) and enforce keyboard visibility with standard Tailwind classes `focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none`.
