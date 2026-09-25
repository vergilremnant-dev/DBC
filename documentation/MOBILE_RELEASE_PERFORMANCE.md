# DBC Mobile Application — Release Performance & Bundle Metrics

> [!NOTE]
> This document details factual performance metrics, production bundle asset distribution, code splitting strategy, compression, and caching rules for the DBC Mobile Application production build.

---

## 1. Production Bundle Size Summary

* **Build Command**: `npx vite build`
* **Target Environment**: Production Client Build
* **Total Transformed Modules**: 320 modules
* **Build Time**: ~1.9 seconds

| Asset Category | Production File | Uncompressed Size | Gzip Compressed Size | Optimization Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **HTML Entry Point** | `dist/index.html` | 1.94 kB | 0.83 kB | Minified HTML |
| **Global Stylesheet** | `dist/assets/index-CPzpf2pu.css` | 134.12 kB | 20.47 kB | Tailwind CSS purge & CSS minification |
| **Vendor Library Chunk** | `dist/assets/vendor-DYMagUuo.js` | 424.79 kB | 135.30 kB | Code splitting (React, Lucide, Axios, Zustand) |
| **Main Application Entry** | `dist/assets/index-DBeQ4Gh8.js` | 831.87 kB | 154.02 kB | Tree-shaken JS bundle |
| **Dynamic Workspace Chunks**| `dist/assets/Workspace*.js` | ~25–59 kB each | ~6–11 kB each | Lazy dynamic route loading |

---

## 2. PWA Caching & Compression Architecture

1. **Service Worker Cache Strategy**:
   - Static assets (HTML, CSS, JS, fonts, icons) cached with Cache-First strategy for instant load.
   - API network requests (`/api/*`) are strictly **excluded** from service worker cache to ensure zero stale financial data or authorization breaches.
2. **Code Splitting & Lazy Route Imports**: Workspace screens (`WorkspaceOverview`, `WorkspaceBookings`, `WorkspaceInbox`, `ProfessionalDashboard`) are lazily loaded on demand via Vite dynamic imports, keeping initial bundle execution lightweight.
3. **Gzip / Brotli Compression**: Total transfer size for cold initial load is **~315 kB Gzipped**, ensuring sub-2-second interactive load times on standard mobile 3G/4G networks.
