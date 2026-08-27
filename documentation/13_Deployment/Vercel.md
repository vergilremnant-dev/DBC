# Vercel Configuration Reference

Deployment settings are governed by the `vercel.json` configuration in the root directory.

## Core Directives
*   **Framework mapping:** Uses Vite for building static assets.
*   **Serverless adaptor routing:**
    *   Rewrites all requests matching `/api/:path*` to the single serverless router at `/api/index`.
    *   Rewrites all client routing paths to `/index.html` to support Single-Page App (SPA) routes.
*   **Headers:** Configures standard headers (Access-Control-Allow-Origin, X-Frame-Options: DENY, etc.) to ensure API and workspace security.
