# User Roles & System Permissions

DBC defines four roles, implemented in database structures and enforced by both frontend route guards and backend middlewares.

## 1. Customer (`ROLE_CUSTOMER`)
* **Purpose:** Property owners looking to hire construction services.
* **Redirection after Login:** Public Homepage (`/`).
* **Capabilities:** Submit project requirements, send private requests to professionals, chat, review proposals, approve project milestones, buy subscription passes.

## 2. Professional / Trade Partner (`ROLE_PROVIDER`)
* **Purpose:** Contractors, builders, and designers providing services.
* **Redirection after Login:** Professional Workspace (`/workspace/dashboard`).
* **Capabilities:** Receive direct requests, browse marketplace leads, submit quotes, update active project progress, update calendar availability.

## 3. Consultant (`ROLE_PROVIDER` with Consultation flag)
* **Purpose:** Advisory professionals (Architects, Vastu Consultants, Structural Engineers).
* **Redirection after Login:** Consultant Workspace (`/workspace/dashboard`).
* **Capabilities:** Set consultation fees, manage availability blocks, conduct consultation calls.

## 4. Admin (`ROLE_ADMIN`)
* **Purpose:** Platform operators.
* **Redirection after Login:** Admin Dashboard (`/admin/dashboard`).
* **Capabilities:** Verify professional profiles, manage service categories, view financial analytics, hide/restore user reviews.
