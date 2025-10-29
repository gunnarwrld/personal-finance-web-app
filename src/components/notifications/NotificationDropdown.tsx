import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { CheckCheck, Trash2, Bell, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '../../types/notification';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsReadAsync,
    markAllAsReadAsync,
    deleteNotificationAsync,
  } = useNotifications();

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

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  const getNotificationIcon = (type: Notification['type']) => {
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

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                } ${deletingIds.has(notification.id) ? 'opacity-50' : ''}`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 pt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex gap-1">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      disabled={deletingIds.has(notification.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {recentNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleViewAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            View all notifications
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
