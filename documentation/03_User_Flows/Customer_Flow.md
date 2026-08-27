# Customer Journey Flow

This document maps the customer interaction stages on the DBC platform.

```mermaid
graph TD
  A[Browse Homepage] --> B[Discover Services / Professionals]
  B --> C[Submit Private Request / Public Requirement]
  C --> D[Authentication Challenge / Toggle Register]
  D --> E[OTP Verification UI]
  E --> F[Redirect to Homepage with Auth Session]
  F --> G[Customer Workspace Dashboard]
  G --> H[Track Request, Chat, and Review Quotes]
  H --> I[Accept Quote -> Active Project Milestone Track]
```

## Key Highlights
* **Login Redirection:** On successful authentication, the customer lands back on the public homepage (`/`) with their session active so they can continue browsing.
* **Workspace Access:** Customers enter their workspace by clicking "Dashboard" (`/workspace/overview`) in the navbar.
