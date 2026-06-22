## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2024-05-18 - Accessibility of Icon-Only Actions in Data Tables
**Learning:** Icon-only action buttons (like play/start timers) in repetitive structures like data tables often lack context for screen reader users and fail to display a clear visible focus indicator when navigated via keyboard. A static `aria-label` like "Start timer" becomes ambiguous when repeated 50 times in a table.
**Action:** Always provide context-aware `aria-label`s (e.g., `Start practice timer for ${prob.title}`) and explicit `focus-visible:ring-2` styles to icon-only buttons to guarantee screen reader context and keyboard navigability.
