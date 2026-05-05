## 2026-04-09 - Missing rel="noopener noreferrer" on target="_blank" links
**Vulnerability:** Missing `rel="noopener noreferrer"` on links that open in a new tab (`target="_blank"`), specifically using only `rel="noreferrer"` or nothing at all.
**Learning:** Even though modern browsers treat `target="_blank"` as `rel="noopener"` by default, explicitly defining it is crucial for defense-in-depth, support for older browsers, and passing security audits.
**Prevention:** Always include `rel="noopener noreferrer"` when using `target="_blank"`. Use linting rules (like `react/jsx-no-target-blank`) to catch these issues automatically.

## 2026-04-05 - Fix XSS vulnerability in Admin Dashboard image links
**Vulnerability:** The Admin Dashboard rendered user-provided `image_url` directly as an `href` inside an `<a>` tag without proper sanitization.
**Learning:** Even though feedback images are uploaded to Supabase and return valid URLs, an attacker could manually insert a payload like `javascript:alert(1)` into the database or API. Untrusted URLs must always be validated on the client side before rendering in anchor tags.
**Prevention:** Always check if a user-provided URL starts with `http://` or `https://` before rendering it as an `href`.

## 2024-03-24 - Stack Trace Leakage in AdminDashboard and FeedbackModal
**Vulnerability:** UI and console error handling leaked raw error objects which can contain database details or stack traces on fetch errors.
**Learning:** Default error handlers used `error.message` directly in the UI state or passed `error` to `console.error` which is an information disclosure risk.
**Prevention:** Always use generic fallback strings for client-facing errors and log messages, avoiding the direct assignment of raw error objects to frontend state.

## 2026-04-10 - Fix XSS vulnerability in Admin Dashboard image links
**Vulnerability:** The Admin Dashboard rendered user-provided `image_url` directly as an `href` inside an `<a>` tag and `src` inside an `<img>` tag without centralized proper sanitization.
**Learning:** Even though feedback images are uploaded to Supabase and return valid URLs, an attacker could manually insert a payload like `javascript:alert(1)` into the database or API. Relying on inline `try/catch` block for URLs does not securely prevent DOM injection and lacks centralized enforcement.
**Prevention:** Always use a centralized utility function (like `sanitizeUrl`) to check if a user-provided URL starts with `http://`, `https://`, or `/` before rendering it as an `href` or `src`.
