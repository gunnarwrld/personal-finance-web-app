import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, Filter, Trash2, CheckCheck, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { NotificationType, NotificationPriority } from '../types/notification';

export const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsReadAsync,
    markAllAsReadAsync,
    deleteNotificationAsync,
    deleteAllReadAsync,
    getNotificationsByType,
  } = useNotifications();

  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>('all');
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const handleMarkAsRead = async (id: number) => {
    await markAsReadAsync(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadAsync();
  };

  const handleDelete = async (id: number) => {
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await deleteNotificationAsync(id);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDeleteAllRead = async () => {
    if (window.confirm('Are you sure you want to delete all read notifications?')) {
      await deleteAllReadAsync();
    }
  };

  // Filter notifications
  let filteredNotifications = notifications;
  if (selectedType !== 'all') {
    filteredNotifications = getNotificationsByType(selectedType);
  }
  if (selectedPriority !== 'all') {
    filteredNotifications = filteredNotifications.filter(n => n.priority === selectedPriority);
  }

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'bill_reminder':
        return <Bell className={`${iconClass} text-orange-500`} />;
      case 'budget_alert':
        return <Bell className={`${iconClass} text-red-500`} />;
      case 'recurring_transaction':
        return <Bell className={`${iconClass} text-purple-500`} />;
      case 'goal_achievement':
        return <Bell className={`${iconClass} text-green-500`} />;
      case 'payment_received':
        return <Bell className={`${iconClass} text-blue-500`} />;
      case 'subscription_renewal':
        return <Bell className={`${iconClass} text-yellow-500`} />;
      case 'low_balance':
        return <Bell className={`${iconClass} text-red-500`} />;
      case 'unusual_spending':
        return <Bell className={`${iconClass} text-orange-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    const classes = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${classes[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {unreadCount} unread • {notifications.length} total
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={handleDeleteAllRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex-1 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as NotificationType | 'all')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="all">All Types</option>
                <option value="bill_reminder">Bill Reminders</option>
                <option value="budget_alert">Budget Alerts</option>
                <option value="recurring_transaction">Recurring Transactions</option>
                <option value="goal_achievement">Goal Achievements</option>
                <option value="payment_received">Payment Received</option>
                <option value="subscription_renewal">Subscription Renewals</option>
                <option value="low_balance">Low Balance</option>
                <option value="unusual_spending">Unusual Spending</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as NotificationPriority | 'all')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {selectedType !== 'all' || selectedPriority !== 'all'
                ? 'No notifications match the selected filters'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500' : ''
                } ${deletingIds.has(notification.id) ? 'opacity-50' : ''}`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getPriorityBadge(notification.priority)}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <CheckCheck className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={deletingIds.has(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {notification.message}
                    </p>
                    {notification.action_url && (
                      <button
                        onClick={() => navigate(notification.action_url!)}
                        className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Details →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
