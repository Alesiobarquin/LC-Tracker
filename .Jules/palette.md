## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.
## 2024-05-24 - Interactive icon-only buttons
**Learning:** Icon-only buttons often lack accessible context when reading them out loud.
**Action:** Adding a context-aware `aria-label` incorporates the target entity name in repetitive structures like data tables, while `focus-visible` ring styling ensures visible keyboard focus without relying on pointer hover interactions.
