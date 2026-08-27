# Decision Log

Historical log of architectural design choices.

## Dec 2025: In-Place Authentication Card
*   **Decision:** Maintain login/signup forms inside a single page card layout.
*   **Rationale:** Keeps the user's focus on the marketplace context and avoids complex redirect routing.

## Jan 2026: Vercel Serverless Express adaptor
*   **Decision:** Run Express behind Vercel serverless adapters.
*   **Rationale:** Lowers hosting costs by scaling to zero when inactive, while preserving local Express server setups for dev runtimes.
