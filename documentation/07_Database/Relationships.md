# Entity Relationships Reference

This document maps relationships between primary database entities.

## 1. Opportunity to Project Relationship

```text
[ Customer Profile ]
        │
        ├── 1:N ──> [ Booking (Private Project Request) ]
        │
        └── 1:N ──> [ Requirement (Public Marketplace Lead) ]
                         │
                         └── 1:N ──> [ Quotation (Bids) ] ── 1:1 ──> [ Project ]
```

## 2. Messaging & Chats Relationships
*   `Conversation` belongs to either a `Booking` or a `Requirement` / `Project`.
*   `Message` records belong to a `Conversation` thread, containing a `senderId` linked to the `User` table.
