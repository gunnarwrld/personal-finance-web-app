import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Notification, InsertNotification, NotificationType, NotificationStats } from '@/types';

const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all notifications
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Get unread notifications
  const unreadNotifications = notifications.filter((n) => !n.is_read);

  // Get unread count
  const unreadCount = unreadNotifications.length;

  // Get notifications by type
  const getNotificationsByType = (type: NotificationType) => {
    return notifications.filter((n) => n.type === type);
  };

  // Get notification stats
  const getStats = (): NotificationStats => {
    const stats: NotificationStats = {
      total: notifications.length,
      unread: unreadCount,
      byType: {
        bill_reminder: 0,
        budget_alert: 0,
        recurring_transaction: 0,
        goal_achievement: 0,
        payment_received: 0,
        subscription_renewal: 0,
        low_balance: 0,
        unusual_spending: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      },
    };

    notifications.forEach((n) => {
      stats.byType[n.type as NotificationType]++;
      stats.byPriority[n.priority as 'low' | 'medium' | 'high' | 'urgent']++;
    });

    return stats;
  };

  // Create notification
  const createNotification = useMutation({
    mutationFn: async (notification: InsertNotification) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: number) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  // Delete all read notifications
  const deleteAllRead = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    error,
    createNotification: createNotification.mutate,
    createNotificationAsync: createNotification.mutateAsync,
    markAsRead: markAsRead.mutate,
    markAsReadAsync: markAsRead.mutateAsync,
    markAllAsRead: markAllAsRead.mutate,
    markAllAsReadAsync: markAllAsRead.mutateAsync,
    deleteNotification: deleteNotification.mutate,
    deleteNotificationAsync: deleteNotification.mutateAsync,
    deleteAllRead: deleteAllRead.mutate,
    deleteAllReadAsync: deleteAllRead.mutateAsync,
    getNotificationsByType,
    getStats,
    isCreating: createNotification.isPending,
    isUpdating: markAsRead.isPending || markAllAsRead.isPending,
    isDeleting: deleteNotification.isPending || deleteAllRead.isPending,
  };
}
