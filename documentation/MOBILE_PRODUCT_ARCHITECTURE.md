# DBC Native Mobile Application Product Architecture & User Flow Specification

## 1. Executive Summary

This document defines the product architecture, Information Architecture (IA), role-scoped navigation stacks, user journeys, and native device capabilities integration for the future **DBC Android + iOS mobile application**.

The specification translates the completed DBC Phase 1 application, Module 29 readiness audit, and Module 30 REST API contracts into a native mobile UX framework.

---

## 2. Role-Scoped Mobile Architecture

The native mobile application enforces strict separation between the primary system roles:

```text
                               DBC Mobile App Core
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
      Customer Shell             Professional Shell           Admin Console
   (Discovery & Projects)     (Console, Leads, Quotes)   (Moderation & Analytics)
```

---

## 3. Customer Mobile Information Architecture

### Navigation Pattern: 5-Tab Bottom Navigation Bar

```text
┌───────────────┬───────────────┬───────────────┬───────────────┬───────────────┐
│     Home      │   Requests    │   Projects    │   Messages    │    Account    │
│      🏠       │      📋       │      🏗️       │      💬       │      👤       │
└───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
```

#### Tab 1: Home (Discovery & Search)
- **Top Bar**: Location Selector dropdown (`City`), Search bar input (`🔍`).
- **Hero Banner**: "Design. Build. Connect." carousel & Project Assistant CTA.
- **Service Categories Grid**: Civil Masonry, Plumbing, Electrical, Architecture, Interior Design, Painting, Carpentry.
- **Featured Professionals**: Verified provider cards with rating, location, and `Discuss Project` CTA.
- **Curated Projects**: Showcase of completed architectural & interior design projects.

#### Tab 2: Requests (Inbound & Submitted Direct Requests)
- **Header**: Active requests count & status filter tabs (`All`, `Submitted`, `Under Review`, `Accepted`).
- **Request Cards**: Service category, professional name, status badge, scheduled date, and target budget.
- **Details Modal / Screen**: Full scope notes, address, professional credentials, and `Cancel Request` action.

#### Tab 3: Projects (Active Project Execution Workspaces)
- **Projects List**: Active projects with completion progress bar (e.g. `60%`), current stage, and budget spent.
- **Project Workspace Screen**:
  - **Tabs Bar**: `Overview`, `Milestones`, `Documents`, `Timeline`, `Financials`, `Handover`, `Warranty`.
  - **Milestone Cards**: Milestone title, completion status, target date, and `Release Funds` trigger.
  - **Documents List**: Architectural blueprints, contracts, invoices with native download/preview.

#### Tab 4: Messages (Chat Threads & Communication)
- **Thread List**: Conversation list with provider avatar, unread indicator, and last message preview.
- **Active Chat Screen**: Real-time message feed, attachment download links, voice coordinator trigger (`📞 Call`), and sticky message input composer.

#### Tab 5: Account (Profile, Settings & Payments)
- **Profile Header**: Customer name, email, phone number, completion badge.
- **Menu List**:
  - `Payment History & Receipts`
  - `Saved Bookmarks / Favorites`
  - `Notification Preferences`
  - `Subscriptions / Premium Membership`
  - `Help & Customer Support`
  - `Logout`

---

## 4. Professional Mobile Information Architecture

### Navigation Pattern: 5-Tab Bottom Navigation Bar

```text
┌───────────────┬───────────────┬───────────────┬───────────────┬───────────────┐
│    Console    │     Leads     │    Quotes     │   Projects    │   Earnings    │
│      📊       │      ⚡       │      📄       │      🏗️       │      💳       │
└───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
```

#### Tab 1: Console (Operational Dashboard)
- **Header**: Provider business name, status toggle (`Available` 🟢 | `Busy` 🟡 | `Off-duty` 🔴).
- **KPI Metrics Grid**: Active Projects (`4`), Available Leads (`18`), Pending Quotes (`2`), Completed (`42`).
- **Action Required Banner**: Inbound request alerts, pending milestone updates.
- **Today's Schedule**: Site visits, coordination calls, procurement deadlines.

#### Tab 2: Leads (Marketplace Requirement Opportunities)
- **Filters Bar**: Service category dropdown, collar filter (`White Collar` vs `Blue Collar`), budget range.
- **Lead Cards**: Requirement title, category badge, location, budget range, posted time, and `Express Interest` button.

#### Tab 3: Quotes & Requests (Inbound Requests & Proposals)
- **Segmented Control**: `Direct Requests` | `Quotation Proposals`.
- **Direct Requests List**: Customer request cards with `Accept`, `Decline`, and `Contact Customer` actions.
- **Quotation Management Screen**: Create/edit proposal, itemized pricing lines, milestone schedule, exclusions, and `Submit Proposal` trigger.

#### Tab 4: Projects (Active Project Execution)
- **Projects List**: Assigned projects with milestone completion progress.
- **Project Execution Screen**:
  - `Add Milestone` / `Update Progress` triggers.
  - `Upload Document` trigger (Native camera / file picker).
  - `Mark Project Completed` & Handover checklist.

#### Tab 5: Earnings (Finance & Account Settings)
- **Financial Ledger**: Total project earnings, pending escrow payouts, transaction history.
- **Profile Settings**: Trade specializations, portfolio gallery manager, availability settings, subscription tier.

---

## 5. End-to-End User Journeys

### Journey A: Customer Project Discovery to Milestone Handover

```text
  1. Discovery              2. Direct Request            3. Auth Challenge
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Home Tab / Search│ ────> │ Book Service Page│ ────> │ Sign In / Reg    │
└──────────────────┘       └──────────────────┘       └──────────────────┘
                                                               │
                                                               ▼
  6. Project Closure        5. Milestone Payment         4. Quote Review
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Review & Rating  │ <──── │ Escrow Release   │ <──── │ Accept Proposal  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### Journey B: Professional Lead to Payout Execution

```text
  1. Lead Alert             2. Submit Quote              3. Request Accept
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Leads Tab        │ ────> │ Quotation Screen │ ────> │ Direct Request   │
└──────────────────┘       └──────────────────┘       └──────────────────┘
                                                               │
                                                               ▼
  6. Payout Release         5. Handover Signoff          4. Milestone Update
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Finance Ledger   │ <──── │ Completion Check │ <──── │ Add Milestones   │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

---

## 6. Native Device Capabilities Integration Plan

1. **Push Notifications (FCM / APNs)**:
   - Request status updates (Accepted / Declined).
   - Proposal submission & customer acceptance notifications.
   - Milestone payment release alerts.
   - New chat message notifications.
2. **Native Camera & Gallery Access**:
   - Site inspection photography.
   - Progress verification photo uploads.
   - Blueprint & contract document scanning.
3. **Native File & Document Picker**:
   - Upload PDF drawings, CAD files, and invoices.
   - Save downloaded contracts to device filesystem.
4. **Biometric Authentication (TouchID / FaceID)**:
   - Secure one-touch login for returning customers & specialists.
5. **Deep Linking (App Links / Universal Links)**:
   - Direct link opening for `dbc://project/:id`, `dbc://quotation/:id`, `dbc://chat/:threadId`.

---

## 7. Architectural Alignment & Status

The proposed mobile application structure aligns 100% with existing DBC REST API endpoints (`/api/auth`, `/api/bookings`, `/api/quotations`, `/api/projects`, `/api/chat`).

**STATUS: READY FOR PHASE 2 MOBILE APPLICATION PLANNING**
