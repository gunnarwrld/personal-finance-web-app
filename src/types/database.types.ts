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
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_currency?: string
          balance_visible?: boolean
          budget_alerts?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          display_currency?: string
          balance_visible?: boolean
          budget_alerts?: boolean
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
