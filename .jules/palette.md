## 2024-06-30 - Context-Aware ARIA Labels for Mapped Lists
**Learning:** When generating interactive elements in mapped lists (like problem lists), generic ARIA labels like "Open LeetCode" become redundant and ambiguous for screen reader users trying to navigate the list.
**Action:** Always inject loop variables into `aria-label` attributes (e.g., `aria-label={\`Open \${prob.title} on LeetCode\`}`) to ensure every action button has a unique and descriptive accessible name.
