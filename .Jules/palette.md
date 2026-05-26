## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.

## 2024-05-26 - Interactive Icon-only Buttons Requires Explicit Focus Outline
**Learning:** Dismiss buttons or smaller icon-only actions often rely solely on hover states for interaction cues. If not explicitly styled with `focus-visible`, keyboard users miss crucial visual feedback for their current location.
**Action:** When adding `aria-label` to icon-only buttons, concurrently apply `focus-visible:ring-2` combined with an appropriate theme color (e.g., `focus-visible:ring-zinc-400` or `emerald-500`) and `outline-none` to guarantee comprehensive accessibility (both semantic and navigational).
