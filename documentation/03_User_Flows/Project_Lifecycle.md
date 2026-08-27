# DBC Project Lifecycle & Transitions

This document maps how requests and requirements transition through execution states.

## 1. Direct Project Request (`Booking`)
* Controlled by: Customer & Assigned Professional.

```text
[REQUESTED]  -- (Professional Accepts) --> [ACCEPTED]
[REQUESTED]  -- (Professional Declines) --> [REJECTED]
[ACCEPTED]   -- (Professional Starts)   --> [IN_PROGRESS]
[IN_PROGRESS]-- (Professional Completes)--> [COMPLETED]
[REQUESTED/ACCEPTED] -- (Customer Cancels) --> [CANCELLED]
```

---

## 2. Public Requirement Matching Lifecycle
* Controlled by: Customer & Multiple Bidding Professionals.

```text
[DRAFT] ➔ [SUBMITTED] ➔ [PUBLISHED]
                          ↓
                 [QUOTATION_RECEIVED] (Proposals sent)
                          ↓
                 [QUOTATION_ACCEPTED] (Customer selects proposal)
                          ↓
                 [ASSIGNED] ➔ [IN_PROGRESS] ➔ [COMPLETED]
```
