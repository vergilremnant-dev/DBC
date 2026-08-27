# Release Checklist

Verify compliance checks before merging features to `main`.

- [ ] All TypeScript types compile cleanly (`npx tsc -b`).
- [ ] Frontend and backend tests pass successfully (`npx vitest run`).
- [ ] Production build succeeds without errors (`npm run build`).
- [ ] No local environment secrets are committed in source code files.
