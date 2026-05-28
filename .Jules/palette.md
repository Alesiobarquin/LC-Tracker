## 2024-04-07 - Keyboard Accessibility for Styled File Inputs
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the keyboard focus order, making custom styled file inputs inaccessible to keyboard users.
**Action:** Always use `className="sr-only peer"` on the input and add `peer-focus-visible` styles to its associated `<label>` to maintain keyboard navigation and visual focus indication.
## 2024-05-18 - Context-Aware ARIA labels in Mapped Lists
**Learning:** Adding static `aria-label`s to interactive elements within mapped lists (like problem rows in a dashboard) creates a poor screen reader experience where every button announces the same text.
**Action:** Always interpolate unique context, such as the item's title or ID (e.g., \`aria-label={\`View \${prob.title} on LeetCode\`}\`), into ARIA labels within loops to ensure distinct and meaningful announcements for screen reader users.
