## 2026-04-10 - Missing URL Validation Pattern
**Vulnerability:** External URLs stored in the database or external objects (like problem URLs or feedback images) were not being sanitized before rendering into `href` or `src` attributes.
**Learning:** React prevents XSS in text nodes, but XSS via `javascript:` URIs in `href` and `src` attributes is still a risk if user data controls those URLs.
**Prevention:** Always use `isSafeUrl` to validate absolute URLs against safe protocols (`http:`, `https:`).
