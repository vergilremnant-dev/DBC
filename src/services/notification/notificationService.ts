export interface AppNotification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  category?: 'Requirements' | 'Bookings' | 'Messages' | 'Consultations' | 'Payments' | 'System' | 'Promotions';
  priority?: 'High' | 'Medium' | 'Low';
  description?: string;
  archived?: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

let currentRoleState = '';
let notificationList: AppNotification[] = [];
const listeners = new Set<() => void>();

function seedNotifications(role: string) {
  const normRole = (role || '').toUpperCase();
  currentRoleState = normRole;

  if (normRole.includes('ADMIN')) {
    notificationList = [
      { id: 'n1', title: 'New Provider Registered', content: 'Alice Architect has submitted verification documents.', createdAt: '5 mins ago', isRead: false, category: 'System', priority: 'High', description: 'Alice Architect registered a new design profile and uploaded COA certificates. Action is required to inspect credentials.', actionLabel: 'Verify Profile' },
      { id: 'n2', title: 'Callback Request Assigned', content: 'Customer request CB-CAT-7711 assigned to Ramesh Kumar.', createdAt: '1 hour ago', isRead: false, category: 'Consultations', priority: 'Medium', description: 'Callback ID CB-CAT-7711 has been successfully allocated to Dinesh Karthik.', actionLabel: 'View Request' },
      { id: 'n3', title: 'System Security Audit Completed', content: 'All firewall and permission logs checked.', createdAt: '1 day ago', isRead: true, category: 'System', priority: 'Low', description: 'Weekly system audit log completed with 0 errors.' }
    ];
  } else if (normRole.includes('CONTRACTOR') || normRole.includes('PROVIDER')) {
    notificationList = [
      { id: 'n1', title: 'New Booking Assigned', content: 'You have been assigned to BK-ELE-43927 by John Customer.', createdAt: '2 mins ago', isRead: false, category: 'Bookings', priority: 'High', description: 'A new booking (BK-ELE-43927) for electrical services has been scheduled by John Customer.', actionLabel: 'View Details' },
      { id: 'n2', title: 'Payment Success', content: '₹8,500 consultation payout has been deposited.', createdAt: '4 hours ago', isRead: false, category: 'Payments', priority: 'Medium', description: 'Payout reference TXN-998822 for false ceiling services has been deposited to your bank account.', actionLabel: 'View Payouts' },
      { id: 'n3', title: 'Review Posted', content: 'John Customer left a 5-star review for false ceiling.', createdAt: '2 days ago', isRead: true, category: 'System', priority: 'Low', description: 'Customer John left positive rating for your completed work.' }
    ];
  } else if (normRole.includes('ARCHITECT')) {
    notificationList = [
      { id: 'n1', title: 'New Design Inquiry', content: 'John Customer requested structural blueprints consultation.', createdAt: '10 mins ago', isRead: false, category: 'Consultations', priority: 'High', description: 'Customer John requested layout review for 3BHK flat.', actionLabel: 'View Details' },
      { id: 'n2', title: 'Portfolio Project Approved', content: 'PK Villa design approved by Admin.', createdAt: '6 hours ago', isRead: false, category: 'System', priority: 'Medium', description: 'Your submitted project images for PK Villa are approved.' }
    ];
  } else if (normRole.includes('WORKER')) {
    notificationList = [
      { id: 'n1', title: 'Assigned to New Site', content: 'Project coordinator added you to Madhapur site.', createdAt: '20 mins ago', isRead: false, category: 'Bookings', priority: 'High', description: 'Assigned to Madhapur site electrical plumbing execution layout.' },
      { id: 'n2', title: 'Timesheet Approved', content: 'Week 26 work hours approved by lead contractor.', createdAt: '1 day ago', isRead: true, category: 'Payments', priority: 'Low', description: 'Your timesheet layout approved.' }
    ];
  } else {
    // Default: Customer
    notificationList = [
      {
        id: 'n1',
        title: 'New Bid Proposals Available',
        content: 'Your request for plumbing in Madhapur has 3 new contractor bids.',
        createdAt: '5 mins ago',
        isRead: false,
        category: 'Requirements',
        priority: 'High',
        description: 'We analyzed your service request for bathroom plumbing renovation. 3 contractors (including Bob Builder) have submitted bids starting from ₹4,500. Review their profiles to schedule.',
        actionLabel: 'View Requirements',
        actionUrl: '/customer/requirements'
      },
      {
        id: 'n2',
        title: 'Booking Schedule Confirmed',
        content: 'BK-CCT-8833 with Dinesh Karthik has been scheduled.',
        createdAt: '2 hours ago',
        isRead: false,
        category: 'Bookings',
        priority: 'High',
        description: 'Your booking reference BK-CCT-8833 for pest control services has been accepted. The professional is scheduled to visit your location tomorrow at 10:00 AM. Please make sure someone is available.',
        actionLabel: 'View Bookings',
        actionUrl: '/customer/bookings'
      },
      {
        id: 'n3',
        title: 'New Message from Designer',
        content: 'Alice Architect: "Hi, I uploaded the draft structural layout blueprints..."',
        createdAt: '4 hours ago',
        isRead: false,
        category: 'Messages',
        priority: 'Medium',
        description: 'You have a new message from Alice Design Studio: "Hi, I uploaded the draft structural layout blueprints for your review. Please inspect the measurements and let me know if they look good."',
        actionLabel: 'Open Inbox',
        actionUrl: '/customer/inbox'
      },
      {
        id: 'n4',
        title: 'Vastu Consultation Scheduled',
        content: 'Your consultation session on Sunday 4:00 PM is confirmed.',
        createdAt: '1 day ago',
        isRead: true,
        category: 'Consultations',
        priority: 'Medium',
        description: 'Your design consultation session has been successfully booked with Shastryji Sharma for Sunday at 4:00 PM. A Vastu checklist and connection link will be shared via email shortly.',
        actionLabel: 'View Schedule',
        actionUrl: '/customer/dashboard'
      },
      {
        id: 'n5',
        title: 'Invoice Payment Success',
        content: '₹1,500 booking fee has been processed.',
        createdAt: '2 days ago',
        isRead: true,
        category: 'Payments',
        priority: 'Low',
        description: 'Thank you for choosing DBC. A receipt for ₹1,500 has been generated for Vastu Consultation booking. The PDF invoice is available for download in your receipt records.',
        actionLabel: 'View Invoice',
        actionUrl: '/customer/dashboard'
      },
      {
        id: 'n6',
        title: 'Welcome to DBC',
        content: 'Explore verified manual and design experts near you.',
        createdAt: '3 days ago',
        isRead: true,
        category: 'System',
        priority: 'Low',
        description: 'Welcome to DBC! Browse structural engineers, Vastu consultants, plumbers, and painters in your area. Use your dashboard to coordinate requirements and bookings seamlessly.',
        actionLabel: 'Go to Dashboard',
        actionUrl: '/customer/dashboard'
      },
      {
        id: 'n7',
        title: 'Monsoon Protection Special Offer',
        content: 'Get 15% off waterproofing consultations this week.',
        createdAt: '5 days ago',
        isRead: true,
        category: 'Promotions',
        priority: 'Low',
        description: 'Protect your roof and walls this season. Schedule a waterproofing structural assessment from verified experts and apply code MONSOON15 to save 15% on consultant fees.',
        actionLabel: 'View Subscriptions',
        actionUrl: '/subscriptions'
      }
    ];
  }
}

const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // Fallback
  }
  return memoryStorage[key] || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fallback
  }
  memoryStorage[key] = value;
}

export const notificationApi = {
  getNotifications(role: string): AppNotification[] {
    const normRole = (role || '').toUpperCase();
    const storageKey = `dbc_notifications_${normRole.toLowerCase()}`;
    const raw = safeGetItem(storageKey);
    if (raw) {
      try {
        notificationList = JSON.parse(raw);
        currentRoleState = normRole;
        return notificationList;
      } catch (err) {
        console.warn('Failed to parse notifications', err);
      }
    }
    if (notificationList.length === 0 || normRole !== currentRoleState) {
      seedNotifications(role);
      safeSetItem(storageKey, JSON.stringify(notificationList));
    }
    return notificationList;
  },

  markAsRead(id: string): void {
    notificationList = notificationList.map((item) =>
      item.id === id ? { ...item, isRead: true } : item
    );
    const storageKey = `dbc_notifications_${currentRoleState.toLowerCase()}`;
    safeSetItem(storageKey, JSON.stringify(notificationList));
    notify();
  },

  markAsUnread(id: string): void {
    notificationList = notificationList.map((item) =>
      item.id === id ? { ...item, isRead: false } : item
    );
    const storageKey = `dbc_notifications_${currentRoleState.toLowerCase()}`;
    safeSetItem(storageKey, JSON.stringify(notificationList));
    notify();
  },

  archiveNotification(id: string, archiveState: boolean = true): void {
    notificationList = notificationList.map((item) =>
      item.id === id ? { ...item, archived: archiveState } : item
    );
    const storageKey = `dbc_notifications_${currentRoleState.toLowerCase()}`;
    safeSetItem(storageKey, JSON.stringify(notificationList));
    notify();
  },

  deleteNotification(id: string): void {
    notificationList = notificationList.filter((item) => item.id !== id);
    const storageKey = `dbc_notifications_${currentRoleState.toLowerCase()}`;
    safeSetItem(storageKey, JSON.stringify(notificationList));
    notify();
  },

  markAllAsRead(): void {
    notificationList = notificationList.map((item) => ({ ...item, isRead: true }));
    const storageKey = `dbc_notifications_${currentRoleState.toLowerCase()}`;
    safeSetItem(storageKey, JSON.stringify(notificationList));
    notify();
  },

  getUnreadCount(role: string): number {
    const list = this.getNotifications(role);
    return list.filter((item) => !item.isRead && !item.archived).length;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

function notify() {
  listeners.forEach((listener) => listener());
}

