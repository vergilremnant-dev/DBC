# Deployment Architecture

DesignBuildConnect is set up for automatic Git-triggered deployments.

## Platforms
*   **Web Portal & APIs hosting:** [Vercel](https://vercel.com).
*   **Database hosting:** PostgreSQL database.
*   **Deployment Pipeline:** Pushing to `main` branch triggers automated Vercel builds, running the Vite compiler and bundling serverless routes.
