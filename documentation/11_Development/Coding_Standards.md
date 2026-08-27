# Coding Standards & Guidelines

DBC enforces coding rules to ensure code quality across the codebase.

## 1. TypeScript Strictness
*   Define explicit parameters and return interfaces. Avoid using `any` where possible.
*   Keep models, enums, and database types mapped directly from the Prisma schema client.

## 2. Component Structures
*   **Atomic UI:** Group reusable sub-components in `src/components/common/`.
*   **Clean CSS:** Use Tailwind utility classes for element layout, or standard class names defined in `src/index.css` (e.g. `dbc-btn-sm`).
