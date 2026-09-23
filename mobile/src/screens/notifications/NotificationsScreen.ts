import { mobileNotificationService } from '../../services/mobileNotificationService.js';
import { mobileDeepLinkService } from '../../services/mobileDeepLinkService.js';
import type { MobileNotification, MobileNotificationTarget } from '../../types/mobileNotificationTypes.js';

export interface NotificationsScreenProps {
  userRole?: 'customer' | 'contractor' | 'admin';
  onNavigateTarget?: (target: MobileNotificationTarget) => void;
  onBack?: () => void;
}

export class NotificationsScreenController {
  private props: NotificationsScreenProps;
  private state: {
    notifications: MobileNotification[];
    isLoading: boolean;
    activeCategory: string;
    error: string | null;
    statusMessage: string | null;
  };

  constructor(props: NotificationsScreenProps) {
    this.props = props;
    this.state = {
      notifications: [],
      isLoading: true,
      activeCategory: 'ALL',
      error: null,
      statusMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadNotifications();
  }

  async loadNotifications(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const items = await mobileNotificationService.getNotifications(this.props.userRole || 'customer');
      this.state.notifications = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load notifications';
    } finally {
      this.state.isLoading = false;
    }
  }

  setCategoryFilter(category: string): void {
    this.state.activeCategory = category;
  }

  async markRead(id: string): Promise<void> {
    try {
      await mobileNotificationService.markNotificationRead(id, this.props.userRole);
      const items = this.state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      this.state.notifications = items;
    } catch {
      // Non-blocking fallback
    }
  }

  async markAllRead(): Promise<void> {
    try {
      await mobileNotificationService.markAllNotificationsRead(this.props.userRole);
      const items = this.state.notifications.map((n) => ({ ...n, isRead: true }));
      this.state.notifications = items;
      this.state.statusMessage = 'All notifications marked as read.';
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
    }
  }

  async handleNotificationTap(notification: MobileNotification): Promise<MobileNotificationTarget> {
    await this.markRead(notification.id);

    const resolved = mobileDeepLinkService.resolveNotificationTarget(
      notification,
      this.props.userRole
    );

    if (this.props.onNavigateTarget) {
      this.props.onNavigateTarget(resolved);
    }

    return resolved;
  }

  getFilteredNotifications(): MobileNotification[] {
    const { notifications, activeCategory } = this.state;
    if (activeCategory === 'UNREAD') {
      return notifications.filter((n) => !n.isRead);
    }
    if (activeCategory === 'PROJECTS') {
      return notifications.filter(
        (n) =>
          n.type.includes('PROJECT') ||
          n.type.includes('MILESTONE') ||
          (n.category && n.category.toLowerCase().includes('booking'))
      );
    }
    if (activeCategory === 'MESSAGES') {
      return notifications.filter(
        (n) =>
          n.type.includes('MESSAGE') ||
          (n.category && n.category.toLowerCase().includes('message'))
      );
    }
    if (activeCategory === 'PAYMENTS') {
      return notifications.filter(
        (n) =>
          n.type.includes('PAYMENT') ||
          n.type.includes('EARNING') ||
          (n.category && n.category.toLowerCase().includes('payment'))
      );
    }
    return notifications;
  }

  getState() {
    return { ...this.state };
  }
}

export function renderNotificationsScreen(
  controller: NotificationsScreenController,
  onNavigateTarget?: (target: MobileNotificationTarget) => void,
  onBack?: () => void
): string {
  const { isLoading, activeCategory, error, statusMessage } = controller.getState();
  const filteredList = controller.getFilteredNotifications();
  const unreadCount = controller.getState().notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Notifications...</p>
      </div>
    `;
  }

  return `
    <div class="mobile-container p-4 space-y-4 select-none pb-24">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          ${
            onBack
              ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
              : ''
          }
          <div>
            <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Updates & Activity</span>
            <h1 class="text-base font-bold text-stone-900 font-serif">
              Notifications ${unreadCount > 0 ? `<span class="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-mono font-bold">${unreadCount} New</span>` : ''}
            </h1>
          </div>
        </div>

        ${
          unreadCount > 0
            ? `<button
                onclick="controller.markAllRead()"
                class="min-h-[44px] px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition border border-stone-200 shrink-0"
              >
                Mark All Read
              </button>`
            : ''
        }
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        ${['ALL', 'UNREAD', 'PROJECTS', 'MESSAGES', 'PAYMENTS']
          .map(
            (cat) => `
          <button
            onclick="controller.setCategoryFilter('${cat}')"
            class="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
              activeCategory === cat
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }"
          >
            ${cat}
          </button>
        `
          )
          .join('')}
      </div>

      ${
        error
          ? `
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-center">
          <p class="text-xs font-bold text-rose-800">${error}</p>
          <button
            onclick="controller.loadNotifications()"
            class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs"
          >
            Retry
          </button>
        </div>
      `
          : ''
      }

      ${
        statusMessage
          ? `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          ${statusMessage}
        </div>
      `
          : ''
      }

      <!-- Notifications List -->
      ${
        filteredList.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">🔔</span>
          <p class="text-xs font-bold text-stone-800">You're all caught up.</p>
          <p class="text-[11px] text-stone-500 font-medium">No new notifications in this category.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${filteredList
            .map(
              (n) => `
            <div
              onclick="controller.handleNotificationTap(${JSON.stringify(n).replace(/"/g, '&quot;')})"
              class="p-4 bg-white rounded-2xl space-y-2 shadow-sm border transition cursor-pointer hover:border-emerald-400 ${
                !n.isRead
                  ? 'border-l-4 border-l-emerald-600 border-t-stone-200 border-r-stone-200 border-b-stone-200 bg-emerald-50/20'
                  : 'border-stone-200'
              }"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  ${
                    !n.isRead
                      ? `<span class="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 inline-block"></span>`
                      : `<span class="w-2.5 h-2.5 rounded-full bg-stone-300 shrink-0 inline-block"></span>`
                  }
                  <h4 class="text-xs font-black text-stone-900">${n.title}</h4>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  ${
                    !n.isRead
                      ? `<span class="dbc-badge bg-rose-100 text-rose-800 border-rose-200 text-[7.5px] font-bold uppercase">UNREAD</span>`
                      : `<span class="dbc-badge bg-stone-100 text-stone-600 border-stone-200 text-[7.5px] font-bold uppercase">READ</span>`
                  }
                </div>
              </div>

              <p class="text-xs text-stone-600 font-medium line-clamp-2 pl-4">${n.message}</p>

              <div class="flex items-center justify-between text-[10px] text-stone-400 font-medium pt-2 border-t border-stone-100 pl-4">
                <span>${n.createdAt}</span>
                <span class="text-emerald-800 font-bold flex items-center gap-1">
                  ${n.actionLabel || 'View Details'} →
                </span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `
      }
    </div>
  `;
}
