1. **Fix XSS Vulnerability via Centralized URL Sanitization**:
   - Create `src/utils/security.ts` to expose a `sanitizeUrl(url: string | undefined): string | undefined` function.
   - The function will enforce that the protocol is `http:` or `https:`. If it's a relative URL (starts with `/`), it will allow it. Otherwise, it will return `undefined`.

2. **Implement sanitization in `AdminDashboard.tsx`**:
   - In `src/components/AdminDashboard.tsx`, replace the inline `try { const url = new URL(...); ... }` block that attempts to sanitize `ticket.image_url`.
   - Import `sanitizeUrl` from `../utils/security.ts`.
   - Sanitize `ticket.image_url` for both the `href` on the `<a>` tag and the `src` on the `<img>` tag, using `sanitizeUrl`. If it returns undefined, fallback to `'#'` for `href` and `''` for `src` (or similar safe values).

3. **Verify the Fix**:
   - Run `npm run lint` and `npm run test` to verify no functionality is broken.
   - Run `cat` on `src/components/AdminDashboard.tsx` to verify the inline block is gone and `sanitizeUrl` is used.

4. **Complete Pre-commit Steps**:
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

5. **Submit PR**:
   - Create a PR with title "🛡️ Sentinel: [CRITICAL] Fix XSS vulnerability in Admin Dashboard image links" and provide description detailing the vulnerability, impact, and fix.
