## 2025-04-25 - Icon-only Button Accessibility
**Learning:** Icon-only buttons (like the `X` close buttons in floating indicators, modals, and banners) often lack `aria-label`s and `focus-visible` classes in this React app. This makes them invisible to screen readers and difficult to navigate via keyboard.
**Action:** When adding or reviewing icon-only buttons, always explicitly add an `aria-label` describing the action, and include Tailwind's `focus-visible:ring-2 outline-none` (with an appropriate ring color like `focus-visible:ring-emerald-500`) to ensure visible keyboard focus.
