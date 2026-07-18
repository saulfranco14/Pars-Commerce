export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      commission_payments: {
        Row: {
          commission_amount: number
          created_at: string
          gross_profit: number
          id: string
          paid_at: string | null
          paid_by: string | null
          payment_notes: string | null
          payment_status: string
          period_end: string
          period_start: string
          period_type: string
          products_sold: number
          services_sold: number
          tenant_id: string
          total_cost: number
          total_items: number
          total_orders: number
          total_revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          gross_profit?: number
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_notes?: string | null
          payment_status?: string
          period_end: string
          period_start: string
          period_type: string
          products_sold?: number
          services_sold?: number
          tenant_id: string
          total_cost?: number
          total_items?: number
          total_orders?: number
          total_revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          gross_profit?: number
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_notes?: string | null
          payment_status?: string
          period_end?: string
          period_start?: string
          period_type?: string
          products_sold?: number
          services_sold?: number
          tenant_id?: string
          total_cost?: number
          total_items?: number
          total_orders?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payments_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_cards: {
        Row: {
          card_type: string | null
          created_at: string
          customer_id: string
          expiration_month: number | null
          expiration_year: number | null
          holder_name: string | null
          id: string
          is_active: boolean
          is_default: boolean
          last_four: string
          mp_card_id: string
          tenant_id: string
        }
        Insert: {
          card_type?: string | null
          created_at?: string
          customer_id: string
          expiration_month?: number | null
          expiration_year?: number | null
          holder_name?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_four: string
          mp_card_id: string
          tenant_id: string
        }
        Update: {
          card_type?: string | null
          created_at?: string
          customer_id?: string
          expiration_month?: number | null
          expiration_year?: number | null
          holder_name?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_four?: string
          mp_card_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_cards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          mp_customer_id: string | null
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          mp_customer_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          mp_customer_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          quantity: number
          reference: string | null
          reference_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          quantity: number
          reference?: string | null
          reference_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          quantity?: number
          reference?: string | null
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_bulk_payments: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          distribution: Json
          id: string
          loan_ids: string[]
          mp_payment_id: string | null
          mp_preference_id: string
          status: string
          tenant_id: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          distribution: Json
          id?: string
          loan_ids: string[]
          mp_payment_id?: string | null
          mp_preference_id: string
          status?: string
          tenant_id: string
          total_amount: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          distribution?: Json
          id?: string
          loan_ids?: string[]
          mp_payment_id?: string | null
          mp_preference_id?: string
          status?: string
          tenant_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_bulk_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_bulk_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_bulk_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          loan_id: string
          mp_fee_amount: number | null
          mp_net_amount: number | null
          mp_payment_id: string | null
          mp_preapproval_id: string | null
          mp_preference_id: string | null
          notes: string | null
          payment_method: string
          registered_by: string | null
          source: string
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          loan_id: string
          mp_fee_amount?: number | null
          mp_net_amount?: number | null
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          mp_preference_id?: string | null
          notes?: string | null
          payment_method: string
          registered_by?: string | null
          source?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          loan_id?: string
          mp_fee_amount?: number | null
          mp_net_amount?: number | null
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          mp_preference_id?: string | null
          notes?: string | null
          payment_method?: string
          registered_by?: string | null
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          amount_paid: number
          amount_pending: number | null
          cancelled_at: string | null
          cancelled_by: string | null
          concept: string
          created_at: string
          created_by: string | null
          customer_id: string
          due_date: string | null
          id: string
          interest_rate: number
          interest_type: string
          last_mp_preference_id: string | null
          last_payment_link: string | null
          mp_fee_absorbed_by: string
          mp_preapproval_id: string | null
          mp_preapproval_plan_id: string | null
          mp_subscription_init_point: string | null
          notes: string | null
          order_id: string | null
          paid_at: string | null
          payment_plan_frequency: number | null
          payment_plan_frequency_type: string | null
          payment_plan_installment_amount: number | null
          payment_plan_status: string | null
          payment_plan_type: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          amount_pending?: number | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          concept: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          due_date?: string | null
          id?: string
          interest_rate?: number
          interest_type?: string
          last_mp_preference_id?: string | null
          last_payment_link?: string | null
          mp_fee_absorbed_by?: string
          mp_preapproval_id?: string | null
          mp_preapproval_plan_id?: string | null
          mp_subscription_init_point?: string | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_plan_frequency?: number | null
          payment_plan_frequency_type?: string | null
          payment_plan_installment_amount?: number | null
          payment_plan_status?: string | null
          payment_plan_type?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          amount_pending?: number | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          concept?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          due_date?: string | null
          id?: string
          interest_rate?: number
          interest_type?: string
          last_mp_preference_id?: string | null
          last_payment_link?: string | null
          mp_fee_absorbed_by?: string
          mp_preapproval_id?: string | null
          mp_preapproval_plan_id?: string | null
          mp_subscription_init_point?: string | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_plan_frequency?: number | null
          payment_plan_frequency_type?: string | null
          payment_plan_installment_amount?: number | null
          payment_plan_status?: string | null
          payment_plan_type?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          actor_type: string
          created_at: string
          id: string
          order_id: string
          payload: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          actor_type: string
          created_at?: string
          id?: string
          order_id: string
          payload?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          order_id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_activity_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_devices: {
        Row: {
          color_hex: string | null
          created_at: string
          device_fingerprint: string
          display_name: string | null
          fulfillment_status: string
          id: string
          is_owner: boolean
          joined_at: string
          last_seen_at: string
          order_id: string
          updated_at: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          device_fingerprint: string
          display_name?: string | null
          fulfillment_status?: string
          id?: string
          is_owner?: boolean
          joined_at?: string
          last_seen_at?: string
          order_id: string
          updated_at?: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          device_fingerprint?: string
          display_name?: string | null
          fulfillment_status?: string
          id?: string
          is_owner?: boolean
          joined_at?: string
          last_seen_at?: string
          order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_devices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          added_by_device_id: string | null
          added_by_member_id: string | null
          created_at: string
          fulfillment_status: string
          id: string
          is_shared: boolean
          is_wholesale: boolean
          order_id: string
          origin_table_label: string | null
          product_id: string
          promotion_id: string | null
          quantity: number
          subtotal: number
          unit_price: number
          wholesale_savings: number
        }
        Insert: {
          added_by_device_id?: string | null
          added_by_member_id?: string | null
          created_at?: string
          fulfillment_status?: string
          id?: string
          is_shared?: boolean
          is_wholesale?: boolean
          order_id: string
          origin_table_label?: string | null
          product_id: string
          promotion_id?: string | null
          quantity: number
          subtotal: number
          unit_price: number
          wholesale_savings?: number
        }
        Update: {
          added_by_device_id?: string | null
          added_by_member_id?: string | null
          created_at?: string
          fulfillment_status?: string
          id?: string
          is_shared?: boolean
          is_wholesale?: boolean
          order_id?: string
          origin_table_label?: string | null
          product_id?: string
          promotion_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
          wholesale_savings?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_added_by_device_fkey"
            columns: ["added_by_device_id"]
            isOneToOne: false
            referencedRelation: "order_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_added_by_member_id_fkey"
            columns: ["added_by_member_id"]
            isOneToOne: false
            referencedRelation: "tenant_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_merge_requests: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          requested_by_device_id: string | null
          requester_label: string | null
          requester_order_id: string
          resolved_by: string | null
          status: string
          target_order_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          requested_by_device_id?: string | null
          requester_label?: string | null
          requester_order_id: string
          resolved_by?: string | null
          status?: string
          target_order_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          requested_by_device_id?: string | null
          requester_label?: string | null
          requester_order_id?: string
          resolved_by?: string | null
          status?: string
          target_order_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_merge_requests_requested_by_device_id_fkey"
            columns: ["requested_by_device_id"]
            isOneToOne: false
            referencedRelation: "order_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_merge_requests_requester_order_id_fkey"
            columns: ["requester_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_merge_requests_target_order_id_fkey"
            columns: ["target_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_merge_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payment_attempts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string | null
          external_reference: string | null
          id: string
          idempotency_key: string
          metadata: Json | null
          mode: string
          order_id: string
          provider: string
          provider_reference: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_reference?: string | null
          id?: string
          idempotency_key: string
          metadata?: Json | null
          mode: string
          order_id: string
          provider?: string
          provider_reference?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_reference?: string | null
          id?: string
          idempotency_key?: string
          metadata?: Json | null
          mode?: string
          order_id?: string
          provider?: string
          provider_reference?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payment_schedules: {
        Row: {
          amount_due: number
          amount_paid: number
          attempt_id: string | null
          created_at: string
          due_date: string
          id: string
          installment_number: number
          metadata: Json | null
          mp_payment_id: string | null
          order_id: string
          paid_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          attempt_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          metadata?: Json | null
          mp_payment_id?: string | null
          order_id: string
          paid_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          attempt_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          metadata?: Json | null
          mp_payment_id?: string | null
          order_id?: string
          paid_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payment_schedules_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "order_payment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_schedules_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_split_group_items: {
        Row: {
          created_at: string
          id: string
          order_item_id: string
          quantity: number
          split_group_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_item_id: string
          quantity: number
          split_group_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_item_id?: string
          quantity?: number
          split_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_split_group_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_split_group_items_split_group_id_fkey"
            columns: ["split_group_id"]
            isOneToOne: false
            referencedRelation: "order_split_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_split_groups: {
        Row: {
          balance_due: number
          created_at: string
          device_id: string | null
          id: string
          label: string
          order_id: string
          paid_total: number
          payment_status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          balance_due?: number
          created_at?: string
          device_id?: string | null
          id?: string
          label: string
          order_id: string
          paid_total?: number
          payment_status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          balance_due?: number
          created_at?: string
          device_id?: string | null
          id?: string
          label?: string
          order_id?: string
          paid_total?: number
          payment_status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_split_groups_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "order_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_split_groups_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_to: string | null
          balance_due: number
          cancel_reason: string | null
          cancelled_from: string | null
          checkout_session_id: string | null
          closed_by_membership_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          diner_count: number | null
          discount: number
          expires_at: string | null
          fulfillment_status: string
          id: string
          merge_group_id: string | null
          mp_preference_id: string | null
          order_type: string | null
          paid_at: string | null
          paid_total: number
          payment_link: string | null
          payment_method: string | null
          payment_mode: string
          payment_plan_status: string
          promotion_id: string | null
          qr_code_id: string | null
          source: string
          status: string
          subscription_id: string | null
          subscription_installment: number | null
          subtotal: number
          table_label: string | null
          tenant_id: string
          total: number
          updated_at: string
          work_metadata: Json | null
        }
        Insert: {
          assigned_to?: string | null
          balance_due?: number
          cancel_reason?: string | null
          cancelled_from?: string | null
          checkout_session_id?: string | null
          closed_by_membership_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          diner_count?: number | null
          discount?: number
          expires_at?: string | null
          fulfillment_status?: string
          id?: string
          merge_group_id?: string | null
          mp_preference_id?: string | null
          order_type?: string | null
          paid_at?: string | null
          paid_total?: number
          payment_link?: string | null
          payment_method?: string | null
          payment_mode?: string
          payment_plan_status?: string
          promotion_id?: string | null
          qr_code_id?: string | null
          source?: string
          status?: string
          subscription_id?: string | null
          subscription_installment?: number | null
          subtotal?: number
          table_label?: string | null
          tenant_id: string
          total?: number
          updated_at?: string
          work_metadata?: Json | null
        }
        Update: {
          assigned_to?: string | null
          balance_due?: number
          cancel_reason?: string | null
          cancelled_from?: string | null
          checkout_session_id?: string | null
          closed_by_membership_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          diner_count?: number | null
          discount?: number
          expires_at?: string | null
          fulfillment_status?: string
          id?: string
          merge_group_id?: string | null
          mp_preference_id?: string | null
          order_type?: string | null
          paid_at?: string | null
          paid_total?: number
          payment_link?: string | null
          payment_method?: string | null
          payment_mode?: string
          payment_plan_status?: string
          promotion_id?: string | null
          qr_code_id?: string | null
          source?: string
          status?: string
          subscription_id?: string | null
          subscription_installment?: number | null
          subtotal?: number
          table_label?: string | null
          tenant_id?: string
          total?: number
          updated_at?: string
          work_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_closed_by_membership_id_fkey"
            columns: ["closed_by_membership_id"]
            isOneToOne: false
            referencedRelation: "tenant_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          attempt_id: string | null
          checkout_session_id: string | null
          created_at: string
          external_id: string | null
          id: string
          idempotency_key: string | null
          installment_number: number | null
          metadata: Json | null
          order_id: string
          payment_kind: string
          provider: string
          split_group_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          attempt_id?: string | null
          checkout_session_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          idempotency_key?: string | null
          installment_number?: number | null
          metadata?: Json | null
          order_id: string
          payment_kind?: string
          provider: string
          split_group_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          attempt_id?: string | null
          checkout_session_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          idempotency_key?: string | null
          installment_number?: number | null
          metadata?: Json | null
          order_id?: string
          payment_kind?: string
          provider?: string
          split_group_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "order_payment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_split_group_id_fkey"
            columns: ["split_group_id"]
            isOneToOne: false
            referencedRelation: "order_split_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_inventory: {
        Row: {
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subcatalogs: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_subcatalogs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          commission_amount: number | null
          cost_price: number
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_public: boolean
          name: string
          price: number
          sku: string | null
          slug: string
          subcatalog_id: string | null
          tenant_id: string
          theme: string | null
          track_stock: boolean
          type: string
          unit: string
          updated_at: string
          wholesale_min_quantity: number | null
          wholesale_price: number | null
        }
        Insert: {
          commission_amount?: number | null
          cost_price?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          name: string
          price: number
          sku?: string | null
          slug: string
          subcatalog_id?: string | null
          tenant_id: string
          theme?: string | null
          track_stock?: boolean
          type?: string
          unit?: string
          updated_at?: string
          wholesale_min_quantity?: number | null
          wholesale_price?: number | null
        }
        Update: {
          commission_amount?: number | null
          cost_price?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          name?: string
          price?: number
          sku?: string | null
          slug?: string
          subcatalog_id?: string | null
          tenant_id?: string
          theme?: string | null
          track_stock?: boolean
          type?: string
          unit?: string
          updated_at?: string
          wholesale_min_quantity?: number | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_subcatalog_id_fkey"
            columns: ["subcatalog_id"]
            isOneToOne: false
            referencedRelation: "product_subcatalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          role_type: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
          role_type?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          role_type?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      promotion_images: {
        Row: {
          created_at: string
          id: string
          position: number
          promotion_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          promotion_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          promotion_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_images_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          badge_label: string | null
          bundle_product_ids: string[] | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_amount: number | null
          name: string
          product_ids: string[] | null
          quantity: number | null
          slug: string | null
          subcatalog_ids: string[] | null
          tenant_id: string
          type: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          badge_label?: string | null
          bundle_product_ids?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_amount?: number | null
          name: string
          product_ids?: string[] | null
          quantity?: number | null
          slug?: string | null
          subcatalog_ids?: string[] | null
          tenant_id: string
          type: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          badge_label?: string | null
          bundle_product_ids?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_amount?: number | null
          name?: string
          product_ids?: string[] | null
          quantity?: number | null
          slug?: string | null
          subcatalog_ids?: string[] | null
          tenant_id?: string
          type?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      public_cart_items: {
        Row: {
          added_at: string
          cart_id: string
          id: string
          price_snapshot: number
          product_id: string
          promotion_id: string | null
          quantity: number
        }
        Insert: {
          added_at?: string
          cart_id: string
          id?: string
          price_snapshot: number
          product_id: string
          promotion_id?: string | null
          quantity: number
        }
        Update: {
          added_at?: string
          cart_id?: string
          id?: string
          price_snapshot?: number
          product_id?: string
          promotion_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "public_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_cart_items_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      public_carts: {
        Row: {
          created_at: string
          fingerprint_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          fingerprint_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          fingerprint_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_carts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          allow_amount_override: boolean
          archived_at: string | null
          created_at: string
          created_by: string | null
          current_order_id: string | null
          id: string
          is_active: boolean
          kind: string
          label: string
          metadata: Json | null
          preset_amount: number | null
          preset_concept: string | null
          print_template: string | null
          table_capacity: number | null
          tenant_id: string
          token: string
          updated_at: string
        }
        Insert: {
          allow_amount_override?: boolean
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          current_order_id?: string | null
          id?: string
          is_active?: boolean
          kind: string
          label: string
          metadata?: Json | null
          preset_amount?: number | null
          preset_concept?: string | null
          print_template?: string | null
          table_capacity?: number | null
          tenant_id: string
          token: string
          updated_at?: string
        }
        Update: {
          allow_amount_override?: boolean
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          current_order_id?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          label?: string
          metadata?: Json | null
          preset_amount?: number | null
          preset_concept?: string | null
          print_template?: string | null
          table_capacity?: number | null
          tenant_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "tenant_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_current_order_id_fkey"
            columns: ["current_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_commissions: {
        Row: {
          commission_amount: number
          commission_config: Json | null
          created_at: string
          gross_profit: number
          id: string
          is_paid: boolean
          order_id: string
          paid_at: string | null
          paid_by: string | null
          products_count: number
          services_count: number
          tenant_id: string
          total_cost: number
          total_items_sold: number
          total_revenue: number
          updated_at: string
          user_id: string
          voided_at: string | null
        }
        Insert: {
          commission_amount?: number
          commission_config?: Json | null
          created_at?: string
          gross_profit?: number
          id?: string
          is_paid?: boolean
          order_id: string
          paid_at?: string | null
          paid_by?: string | null
          products_count?: number
          services_count?: number
          tenant_id: string
          total_cost?: number
          total_items_sold?: number
          total_revenue?: number
          updated_at?: string
          user_id: string
          voided_at?: string | null
        }
        Update: {
          commission_amount?: number
          commission_config?: Json | null
          created_at?: string
          gross_profit?: number
          id?: string
          is_paid?: boolean
          order_id?: string
          paid_at?: string | null
          paid_by?: string | null
          products_count?: number
          services_count?: number
          tenant_id?: string
          total_cost?: number
          total_items_sold?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_cutoffs: {
        Row: {
          breakdown_by_payment_method: Json | null
          breakdown_by_person: Json | null
          commissions_paid: number
          commissions_pending: number
          created_at: string
          created_by: string | null
          gross_profit: number
          id: string
          notes: string | null
          period_end: string
          period_start: string
          tenant_id: string
          total_cost: number
          total_orders: number
          total_revenue: number
        }
        Insert: {
          breakdown_by_payment_method?: Json | null
          breakdown_by_person?: Json | null
          commissions_paid?: number
          commissions_pending?: number
          created_at?: string
          created_by?: string | null
          gross_profit?: number
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          tenant_id: string
          total_cost?: number
          total_orders?: number
          total_revenue?: number
        }
        Update: {
          breakdown_by_payment_method?: Json | null
          breakdown_by_person?: Json | null
          commissions_paid?: number
          commissions_pending?: number
          created_at?: string
          created_by?: string | null
          gross_profit?: number
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          tenant_id?: string
          total_cost?: number
          total_orders?: number
          total_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_cutoffs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cutoffs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_items: {
        Row: {
          created_at: string
          fee_amount: number
          gross_amount: number
          id: string
          net_amount: number
          settlement_id: string
          source_id: string
          source_table: string
        }
        Insert: {
          created_at?: string
          fee_amount?: number
          gross_amount: number
          id?: string
          net_amount: number
          settlement_id: string
          source_id: string
          source_table: string
        }
        Update: {
          created_at?: string
          fee_amount?: number
          gross_amount?: number
          id?: string
          net_amount?: number
          settlement_id?: string
          source_id?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_items_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount_to_transfer: number
          commission_percent: number
          created_at: string
          cycle_type: string
          gross_mp_amount: number
          id: string
          mp_fees_total: number
          net_mp_amount: number
          period_end: string
          period_start: string
          platform_commission: number
          snapshot: Json
          status: string
          tenant_id: string
          transfer_confirmed_at: string | null
          transfer_confirmed_by: string | null
          transfer_reference: string | null
          updated_at: string
        }
        Insert: {
          amount_to_transfer?: number
          commission_percent?: number
          created_at?: string
          cycle_type: string
          gross_mp_amount?: number
          id?: string
          mp_fees_total?: number
          net_mp_amount?: number
          period_end: string
          period_start: string
          platform_commission?: number
          snapshot?: Json
          status?: string
          tenant_id: string
          transfer_confirmed_at?: string | null
          transfer_confirmed_by?: string | null
          transfer_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount_to_transfer?: number
          commission_percent?: number
          created_at?: string
          cycle_type?: string
          gross_mp_amount?: number
          id?: string
          mp_fees_total?: number
          net_mp_amount?: number
          period_end?: string
          period_start?: string
          platform_commission?: number
          snapshot?: Json
          status?: string
          tenant_id?: string
          transfer_confirmed_at?: string | null
          transfer_confirmed_by?: string | null
          transfer_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_templates: {
        Row: {
          config: Json | null
          created_at: string
          default_theme_color: string | null
          description: string | null
          id: string
          layout_variant: string
          name: string
          preview_image_url: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          default_theme_color?: string | null
          description?: string | null
          id?: string
          layout_variant?: string
          name: string
          preview_image_url?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          default_theme_color?: string | null
          description?: string | null
          id?: string
          layout_variant?: string
          name?: string
          preview_image_url?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          installment_number: number
          mp_payment_id: string | null
          mp_preapproval_id: string | null
          net_amount: number | null
          order_id: string | null
          service_fee: number
          status: string
          subscription_id: string
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          installment_number: number
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          net_amount?: number | null
          order_id?: string | null
          service_fee?: number
          status?: string
          subscription_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          installment_number?: number
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          net_amount?: number | null
          order_id?: string | null
          service_fee?: number
          status?: string
          subscription_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          charge_amount: number
          completed_installments: number
          concept: string | null
          created_at: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          discount_percent: number
          discounted_amount: number
          frequency: number
          frequency_type: string
          id: string
          installment_amount: number
          items_snapshot: Json
          mp_fee_absorbed_by: string
          mp_preapproval_id: string | null
          mp_subscription_init_point: string | null
          next_charge_date: string | null
          original_amount: number
          original_order_id: string | null
          service_fee_per_charge: number
          start_date: string | null
          status: string
          tenant_id: string
          total_installments: number | null
          type: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          charge_amount: number
          completed_installments?: number
          concept?: string | null
          created_at?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          discount_percent?: number
          discounted_amount: number
          frequency?: number
          frequency_type: string
          id?: string
          installment_amount: number
          items_snapshot?: Json
          mp_fee_absorbed_by?: string
          mp_preapproval_id?: string | null
          mp_subscription_init_point?: string | null
          next_charge_date?: string | null
          original_amount: number
          original_order_id?: string | null
          service_fee_per_charge?: number
          start_date?: string | null
          status?: string
          tenant_id: string
          total_installments?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          charge_amount?: number
          completed_installments?: number
          concept?: string | null
          created_at?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount_percent?: number
          discounted_amount?: number
          frequency?: number
          frequency_type?: string
          id?: string
          installment_amount?: number
          items_snapshot?: Json
          mp_fee_absorbed_by?: string
          mp_preapproval_id?: string | null
          mp_subscription_init_point?: string | null
          next_charge_date?: string | null
          original_amount?: number
          original_order_id?: string | null
          service_fee_per_charge?: number
          start_date?: string | null
          status?: string
          tenant_id?: string
          total_installments?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_original_order_id_fkey"
            columns: ["original_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_addresses: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          street: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          street?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          street?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_memberships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          role_id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          role_id: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          role_id?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "tenant_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_methods: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          clabe: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          kind: string
          label: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          clabe?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          kind: string
          label?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          clabe?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          kind?: string
          label?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_roles: {
        Row: {
          created_at: string
          id: string
          is_system: boolean
          name: string
          permissions: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          permissions?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          permissions?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_sales_config: {
        Row: {
          created_at: string
          monthly_rent: number
          monthly_sales_objective: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          monthly_rent?: number
          monthly_sales_objective?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          monthly_rent?: number
          monthly_sales_objective?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_sales_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_site_pages: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_enabled: boolean
          position: number
          slug: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          position?: number
          slug: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          position?: number
          slug?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_site_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          banner_url: string | null
          business_type: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          public_store_enabled: boolean
          settings: Json | null
          site_template_id: string | null
          slug: string
          social_links: Json | null
          theme_color: string | null
          updated_at: string
          whatsapp_phone: string | null
        }
        Insert: {
          banner_url?: string | null
          business_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          public_store_enabled?: boolean
          settings?: Json | null
          site_template_id?: string | null
          slug: string
          social_links?: Json | null
          theme_color?: string | null
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Update: {
          banner_url?: string | null
          business_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          public_store_enabled?: boolean
          settings?: Json | null
          site_template_id?: string | null
          slug?: string
          social_links?: Json | null
          theme_color?: string | null
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_site_template_id_fkey"
            columns: ["site_template_id"]
            isOneToOne: false
            referencedRelation: "site_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      payment_ledger: {
        Row: {
          amount_gross: number | null
          created_at: string | null
          external_id: string | null
          fee_amount: number | null
          is_platform_custodied: boolean | null
          kind: string | null
          net_amount: number | null
          order_id: string | null
          payment_method: string | null
          provider: string | null
          source_id: string | null
          source_table: string | null
          status: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      payment_retry_counts: {
        Row: {
          approved_attempts: number | null
          attempts_total: number | null
          failed_attempts: number | null
          last_attempt_at: string | null
          order_id: string | null
          retries: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_manage_tenant_team: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      is_tenant_member: { Args: { p_tenant_id: string }; Returns: boolean }
      recompute_device_fulfillment: {
        Args: { p_device_id: string }
        Returns: undefined
      }
      recompute_order_fulfillment: {
        Args: { p_order_id: string }
        Returns: undefined
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

