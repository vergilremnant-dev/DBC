# Navigation Architecture

DesignBuildConnect uses a role-based, viewport-responsive navigation architecture.

## 1. Top Navbar Header (`Navbar.tsx`)
*   **Sticky Header:** Standard height of `78px` (`72px` on scroll) with translucent blur backdrop (`backdrop-blur-md`).
*   **Branding Logo:** Points back to the marketplace root (`/`).
*   **Role-Aware Items:**
    *   *Guest:* Find Services, Browse Professionals, Subscriptions, About, Blog.
    *   *Customer:* Marketplace, Dashboard (`/workspace/overview`), Subscription.
    *   *Provider:* Marketplace, Dashboard (`/workspace/dashboard`), Subscription.
    *   *Admin:* Marketplace, Dashboard (`/admin/dashboard`), Subscription.
*   **Avatar Menu (`ProfileMenu.tsx`):** Quick portal to workspace links, Profile Settings, and logout trigger.

## 2. Workspace Sidebar Menu (`WorkspaceLayout.tsx`)
*   Provides left-side layout actions inside authenticated panels.
*   *Customer navigation:* Overview, Requests, Requirements, Inbox, Settings.
*   *Provider navigation:* Dashboard, Project Requests, Leads, Projects, Quotations, Inbox, Finance, Settings.
