## 2024-05-24 - Dynamic Context in List Management Buttons
**Learning:** Icon-only delete buttons in mapped lists (like blackout dates or events) are ambiguous to screen readers if they all share the same generic `aria-label="Remove"`. Also, disabled "Add" buttons cause frustration without a hover tooltip explaining what fields are missing.
**Action:** Always interpolate loop variables into `aria-label`s for list item actions (e.g., `aria-label={\`Remove event: \${event.title}\`}`) to provide context. Add conditional `title` attributes to disabled buttons to explain the required state.
