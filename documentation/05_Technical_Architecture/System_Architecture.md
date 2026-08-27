# System Architecture

DesignBuildConnect is deployed as a single-repository monorepo hosted on Vercel.

```text
[ Client Web Browser ]
        │ (React App, Vite dev port 5173 / Production dist assets)
        ▼
[ Vercel CDN / Serverless Layer ]
        │ (vercel.json routes rewrites /api/:path* to /api/index.ts)
        ▼
[ Express Router (api-lib/app.ts) ]
        │ (Route controllers parsing req and res adaptors)
        ▼
[ Services Layer (api-lib/services/) ]
        │ (Transaction engines, security rules validation)
        ▼
[ Prisma Client (schema.prisma) ]
        │ (Type-safe querying)
        ▼
[ PostgreSQL Database ]
```
