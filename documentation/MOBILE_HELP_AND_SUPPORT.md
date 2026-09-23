# Module 48 — Mobile Help, Support & Issue Resolution

## Executive Summary
Module 48 introduces a complete **Mobile Help, Support & Issue Resolution** experience for the DBC Mobile Application across Customer, Professional (Contractor), and Admin roles. Built on top of Modules 33–47, this module delivers an intuitive, touch-friendly knowledge center, searchable FAQs with deep-link navigation shortcuts, a direct contact support request form with attachment upload capability, and local support ticket tracking.

The implementation strictly honors existing backend integration boundaries: zero backend schema or database modifications were made, support requests leverage existing support channels (`support@dbc.com`), and file attachments reuse existing profile upload infrastructure (`profileService.uploadImage`).

---

## Architecture & Mental Model

```
                    ┌─────────────────────────────────────────┐
                    │          Mobile Profile / Settings      │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │         Help & Support Center           │
                    │        (Role-Aware Topics Hub)          │
                    └────────────┬──────────────────┬─────────┘
                                 │                  │
            ┌────────────────────┴───┐          ┌───┴────────────────────┐
            ▼                        │          │                        ▼
 ┌──────────────────────┐            │          │             ┌──────────────────────┐
 │ Knowledge Base & FAQs│            │          │             │ Contact Support Form │
 │  (Searchable Accord) │            │          │             │ (Subject, ID, Photo) │
 └──────────┬───────────┘            │          │             └──────────┬───────────┘
            │                        │          │                        │
            ▼                        │          │                        ▼
 ┌──────────────────────┐            │          │             ┌──────────────────────┐
 │ DBC Feature Shortcut │◄───────────┘          └────────────►│ Support Issue Record │
 │(Deep Link Navigation)│                                     │  (Ticket ID & Notes) │
 └──────────────────────┘                                     └──────────────────────┘
```

---

## Key Components Implemented

### 1. Types & Data Structures (`mobile/src/types/mobileSupportTypes.ts`)
- **`MobileHelpTopic`**: Category definitions (`id`, `title`, `description`, `icon`, `allowedRoles`).
- **`MobileFaqItem`**: Accordion FAQ entries with optional `relatedRoute` and `relatedParams` for deep-linking into DBC workflows.
- **`MobileSupportRequest` & `MobileSupportIssue`**: Ticket structure with auto-generated ticket IDs (`SUP-XXXXXX`), category classification, attachment URL, user email/role snapshot, and platform response note.

### 2. Service Layer (`mobile/src/services/mobileSupportService.ts`)
- **Role-Aware Help Topics**: Filters topics dynamically based on user role (`customer`, `contractor`, `admin`).
- **Searchable FAQ Registry**: Supports keyword text filtering across questions, answers, and category labels.
- **Support Ticket Creation**: Formats structured support requests, dispatches email notes referencing `BRAND.supportEmail` (`support@dbc.com`), and stores issue instances locally.
- **Attachment Storage**: Integrates with `profileService.uploadImage(base64Data, 'support')` for screenshot attachments.

### 3. Screen Views & Controllers
- **Help Center (`mobile/src/screens/support/HelpCenterScreen.ts`)**: Role-aware hub displaying search bar, quick action cards (Browse FAQs, Contact Support), and topic grid.
- **FAQ Center (`mobile/src/screens/support/FAQScreen.ts`)**: Searchable FAQ experience with category badges, interactive accordion toggles, and feature deep-link action buttons.
- **Contact Support (`mobile/src/screens/support/ContactSupportScreen.ts`)**: Support request form with issue category tabs, subject input, project/request ID linkage, photo attachment upload trigger, and immediate confirmation modal.
- **Support Issue Details (`mobile/src/screens/support/SupportIssueDetailsScreen.ts`)**: Detailed ticket inspector displaying ticket metadata, issue breakdown, and support response notes.

### 4. Navigation Integration (`mobile/src/navigation/rootNavigation.ts`)
- Added `HelpCenter`, `FAQ`, `ContactSupport`, and `SupportIssueDetails` to `RootStackParamList`.
- Integrated "Help & Support Center" shortcuts into `MobileProfileScreen.ts` and `AccountSettingsScreen.ts`.

---

## Role-Based Coverage Matrix

| Feature / Topic | Customer | Professional (Contractor) | Platform Admin |
| :--- | :---: | :---: | :---: |
| **Project Requests & Specifications** | ✓ | ✓ | ✓ |
| **Quotations & Proposals** | ✓ | ✓ | ✓ |
| **Projects & Milestone Escrow** | ✓ | ✓ | ✓ |
| **Payments & Payouts** | ✓ | ✓ | — |
| **Messages & Project Communication** | ✓ | ✓ | — |
| **Open Market Leads** | — | ✓ | — |
| **Trade Partner Credentials** | — | — | ✓ |
| **Platform Operations** | — | — | ✓ |

---

## Verification & Testing
- **Unit Tests**: 13 unit tests created in `tests/frontend/mobile_support.test.ts` covering topic retrieval, FAQ search, ticket creation, photo upload, accordion toggling, form validation, and issue detail rendering.
- **Suite Verification**: All 20 mobile test suites (199 total tests) passed cleanly.
- **TypeScript**: `npx tsc -b` completed with zero errors.
- **Build**: `npx vite build` generated clean production assets.
