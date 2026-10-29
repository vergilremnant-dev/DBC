import React, { useState, useEffect, useMemo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { notificationApi } from '../../services/notification/notificationService';
import type { AppNotification } from '../../services/notification/notificationService';
import { NotificationSummaryCard } from '../../components/workspace/notifications/NotificationSummaryCard';
import { NotificationFilters } from '../../components/workspace/notifications/NotificationFilters';
import { NotificationCard } from '../../components/workspace/notifications/NotificationCard';
import { NotificationDetail } from '../../components/workspace/notifications/NotificationDetail';
import { NotificationEmptyState } from '../../components/workspace/notifications/NotificationEmptyState';

import ProfessionalNotifications from './professional/ProfessionalNotifications';

function CustomerNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, UNREAD, ARCHIVED, TODAY, THIS_WEEK
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Bulk selection states
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Load and subscribe to notification changes
  useEffect(() => {
    const role = user?.role || 'ROLE_CUSTOMER';
    
    // Load initial
    startTransition(() => {
      setNotifications([...notificationApi.getNotifications(role)]);
    });

    // Subscribe
    const unsubscribe = notificationApi.subscribe(() => {
      startTransition(() => {
        setNotifications([...notificationApi.getNotifications(role)]);
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Compute summary stats dynamically
  const stats = useMemo(() => {
    const activeItems = notifications.filter(n => !n.archived);
    return {
      unread: activeItems.filter(n => !n.isRead).length,
      today: activeItems.filter(n => n.createdAt.includes('min') || n.createdAt.includes('hour')).length,
      week: activeItems.length,
      archived: notifications.filter(n => n.archived).length
    };
  }, [notifications]);

  // Filter & Sort notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    // Status Filter
    if (statusFilter === 'UNREAD') {
      result = result.filter(n => !n.archived && !n.isRead);
    } else if (statusFilter === 'ARCHIVED') {
      result = result.filter(n => n.archived);
    } else if (statusFilter === 'TODAY') {
      result = result.filter(n => !n.archived && (n.createdAt.includes('min') || n.createdAt.includes('hour')));
    } else if (statusFilter === 'THIS_WEEK') {
      result = result.filter(n => !n.archived);
    } else {
      // Default: ALL (excludes archived)
      result = result.filter(n => !n.archived);
    }

    // Category Filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(n => n.category === categoryFilter);
    }

    // Priority Filter
    if (priorityFilter !== 'ALL') {
      result = result.filter(n => n.priority === priorityFilter);
    }

    // Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.description && n.description.toLowerCase().includes(q))
      );
    }

    // Sorting rules
    result.sort((a, b) => {
      // Suffix sorting logic based on mock ID string numbers (e.g. n1 is newer than n2)
      const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;

      if (sortBy === 'NEWEST') {
        return numA - numB;
      }
      if (sortBy === 'OLDEST') {
        return numB - numA;
      }
      if (sortBy === 'UNREAD_FIRST') {
        if (!a.isRead && b.isRead) return -1;
        if (a.isRead && !b.isRead) return 1;
        return numA - numB;
      }
      if (sortBy === 'READ_FIRST') {
        if (a.isRead && !b.isRead) return -1;
        if (!a.isRead && b.isRead) return 1;
        return numA - numB;
      }
      return 0;
    });

    return result;
  }, [notifications, searchQuery, statusFilter, categoryFilter, priorityFilter, sortBy]);

  // Sync selectedId with filtered results
  useEffect(() => {
    // If current selectedId is not in filtered list, pick the first one on desktop
    if (filteredNotifications.length > 0) {
      const exists = filteredNotifications.some(n => n.id === selectedId);
      if (!exists && window.innerWidth >= 1024) {
        startTransition(() => {
          setSelectedId(filteredNotifications[0].id);
        });
      }
    } else {
      startTransition(() => {
        setSelectedId(null);
      });
    }
  }, [filteredNotifications, selectedId]);

  // Retrieve current selected notification details
  const selectedNotification = useMemo(() => {
    return notifications.find(n => n.id === selectedId) || null;
  }, [notifications, selectedId]);

  // Check if any filters are active
  const isFiltered = useMemo(() => {
    return (
      searchQuery !== '' ||
      statusFilter !== 'ALL' ||
      categoryFilter !== 'ALL' ||
      priorityFilter !== 'ALL'
    );
  }, [searchQuery, statusFilter, categoryFilter, priorityFilter]);

  // Reset Filters handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setSortBy('NEWEST');
  };

  // Notification Operations
  const handleSelectNotification = (id: string) => {
    setSelectedId(id);
    // Mark as read automatically when selecting/opening
    notificationApi.markAsRead(id);
  };

  const handleToggleRead = (e: React.MouseEvent | null, id: string) => {
    if (e) e.stopPropagation();
    const item = notifications.find(n => n.id === id);
    if (!item) return;

    if (item.isRead) {
      notificationApi.markAsUnread(id);
    } else {
      notificationApi.markAsRead(id);
    }
  };

  const handleToggleArchive = (e: React.MouseEvent | null, id: string) => {
    if (e) e.stopPropagation();
    const item = notifications.find(n => n.id === id);
    if (!item) return;

    notificationApi.archiveNotification(id, !item.archived);
  };

  const handleDelete = (e: React.MouseEvent | null, id: string) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this notification record?')) {
      notificationApi.deleteNotification(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
      setSelectedItemIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  // Bulk Operations (UI layer)
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedItemIds.length === filteredNotifications.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredNotifications.map(n => n.id));
    }
  };

  const handleBulkMarkRead = () => {
    selectedItemIds.forEach(id => {
      notificationApi.markAsRead(id);
    });
    setSelectedItemIds([]);
  };

  const handleBulkArchive = () => {
    selectedItemIds.forEach(id => {
      notificationApi.archiveNotification(id, true);
    });
    setSelectedItemIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete the ${selectedItemIds.length} selected notifications?`)) {
      selectedItemIds.forEach(id => {
        notificationApi.deleteNotification(id);
      });
      setSelectedItemIds([]);
      setSelectedId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 pb-5 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-stone-900 font-display">Notifications</h1>
          <p className="text-xs text-stone-600 font-semibold">
            Stay updated with your latest account, planning, and project activities.
          </p>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => notificationApi.markAllAsRead()}
            className="rounded-lg bg-stone-900 hover:bg-stone-850 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <NotificationSummaryCard
        unreadCount={stats.unread}
        todayCount={stats.today}
        weekCount={stats.week}
        archivedCount={stats.archived}
        activeFilter={statusFilter}
        onFilterSelect={(filter) => {
          setStatusFilter(filter);
          setSelectedId(null);
        }}
      />

      {/* Filters & Search Component */}
      <NotificationFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={(status) => {
          setStatusFilter(status);
          setSelectedId(null);
        }}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleResetFilters}
        isFiltered={isFiltered}
      />

      {/* Bulk actions panel (Optional UI) */}
      {filteredNotifications.length > 0 && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-stone-600">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                filteredNotifications.length > 0 &&
                selectedItemIds.length === filteredNotifications.length
              }
              onChange={handleSelectAllFiltered}
              className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
            />
            <span>
              Selected {selectedItemIds.length} of {filteredNotifications.length} items
            </span>
          </div>

          {selectedItemIds.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkMarkRead}
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                Mark Read
              </button>
              <button
                onClick={handleBulkArchive}
                className="text-brand-emerald hover:text-brand-emerald/90 cursor-pointer"
              >
                Archive Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-rose-700 hover:text-rose-900 cursor-pointer"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      )}

      {/* List Layout with optional side panel */}
      {filteredNotifications.length === 0 ? (
        <NotificationEmptyState onGoHome={() => navigate('/customer/dashboard')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Notifications feed list */}
          <div className={`space-y-3 ${selectedNotification ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
              {filteredNotifications.map((notification) => {
                const isChecked = selectedItemIds.includes(notification.id);
                return (
                  <div key={notification.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelectItem(notification.id)}
                      className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                    />
                    <div className="flex-1">
                      <NotificationCard
                        notification={notification}
                        isSelected={selectedId === notification.id}
                        onSelect={() => handleSelectNotification(notification.id)}
                        onToggleRead={(e) => handleToggleRead(e, notification.id)}
                        onToggleArchive={(e) => handleToggleArchive(e, notification.id)}
                        onDelete={(e) => handleDelete(e, notification.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details side panel (Desktop) or Modal/Overlay (Mobile) */}
          {selectedNotification && (
            <>
              {/* Desktop Side Panel view */}
              <div className="hidden lg:block lg:col-span-5 h-full min-h-[450px]">
                <NotificationDetail
                  notification={selectedNotification}
                  onToggleRead={() => handleToggleRead(null, selectedNotification.id)}
                  onToggleArchive={() => handleToggleArchive(null, selectedNotification.id)}
                  onDelete={() => handleDelete(null, selectedNotification.id)}
                  onNavigateToModule={(url) => navigate(url)}
                />
              </div>

              {/* Mobile overlay sheet */}
              <div className="dbc-modal-overlay lg:hidden">
                <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl h-[90vh]">
                  <NotificationDetail
                    notification={selectedNotification}
                    onClose={() => setSelectedId(null)}
                    onToggleRead={() => handleToggleRead(null, selectedNotification.id)}
                    onToggleArchive={() => handleToggleArchive(null, selectedNotification.id)}
                    onDelete={() => handleDelete(null, selectedNotification.id)}
                    onNavigateToModule={(url) => {
                      setSelectedId(null);
                      navigate(url);
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkspaceNotifications() {
  const { user } = useAuth();

  if (user?.role === 'ROLE_PROVIDER') {
    return <ProfessionalNotifications />;
  }

  return <CustomerNotifications />;
}

