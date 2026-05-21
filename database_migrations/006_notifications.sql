-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'bill_reminder',
    'budget_alert',
    'recurring_transaction',
    'goal_achievement',
    'payment_received',
    'subscription_renewal',
    'low_balance',
    'unusual_spending'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  related_id BIGINT,
  related_type TEXT CHECK (related_type IN ('bill', 'budget', 'transaction', 'goal', 'subscription')),
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(user_id, type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  bill_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  budget_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  recurring_transactions BOOLEAN NOT NULL DEFAULT TRUE,
  goal_achievements BOOLEAN NOT NULL DEFAULT TRUE,
  subscription_updates BOOLEAN NOT NULL DEFAULT TRUE,
  low_balance_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  unusual_spending_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  notification_frequency TEXT NOT NULL DEFAULT 'realtime' CHECK (notification_frequency IN ('realtime', 'daily', 'weekly')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create notification preferences
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_notification_preferences_for_user();

-- Add comment
COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery and settings';
