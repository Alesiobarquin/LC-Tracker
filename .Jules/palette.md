## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.
## 2024-05-18 - Missing ARIA Labels on Recurring Icon-Only Interactive Elements
**Learning:** In repetitive UI structures like lists, dashboards, and data tables within this application, context-independent icon-only buttons (like a global 'Play' or 'Skip' icon) often lack distinct, context-aware `aria-label`s, rendering them ambiguous to screen readers. Furthermore, these elements frequently lack explicit `:focus-visible` styling, degrading keyboard navigation.
**Action:** Always verify that interactive elements in mapped lists have `aria-label`s that dynamically include the specific entity's context (e.g., `aria-label={"Start " + entity.title}`). Standardize the use of `focus-visible:ring-2 outline-none` across all custom buttons and links.
