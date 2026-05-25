## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2024-05-15 - Context-Aware ARIA Labels for Repetitive UI
**Learning:** Using static `aria-label`s (like "Remove item") inside `.map()` loops creates ambiguity for screen reader users, as all buttons in the list will announce identically without context.
**Action:** Always make `aria-label`s dynamic and context-aware (e.g., ``aria-label={`Remove event: ${event.title}`}``) when rendering repeated icon-only buttons in lists or tables.
