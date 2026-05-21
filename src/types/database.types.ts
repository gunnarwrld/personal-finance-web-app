export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: number
          user_id: string
          name: string
          type: string
          balance: number
          currency: string
          bank_name: string | null
          account_number: string | null
          account_holder: string | null
          notes: string | null
          account_type: string
          credit_limit: number | null
          interest_rate: number | null
          apy: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          type: string
          balance: number
          currency: string
          bank_name?: string | null
          account_number?: string | null
          account_holder?: string | null
          notes?: string | null
          account_type?: string
          credit_limit?: number | null
          interest_rate?: number | null
          apy?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          type?: string
          balance?: number
          currency?: string
          bank_name?: string | null
          account_number?: string | null
          account_holder?: string | null
          notes?: string | null
          account_type?: string
          credit_limit?: number | null
          interest_rate?: number | null
          apy?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: number
          user_id: string
          account_id: number
          amount: number
          description: string
          category: string
          type: string
          currency: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          account_id: number
          amount: number
          description: string
          category: string
          type: string
          currency: string
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          account_id?: number
          amount?: number
          description?: string
          category?: string
          type?: string
          currency?: string
          date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          user_id: string
          display_currency: string
          balance_visible: boolean
          budget_alerts: boolean
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_currency?: string
          balance_visible?: boolean
          budget_alerts?: boolean
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          display_currency?: string
          balance_visible?: boolean
          budget_alerts?: boolean
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          id: number
          user_id: string
          category: string
          amount: number
          period: string
          start_date: string
          end_date: string | null
          alert_threshold: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          category: string
          amount: number
          period?: string
          start_date: string
          end_date?: string | null
          alert_threshold?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          category?: string
          amount?: number
          period?: string
          start_date?: string
          end_date?: string | null
          alert_threshold?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          id: number
          user_id: string
          account_id: number
          description: string
          amount: number
          category: string
          type: string
          frequency: string
          start_date: string
          end_date: string | null
          next_occurrence: string
          last_created_at: string | null
          is_active: boolean
          auto_create: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          account_id: number
          description: string
          amount: number
          category: string
          type: string
          frequency: string
          start_date: string
          end_date?: string | null
          next_occurrence: string
          last_created_at?: string | null
          is_active?: boolean
          auto_create?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          account_id?: number
          description?: string
          amount?: number
          category?: string
          type?: string
          frequency?: string
          start_date?: string
          end_date?: string | null
          next_occurrence?: string
          last_created_at?: string | null
          is_active?: boolean
          auto_create?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      bill_reminders: {
        Row: {
          id: number
          user_id: string
          account_id: number | null
          title: string
          amount: number
          category: string
          due_date: string
          is_paid: boolean
          paid_date: string | null
          recurring_id: number | null
          reminder_days_before: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          account_id?: number | null
          title: string
          amount: number
          category: string
          due_date: string
          is_paid?: boolean
          paid_date?: string | null
          recurring_id?: number | null
          reminder_days_before?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          account_id?: number | null
          title?: string
          amount?: number
          category?: string
          due_date?: string
          is_paid?: boolean
          paid_date?: string | null
          recurring_id?: number | null
          reminder_days_before?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_reminders_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_reminders_recurring_id_fkey"
            columns: ["recurring_id"]
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      account_transfers: {
        Row: {
          id: number
          user_id: string
          from_account_id: number
          to_account_id: number
          amount: number
          from_currency: string
          to_currency: string
          exchange_rate: number
          converted_amount: number
          description: string | null
          transfer_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          from_account_id: number
          to_account_id: number
          amount: number
          from_currency: string
          to_currency: string
          exchange_rate?: number
          converted_amount: number
          description?: string | null
          transfer_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          from_account_id?: number
          to_account_id?: number
          amount?: number
          from_currency?: string
          to_currency?: string
          exchange_rate?: number
          converted_amount?: number
          description?: string | null
          transfer_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      user_subscriptions: {
        Row: {
          id: number
          user_id: string
          subscription_tier: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          trial_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          subscription_tier?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          subscription_tier?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: number
          user_id: string
          type: string
          title: string
          message: string
          priority: string
          is_read: boolean
          related_id: number | null
          related_type: string | null
          action_url: string | null
          metadata: Json | null
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          type: string
          title: string
          message: string
          priority?: string
          is_read?: boolean
          related_id?: number | null
          related_type?: string | null
          action_url?: string | null
          metadata?: Json | null
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          type?: string
          title?: string
          message?: string
          priority?: string
          is_read?: boolean
          related_id?: number | null
          related_type?: string | null
          action_url?: string | null
          metadata?: Json | null
          created_at?: string
          read_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          user_id: string
          email_notifications: boolean
          push_notifications: boolean
          bill_reminders: boolean
          budget_alerts: boolean
          recurring_transactions: boolean
          goal_achievements: boolean
          subscription_updates: boolean
          low_balance_alerts: boolean
          unusual_spending_alerts: boolean
          notification_frequency: string
          quiet_hours_start: string | null
          quiet_hours_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email_notifications?: boolean
          push_notifications?: boolean
          bill_reminders?: boolean
          budget_alerts?: boolean
          recurring_transactions?: boolean
          goal_achievements?: boolean
          subscription_updates?: boolean
          low_balance_alerts?: boolean
          unusual_spending_alerts?: boolean
          notification_frequency?: string
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email_notifications?: boolean
          push_notifications?: boolean
          bill_reminders?: boolean
          budget_alerts?: boolean
          recurring_transactions?: boolean
          goal_achievements?: boolean
          subscription_updates?: boolean
          low_balance_alerts?: boolean
          unusual_spending_alerts?: boolean
          notification_frequency?: string
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          id: number
          base_currency: string
          rates: Json
          last_updated: string
        }
        Insert: {
          id?: number
          base_currency: string
          rates: Json
          last_updated: string
        }
        Update: {
          id?: number
          base_currency?: string
          rates?: Json
          last_updated?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
