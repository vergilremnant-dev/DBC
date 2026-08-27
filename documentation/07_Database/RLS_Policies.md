# Row-Level Security (RLS) Policies

*   **Current Status:** *Planned — not currently implemented.*
*   **Context:** The current system connects directly to PostgreSQL using standard Prisma Client database authorization credentials. Access boundaries are enforced programmatically in the Express backend services layer rather than at the database engine level via RLS policies.
