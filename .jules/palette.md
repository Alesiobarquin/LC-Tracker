## 2024-06-06 - Interactive icon-only buttons need aria-labels and focus indicators
**Learning:** Found multiple instances of icon-only buttons (like `X` to close) lacking explicit `aria-label` attributes and keyboard focus indicators, which makes the UI inaccessible to screen reader users and keyboard navigators.
**Action:** Consistently added `aria-label` providing context and `focus-visible:ring-2 outline-none` classes to these buttons to improve accessibility across the application.
