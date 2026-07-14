## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2024-05-24 - Context-Aware ARIA Labels in Mapped Lists
**Learning:** Screen readers announce icon-only buttons in mapped lists (like tables or grids) repeatedly as the same action (e.g., "Mark as solved") which removes the context of what item is being acted upon.
**Action:** Always inject loop variables like `${item.title}` into the `aria-label` for repetitive list actions to ensure each interactive element is uniquely identifiable to assistive technologies. Additionally, ensure keyboard focus states (`focus-visible:ring-2`) are explicitly defined.
