# Professional/Contractor Workspace Flow

This document maps the workflow of a registered trade professional.

```mermaid
graph TD
  A[Login] --> B[Provider Dashboard /workspace/dashboard]
  B --> C{Review Incoming Opportunities}
  C -->|Private Request| D[Accept / Reject Request]
  C -->|Public Lead| E[Browse Marketplace Leads]
  E --> F[Submit Cost Quotation]
  D -->|Accepted| G[Start Project -> Milestone Logs]
  F -->|Customer Accepts| G
  G --> H[Complete Project Milestones]
```

## Action Center
* **Accept / Reject:** Can only transition direct requests when status is `REQUESTED`.
* **Start / Complete:** Professional updates project execution status directly.
