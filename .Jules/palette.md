## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2024-06-02 - Icon-only Context-Aware Buttons
**Learning:** Repetitive mapped lists with interactive icon-only buttons need dynamic, entity-specific `aria-label`s and clear visual focus rings to avoid screen reader ambiguity and tab navigation guessing.
**Action:** Always interpolate the entity identifier (e.g., `aria-label={`Start ${prob.title}`}`) in mapped icon actions and apply `focus-visible:ring-2 outline-none` in Tailwind.
