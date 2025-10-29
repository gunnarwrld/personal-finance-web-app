// Notification types

export type NotificationType = 
  | 'bill_reminder'
  | 'budget_alert'
  | 'recurring_transaction'
  | 'goal_achievement'
  | 'payment_received'
  | 'subscription_renewal'
  | 'low_balance'
  | 'unusual_spending';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: number;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  is_read: boolean;
  related_id: number | null; // ID of related entity (bill, budget, etc.)
  related_type: 'bill' | 'budget' | 'transaction' | 'goal' | 'subscription' | null;
  action_url: string | null; // URL to navigate to when clicked
  metadata: Record<string, any> | null; // Additional data
  created_at: string;
  read_at: string | null;
}

export interface InsertNotification {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  is_read?: boolean;
  related_id?: number | null;
  related_type?: 'bill' | 'budget' | 'transaction' | 'goal' | 'subscription' | null;
  action_url?: string | null;
  metadata?: Record<string, any> | null;
}

export interface UpdateNotification {
  is_read?: boolean;
  read_at?: string | null;
}

export interface NotificationGroup {
  type: NotificationType;
  count: number;
  latestNotification: Notification;
  unreadCount: number;
}

export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  bill_reminders: boolean;
  budget_alerts: boolean;
  recurring_transactions: boolean;
  goal_achievements: boolean;
  subscription_updates: boolean;
  low_balance_alerts: boolean;
  unusual_spending_alerts: boolean;
  notification_frequency: 'realtime' | 'daily' | 'weekly';
  quiet_hours_start: string | null; // HH:MM format
  quiet_hours_end: string | null; // HH:MM format
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}
