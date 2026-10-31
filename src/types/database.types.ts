export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_transfers: {
        Row: {
          amount: number
          converted_amount: number
          created_at: string | null
          description: string | null
          exchange_rate: number | null
          from_account_id: number
          from_currency: string
          id: number
          to_account_id: number
          to_currency: string
          transfer_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          converted_amount: number
          created_at?: string | null
          description?: string | null
          exchange_rate?: number | null
          from_account_id: number
          from_currency: string
          id?: number
          to_account_id: number
          to_currency: string
          transfer_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          converted_amount?: number
          created_at?: string | null
          description?: string | null
          exchange_rate?: number | null
          from_account_id?: number
          from_currency?: string
          id?: number
          to_account_id?: number
          to_currency?: string
          transfer_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_holder: string | null
          account_number: string | null
          balance: number
          bank_name: string | null
          created_at: string | null
          currency: string | null
          id: number
          name: string
          notes: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          balance?: number
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          id?: number
          name: string
          notes?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          balance?: number
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          id?: number
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bill_reminders: {
        Row: {
          account_id: number | null
          amount: number
          category: string
          created_at: string | null
          due_date: string
          id: number
          is_paid: boolean | null
          notes: string | null
          paid_date: string | null
          recurring_id: number | null
          reminder_days_before: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: number | null
          amount: number
          category: string
          created_at?: string | null
          due_date: string
          id?: number
          is_paid?: boolean | null
          notes?: string | null
          paid_date?: string | null
          recurring_id?: number | null
          reminder_days_before?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: number | null
          amount?: number
          category?: string
          created_at?: string | null
          due_date?: string
          id?: number
          is_paid?: boolean | null
          notes?: string | null
          paid_date?: string | null
          recurring_id?: number | null
          reminder_days_before?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_reminders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_reminders_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          alert_threshold: number | null
          amount: number
          category: string
          created_at: string | null
          end_date: string | null
          id: number
          is_active: boolean | null
          period: string | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold?: number | null
          amount: number
          category: string
          created_at?: string | null
          end_date?: string | null
          id?: number
          is_active?: boolean | null
          period?: string | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold?: number | null
          amount?: number
          category?: string
          created_at?: string | null
          end_date?: string | null
          id?: number
          is_active?: boolean | null
          period?: string | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          base_currency: string | null
          id: number
          last_updated: string | null
          rates: Json
        }
        Insert: {
          base_currency?: string | null
          id?: number
          last_updated?: string | null
          rates: Json
        }
        Update: {
          base_currency?: string | null
          id?: number
          last_updated?: string | null
          rates?: Json
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          bill_reminders: boolean
          budget_alerts: boolean
          created_at: string
          email_notifications: boolean
          goal_achievements: boolean
          low_balance_alerts: boolean
          notification_frequency: string
          push_notifications: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          recurring_transactions: boolean
          subscription_updates: boolean
          unusual_spending_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          bill_reminders?: boolean
          budget_alerts?: boolean
          created_at?: string
          email_notifications?: boolean
          goal_achievements?: boolean
          low_balance_alerts?: boolean
          notification_frequency?: string
          push_notifications?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          recurring_transactions?: boolean
          subscription_updates?: boolean
          unusual_spending_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          bill_reminders?: boolean
          budget_alerts?: boolean
          created_at?: string
          email_notifications?: boolean
          goal_achievements?: boolean
          low_balance_alerts?: boolean
          notification_frequency?: string
          push_notifications?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          recurring_transactions?: boolean
          subscription_updates?: boolean
          unusual_spending_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: number
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string
          read_at: string | null
          related_id: number | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: number
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          related_id?: number | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: number
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          related_id?: number | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          account_id: number | null
          amount: number
          auto_create: boolean | null
          category: string
          created_at: string | null
          description: string
          end_date: string | null
          frequency: string
          id: number
          is_active: boolean | null
          last_created_at: string | null
          next_occurrence: string
          start_date: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: number | null
          amount: number
          auto_create?: boolean | null
          category: string
          created_at?: string | null
          description: string
          end_date?: string | null
          frequency: string
          id?: number
          is_active?: boolean | null
          last_created_at?: string | null
          next_occurrence: string
          start_date: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: number | null
          amount?: number
          auto_create?: boolean | null
          category?: string
          created_at?: string | null
          description?: string
          end_date?: string | null
          frequency?: string
          id?: number
          is_active?: boolean | null
          last_created_at?: string | null
          next_occurrence?: string
          start_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: number
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          date: string
          description: string
          id: number
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: number
          amount: number
          category: string
          created_at?: string | null
          currency?: string | null
          date: string
          description: string
          id?: number
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: number
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string
          id?: number
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          balance_visible: boolean | null
          budget_alerts: boolean | null
          created_at: string | null
          display_currency: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance_visible?: boolean | null
          budget_alerts?: boolean | null
          created_at?: string | null
          display_currency?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance_visible?: boolean | null
          budget_alerts?: boolean | null
          created_at?: string | null
          display_currency?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_account_transfer: {
        Args: {
          p_amount: number
          p_description?: string
          p_exchange_rate?: number
          p_from_account_id: number
          p_to_account_id: number
          p_transfer_date?: string
        }
        Returns: {
          amount: number
          converted_amount: number
          created_at: string | null
          description: string | null
          exchange_rate: number | null
          from_account_id: number
          from_currency: string
          id: number
          to_account_id: number
          to_currency: string
          transfer_date: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "account_transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_transaction: {
        Args: {
          p_account_id: number
          p_amount: number
          p_category: string
          p_date: string
          p_description: string
          p_type: string
        }
        Returns: {
          account_id: number
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          date: string
          description: string
          id: number
          type: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_account_transfer: { Args: { p_id: number }; Returns: undefined }
      delete_transaction: { Args: { p_id: number }; Returns: undefined }
      update_transaction: {
        Args: {
          p_account_id: number
          p_amount: number
          p_category: string
          p_date: string
          p_description: string
          p_id: number
          p_type: string
        }
        Returns: {
          account_id: number
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          date: string
          description: string
          id: number
          type: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

