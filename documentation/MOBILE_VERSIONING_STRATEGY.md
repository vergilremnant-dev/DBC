# DBC Mobile Application — Versioning & Release Strategy

> [!NOTE]
> This document specifies semantic versioning rules, build numbering strategy, and changelog management across Web/PWA, Android, and iOS deployment targets.

---

## 1. Versioning Scheme (SemVer)

The DBC Mobile Application follows **Semantic Versioning 2.0.0** formatted as `MAJOR.MINOR.PATCH`:

- **MAJOR**: Breaking platform architecture changes or major backend API version jumps (e.g. `1.0.0` $\rightarrow$ `2.0.0`).
- **MINOR**: New workflow features, screen additions, or module completions (e.g. `1.0.0` $\rightarrow$ `1.1.0`).
- **PATCH**: Bug fixes, performance tweaks, security hardening, or accessibility improvements (e.g. `1.0.0` $\rightarrow$ `1.0.1`).

---

## 2. Platform Versioning Breakdown

| Target Platform | Current Release Version | Build Identifier / Code | Auto-Increment Strategy |
| :--- | :--- | :--- | :--- |
| **Web / PWA Target** | `1.0.0` | Commit Hash (`7fbf6ee`) | Continuous integration deployment tag |
| **Android Target** | `1.0.0` (Proposed) | `versionCode = 1` | Auto-incremented integer per Play Console build (`1, 2, 3...`) |
| **iOS Target** | `1.0.0` (Proposed) | `CFBundleVersion = 1.0.0.1` | Auto-incremented build number per TestFlight upload |

---

## 3. Release Candidate Tagging & Changelog Policy

1. **Release Candidate Tag**: `v1.0.0-rc.1`
2. **Changelog Requirement**: Every production release candidate must include an updated `CHANGELOG.md` detailing:
   - Security hardening & privacy updates
   - Bug fixes & performance metrics
   - API contract changes
   - Known external dependencies
