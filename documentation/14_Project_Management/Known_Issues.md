# Known Issues & Workarounds

Information on resolved/ignored console logs.

## 1. Browser Extension Warnings
*   **Warning:** `Unchecked runtime.lastError: Could not establish connection...`
*   **Cause:** Caused by browser extensions (e.g. ad blockers) interrupting script injections.
*   **Workaround:** Can be safely ignored. Disabling extension permissions or using Incognito mode resolves the console warning.

## 2. Service Worker Fetch Handling
*   **Warning:** `TypeError: Failed to convert value to 'Response'`
*   **Fix:** Resolved in `sw.js` by re-throwing network errors or serving the cached `index.html` rather than returning `undefined`.
