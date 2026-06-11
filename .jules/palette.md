## 2024-06-11 - Loop-aware ARIA labels and Focus states
**Learning:** Repetitive icon-only buttons in mapped lists (like tables or grid lists) need context-aware `aria-label`s (e.g. incorporating `${item.title}`) to avoid screen reader ambiguity. They also need clear keyboard focus states (`focus-visible:ring-2`) for accessibility.
**Action:** Always include item-specific context in `aria-label`s and `title`s for mapped icon-only buttons, and pair them with `focus-visible:ring-2 outline-none`.
