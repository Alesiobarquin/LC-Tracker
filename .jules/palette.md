## 2024-06-13 - Add Accessible Attributes to Icon Buttons
**Learning:** Missing aria-labels, titles, and focus-visible outlines on icon-only buttons severely degrade screen reader and keyboard navigation experiences.
**Action:** Always add `aria-label` for screen readers, `title` for hover tooltips, and `focus-visible:outline-none focus-visible:ring-2` with an appropriate ring color for keyboard focus.
