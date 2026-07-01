## 2024-06-26 - Add Context-Aware ARIA to Mapped Form Lists
**Learning:** Icon-only remove buttons in dynamic lists (like target events) need context-aware `aria-label`s incorporating list item properties (e.g., event.title) so screen reader users know exactly which item they are removing.
**Action:** Always map loop variables into template literal `aria-label`s and tooltips for icon-only action buttons within `.map()` iterators.
