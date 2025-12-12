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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bank_deposits: {
        Row: {
          account_number: string | null
          amount: number
          bank_name: string
          created_at: string
          deposit_date: string
          deposited_by: string | null
          id: string
          notes: string | null
          reference_number: string | null
        }
        Insert: {
          account_number?: string | null
          amount: number
          bank_name: string
          created_at?: string
          deposit_date: string
          deposited_by?: string | null
          id?: string
          notes?: string | null
          reference_number?: string | null
        }
        Update: {
          account_number?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          deposit_date?: string
          deposited_by?: string | null
          id?: string
          notes?: string | null
          reference_number?: string | null
        }
        Relationships: []
      }
      cash_register: {
        Row: {
          closed_by: string | null
          closing_balance: number | null
          created_at: string
          date: string
          id: string
          notes: string | null
          opening_balance: number
          total_deposits: number | null
          total_expenses: number | null
          total_refunds: number | null
          total_sales: number | null
          updated_at: string
        }
        Insert: {
          closed_by?: string | null
          closing_balance?: number | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          opening_balance?: number
          total_deposits?: number | null
          total_expenses?: number | null
          total_refunds?: number | null
          total_sales?: number | null
          updated_at?: string
        }
        Update: {
          closed_by?: string | null
          closing_balance?: number | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          opening_balance?: number
          total_deposits?: number | null
          total_expenses?: number | null
          total_refunds?: number | null
          total_sales?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_source: Database["public"]["Enums"]["payment_source"]
          receipt_url: string | null
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_source?: Database["public"]["Enums"]["payment_source"]
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_source?: Database["public"]["Enums"]["payment_source"]
          receipt_url?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_company: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          message: string | null
          notes: string | null
          priority: string | null
          product_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_company?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          priority?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_company?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          priority?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_stock: number
          notes: string | null
          previous_stock: number
          product_id: string
          quantity: number
          reference_id: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          product_id: string
          quantity: number
          reference_id?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          product_id?: string
          quantity?: number
          reference_id?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      page_permissions: {
        Row: {
          created_at: string
          id: string
          page_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string
          condition: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dimensions: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          price: number
          reorder_level: number | null
          reorder_quantity: number | null
          serial_numbers: string[] | null
          sku: string | null
          stock_quantity: number
          unit_cost: number | null
          updated_at: string
          warranty_months: number | null
          weight_kg: number | null
        }
        Insert: {
          barcode?: string | null
          category: string
          condition?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          price: number
          reorder_level?: number | null
          reorder_quantity?: number | null
          serial_numbers?: string[] | null
          sku?: string | null
          stock_quantity?: number
          unit_cost?: number | null
          updated_at?: string
          warranty_months?: number | null
          weight_kg?: number | null
        }
        Update: {
          barcode?: string | null
          category?: string
          condition?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          price?: number
          reorder_level?: number | null
          reorder_quantity?: number | null
          serial_numbers?: string[] | null
          sku?: string | null
          stock_quantity?: number
          unit_cost?: number | null
          updated_at?: string
          warranty_months?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_number: string
          ordered_by: string | null
          received_at: string | null
          status: string
          supplier_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_number: string
          ordered_by?: string | null
          received_at?: string | null
          status?: string
          supplier_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: string
          ordered_by?: string | null
          received_at?: string | null
          status?: string
          supplier_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          items_returned: Json | null
          reason: string
          receipt_number: string
          refunded_by: string | null
          sale_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          items_returned?: Json | null
          reason: string
          receipt_number: string
          refunded_by?: string | null
          sale_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          items_returned?: Json | null
          reason?: string
          receipt_number?: string
          refunded_by?: string | null
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_paid: number
          change_given: number | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          discount: number | null
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_number: string
          sold_by: string | null
          subtotal: number
          tax: number | null
          total: number
        }
        Insert: {
          amount_paid?: number
          change_given?: number | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_number: string
          sold_by?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
        }
        Update: {
          amount_paid?: number
          change_given?: number | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_number?: string
          sold_by?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_unit_history: {
        Row: {
          action: string
          created_at: string
          id: string
          new_location: string | null
          new_status: string | null
          notes: string | null
          performed_by: string | null
          previous_location: string | null
          previous_status: string | null
          serial_unit_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_location?: string | null
          new_status?: string | null
          notes?: string | null
          performed_by?: string | null
          previous_location?: string | null
          previous_status?: string | null
          serial_unit_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_location?: string | null
          new_status?: string | null
          notes?: string | null
          performed_by?: string | null
          previous_location?: string | null
          previous_status?: string | null
          serial_unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_unit_history_serial_unit_id_fkey"
            columns: ["serial_unit_id"]
            isOneToOne: false
            referencedRelation: "serial_units"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_units: {
        Row: {
          condition: string | null
          created_at: string
          customer_id: string | null
          id: string
          location: string | null
          notes: string | null
          product_id: string
          purchase_cost: number | null
          purchase_date: string | null
          sale_id: string | null
          serial_number: string
          sold_date: string | null
          status: string
          updated_at: string
          warranty_end_date: string | null
          warranty_start_date: string | null
        }
        Insert: {
          condition?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          product_id: string
          purchase_cost?: number | null
          purchase_date?: string | null
          sale_id?: string | null
          serial_number: string
          sold_date?: string | null
          status?: string
          updated_at?: string
          warranty_end_date?: string | null
          warranty_start_date?: string | null
        }
        Update: {
          condition?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          product_id?: string
          purchase_cost?: number | null
          purchase_date?: string | null
          sale_id?: string | null
          serial_number?: string
          sold_date?: string | null
          status?: string
          updated_at?: string
          warranty_end_date?: string | null
          warranty_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serial_units_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_units_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          bank_name: string | null
          created_at: string
          id: string
          notes: string | null
          paid_by: string | null
          payment_date: string
          payment_method: string
          payment_source: Database["public"]["Enums"]["payment_source"]
          purchase_order_id: string | null
          reference_number: string | null
          supplier_id: string
        }
        Insert: {
          amount: number
          bank_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          payment_date?: string
          payment_method?: string
          payment_source?: Database["public"]["Enums"]["payment_source"]
          purchase_order_id?: string | null
          reference_number?: string | null
          supplier_id: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          payment_date?: string
          payment_method?: string
          payment_source?: Database["public"]["Enums"]["payment_source"]
          purchase_order_id?: string | null
          reference_number?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      generate_receipt_number: { Args: never; Returns: string }
      has_page_access: {
        Args: { _page_path: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff_or_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff"
      expense_category:
        | "utilities"
        | "rent"
        | "salaries"
        | "supplies"
        | "transport"
        | "marketing"
        | "maintenance"
        | "other"
      payment_method:
        | "cash"
        | "card"
        | "mobile_money"
        | "bank_transfer"
        | "credit"
      payment_source: "cash_register" | "bank"
      transaction_type: "sale" | "purchase" | "adjustment" | "return" | "damage"
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
    Enums: {
      app_role: ["admin", "staff"],
      expense_category: [
        "utilities",
        "rent",
        "salaries",
        "supplies",
        "transport",
        "marketing",
        "maintenance",
        "other",
      ],
      payment_method: [
        "cash",
        "card",
        "mobile_money",
        "bank_transfer",
        "credit",
      ],
      payment_source: ["cash_register", "bank"],
      transaction_type: ["sale", "purchase", "adjustment", "return", "damage"],
    },
  },
} as const
