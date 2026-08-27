# Backend Architecture

The backend is built as an Express app running inside a Vercel Serverless Function adaptor.

## Execution Adaptor Flow
*   **Vercel Routing:** Standard requests matching `/api/:path*` are rewritten to `/api/index.ts`, which exports the Express app instance in `api-lib/app.ts`.
*   **Express Adaptor:** Uses a request adaptor (`adapt(handler)`) to translate standard Vercel serverless request/response formats into Express patterns, ensuring local dev servers and serverless deployments share code.
*   **Services Layer:** Standardizes data validations, state rules, and database operations.
