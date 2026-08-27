# Technical Debt Inventory

Areas targeted for cleanup in future phases.

## 1. terminology Alignment in Database
*   **Debt:** The database schema uses `Booking` to represent a private project request.
*   **Goal:** Re-map schema names to align with user terms (`ProjectRequest`) once database migrations are authorized.

## 2. Shared Button component
*   **Debt:** Custom page layouts write Tailwind overrides alongside the standard `.dbc-btn` styling class.
*   **Goal:** Create a single, shared, reusable React Button component to clean up page code.
