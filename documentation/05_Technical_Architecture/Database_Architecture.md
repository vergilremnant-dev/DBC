# Database Architecture

DBC uses PostgreSQL as its primary database.

## Database Connectivity & ORM
*   **ORM:** Prisma ORM is used to query the database.
*   **Schema:** Defined in `prisma/schema.prisma`.
*   **Prisma Client:** Automatically compiled to `node_modules/@prisma/client` during build scripts.
*   **Migrations:** Managed via standard Prisma migrate commands.
