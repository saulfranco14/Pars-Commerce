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
      assisted_onboarding_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: NonNullable<Json>
          onboarding_id: string
        }
        ComputedFields: never
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: NonNullable<Json>
          onboarding_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: NonNullable<Json>
          onboarding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assisted_onboarding_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assisted_onboarding_events_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "assisted_onboardings"
            referencedColumns: ["id"]
          },
        ]
      }
      assisted_onboardings: {
        Row: {
          assigned_to: string | null
          billing_mode: string
          catalog_template_key: string | null
          created_at: string
          id: string
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          last_error: string | null
          notes: string | null
          owner_email: string
          owner_name: string | null
          owner_phone: string | null
          owner_user_id: string | null
          provisioning_key: string
          status: string
          tenant_id: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          assigned_to?: string | null
          billing_mode?: string
          catalog_template_key?: string | null
          created_at?: string
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          last_error?: string | null
          notes?: string | null
          owner_email: string
          owner_name?: string | null
          owner_phone?: string | null
          owner_user_id?: string | null
          provisioning_key?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          billing_mode?: string
          catalog_template_key?: string | null
          created_at?: string
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          last_error?: string | null
          notes?: string | null
          owner_email?: string
          owner_name?: string | null
          owner_phone?: string | null
          owner_user_id?: string | null
          provisioning_key?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assisted_onboardings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assisted_onboardings_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assisted_onboardings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_activity_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          id: string
          payload: NonNullable<Json>
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          created_at?: string
          id?: string
          payload?: NonNullable<Json>
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          payload?: NonNullable<Json>
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_activity_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          amount_mxn: number
          billing_interval: string
          code: string
          created_at: string
          entitlements: NonNullable<Json>
          is_active: boolean
          name: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          amount_mxn: number
          billing_interval?: string
          code: string
          created_at?: string
          entitlements?: NonNullable<Json>
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          amount_mxn?: number
          billing_interval?: string
          code?: string
          created_at?: string
          entitlements?: NonNullable<Json>
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_change_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          note: string | null
          price_after: number | null
          price_before: number | null
          product_id: string
          product_variant_id: string | null
          stock_after: number | null
          stock_before: number | null
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          note?: string | null
          price_after?: number | null
          price_before?: number | null
          product_id: string
          product_variant_id?: string | null
          stock_after?: number | null
          stock_before?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          note?: string | null
          price_after?: number | null
          price_before?: number | null
          product_id?: string
          product_variant_id?: string | null
          stock_after?: number | null
          stock_before?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_change_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_change_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_change_events_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_change_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_template_categories: {
        Row: {
          id: string
          name: string
          position: number
          slug: string
          template_id: string
        }
        ComputedFields: never
        Insert: {
          id?: string
          name: string
          position?: number
          slug: string
          template_id: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
          slug?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_template_categories_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "catalog_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_template_items: {
        Row: {
          category_id: string | null
          description: string | null
          id: string
          image_url: string | null
          initial_stock: number
          is_public: boolean
          name: string
          position: number
          price: number
          slug: string
          template_id: string
          track_stock: boolean
          type: string
          unit: string
        }
        ComputedFields: never
        Insert: {
          category_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          initial_stock?: number
          is_public?: boolean
          name: string
          position?: number
          price: number
          slug: string
          template_id: string
          track_stock?: boolean
          type: string
          unit?: string
        }
        Update: {
          category_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          initial_stock?: number
          is_public?: boolean
          name?: string
          position?: number
          price?: number
          slug?: string
          template_id?: string
          track_stock?: boolean
          type?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_template_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_template_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "catalog_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_templates: {
        Row: {
          business_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          updated_at: string
          version: number
        }
        ComputedFields: never
        Insert: {
          business_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          business_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
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
        ComputedFields: never
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
      communication_events: {
        Row: {
          channel: string
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          initiated_by: string | null
          metadata: NonNullable<Json>
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          channel: string
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          initiated_by?: string | null
          metadata?: NonNullable<Json>
          tenant_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          initiated_by?: string | null
          metadata?: NonNullable<Json>
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_events_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_payment_requests: {
        Row: {
          account_id: string
          applied_amount: number
          change_amount: number
          created_at: string
          debt_after: number
          id: string
          idempotency_key: string
          stored_amount: number
          stored_balance_after: number
        }
        ComputedFields: never
        Insert: {
          account_id: string
          applied_amount?: number
          change_amount?: number
          created_at?: string
          debt_after?: number
          id?: string
          idempotency_key: string
          stored_amount?: number
          stored_balance_after?: number
        }
        Update: {
          account_id?: string
          applied_amount?: number
          change_amount?: number
          created_at?: string
          debt_after?: number
          id?: string
          idempotency_key?: string
          stored_amount?: number
          stored_balance_after?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_payment_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_accounts"
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
        ComputedFields: never
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
      customer_credit_accounts: {
        Row: {
          created_at: string
          created_by: string | null
          credit_limit: number
          customer_id: string
          debt_balance: number
          id: string
          internal_notes: string | null
          status: string
          stored_balance: number
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          credit_limit: number
          customer_id: string
          debt_balance?: number
          id?: string
          internal_notes?: string | null
          status?: string
          stored_balance?: number
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credit_limit?: number
          customer_id?: string
          debt_balance?: number
          id?: string
          internal_notes?: string | null
          status?: string
          stored_balance?: number
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_accounts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credit_movements: {
        Row: {
          account_id: string
          change_amount: number
          created_at: string
          created_by: string | null
          debt_after: number
          debt_delta: number
          id: string
          loan_id: string | null
          loan_payment_id: string | null
          movement_type: string
          note: string | null
          order_id: string | null
          received_amount: number
          stored_balance_after: number
          stored_balance_delta: number
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          account_id: string
          change_amount?: number
          created_at?: string
          created_by?: string | null
          debt_after: number
          debt_delta?: number
          id?: string
          loan_id?: string | null
          loan_payment_id?: string | null
          movement_type: string
          note?: string | null
          order_id?: string | null
          received_amount?: number
          stored_balance_after: number
          stored_balance_delta?: number
          tenant_id: string
        }
        Update: {
          account_id?: string
          change_amount?: number
          created_at?: string
          created_by?: string | null
          debt_after?: number
          debt_delta?: number
          id?: string
          loan_id?: string | null
          loan_payment_id?: string | null
          movement_type?: string
          note?: string | null
          order_id?: string | null
          received_amount?: number
          stored_balance_after?: number
          stored_balance_delta?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_movements_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_movements_loan_payment_id_fkey"
            columns: ["loan_payment_id"]
            isOneToOne: false
            referencedRelation: "loan_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_devices: {
        Row: {
          created_at: string
          customer_id: string
          device_hash: string
          id: string
          last_seen_at: string
          revoked_at: string | null
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          customer_id: string
          device_hash: string
          id?: string
          last_seen_at?: string
          revoked_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          device_hash?: string
          id?: string
          last_seen_at?: string
          revoked_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_devices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_document_link_accesses: {
        Row: {
          accessed_at: string
          document_link_id: string
          id: string
          ip_hash: string | null
          user_agent: string | null
        }
        ComputedFields: never
        Insert: {
          accessed_at?: string
          document_link_id: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          document_link_id?: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_document_link_accesses_document_link_id_fkey"
            columns: ["document_link_id"]
            isOneToOne: false
            referencedRelation: "customer_document_links"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_document_links: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          expires_at: string | null
          id: string
          revoked_at: string | null
          tenant_id: string
          token_hash: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          tenant_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          tenant_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_document_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_document_links_tenant_id_fkey"
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
          identity_consent_at: string | null
          last_seen_at: string | null
          mp_customer_id: string | null
          name: string
          normalized_phone: string | null
          notes: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          identity_consent_at?: string | null
          last_seen_at?: string | null
          mp_customer_id?: string | null
          name: string
          normalized_phone?: string | null
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
          identity_consent_at?: string | null
          last_seen_at?: string | null
          mp_customer_id?: string | null
          name?: string
          normalized_phone?: string | null
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
      feature_interest: {
        Row: {
          created_at: string
          created_by: string | null
          feature_key: string
          id: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          feature_key: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          feature_key?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_interest_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_ai_answers: {
        Row: {
          answer: string
          created_at: string
          hits: number
          knowledge_version: string
          last_asked_at: string
          question: string
          question_key: string
          source: string | null
        }
        ComputedFields: never
        Insert: {
          answer: string
          created_at?: string
          hits?: number
          knowledge_version: string
          last_asked_at?: string
          question: string
          question_key: string
          source?: string | null
        }
        Update: {
          answer?: string
          created_at?: string
          hits?: number
          knowledge_version?: string
          last_asked_at?: string
          question?: string
          question_key?: string
          source?: string | null
        }
        Relationships: []
      }
      growth_enrollments: {
        Row: {
          claimed_until: string | null
          created_at: string
          current_step: number
          id: string
          last_sent_at: string | null
          lead_id: string
          mailbox_id: string | null
          next_send_at: string
          status: string
          stop_reason: string | null
          thread_message_id: string | null
          variant: string
        }
        ComputedFields: never
        Insert: {
          claimed_until?: string | null
          created_at?: string
          current_step?: number
          id?: string
          last_sent_at?: string | null
          lead_id: string
          mailbox_id?: string | null
          next_send_at?: string
          status?: string
          stop_reason?: string | null
          thread_message_id?: string | null
          variant?: string
        }
        Update: {
          claimed_until?: string | null
          created_at?: string
          current_step?: number
          id?: string
          last_sent_at?: string | null
          lead_id?: string
          mailbox_id?: string | null
          next_send_at?: string
          status?: string
          stop_reason?: string | null
          thread_message_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "growth_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_enrollments_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "growth_mailboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_imports: {
        Row: {
          assign_to: string | null
          created_at: string
          created_by: string | null
          cursors: NonNullable<Json>
          error: string | null
          finished_at: string | null
          found: number
          giros: string[]
          id: string
          imported: number
          locked_until: string | null
          municipios: string[]
          only_with_contact: boolean
          skipped: number
          source: string
          status: string
          updated: number
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          assign_to?: string | null
          created_at?: string
          created_by?: string | null
          cursors?: NonNullable<Json>
          error?: string | null
          finished_at?: string | null
          found?: number
          giros?: string[]
          id?: string
          imported?: number
          locked_until?: string | null
          municipios?: string[]
          only_with_contact?: boolean
          skipped?: number
          source?: string
          status?: string
          updated?: number
          workspace_id: string
        }
        Update: {
          assign_to?: string | null
          created_at?: string
          created_by?: string | null
          cursors?: NonNullable<Json>
          error?: string | null
          finished_at?: string | null
          found?: number
          giros?: string[]
          id?: string
          imported?: number
          locked_until?: string | null
          municipios?: string[]
          only_with_contact?: boolean
          skipped?: number
          source?: string
          status?: string
          updated?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_imports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "growth_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_lead_events: {
        Row: {
          actor: string
          actor_user_id: string | null
          channel: string | null
          created_at: string
          id: string
          lead_id: string
          payload: NonNullable<Json>
          template_id: string | null
          type: string
        }
        ComputedFields: never
        Insert: {
          actor?: string
          actor_user_id?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          lead_id: string
          payload?: NonNullable<Json>
          template_id?: string | null
          type: string
        }
        Update: {
          actor?: string
          actor_user_id?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          payload?: NonNullable<Json>
          template_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "growth_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_lead_links: {
        Row: {
          channel: string | null
          created_at: string
          expires_at: string
          id: string
          last_viewed_at: string | null
          lead_id: string
          purpose: string
          revoked_at: string | null
          template_id: string | null
          token_cipher: string | null
          token_hash: string
          view_count: number
        }
        ComputedFields: never
        Insert: {
          channel?: string | null
          created_at?: string
          expires_at: string
          id?: string
          last_viewed_at?: string | null
          lead_id: string
          purpose: string
          revoked_at?: string | null
          template_id?: string | null
          token_cipher?: string | null
          token_hash: string
          view_count?: number
        }
        Update: {
          channel?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          last_viewed_at?: string | null
          lead_id?: string
          purpose?: string
          revoked_at?: string | null
          template_id?: string | null
          token_cipher?: string | null
          token_hash?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "growth_lead_links_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "growth_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_leads: {
        Row: {
          activity: string | null
          address: string | null
          appointment_at: string | null
          business_name: string
          catalog_template_key: string | null
          colonia: string | null
          created_at: string
          denue_id: string | null
          drop_reason: string | null
          email: string | null
          email_status: string
          giro: string
          id: string
          last_activity_at: string | null
          last_whatsapp_at: string | null
          lat: number | null
          legal_name: string | null
          lng: number | null
          municipio: string
          next_channel: string
          next_step: string | null
          next_step_at: string | null
          next_step_note: string | null
          owned_at: string | null
          owner_user_id: string | null
          phone_e164: string | null
          phone_status: string
          postal_code: string | null
          registered_tenant_id: string | null
          reserved_by: string | null
          reserved_kind: string | null
          reserved_until: string | null
          revisit_at: string | null
          snoozed_until: string | null
          source: string
          source_detail: string | null
          staff_range: string | null
          stage: string
          updated_at: string
          visit_attempts: number
          visit_status: string
          website: string | null
          whatsapp_attempts: number
          workspace_id: string
          growth_next_channel: string | null
        }
        ComputedFields: "growth_next_channel"
        Insert: {
          activity?: string | null
          address?: string | null
          appointment_at?: string | null
          business_name: string
          catalog_template_key?: string | null
          colonia?: string | null
          created_at?: string
          denue_id?: string | null
          drop_reason?: string | null
          email?: string | null
          email_status?: string
          giro: string
          id?: string
          last_activity_at?: string | null
          last_whatsapp_at?: string | null
          lat?: number | null
          legal_name?: string | null
          lng?: number | null
          municipio: string
          next_channel?: string
          next_step?: string | null
          next_step_at?: string | null
          next_step_note?: string | null
          owned_at?: string | null
          owner_user_id?: string | null
          phone_e164?: string | null
          phone_status?: string
          postal_code?: string | null
          registered_tenant_id?: string | null
          reserved_by?: string | null
          reserved_kind?: string | null
          reserved_until?: string | null
          revisit_at?: string | null
          snoozed_until?: string | null
          source?: string
          source_detail?: string | null
          staff_range?: string | null
          stage?: string
          updated_at?: string
          visit_attempts?: number
          visit_status?: string
          website?: string | null
          whatsapp_attempts?: number
          workspace_id?: string
        }
        Update: {
          activity?: string | null
          address?: string | null
          appointment_at?: string | null
          business_name?: string
          catalog_template_key?: string | null
          colonia?: string | null
          created_at?: string
          denue_id?: string | null
          drop_reason?: string | null
          email?: string | null
          email_status?: string
          giro?: string
          id?: string
          last_activity_at?: string | null
          last_whatsapp_at?: string | null
          lat?: number | null
          legal_name?: string | null
          lng?: number | null
          municipio?: string
          next_channel?: string
          next_step?: string | null
          next_step_at?: string | null
          next_step_note?: string | null
          owned_at?: string | null
          owner_user_id?: string | null
          phone_e164?: string | null
          phone_status?: string
          postal_code?: string | null
          registered_tenant_id?: string | null
          reserved_by?: string | null
          reserved_kind?: string | null
          reserved_until?: string | null
          revisit_at?: string | null
          snoozed_until?: string | null
          source?: string
          source_detail?: string | null
          staff_range?: string | null
          stage?: string
          updated_at?: string
          visit_attempts?: number
          visit_status?: string
          website?: string | null
          whatsapp_attempts?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_leads_registered_tenant_id_fkey"
            columns: ["registered_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "growth_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_mailboxes: {
        Row: {
          address: string
          created_at: string
          daily_cap: number
          display_name: string
          id: string
          imap_last_uid: number
          imap_uid_validity: number | null
          is_active: boolean
          paused_reason: string | null
          secret_env_key: string
          warmup_started_on: string
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          address: string
          created_at?: string
          daily_cap?: number
          display_name: string
          id?: string
          imap_last_uid?: number
          imap_uid_validity?: number | null
          is_active?: boolean
          paused_reason?: string | null
          secret_env_key: string
          warmup_started_on?: string
          workspace_id?: string
        }
        Update: {
          address?: string
          created_at?: string
          daily_cap?: number
          display_name?: string
          id?: string
          imap_last_uid?: number
          imap_uid_validity?: number | null
          is_active?: boolean
          paused_reason?: string | null
          secret_env_key?: string
          warmup_started_on?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_mailboxes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "growth_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_members: {
        Row: {
          daily_goal: number
          display_name: string
          invited_at: string
          invited_by: string | null
          joined_at: string | null
          role: string
          signature: string | null
          status: string
          user_id: string
          whatsapp_e164: string | null
          workspace_id: string
          zones: NonNullable<Json>
        }
        ComputedFields: never
        Insert: {
          daily_goal?: number
          display_name: string
          invited_at?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          signature?: string | null
          status?: string
          user_id: string
          whatsapp_e164?: string | null
          workspace_id: string
          zones?: NonNullable<Json>
        }
        Update: {
          daily_goal?: number
          display_name?: string
          invited_at?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          signature?: string | null
          status?: string
          user_id?: string
          whatsapp_e164?: string | null
          workspace_id?: string
          zones?: NonNullable<Json>
        }
        Relationships: [
          {
            foreignKeyName: "growth_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "growth_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_messages: {
        Row: {
          body: string | null
          channel: string
          classification: string | null
          created_at: string
          direction: string
          enrollment_id: string | null
          error: string | null
          from_address: string | null
          id: string
          in_reply_to: string | null
          lead_id: string | null
          mailbox_id: string | null
          provider_message_id: string | null
          status: string
          step: string | null
          subject: string | null
          template_id: string | null
          to_address: string | null
        }
        ComputedFields: never
        Insert: {
          body?: string | null
          channel?: string
          classification?: string | null
          created_at?: string
          direction: string
          enrollment_id?: string | null
          error?: string | null
          from_address?: string | null
          id?: string
          in_reply_to?: string | null
          lead_id?: string | null
          mailbox_id?: string | null
          provider_message_id?: string | null
          status: string
          step?: string | null
          subject?: string | null
          template_id?: string | null
          to_address?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          classification?: string | null
          created_at?: string
          direction?: string
          enrollment_id?: string | null
          error?: string | null
          from_address?: string | null
          id?: string
          in_reply_to?: string | null
          lead_id?: string | null
          mailbox_id?: string | null
          provider_message_id?: string | null
          status?: string
          step?: string | null
          subject?: string | null
          template_id?: string | null
          to_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_messages_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "growth_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "growth_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_messages_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "growth_mailboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "growth_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_operator_chats: {
        Row: {
          chat_id: number | null
          created_at: string
          id: string
          link_code_hash: string | null
          link_expires_at: string | null
          linked_at: string | null
          notify: boolean
          user_id: string
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          chat_id?: number | null
          created_at?: string
          id?: string
          link_code_hash?: string | null
          link_expires_at?: string | null
          linked_at?: string | null
          notify?: boolean
          user_id: string
          workspace_id?: string
        }
        Update: {
          chat_id?: number | null
          created_at?: string
          id?: string
          link_code_hash?: string | null
          link_expires_at?: string | null
          linked_at?: string | null
          notify?: boolean
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_operator_chats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "growth_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_settings: {
        Row: {
          cta_label: string | null
          digest_hour: number
          email_variant_weights: NonNullable<Json>
          last_digest_on: string | null
          offer_text: string | null
          offer_title: string | null
          paused: boolean
          paused_reason: string | null
          send_days: number[]
          send_end_hour: number
          send_start_hour: number
          signature: string
          timezone: string
          updated_at: string
          visit_municipios: string[]
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          cta_label?: string | null
          digest_hour?: number
          email_variant_weights?: NonNullable<Json>
          last_digest_on?: string | null
          offer_text?: string | null
          offer_title?: string | null
          paused?: boolean
          paused_reason?: string | null
          send_days?: number[]
          send_end_hour?: number
          send_start_hour?: number
          signature?: string
          timezone?: string
          updated_at?: string
          visit_municipios?: string[]
          workspace_id?: string
        }
        Update: {
          cta_label?: string | null
          digest_hour?: number
          email_variant_weights?: NonNullable<Json>
          last_digest_on?: string | null
          offer_text?: string | null
          offer_title?: string | null
          paused?: boolean
          paused_reason?: string | null
          send_days?: number[]
          send_end_hour?: number
          send_start_hour?: number
          signature?: string
          timezone?: string
          updated_at?: string
          visit_municipios?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "growth_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_suppressions: {
        Row: {
          created_at: string
          email: string | null
          id: string
          lead_id: string | null
          phone_e164: string | null
          reason: string
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          phone_e164?: string | null
          reason: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          phone_e164?: string | null
          reason?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_suppressions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "growth_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_suppressions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "growth_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          created_by: string | null
          giro: string | null
          id: string
          status: string
          step: string
          subject: string | null
          variant: string
          version: number
          workspace_id: string
        }
        ComputedFields: never
        Insert: {
          body: string
          channel: string
          created_at?: string
          created_by?: string | null
          giro?: string | null
          id?: string
          status?: string
          step: string
          subject?: string | null
          variant?: string
          version?: number
          workspace_id?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          giro?: string | null
          id?: string
          status?: string
          step?: string
          subject?: string | null
          variant?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "growth_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          tenant_id: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_workspaces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
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
          product_variant_id: string | null
          quantity: number
          reference: string | null
          reference_id: string | null
          type: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          product_variant_id?: string | null
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
          product_variant_id?: string | null
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
          {
            foreignKeyName: "inventory_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_closure_requests: {
        Row: {
          created_at: string
          export_id: string | null
          id: string
          note: string | null
          requested_by: string
          status: string
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          export_id?: string | null
          id?: string
          note?: string | null
          requested_by: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          export_id?: string | null
          id?: string
          note?: string | null
          requested_by?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_closure_requests_export_id_fkey"
            columns: ["export_id"]
            isOneToOne: false
            referencedRelation: "legal_data_exports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_closure_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_closure_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_data_exports: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          expires_at: string | null
          id: string
          requested_by: string
          status: string
          storage_path: string | null
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          requested_by: string
          status?: string
          storage_path?: string | null
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          requested_by?: string
          status?: string
          storage_path?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_data_exports_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_data_exports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_document_versions: {
        Row: {
          content: string
          content_hash: string
          created_at: string
          document_type: string
          effective_at: string | null
          id: string
          published_at: string | null
          status: string
          tenant_id: string | null
          title: string
          version: string
        }
        ComputedFields: never
        Insert: {
          content: string
          content_hash: string
          created_at?: string
          document_type: string
          effective_at?: string | null
          id?: string
          published_at?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          version: string
        }
        Update: {
          content?: string
          content_hash?: string
          created_at?: string
          document_type?: string
          effective_at?: string | null
          id?: string
          published_at?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_document_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_bulk_payments: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          distribution: NonNullable<Json>
          id: string
          loan_ids: string[]
          mp_payment_id: string | null
          mp_preference_id: string
          status: string
          tenant_id: string
          total_amount: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          distribution: NonNullable<Json>
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
          distribution?: NonNullable<Json>
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
        ComputedFields: never
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
          credit_account_id: string | null
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
        ComputedFields: never
        Insert: {
          amount: number
          amount_paid?: number
          amount_pending?: never
          cancelled_at?: string | null
          cancelled_by?: string | null
          concept: string
          created_at?: string
          created_by?: string | null
          credit_account_id?: string | null
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
          amount_pending?: never
          cancelled_at?: string | null
          cancelled_by?: string | null
          concept?: string
          created_at?: string
          created_by?: string | null
          credit_account_id?: string | null
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
            foreignKeyName: "loans_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_accounts"
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
      offer_plan_items: {
        Row: {
          id: string
          plan_id: string
          position: number
          product_id: string
          product_variant_id: string | null
          quantity: number
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          id?: string
          plan_id: string
          position?: number
          product_id: string
          product_variant_id?: string | null
          quantity: number
          tenant_id: string
        }
        Update: {
          id?: string
          plan_id?: string
          position?: number
          product_id?: string
          product_variant_id?: string | null
          quantity?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "offer_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_plan_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_plan_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_plan_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_plans: {
        Row: {
          archived_at: string | null
          billing_methods: string[]
          created_at: string
          description: string | null
          fulfillment_methods: string[]
          grace_days: number
          id: string
          image_url: string | null
          interval_count: number
          interval_unit: string
          kind: string
          max_active_members: number | null
          max_periods: number | null
          name: string
          preferred_weekday: number | null
          price: number
          renewal_lead_days: number
          slug: string
          sort_order: number
          status: string
          template_key: string | null
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          archived_at?: string | null
          billing_methods?: string[]
          created_at?: string
          description?: string | null
          fulfillment_methods?: string[]
          grace_days?: number
          id?: string
          image_url?: string | null
          interval_count?: number
          interval_unit: string
          kind: string
          max_active_members?: number | null
          max_periods?: number | null
          name: string
          preferred_weekday?: number | null
          price: number
          renewal_lead_days?: number
          slug: string
          sort_order?: number
          status?: string
          template_key?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          billing_methods?: string[]
          created_at?: string
          description?: string | null
          fulfillment_methods?: string[]
          grace_days?: number
          id?: string
          image_url?: string | null
          interval_count?: number
          interval_unit?: string
          kind?: string
          max_active_members?: number | null
          max_periods?: number | null
          name?: string
          preferred_weekday?: number | null
          price?: number
          renewal_lead_days?: number
          slug?: string
          sort_order?: number
          status?: string
          template_key?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_plans_tenant_id_fkey"
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
        ComputedFields: never
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
      order_batches: {
        Row: {
          created_at: string
          customer_note: string | null
          device_id: string | null
          id: string
          order_id: string
          source: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          customer_note?: string | null
          device_id?: string | null
          id?: string
          order_id: string
          source?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          customer_note?: string | null
          device_id?: string | null
          id?: string
          order_id?: string
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_batches_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "order_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_batches_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_delivery_details: {
        Row: {
          address_text: string | null
          created_at: string
          latitude: number | null
          longitude: number | null
          mapbox_feature_id: string | null
          order_id: string
          pickup_point_id: string | null
          recipient_name: string | null
          recipient_phone: string | null
          reference: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          address_text?: string | null
          created_at?: string
          latitude?: number | null
          longitude?: number | null
          mapbox_feature_id?: string | null
          order_id: string
          pickup_point_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          address_text?: string | null
          created_at?: string
          latitude?: number | null
          longitude?: number | null
          mapbox_feature_id?: string | null
          order_id?: string
          pickup_point_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_delivery_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_delivery_details_pickup_point_id_fkey"
            columns: ["pickup_point_id"]
            isOneToOne: false
            referencedRelation: "tenant_pickup_points"
            referencedColumns: ["id"]
          },
        ]
      }
      order_delivery_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          order_id: string
          photo_path: string | null
          type: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id: string
          photo_path?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string
          photo_path?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_delivery_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_delivery_events_order_id_fkey"
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
          customer_id: string | null
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
        ComputedFields: never
        Insert: {
          color_hex?: string | null
          created_at?: string
          customer_id?: string | null
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
          customer_id?: string | null
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
            foreignKeyName: "order_devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
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
          batch_id: string | null
          created_at: string
          fulfillment_status: string
          id: string
          is_shared: boolean
          is_wholesale: boolean
          line_kind: string
          list_unit_price: number | null
          offer_group_id: string | null
          order_id: string
          origin_table_label: string | null
          product_id: string
          product_variant_id: string | null
          promotion_id: string | null
          quantity: number
          subscription_id: string | null
          subtotal: number
          unit_price: number
          variant_snapshot: Json | null
          wholesale_savings: number
        }
        ComputedFields: never
        Insert: {
          added_by_device_id?: string | null
          added_by_member_id?: string | null
          batch_id?: string | null
          created_at?: string
          fulfillment_status?: string
          id?: string
          is_shared?: boolean
          is_wholesale?: boolean
          line_kind?: string
          list_unit_price?: number | null
          offer_group_id?: string | null
          order_id: string
          origin_table_label?: string | null
          product_id: string
          product_variant_id?: string | null
          promotion_id?: string | null
          quantity: number
          subscription_id?: string | null
          subtotal: number
          unit_price: number
          variant_snapshot?: Json | null
          wholesale_savings?: number
        }
        Update: {
          added_by_device_id?: string | null
          added_by_member_id?: string | null
          batch_id?: string | null
          created_at?: string
          fulfillment_status?: string
          id?: string
          is_shared?: boolean
          is_wholesale?: boolean
          line_kind?: string
          list_unit_price?: number | null
          offer_group_id?: string | null
          order_id?: string
          origin_table_label?: string | null
          product_id?: string
          product_variant_id?: string | null
          promotion_id?: string | null
          quantity?: number
          subscription_id?: string | null
          subtotal?: number
          unit_price?: number
          variant_snapshot?: Json | null
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
            foreignKeyName: "order_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "order_batches"
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
            foreignKeyName: "order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
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
        ComputedFields: never
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
          provider_connection_id: string | null
          provider_reference: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
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
          provider_connection_id?: string | null
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
          provider_connection_id?: string | null
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
            foreignKeyName: "order_payment_attempts_provider_connection_id_fkey"
            columns: ["provider_connection_id"]
            isOneToOne: false
            referencedRelation: "payment_provider_connections"
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
        ComputedFields: never
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
      order_plan_charges: {
        Row: {
          amount: number
          created_at: string
          id: string
          name_snapshot: string
          offer_plan_id: string | null
          order_id: string
          period_number: number
          subscription_id: string | null
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          created_at?: string
          id?: string
          name_snapshot: string
          offer_plan_id?: string | null
          order_id: string
          period_number: number
          subscription_id?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          name_snapshot?: string
          offer_plan_id?: string | null
          order_id?: string
          period_number?: number
          subscription_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_plan_charges_offer_plan_id_fkey"
            columns: ["offer_plan_id"]
            isOneToOne: false
            referencedRelation: "offer_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_plan_charges_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_plan_charges_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_plan_charges_tenant_id_fkey"
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
        ComputedFields: never
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
        ComputedFields: never
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
      order_transfer_proofs: {
        Row: {
          amount_claimed: number | null
          created_at: string
          file_type: string
          id: string
          order_id: string
          payment_method_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
        }
        ComputedFields: never
        Insert: {
          amount_claimed?: number | null
          created_at?: string
          file_type: string
          id?: string
          order_id: string
          payment_method_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
        }
        Update: {
          amount_claimed?: number | null
          created_at?: string
          file_type?: string
          id?: string
          order_id?: string
          payment_method_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_transfer_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_transfer_proofs_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "tenant_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_transfer_proofs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
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
          delivery_fee: number
          device_id: string | null
          diner_count: number | null
          discount: number
          expires_at: string | null
          fulfillment_method: string | null
          fulfillment_status: string
          id: string
          merge_group_id: string | null
          mp_preference_id: string | null
          order_number: string | null
          order_type: string | null
          paid_at: string | null
          paid_total: number
          parent_order_id: string | null
          payment_link: string | null
          payment_method: string | null
          payment_mode: string
          payment_plan_status: string
          payment_verification_status: string
          pickup_completed_at: string | null
          pickup_completed_by: string | null
          promotion_id: string | null
          public_request_key: string | null
          public_tracking_token: string | null
          qr_code_id: string | null
          rejected_at: string | null
          rejection_reason: string | null
          scheduled_for: string | null
          source: string
          status: string
          subscription_id: string | null
          subscription_installment: number | null
          subtotal: number
          table_label: string | null
          tenant_id: string
          total: number
          transfer_payment_method_id: string | null
          updated_at: string
          whatsapp_request_key: string | null
          work_metadata: Json | null
        }
        ComputedFields: never
        Insert: {
          accepted_at?: string | null
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
          delivery_fee?: number
          device_id?: string | null
          diner_count?: number | null
          discount?: number
          expires_at?: string | null
          fulfillment_method?: string | null
          fulfillment_status?: string
          id?: string
          merge_group_id?: string | null
          mp_preference_id?: string | null
          order_number?: never
          order_type?: string | null
          paid_at?: string | null
          paid_total?: number
          parent_order_id?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_mode?: string
          payment_plan_status?: string
          payment_verification_status?: string
          pickup_completed_at?: string | null
          pickup_completed_by?: string | null
          promotion_id?: string | null
          public_request_key?: string | null
          public_tracking_token?: string | null
          qr_code_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          scheduled_for?: string | null
          source?: string
          status?: string
          subscription_id?: string | null
          subscription_installment?: number | null
          subtotal?: number
          table_label?: string | null
          tenant_id: string
          total?: number
          transfer_payment_method_id?: string | null
          updated_at?: string
          whatsapp_request_key?: string | null
          work_metadata?: Json | null
        }
        Update: {
          accepted_at?: string | null
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
          delivery_fee?: number
          device_id?: string | null
          diner_count?: number | null
          discount?: number
          expires_at?: string | null
          fulfillment_method?: string | null
          fulfillment_status?: string
          id?: string
          merge_group_id?: string | null
          mp_preference_id?: string | null
          order_number?: never
          order_type?: string | null
          paid_at?: string | null
          paid_total?: number
          parent_order_id?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_mode?: string
          payment_plan_status?: string
          payment_verification_status?: string
          pickup_completed_at?: string | null
          pickup_completed_by?: string | null
          promotion_id?: string | null
          public_request_key?: string | null
          public_tracking_token?: string | null
          qr_code_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          scheduled_for?: string | null
          source?: string
          status?: string
          subscription_id?: string | null
          subscription_installment?: number | null
          subtotal?: number
          table_label?: string | null
          tenant_id?: string
          total?: number
          transfer_payment_method_id?: string | null
          updated_at?: string
          whatsapp_request_key?: string | null
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
            foreignKeyName: "orders_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "tenant_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_parent_order_id_fkey"
            columns: ["parent_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pickup_completed_by_fkey"
            columns: ["pickup_completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          {
            foreignKeyName: "orders_transfer_payment_method_id_fkey"
            columns: ["transfer_payment_method_id"]
            isOneToOne: false
            referencedRelation: "tenant_payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_connections: {
        Row: {
          access_token_ciphertext: string | null
          capabilities: NonNullable<Json>
          connected_at: string | null
          connected_by: string | null
          created_at: string
          id: string
          last_error: string | null
          last_synced_at: string | null
          merchant_account_id: string | null
          merchant_display_name: string | null
          oauth_state_expires_at: string | null
          oauth_state_hash: string | null
          pkce_verifier_ciphertext: string | null
          provider: string
          refresh_token_ciphertext: string | null
          revoked_at: string | null
          status: string
          tenant_id: string
          terms_accepted_at: string | null
          terms_version_accepted: string | null
          token_expires_at: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          access_token_ciphertext?: string | null
          capabilities?: NonNullable<Json>
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          merchant_account_id?: string | null
          merchant_display_name?: string | null
          oauth_state_expires_at?: string | null
          oauth_state_hash?: string | null
          pkce_verifier_ciphertext?: string | null
          provider: string
          refresh_token_ciphertext?: string | null
          revoked_at?: string | null
          status?: string
          tenant_id: string
          terms_accepted_at?: string | null
          terms_version_accepted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_ciphertext?: string | null
          capabilities?: NonNullable<Json>
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          merchant_account_id?: string | null
          merchant_display_name?: string | null
          oauth_state_expires_at?: string | null
          oauth_state_hash?: string | null
          pkce_verifier_ciphertext?: string | null
          provider?: string
          refresh_token_ciphertext?: string | null
          revoked_at?: string | null
          status?: string
          tenant_id?: string
          terms_accepted_at?: string | null
          terms_version_accepted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_provider_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_provider_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_events: {
        Row: {
          connection_id: string | null
          event_type: string
          failure_reason: string | null
          id: string
          payload_hash: string
          processed_at: string | null
          processing_status: string
          provider: string
          provider_event_id: string
          received_at: string
          signature_valid: boolean
          tenant_id: string | null
        }
        ComputedFields: never
        Insert: {
          connection_id?: string | null
          event_type: string
          failure_reason?: string | null
          id?: string
          payload_hash: string
          processed_at?: string | null
          processing_status?: string
          provider: string
          provider_event_id: string
          received_at?: string
          signature_valid?: boolean
          tenant_id?: string | null
        }
        Update: {
          connection_id?: string | null
          event_type?: string
          failure_reason?: string | null
          id?: string
          payload_hash?: string
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_event_id?: string
          received_at?: string
          signature_valid?: boolean
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_provider_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "payment_provider_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_provider_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_terminals: {
        Row: {
          branch: string | null
          connection_id: string
          created_at: string
          display_name: string | null
          id: string
          is_default: boolean
          last_synced_at: string | null
          operating_mode: string | null
          pos: string | null
          provider_terminal_id: string
          status: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          branch?: string | null
          connection_id: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_default?: boolean
          last_synced_at?: string | null
          operating_mode?: string | null
          pos?: string | null
          provider_terminal_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          branch?: string | null
          connection_id?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_default?: boolean
          last_synced_at?: string | null
          operating_mode?: string | null
          pos?: string | null
          provider_terminal_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_provider_terminals_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "payment_provider_connections"
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
          funds_owner: string
          id: string
          idempotency_key: string | null
          installment_number: number | null
          merchant_account_id: string | null
          metadata: Json | null
          order_id: string
          payment_kind: string
          platform_fee_amount: number
          processing_fee_amount: number
          provider: string
          provider_connection_id: string | null
          provider_fee_amount: number
          provider_order_id: string | null
          provider_payment_id: string | null
          reconciliation_status: string
          split_group_id: string | null
          status: string
          tip_amount: number
          tip_fee_amount: number
          tip_net_amount: number
          tip_recipient_user_id: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          attempt_id?: string | null
          checkout_session_id?: string | null
          created_at?: string
          external_id?: string | null
          funds_owner?: string
          id?: string
          idempotency_key?: string | null
          installment_number?: number | null
          merchant_account_id?: string | null
          metadata?: Json | null
          order_id: string
          payment_kind?: string
          platform_fee_amount?: number
          processing_fee_amount?: number
          provider: string
          provider_connection_id?: string | null
          provider_fee_amount?: number
          provider_order_id?: string | null
          provider_payment_id?: string | null
          reconciliation_status?: string
          split_group_id?: string | null
          status?: string
          tip_amount?: number
          tip_fee_amount?: number
          tip_net_amount?: number
          tip_recipient_user_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          attempt_id?: string | null
          checkout_session_id?: string | null
          created_at?: string
          external_id?: string | null
          funds_owner?: string
          id?: string
          idempotency_key?: string | null
          installment_number?: number | null
          merchant_account_id?: string | null
          metadata?: Json | null
          order_id?: string
          payment_kind?: string
          platform_fee_amount?: number
          processing_fee_amount?: number
          provider?: string
          provider_connection_id?: string | null
          provider_fee_amount?: number
          provider_order_id?: string | null
          provider_payment_id?: string | null
          reconciliation_status?: string
          split_group_id?: string | null
          status?: string
          tip_amount?: number
          tip_fee_amount?: number
          tip_net_amount?: number
          tip_recipient_user_id?: string | null
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
            foreignKeyName: "payments_provider_connection_id_fkey"
            columns: ["provider_connection_id"]
            isOneToOne: false
            referencedRelation: "payment_provider_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_split_group_id_fkey"
            columns: ["split_group_id"]
            isOneToOne: false
            referencedRelation: "order_split_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tip_recipient_user_id_fkey"
            columns: ["tip_recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_activity_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          payload: NonNullable<Json>
          tenant_id: string | null
        }
        ComputedFields: never
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          payload?: NonNullable<Json>
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          payload?: NonNullable<Json>
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_activity_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_activity_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
        ComputedFields: never
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
      privacy_requests: {
        Row: {
          contact_email: string
          created_at: string
          details: string | null
          due_at: string | null
          id: string
          request_type: string
          requested_by: string | null
          resolved_at: string | null
          status: string
          tenant_id: string | null
        }
        ComputedFields: never
        Insert: {
          contact_email: string
          created_at?: string
          details?: string | null
          due_at?: string | null
          id?: string
          request_type: string
          requested_by?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id?: string | null
        }
        Update: {
          contact_email?: string
          created_at?: string
          details?: string | null
          due_at?: string | null
          id?: string
          request_type?: string
          requested_by?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "privacy_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "privacy_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
        ComputedFields: never
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
        ComputedFields: never
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
      product_option_groups: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          product_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string
          display_order: number
          id: string
          label: string
          option_group_id: string
          swatch_hex: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          label: string
          option_group_id: string
          swatch_hex?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          option_group_id?: string
          swatch_hex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_group_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "product_option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string | null
          id: string
          order_item_id: string
          product_id: string
          published_at: string | null
          rating: number
          status: string
          tenant_id: string
          updated_at: string
          variant_id: string | null
        }
        ComputedFields: never
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          order_item_id: string
          product_id: string
          published_at?: string | null
          rating: number
          status?: string
          tenant_id: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          order_item_id?: string
          product_id?: string
          published_at?: string | null
          rating?: number
          status?: string
          tenant_id?: string
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
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
        ComputedFields: never
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
      product_variant_values: {
        Row: {
          option_value_id: string
          variant_id: string
        }
        ComputedFields: never
        Insert: {
          option_value_id: string
          variant_id: string
        }
        Update: {
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_values_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          archived_at: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          product_id: string
          selection_key: string
          sku: string | null
          stock: number
          track_stock: boolean
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          archived_at?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          price: number
          product_id: string
          selection_key: string
          sku?: string | null
          stock?: number
          track_stock?: boolean
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          product_id?: string
          selection_key?: string
          sku?: string | null
          stock?: number
          track_stock?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          care_instructions: string | null
          commission_amount: number | null
          cost_price: number
          created_at: string
          deleted_at: string | null
          description: string | null
          has_variants: boolean
          id: string
          image_url: string | null
          is_public: boolean
          material_info: string | null
          name: string
          price: number
          size_guide: string | null
          sku: string | null
          slug: string
          sort_order: number
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
        ComputedFields: never
        Insert: {
          care_instructions?: string | null
          commission_amount?: number | null
          cost_price?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          has_variants?: boolean
          id?: string
          image_url?: string | null
          is_public?: boolean
          material_info?: string | null
          name: string
          price: number
          size_guide?: string | null
          sku?: string | null
          slug: string
          sort_order?: number
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
          care_instructions?: string | null
          commission_amount?: number | null
          cost_price?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          has_variants?: boolean
          id?: string
          image_url?: string | null
          is_public?: boolean
          material_info?: string | null
          name?: string
          price?: number
          size_guide?: string | null
          sku?: string | null
          slug?: string
          sort_order?: number
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
          email_verification_reviewed_at: string | null
          email_verification_reviewed_by: string | null
          email_verification_status: string
          id: string
          phone: string | null
          role_type: number | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verification_reviewed_at?: string | null
          email_verification_reviewed_by?: string | null
          email_verification_status?: string
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
          email_verification_reviewed_at?: string | null
          email_verification_reviewed_by?: string | null
          email_verification_status?: string
          id?: string
          phone?: string | null
          role_type?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_email_verification_reviewed_by_fkey"
            columns: ["email_verification_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_images: {
        Row: {
          created_at: string
          id: string
          position: number
          promotion_id: string
          url: string
        }
        ComputedFields: never
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
      promotion_items: {
        Row: {
          created_at: string
          id: string
          position: number
          product_id: string
          promotion_id: string
          quantity: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          position?: number
          product_id: string
          promotion_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          promotion_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotion_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_items_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          applies_to: string
          archived_at: string | null
          badge_label: string | null
          bundle_product_ids: string[] | null
          buy_quantity: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_amount: number | null
          name: string
          pay_quantity: number | null
          product_ids: string[] | null
          quantity: number | null
          sales_channels: string[]
          slug: string | null
          status: string
          subcatalog_ids: string[] | null
          template_key: string | null
          tenant_id: string
          type: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        ComputedFields: never
        Insert: {
          applies_to?: string
          archived_at?: string | null
          badge_label?: string | null
          bundle_product_ids?: string[] | null
          buy_quantity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_amount?: number | null
          name: string
          pay_quantity?: number | null
          product_ids?: string[] | null
          quantity?: number | null
          sales_channels?: string[]
          slug?: string | null
          status?: string
          subcatalog_ids?: string[] | null
          template_key?: string | null
          tenant_id: string
          type: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          applies_to?: string
          archived_at?: string | null
          badge_label?: string | null
          bundle_product_ids?: string[] | null
          buy_quantity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_amount?: number | null
          name?: string
          pay_quantity?: number | null
          product_ids?: string[] | null
          quantity?: number | null
          sales_channels?: string[]
          slug?: string | null
          status?: string
          subcatalog_ids?: string[] | null
          template_key?: string | null
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
          group_id: string | null
          group_unit_quantity: number | null
          id: string
          list_unit_price: number | null
          price_snapshot: number
          product_id: string
          product_variant_id: string | null
          promotion_id: string | null
          quantity: number
        }
        ComputedFields: never
        Insert: {
          added_at?: string
          cart_id: string
          group_id?: string | null
          group_unit_quantity?: number | null
          id?: string
          list_unit_price?: number | null
          price_snapshot: number
          product_id: string
          product_variant_id?: string | null
          promotion_id?: string | null
          quantity: number
        }
        Update: {
          added_at?: string
          cart_id?: string
          group_id?: string | null
          group_unit_quantity?: number | null
          id?: string
          list_unit_price?: number | null
          price_snapshot?: number
          product_id?: string
          product_variant_id?: string | null
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
            foreignKeyName: "public_cart_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
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
      public_cart_plans: {
        Row: {
          billing_method: string
          cart_id: string
          created_at: string
          id: string
          offer_plan_id: string
          price_snapshot: number
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          billing_method?: string
          cart_id: string
          created_at?: string
          id?: string
          offer_plan_id: string
          price_snapshot: number
          tenant_id: string
        }
        Update: {
          billing_method?: string
          cart_id?: string
          created_at?: string
          id?: string
          offer_plan_id?: string
          price_snapshot?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_cart_plans_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "public_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_cart_plans_offer_plan_id_fkey"
            columns: ["offer_plan_id"]
            isOneToOne: false
            referencedRelation: "offer_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_cart_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
        ComputedFields: never
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
        ComputedFields: never
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
      quote_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: NonNullable<Json>
          quote_id: string
          reason: string | null
          source: string | null
        }
        ComputedFields: never
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: NonNullable<Json>
          quote_id: string
          reason?: string | null
          source?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: NonNullable<Json>
          quote_id?: string
          reason?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          description_snapshot: string | null
          id: string
          image_url_snapshot: string | null
          item_type: string
          name_snapshot: string
          position: number
          product_id: string
          quantity: number
          quote_id: string
          subtotal: number
          unit_price: number
        }
        ComputedFields: never
        Insert: {
          description_snapshot?: string | null
          id?: string
          image_url_snapshot?: string | null
          item_type: string
          name_snapshot: string
          position?: number
          product_id: string
          quantity: number
          quote_id: string
          subtotal: number
          unit_price: number
        }
        Update: {
          description_snapshot?: string | null
          id?: string
          image_url_snapshot?: string | null
          item_type?: string
          name_snapshot?: string
          position?: number
          product_id?: string
          quantity?: number
          quote_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          conversion_reason: string | null
          created_at: string
          created_by: string | null
          customer_change_note: string | null
          customer_id: string
          customer_note: string | null
          customer_requested_items: Json | null
          discount: number
          id: string
          internal_notes: string | null
          order_id: string | null
          parent_quote_id: string | null
          public_token_expires_at: string | null
          public_token_hash: string | null
          quote_number: string
          status: string
          subtotal: number
          tenant_id: string
          total: number
          updated_at: string
          updated_by: string | null
          valid_until: string
          version: number
        }
        ComputedFields: never
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          conversion_reason?: string | null
          created_at?: string
          created_by?: string | null
          customer_change_note?: string | null
          customer_id: string
          customer_note?: string | null
          customer_requested_items?: Json | null
          discount?: number
          id?: string
          internal_notes?: string | null
          order_id?: string | null
          parent_quote_id?: string | null
          public_token_expires_at?: string | null
          public_token_hash?: string | null
          quote_number: string
          status?: string
          subtotal?: number
          tenant_id: string
          total?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string
          version?: number
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          conversion_reason?: string | null
          created_at?: string
          created_by?: string | null
          customer_change_note?: string | null
          customer_id?: string
          customer_note?: string | null
          customer_requested_items?: Json | null
          discount?: number
          id?: string
          internal_notes?: string | null
          order_id?: string | null
          parent_quote_id?: string | null
          public_token_expires_at?: string | null
          public_token_hash?: string | null
          quote_number?: string
          status?: string
          subtotal?: number
          tenant_id?: string
          total?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_exports: {
        Row: {
          created_at: string
          filters: NonNullable<Json>
          format: string
          id: string
          report_type: string
          requested_by: string | null
          row_count: number
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          filters?: NonNullable<Json>
          format: string
          id?: string
          report_type: string
          requested_by?: string | null
          row_count?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          filters?: NonNullable<Json>
          format?: string
          id?: string
          report_type?: string
          requested_by?: string | null
          row_count?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_exports_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_exports_tenant_id_fkey"
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
        ComputedFields: never
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
        ComputedFields: never
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
        ComputedFields: never
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
          snapshot: NonNullable<Json>
          status: string
          tenant_id: string
          transfer_confirmed_at: string | null
          transfer_confirmed_by: string | null
          transfer_note: string | null
          transfer_proof_url: string | null
          transfer_reference: string | null
          updated_at: string
        }
        ComputedFields: never
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
          snapshot?: NonNullable<Json>
          status?: string
          tenant_id: string
          transfer_confirmed_at?: string | null
          transfer_confirmed_by?: string | null
          transfer_note?: string | null
          transfer_proof_url?: string | null
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
          snapshot?: NonNullable<Json>
          status?: string
          tenant_id?: string
          transfer_confirmed_at?: string | null
          transfer_confirmed_by?: string | null
          transfer_note?: string | null
          transfer_proof_url?: string | null
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
        ComputedFields: never
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
      storefront_daily_views: {
        Row: {
          day: string
          tenant_id: string
          views: number
          visitor_hash: string
        }
        ComputedFields: never
        Insert: {
          day: string
          tenant_id: string
          views?: number
          visitor_hash: string
        }
        Update: {
          day?: string
          tenant_id?: string
          views?: number
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_daily_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_activity_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          id: string
          metadata: NonNullable<Json>
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          metadata?: NonNullable<Json>
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          metadata?: NonNullable<Json>
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_activity_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_ai_attempts: {
        Row: {
          actual_cost_usd: number | null
          created_at: string
          error_code: string | null
          estimated_cost_usd: number
          external_request_id: string | null
          finished_at: string | null
          id: string
          job_id: string
          model: string
          provider: string
          status: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          actual_cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          estimated_cost_usd?: number
          external_request_id?: string | null
          finished_at?: string | null
          id?: string
          job_id: string
          model: string
          provider: string
          status: string
          tenant_id: string
        }
        Update: {
          actual_cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          estimated_cost_usd?: number
          external_request_id?: string | null
          finished_at?: string | null
          id?: string
          job_id?: string
          model?: string
          provider?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_ai_attempts_tenant_id_job_id_fkey"
            columns: ["tenant_id", "job_id"]
            isOneToOne: false
            referencedRelation: "studio_ai_jobs"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      studio_ai_jobs: {
        Row: {
          attempt_count: number
          available_at: string
          budget_usd: number
          created_at: string
          design_id: string
          error_code: string | null
          id: string
          idempotency_key: string
          input_asset_id: string
          instructions: string
          lease_token: string | null
          lease_until: string | null
          operation: string
          polling_url: string | null
          provider_request_id: string | null
          quality: string
          queue_message_id: number | null
          quote_id: string
          requested_by: string
          reserved_tlacos: number
          result_asset_id: string | null
          route_id: string
          route_snapshot: NonNullable<Json>
          status: string
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          attempt_count?: number
          available_at?: string
          budget_usd: number
          created_at?: string
          design_id: string
          error_code?: string | null
          id?: string
          idempotency_key: string
          input_asset_id: string
          instructions: string
          lease_token?: string | null
          lease_until?: string | null
          operation: string
          polling_url?: string | null
          provider_request_id?: string | null
          quality: string
          queue_message_id?: number | null
          quote_id: string
          requested_by: string
          reserved_tlacos: number
          result_asset_id?: string | null
          route_id: string
          route_snapshot: NonNullable<Json>
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          available_at?: string
          budget_usd?: number
          created_at?: string
          design_id?: string
          error_code?: string | null
          id?: string
          idempotency_key?: string
          input_asset_id?: string
          instructions?: string
          lease_token?: string | null
          lease_until?: string | null
          operation?: string
          polling_url?: string | null
          provider_request_id?: string | null
          quality?: string
          queue_message_id?: number | null
          quote_id?: string
          requested_by?: string
          reserved_tlacos?: number
          result_asset_id?: string | null
          route_id?: string
          route_snapshot?: NonNullable<Json>
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_ai_jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "studio_ai_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_ai_jobs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "studio_ai_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_ai_jobs_tenant_id_design_id_fkey"
            columns: ["tenant_id", "design_id"]
            isOneToOne: false
            referencedRelation: "studio_designs"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "studio_ai_jobs_tenant_id_design_id_input_asset_id_fkey"
            columns: ["tenant_id", "design_id", "input_asset_id"]
            isOneToOne: false
            referencedRelation: "studio_assets"
            referencedColumns: ["tenant_id", "design_id", "id"]
          },
          {
            foreignKeyName: "studio_ai_jobs_tenant_id_design_id_result_asset_id_fkey"
            columns: ["tenant_id", "design_id", "result_asset_id"]
            isOneToOne: false
            referencedRelation: "studio_assets"
            referencedColumns: ["tenant_id", "design_id", "id"]
          },
        ]
      }
      studio_ai_quotes: {
        Row: {
          asset_id: string
          budget_usd: number
          cost: number
          created_at: string
          design_id: string
          expires_at: string
          id: string
          instructions: string
          operation: string
          quality: string
          requested_by: string
          route_id: string
          route_snapshot: NonNullable<Json>
          route_version: number
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          asset_id: string
          budget_usd: number
          cost: number
          created_at?: string
          design_id: string
          expires_at?: string
          id?: string
          instructions: string
          operation: string
          quality: string
          requested_by: string
          route_id: string
          route_snapshot: NonNullable<Json>
          route_version: number
          tenant_id: string
        }
        Update: {
          asset_id?: string
          budget_usd?: number
          cost?: number
          created_at?: string
          design_id?: string
          expires_at?: string
          id?: string
          instructions?: string
          operation?: string
          quality?: string
          requested_by?: string
          route_id?: string
          route_snapshot?: NonNullable<Json>
          route_version?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_ai_quotes_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "studio_ai_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_ai_quotes_tenant_id_design_id_asset_id_fkey"
            columns: ["tenant_id", "design_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "studio_assets"
            referencedColumns: ["tenant_id", "design_id", "id"]
          },
        ]
      }
      studio_ai_reviews: {
        Row: {
          created_at: string
          design_id: string
          design_version_id: string
          estimated_cost_usd: number
          evaluator_version: string
          findings: NonNullable<Json>
          id: string
          recommendations: NonNullable<Json>
          requested_by: string
          scene_hash: string
          source_hash: string
          status: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          design_id: string
          design_version_id: string
          estimated_cost_usd: number
          evaluator_version: string
          findings?: NonNullable<Json>
          id?: string
          recommendations?: NonNullable<Json>
          requested_by: string
          scene_hash: string
          source_hash: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          design_id?: string
          design_version_id?: string
          estimated_cost_usd?: number
          evaluator_version?: string
          findings?: NonNullable<Json>
          id?: string
          recommendations?: NonNullable<Json>
          requested_by?: string
          scene_hash?: string
          source_hash?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_ai_reviews_tenant_id_design_id_design_version_id_fkey"
            columns: ["tenant_id", "design_id", "design_version_id"]
            isOneToOne: false
            referencedRelation: "studio_design_versions"
            referencedColumns: ["tenant_id", "design_id", "id"]
          },
        ]
      }
      studio_ai_routes: {
        Row: {
          config_version: number
          estimated_cost_usd: number
          id: string
          is_active: boolean
          model_env: string
          operation: string
          priority: number
          provider: string
          quality: string
          tlacos: number
        }
        ComputedFields: never
        Insert: {
          config_version?: number
          estimated_cost_usd: number
          id?: string
          is_active?: boolean
          model_env: string
          operation: string
          priority?: number
          provider: string
          quality: string
          tlacos: number
        }
        Update: {
          config_version?: number
          estimated_cost_usd?: number
          id?: string
          is_active?: boolean
          model_env?: string
          operation?: string
          priority?: number
          provider?: string
          quality?: string
          tlacos?: number
        }
        Relationships: []
      }
      studio_assets: {
        Row: {
          byte_size: number | null
          checksum: string | null
          created_at: string
          design_id: string
          height: number | null
          id: string
          kind: string
          metadata: NonNullable<Json>
          mime_type: string
          provider: string | null
          source_asset_id: string | null
          status: string
          storage_path: string
          tenant_id: string
          width: number | null
        }
        ComputedFields: never
        Insert: {
          byte_size?: number | null
          checksum?: string | null
          created_at?: string
          design_id: string
          height?: number | null
          id?: string
          kind: string
          metadata?: NonNullable<Json>
          mime_type: string
          provider?: string | null
          source_asset_id?: string | null
          status?: string
          storage_path: string
          tenant_id: string
          width?: number | null
        }
        Update: {
          byte_size?: number | null
          checksum?: string | null
          created_at?: string
          design_id?: string
          height?: number | null
          id?: string
          kind?: string
          metadata?: NonNullable<Json>
          mime_type?: string
          provider?: string | null
          source_asset_id?: string | null
          status?: string
          storage_path?: string
          tenant_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_assets_tenant_id_design_id_fkey"
            columns: ["tenant_id", "design_id"]
            isOneToOne: false
            referencedRelation: "studio_designs"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "studio_assets_tenant_id_design_id_source_asset_id_fkey"
            columns: ["tenant_id", "design_id", "source_asset_id"]
            isOneToOne: false
            referencedRelation: "studio_assets"
            referencedColumns: ["tenant_id", "design_id", "id"]
          },
        ]
      }
      studio_credit_grants: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          external_reference: string
          id: string
          kind: string
          payment_id: string | null
          remaining: number
          reserved: number
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string | null
          external_reference: string
          id?: string
          kind: string
          payment_id?: string | null
          remaining: number
          reserved?: number
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          external_reference?: string
          id?: string
          kind?: string
          payment_id?: string | null
          remaining?: number
          reserved?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_credit_grants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_credit_grants_tenant_id_payment_id_fkey"
            columns: ["tenant_id", "payment_id"]
            isOneToOne: false
            referencedRelation: "studio_payments"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      studio_credit_ledger: {
        Row: {
          created_at: string
          delta: number
          external_reference: string
          grant_id: string | null
          id: string
          job_id: string | null
          reason: string
          reservation_id: string | null
          reserved_delta: number
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          delta?: number
          external_reference: string
          grant_id?: string | null
          id?: string
          job_id?: string | null
          reason: string
          reservation_id?: string | null
          reserved_delta?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          external_reference?: string
          grant_id?: string | null
          id?: string
          job_id?: string | null
          reason?: string
          reservation_id?: string | null
          reserved_delta?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_credit_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_credit_ledger_tenant_id_grant_id_fkey"
            columns: ["tenant_id", "grant_id"]
            isOneToOne: false
            referencedRelation: "studio_credit_grants"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "studio_credit_ledger_tenant_id_reservation_id_fkey"
            columns: ["tenant_id", "reservation_id"]
            isOneToOne: false
            referencedRelation: "studio_credit_reservations"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "studio_ledger_job_fk"
            columns: ["tenant_id", "job_id"]
            isOneToOne: false
            referencedRelation: "studio_ai_jobs"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      studio_credit_orders: {
        Row: {
          amount_mxn: number
          catalog_version: number
          created_at: string
          created_by: string
          id: string
          idempotency_key: string
          init_point: string | null
          last_reconciled_at: string | null
          pack_code: string
          provider_payment_id: string | null
          provider_preference_id: string | null
          status: string
          tenant_id: string
          tlacos: number
        }
        ComputedFields: never
        Insert: {
          amount_mxn: number
          catalog_version: number
          created_at?: string
          created_by: string
          id?: string
          idempotency_key: string
          init_point?: string | null
          last_reconciled_at?: string | null
          pack_code: string
          provider_payment_id?: string | null
          provider_preference_id?: string | null
          status?: string
          tenant_id: string
          tlacos: number
        }
        Update: {
          amount_mxn?: number
          catalog_version?: number
          created_at?: string
          created_by?: string
          id?: string
          idempotency_key?: string
          init_point?: string | null
          last_reconciled_at?: string | null
          pack_code?: string
          provider_payment_id?: string | null
          provider_preference_id?: string | null
          status?: string
          tenant_id?: string
          tlacos?: number
        }
        Relationships: [
          {
            foreignKeyName: "studio_credit_orders_pack_code_fkey"
            columns: ["pack_code"]
            isOneToOne: false
            referencedRelation: "studio_credit_packs"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "studio_credit_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_credit_packs: {
        Row: {
          amount_mxn: number
          catalog_version: number
          code: string
          is_active: boolean
          name: string
          tlacos: number
        }
        ComputedFields: never
        Insert: {
          amount_mxn: number
          catalog_version?: number
          code: string
          is_active?: boolean
          name: string
          tlacos: number
        }
        Update: {
          amount_mxn?: number
          catalog_version?: number
          code?: string
          is_active?: boolean
          name?: string
          tlacos?: number
        }
        Relationships: []
      }
      studio_credit_reservation_items: {
        Row: {
          amount: number
          grant_id: string
          reservation_id: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          grant_id: string
          reservation_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          grant_id?: string
          reservation_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_credit_reservation_items_tenant_id_grant_id_fkey"
            columns: ["tenant_id", "grant_id"]
            isOneToOne: false
            referencedRelation: "studio_credit_grants"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "studio_credit_reservation_items_tenant_id_reservation_id_fkey"
            columns: ["tenant_id", "reservation_id"]
            isOneToOne: false
            referencedRelation: "studio_credit_reservations"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      studio_credit_reservations: {
        Row: {
          amount: number
          created_at: string
          expires_at: string
          id: string
          job_id: string
          status: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string
          id?: string
          job_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string
          id?: string
          job_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_credit_reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_reservation_job_fk"
            columns: ["tenant_id", "job_id"]
            isOneToOne: false
            referencedRelation: "studio_ai_jobs"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      studio_design_versions: {
        Row: {
          created_at: string
          created_by: string
          design_id: string
          id: string
          is_preparation: boolean
          scene_hash: string
          scene_json: NonNullable<Json>
          scene_schema_version: number
          source_hash: string
          source_snapshot: NonNullable<Json>
          tenant_id: string
          version: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by: string
          design_id: string
          id?: string
          is_preparation?: boolean
          scene_hash: string
          scene_json: NonNullable<Json>
          scene_schema_version?: number
          source_hash: string
          source_snapshot: NonNullable<Json>
          tenant_id: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string
          design_id?: string
          id?: string
          is_preparation?: boolean
          scene_hash?: string
          scene_json?: NonNullable<Json>
          scene_schema_version?: number
          source_hash?: string
          source_snapshot?: NonNullable<Json>
          tenant_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "studio_design_versions_tenant_id_design_id_fkey"
            columns: ["tenant_id", "design_id"]
            isOneToOne: false
            referencedRelation: "studio_designs"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      studio_designs: {
        Row: {
          active_version_id: string | null
          copy: string
          created_at: string
          created_by: string
          destination_url: string
          draft_scene: NonNullable<Json>
          id: string
          idempotency_key: string
          revision: number
          source_hash: string
          source_id: string | null
          source_snapshot: NonNullable<Json>
          source_type: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          active_version_id?: string | null
          copy?: string
          created_at?: string
          created_by: string
          destination_url?: string
          draft_scene: NonNullable<Json>
          id?: string
          idempotency_key: string
          revision?: number
          source_hash: string
          source_id?: string | null
          source_snapshot: NonNullable<Json>
          source_type: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          copy?: string
          created_at?: string
          created_by?: string
          destination_url?: string
          draft_scene?: NonNullable<Json>
          id?: string
          idempotency_key?: string
          revision?: number
          source_hash?: string
          source_id?: string | null
          source_snapshot?: NonNullable<Json>
          source_type?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_design_active_version_fk"
            columns: ["tenant_id", "id", "active_version_id"]
            isOneToOne: false
            referencedRelation: "studio_design_versions"
            referencedColumns: ["tenant_id", "design_id", "id"]
          },
          {
            foreignKeyName: "studio_designs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_payment_events: {
        Row: {
          attempts: number
          error_code: string | null
          event_key: string
          id: string
          last_attempt_at: string | null
          payload_hash: string
          processed_at: string | null
          received_at: string
          resource_id: string
          resource_type: string
          status: string
          tenant_id: string | null
        }
        ComputedFields: never
        Insert: {
          attempts?: number
          error_code?: string | null
          event_key: string
          id?: string
          last_attempt_at?: string | null
          payload_hash: string
          processed_at?: string | null
          received_at?: string
          resource_id: string
          resource_type: string
          status?: string
          tenant_id?: string | null
        }
        Update: {
          attempts?: number
          error_code?: string | null
          event_key?: string
          id?: string
          last_attempt_at?: string | null
          payload_hash?: string
          processed_at?: string | null
          received_at?: string
          resource_id?: string
          resource_type?: string
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_payment_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_payments: {
        Row: {
          amount_mxn: number
          authorized_payment_id: string | null
          created_at: string
          credit_order_id: string | null
          currency: string
          id: string
          last_reconciled_at: string | null
          paid_at: string | null
          provider_payment_id: string
          refunded_mxn: number
          status: string
          subscription_id: string | null
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          amount_mxn: number
          authorized_payment_id?: string | null
          created_at?: string
          credit_order_id?: string | null
          currency: string
          id?: string
          last_reconciled_at?: string | null
          paid_at?: string | null
          provider_payment_id: string
          refunded_mxn?: number
          status: string
          subscription_id?: string | null
          tenant_id: string
        }
        Update: {
          amount_mxn?: number
          authorized_payment_id?: string | null
          created_at?: string
          credit_order_id?: string | null
          currency?: string
          id?: string
          last_reconciled_at?: string | null
          paid_at?: string | null
          provider_payment_id?: string
          refunded_mxn?: number
          status?: string
          subscription_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_payments_credit_order_id_fkey"
            columns: ["credit_order_id"]
            isOneToOne: false
            referencedRelation: "studio_credit_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_studio_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_placements: {
        Row: {
          alt_text: string
          applied_by: string
          channel: string
          created_at: string
          design_id: string
          design_version_id: string
          destination_url: string
          disabled_reason: string | null
          ends_at: string | null
          id: string
          idempotency_key: string
          is_active: boolean
          render_id: string
          source_hash: string
          source_id: string | null
          source_type: string
          starts_at: string
          surface: string
          target_key: string
          tenant_id: string
          title: string
        }
        ComputedFields: never
        Insert: {
          alt_text: string
          applied_by: string
          channel: string
          created_at?: string
          design_id: string
          design_version_id: string
          destination_url?: string
          disabled_reason?: string | null
          ends_at?: string | null
          id?: string
          idempotency_key: string
          is_active?: boolean
          render_id: string
          source_hash: string
          source_id?: string | null
          source_type: string
          starts_at?: string
          surface: string
          target_key: string
          tenant_id: string
          title: string
        }
        Update: {
          alt_text?: string
          applied_by?: string
          channel?: string
          created_at?: string
          design_id?: string
          design_version_id?: string
          destination_url?: string
          disabled_reason?: string | null
          ends_at?: string | null
          id?: string
          idempotency_key?: string
          is_active?: boolean
          render_id?: string
          source_hash?: string
          source_id?: string | null
          source_type?: string
          starts_at?: string
          surface?: string
          target_key?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_placements_tenant_id_design_id_design_version_id_fkey"
            columns: ["tenant_id", "design_id", "design_version_id"]
            isOneToOne: false
            referencedRelation: "studio_design_versions"
            referencedColumns: ["tenant_id", "design_id", "id"]
          },
          {
            foreignKeyName: "studio_placements_tenant_id_render_id_fkey"
            columns: ["tenant_id", "render_id"]
            isOneToOne: false
            referencedRelation: "studio_renders"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      studio_plans: {
        Row: {
          amount_mxn: number
          catalog_version: number
          code: string
          is_active: boolean
          monthly_reviews: number
          monthly_tlacos: number
          name: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          amount_mxn: number
          catalog_version?: number
          code: string
          is_active?: boolean
          monthly_reviews: number
          monthly_tlacos: number
          name: string
          updated_at?: string
        }
        Update: {
          amount_mxn?: number
          catalog_version?: number
          code?: string
          is_active?: boolean
          monthly_reviews?: number
          monthly_tlacos?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      studio_rate_limits: {
        Row: {
          hits: number
          scope: string
          window_start: string
        }
        ComputedFields: never
        Insert: {
          hits?: number
          scope: string
          window_start: string
        }
        Update: {
          hits?: number
          scope?: string
          window_start?: string
        }
        Relationships: []
      }
      studio_renders: {
        Row: {
          asset_id: string
          created_at: string
          design_id: string
          design_version_id: string
          format: string
          id: string
          renderer_version: number
          surface: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          asset_id: string
          created_at?: string
          design_id: string
          design_version_id: string
          format: string
          id?: string
          renderer_version?: number
          surface?: string
          tenant_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          design_id?: string
          design_version_id?: string
          format?: string
          id?: string
          renderer_version?: number
          surface?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_renders_tenant_id_design_id_asset_id_fkey"
            columns: ["tenant_id", "design_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "studio_assets"
            referencedColumns: ["tenant_id", "design_id", "id"]
          },
          {
            foreignKeyName: "studio_renders_tenant_id_design_id_design_version_id_fkey"
            columns: ["tenant_id", "design_id", "design_version_id"]
            isOneToOne: false
            referencedRelation: "studio_design_versions"
            referencedColumns: ["tenant_id", "design_id", "id"]
          },
        ]
      }
      studio_runtime_limits: {
        Row: {
          daily_budget_usd: number
          id: boolean
          max_concurrent: number
          tenant_monthly_budget_usd: number
        }
        ComputedFields: never
        Insert: {
          daily_budget_usd?: number
          id?: boolean
          max_concurrent?: number
          tenant_monthly_budget_usd?: number
        }
        Update: {
          daily_budget_usd?: number
          id?: boolean
          max_concurrent?: number
          tenant_monthly_budget_usd?: number
        }
        Relationships: []
      }
      studio_share_events: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          design_id: string
          design_version_id: string
          id: string
          idempotency_key: string
          target: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          design_id: string
          design_version_id: string
          id?: string
          idempotency_key: string
          target: string
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          design_id?: string
          design_version_id?: string
          id?: string
          idempotency_key?: string
          target?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_share_events_tenant_id_design_id_design_version_id_fkey"
            columns: ["tenant_id", "design_id", "design_version_id"]
            isOneToOne: false
            referencedRelation: "studio_design_versions"
            referencedColumns: ["tenant_id", "design_id", "id"]
          },
        ]
      }
      studio_subscription_periods: {
        Row: {
          amount_mxn: number
          created_at: string
          ends_at: string
          id: string
          payment_id: string
          plan_code: string
          starts_at: string
          subscription_id: string
          tenant_id: string
          tlacos: number
        }
        ComputedFields: never
        Insert: {
          amount_mxn: number
          created_at?: string
          ends_at: string
          id?: string
          payment_id: string
          plan_code: string
          starts_at: string
          subscription_id: string
          tenant_id: string
          tlacos: number
        }
        Update: {
          amount_mxn?: number
          created_at?: string
          ends_at?: string
          id?: string
          payment_id?: string
          plan_code?: string
          starts_at?: string
          subscription_id?: string
          tenant_id?: string
          tlacos?: number
        }
        Relationships: [
          {
            foreignKeyName: "studio_subscription_periods_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "studio_plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "studio_subscription_periods_tenant_id_payment_id_fkey"
            columns: ["tenant_id", "payment_id"]
            isOneToOne: false
            referencedRelation: "studio_payments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "studio_subscription_periods_tenant_id_subscription_id_fkey"
            columns: ["tenant_id", "subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_studio_subscriptions"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
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
        ComputedFields: never
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
      subscription_periods: {
        Row: {
          amount: number
          created_at: string
          due_at: string
          ends_at: string
          id: string
          mp_payment_id: string | null
          order_id: string | null
          paid_at: string | null
          payment_source: string | null
          period_number: number
          starts_at: string
          status: string
          subscription_id: string
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          created_at?: string
          due_at: string
          ends_at: string
          id?: string
          mp_payment_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_source?: string | null
          period_number: number
          starts_at: string
          status?: string
          subscription_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_at?: string
          ends_at?: string
          id?: string
          mp_payment_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_source?: string | null
          period_number?: number
          starts_at?: string
          status?: string
          subscription_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_periods_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_periods_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_method: string | null
          cancel_at_period_end: boolean
          cancelled_at: string | null
          charge_amount: number
          completed_installments: number
          concept: string | null
          created_at: string
          current_period_end: string | null
          current_period_number: number
          current_period_start: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          discount_percent: number
          discounted_amount: number
          frequency: number
          frequency_type: string
          fulfillment_snapshot: Json | null
          id: string
          installment_amount: number
          items_snapshot: NonNullable<Json>
          mp_fee_absorbed_by: string
          mp_preapproval_id: string | null
          mp_subscription_init_point: string | null
          next_charge_date: string | null
          offer_plan_id: string | null
          original_amount: number
          original_order_id: string | null
          past_due_since: string | null
          plan_kind: string | null
          plan_snapshot: Json | null
          public_token: string | null
          service_fee_per_charge: number
          start_date: string | null
          status: string
          tenant_id: string
          total_installments: number | null
          type: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          billing_method?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          charge_amount: number
          completed_installments?: number
          concept?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_number?: number
          current_period_start?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          discount_percent?: number
          discounted_amount: number
          frequency?: number
          frequency_type: string
          fulfillment_snapshot?: Json | null
          id?: string
          installment_amount: number
          items_snapshot?: NonNullable<Json>
          mp_fee_absorbed_by?: string
          mp_preapproval_id?: string | null
          mp_subscription_init_point?: string | null
          next_charge_date?: string | null
          offer_plan_id?: string | null
          original_amount: number
          original_order_id?: string | null
          past_due_since?: string | null
          plan_kind?: string | null
          plan_snapshot?: Json | null
          public_token?: string | null
          service_fee_per_charge?: number
          start_date?: string | null
          status?: string
          tenant_id: string
          total_installments?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          billing_method?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          charge_amount?: number
          completed_installments?: number
          concept?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_number?: number
          current_period_start?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount_percent?: number
          discounted_amount?: number
          frequency?: number
          frequency_type?: string
          fulfillment_snapshot?: Json | null
          id?: string
          installment_amount?: number
          items_snapshot?: NonNullable<Json>
          mp_fee_absorbed_by?: string
          mp_preapproval_id?: string | null
          mp_subscription_init_point?: string | null
          next_charge_date?: string | null
          offer_plan_id?: string | null
          original_amount?: number
          original_order_id?: string | null
          past_due_since?: string | null
          plan_kind?: string | null
          plan_snapshot?: Json | null
          public_token?: string | null
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
            foreignKeyName: "subscriptions_offer_plan_id_fkey"
            columns: ["offer_plan_id"]
            isOneToOne: false
            referencedRelation: "offer_plans"
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
      tenant_acquisitions: {
        Row: {
          acquired_by: string | null
          bucket: string
          captured_at: string
          channel: string | null
          heard_from: string | null
          lead_id: string | null
          tenant_id: string
          utm: NonNullable<Json>
        }
        ComputedFields: never
        Insert: {
          acquired_by?: string | null
          bucket: string
          captured_at?: string
          channel?: string | null
          heard_from?: string | null
          lead_id?: string | null
          tenant_id: string
          utm?: NonNullable<Json>
        }
        Update: {
          acquired_by?: string | null
          bucket?: string
          captured_at?: string
          channel?: string | null
          heard_from?: string | null
          lead_id?: string | null
          tenant_id?: string
          utm?: NonNullable<Json>
        }
        Relationships: [
          {
            foreignKeyName: "tenant_acquisitions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "growth_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_acquisitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
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
        ComputedFields: never
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
      tenant_billing_accounts: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          grace_ends_at: string | null
          mp_init_point: string | null
          mp_preapproval_id: string | null
          plan_code: string
          status: string
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_ends_at?: string | null
          mp_init_point?: string | null
          mp_preapproval_id?: string | null
          plan_code?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_ends_at?: string | null
          mp_init_point?: string | null
          mp_preapproval_id?: string | null
          plan_code?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_billing_accounts_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tenant_billing_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_billing_items: {
        Row: {
          amount: number
          created_at: string
          id: string
          period: string
          provider: string | null
          source: string
          source_reference: string
          status: string
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          created_at?: string
          id?: string
          period: string
          provider?: string | null
          source: string
          source_reference: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          period?: string
          provider?: string | null
          source?: string
          source_reference?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_billing_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_billing_payments: {
        Row: {
          billing_account_tenant_id: string
          created_at: string
          external_payment_id: string | null
          gross_amount: number
          id: string
          net_amount: number
          paid_at: string | null
          processing_fee_amount: number
          provider: string
          raw_event_reference: string | null
          status: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          billing_account_tenant_id: string
          created_at?: string
          external_payment_id?: string | null
          gross_amount?: number
          id?: string
          net_amount?: number
          paid_at?: string | null
          processing_fee_amount?: number
          provider?: string
          raw_event_reference?: string | null
          status: string
          tenant_id: string
        }
        Update: {
          billing_account_tenant_id?: string
          created_at?: string
          external_payment_id?: string | null
          gross_amount?: number
          id?: string
          net_amount?: number
          paid_at?: string | null
          processing_fee_amount?: number
          provider?: string
          raw_event_reference?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_billing_payments_billing_account_tenant_id_fkey"
            columns: ["billing_account_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_billing_accounts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_billing_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_catalog_approvals: {
        Row: {
          acceptance_source: string
          accepted_at: string
          accepted_by: string | null
          catalog_template_id: string | null
          catalog_template_version: number | null
          id: string
          item_count: number
          note: string | null
          price_snapshot: NonNullable<Json>
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          acceptance_source: string
          accepted_at?: string
          accepted_by?: string | null
          catalog_template_id?: string | null
          catalog_template_version?: number | null
          id?: string
          item_count?: number
          note?: string | null
          price_snapshot?: NonNullable<Json>
          tenant_id: string
        }
        Update: {
          acceptance_source?: string
          accepted_at?: string
          accepted_by?: string | null
          catalog_template_id?: string | null
          catalog_template_version?: number | null
          id?: string
          item_count?: number
          note?: string | null
          price_snapshot?: NonNullable<Json>
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_catalog_approvals_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_catalog_approvals_catalog_template_id_fkey"
            columns: ["catalog_template_id"]
            isOneToOne: false
            referencedRelation: "catalog_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_catalog_approvals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_checkout_legal_acceptances: {
        Row: {
          acceptance_kind: string
          accepted: boolean
          accepted_at: string
          cart_id: string | null
          created_at: string
          document_snapshot: NonNullable<Json>
          fingerprint_hash: string | null
          id: string
          order_id: string | null
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          acceptance_kind: string
          accepted: boolean
          accepted_at?: string
          cart_id?: string | null
          created_at?: string
          document_snapshot: NonNullable<Json>
          fingerprint_hash?: string | null
          id?: string
          order_id?: string | null
          tenant_id: string
        }
        Update: {
          acceptance_kind?: string
          accepted?: boolean
          accepted_at?: string
          cart_id?: string | null
          created_at?: string
          document_snapshot?: NonNullable<Json>
          fingerprint_hash?: string | null
          id?: string
          order_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_checkout_legal_acceptances_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "public_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_checkout_legal_acceptances_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_checkout_legal_acceptances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_credit_policies: {
        Row: {
          block_overdue_loans: boolean
          created_at: string
          max_recommendation_percent: number
          min_paid_last_90_days: number
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          block_overdue_loans?: boolean
          created_at?: string
          max_recommendation_percent?: number
          min_paid_last_90_days?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          block_overdue_loans?: boolean
          created_at?: string
          max_recommendation_percent?: number
          min_paid_last_90_days?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_credit_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_devices: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          claimed_at: string | null
          created_at: string
          enroll_code: string
          id: string
          install_id: string
          kind: string
          last_seen_at: string | null
          name: string | null
          requested_at: string
          screen_info: string | null
          status: string
          tenant_id: string
          token_hash: string | null
          updated_at: string
          user_agent: string | null
        }
        ComputedFields: never
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          claimed_at?: string | null
          created_at?: string
          enroll_code: string
          id?: string
          install_id: string
          kind?: string
          last_seen_at?: string | null
          name?: string | null
          requested_at?: string
          screen_info?: string | null
          status?: string
          tenant_id: string
          token_hash?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          claimed_at?: string | null
          created_at?: string
          enroll_code?: string
          id?: string
          install_id?: string
          kind?: string
          last_seen_at?: string | null
          name?: string | null
          requested_at?: string
          screen_info?: string | null
          status?: string
          tenant_id?: string
          token_hash?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_devices_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_devices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_fee_policies: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          collection_mode: string
          created_at: string
          disclosure_version: string
          effective_from: string
          effective_to: string | null
          id: string
          provider: string | null
          rate_type: string
          rate_value: number
          scope: string
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          collection_mode: string
          created_at?: string
          disclosure_version: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          provider?: string | null
          rate_type: string
          rate_value: number
          scope: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          collection_mode?: string
          created_at?: string
          disclosure_version?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          provider?: string | null
          rate_type?: string
          rate_value?: number
          scope?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_fee_policies_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_fee_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_fulfillment_settings: {
        Row: {
          delivery_area_label: string | null
          delivery_enabled: boolean
          delivery_fee: number
          online_payment_enabled: boolean
          pickup_enabled: boolean
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          delivery_area_label?: string | null
          delivery_enabled?: boolean
          delivery_fee?: number
          online_payment_enabled?: boolean
          pickup_enabled?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          delivery_area_label?: string | null
          delivery_enabled?: boolean
          delivery_fee?: number
          online_payment_enabled?: boolean
          pickup_enabled?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_fulfillment_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_legal_acceptances: {
        Row: {
          accepted_at: string
          accepted_by: string
          created_at: string
          declaration: string
          document_snapshot: NonNullable<Json>
          evidence_path: string | null
          id: string
          idempotency_key: string
          interface_version: string
          legal_profile_snapshot: NonNullable<Json>
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          accepted_at?: string
          accepted_by: string
          created_at?: string
          declaration: string
          document_snapshot: NonNullable<Json>
          evidence_path?: string | null
          id?: string
          idempotency_key: string
          interface_version?: string
          legal_profile_snapshot: NonNullable<Json>
          tenant_id: string
        }
        Update: {
          accepted_at?: string
          accepted_by?: string
          created_at?: string
          declaration?: string
          document_snapshot?: NonNullable<Json>
          evidence_path?: string | null
          id?: string
          idempotency_key?: string
          interface_version?: string
          legal_profile_snapshot?: NonNullable<Json>
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_legal_acceptances_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_legal_acceptances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_legal_profiles: {
        Row: {
          address_latitude: number | null
          address_line1: string
          address_line2: string | null
          address_longitude: number | null
          address_place_id: string | null
          city: string | null
          contractual_email: string | null
          contractual_phone: string
          country: string
          created_at: string
          legal_name: string
          party_type: string
          postal_code: string | null
          public_privacy_contact: string | null
          public_seller_name: string | null
          representative_name: string | null
          representative_role: string | null
          state: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        ComputedFields: never
        Insert: {
          address_latitude?: number | null
          address_line1: string
          address_line2?: string | null
          address_longitude?: number | null
          address_place_id?: string | null
          city?: string | null
          contractual_email?: string | null
          contractual_phone: string
          country?: string
          created_at?: string
          legal_name: string
          party_type: string
          postal_code?: string | null
          public_privacy_contact?: string | null
          public_seller_name?: string | null
          representative_name?: string | null
          representative_role?: string | null
          state?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_latitude?: number | null
          address_line1?: string
          address_line2?: string | null
          address_longitude?: number | null
          address_place_id?: string | null
          city?: string | null
          contractual_email?: string | null
          contractual_phone?: string
          country?: string
          created_at?: string
          legal_name?: string
          party_type?: string
          postal_code?: string | null
          public_privacy_contact?: string | null
          public_seller_name?: string | null
          representative_name?: string | null
          representative_role?: string | null
          state?: string | null
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_legal_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_legal_profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_memberships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invitation_expires_at: string | null
          invited_at: string | null
          role_id: string
          status: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invitation_expires_at?: string | null
          invited_at?: string | null
          role_id: string
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invitation_expires_at?: string | null
          invited_at?: string | null
          role_id?: string
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
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
            foreignKeyName: "tenant_memberships_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ComputedFields: never
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
      tenant_pickup_points: {
        Row: {
          address_text: string
          business_hours: Json | null
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean
          is_primary: boolean
          latitude: number | null
          longitude: number | null
          mapbox_feature_id: string | null
          name: string
          reference: string | null
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          address_text: string
          business_hours?: Json | null
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          mapbox_feature_id?: string | null
          name: string
          reference?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address_text?: string
          business_hours?: Json | null
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          mapbox_feature_id?: string | null
          name?: string
          reference?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_pickup_points_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_preview_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          last_viewed_at: string | null
          revoked_at: string | null
          tenant_id: string
          token_hash: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          last_viewed_at?: string | null
          revoked_at?: string | null
          tenant_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          last_viewed_at?: string | null
          revoked_at?: string | null
          tenant_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_preview_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_preview_links_tenant_id_fkey"
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
          permissions: NonNullable<Json>
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          permissions?: NonNullable<Json>
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          permissions?: NonNullable<Json>
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
        ComputedFields: never
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
      tenant_scheduled_reports: {
        Row: {
          created_at: string
          frequency: string
          is_active: boolean
          last_sent_at: string | null
          recipient_email: string
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          frequency: string
          is_active?: boolean
          last_sent_at?: string | null
          recipient_email: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency?: string
          is_active?: boolean
          last_sent_at?: string | null
          recipient_email?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_scheduled_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settlement_config: {
        Row: {
          commission_override: number | null
          created_at: string
          custom_cycle_days: number | null
          cycle_type: string
          last_settled_at: string | null
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          commission_override?: number | null
          created_at?: string
          custom_cycle_days?: number | null
          cycle_type?: string
          last_settled_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          commission_override?: number | null
          created_at?: string
          custom_cycle_days?: number | null
          cycle_type?: string
          last_settled_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settlement_config_tenant_id_fkey"
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
        ComputedFields: never
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
      tenant_studio_brand_settings: {
        Row: {
          colors: string[]
          default_format: string
          font: string
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          colors?: string[]
          default_format?: string
          font?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          colors?: string[]
          default_format?: string
          font?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_studio_brand_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_studio_subscriptions: {
        Row: {
          ai_blocked: boolean
          cancel_at_period_end: boolean
          checkout_key: string | null
          contracted_amount_mxn: number
          contracted_tlacos: number
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mp_init_point: string | null
          mp_preapproval_id: string | null
          pending_amount_mxn: number | null
          pending_plan_code: string | null
          pending_tlacos: number | null
          plan_change_status: string | null
          plan_code: string
          status: string
          tenant_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          ai_blocked?: boolean
          cancel_at_period_end?: boolean
          checkout_key?: string | null
          contracted_amount_mxn: number
          contracted_tlacos: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_init_point?: string | null
          mp_preapproval_id?: string | null
          pending_amount_mxn?: number | null
          pending_plan_code?: string | null
          pending_tlacos?: number | null
          plan_change_status?: string | null
          plan_code: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ai_blocked?: boolean
          cancel_at_period_end?: boolean
          checkout_key?: string | null
          contracted_amount_mxn?: number
          contracted_tlacos?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_init_point?: string | null
          mp_preapproval_id?: string | null
          pending_amount_mxn?: number | null
          pending_plan_code?: string | null
          pending_tlacos?: number | null
          plan_change_status?: string | null
          plan_code?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_studio_subscriptions_pending_plan_code_fkey"
            columns: ["pending_plan_code"]
            isOneToOne: false
            referencedRelation: "studio_plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tenant_studio_subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "studio_plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tenant_studio_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          accepting_orders: boolean
          banner_url: string | null
          business_type: string | null
          catalog_approved_at: string | null
          catalog_approved_by: string | null
          catalog_review_status: string
          catalog_template_id: string | null
          catalog_template_version: number | null
          created_at: string
          demo_key: string | null
          description: string | null
          id: string
          is_demo: boolean
          kiosk_enroll_key: string | null
          logo_url: string | null
          merchant_payments_v2_enabled: boolean
          name: string
          onsite_promotions_enabled: boolean
          public_store_enabled: boolean
          settings: Json | null
          site_slug: string
          site_template_id: string | null
          slug: string
          social_links: Json | null
          theme_color: string | null
          updated_at: string
          whatsapp_orders_enabled: boolean
          whatsapp_phone: string | null
        }
        ComputedFields: never
        Insert: {
          accepting_orders?: boolean
          banner_url?: string | null
          business_type?: string | null
          catalog_approved_at?: string | null
          catalog_approved_by?: string | null
          catalog_review_status?: string
          catalog_template_id?: string | null
          catalog_template_version?: number | null
          created_at?: string
          demo_key?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          kiosk_enroll_key?: string | null
          logo_url?: string | null
          merchant_payments_v2_enabled?: boolean
          name: string
          onsite_promotions_enabled?: boolean
          public_store_enabled?: boolean
          settings?: Json | null
          site_slug: string
          site_template_id?: string | null
          slug: string
          social_links?: Json | null
          theme_color?: string | null
          updated_at?: string
          whatsapp_orders_enabled?: boolean
          whatsapp_phone?: string | null
        }
        Update: {
          accepting_orders?: boolean
          banner_url?: string | null
          business_type?: string | null
          catalog_approved_at?: string | null
          catalog_approved_by?: string | null
          catalog_review_status?: string
          catalog_template_id?: string | null
          catalog_template_version?: number | null
          created_at?: string
          demo_key?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          kiosk_enroll_key?: string | null
          logo_url?: string | null
          merchant_payments_v2_enabled?: boolean
          name?: string
          onsite_promotions_enabled?: boolean
          public_store_enabled?: boolean
          settings?: Json | null
          site_slug?: string
          site_template_id?: string | null
          slug?: string
          social_links?: Json | null
          theme_color?: string | null
          updated_at?: string
          whatsapp_orders_enabled?: boolean
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_catalog_approved_by_fkey"
            columns: ["catalog_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_catalog_template_id_fkey"
            columns: ["catalog_template_id"]
            isOneToOne: false
            referencedRelation: "catalog_templates"
            referencedColumns: ["id"]
          },
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
        ComputedFields: never
        Relationships: []
      }
      payment_retry_counts: {
        Row: {
          approved_attempts: number | null
          attempts_total: number | null
          failed_attempts: number | null
          last_attempt_at: string | null
          order_id: string
          retries: number | null
          tenant_id: string
        }
        ComputedFields: never
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
      add_order_items_batch: {
        Args: { p_items: Json; p_order_id: string }
        Returns: {
          id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }[]
      }
      apply_catalog_quick_update: {
        Args: {
          p_note?: string
          p_price?: number
          p_product_id: string
          p_stock_operation?: string
          p_stock_quantity?: number
          p_variant_id?: string
        }
        Returns: Json
      }
      apply_credit_payment: {
        Args: {
          p_account_id: string
          p_actor_id: string
          p_idempotency_key?: string
          p_note?: string
          p_overage_action: string
          p_payment_method: string
          p_received_amount: number
        }
        Returns: {
          applied_amount: number
          change_amount: number
          debt_after: number
          stored_amount: number
          stored_balance_after: number
        }[]
      }
      apply_studio_credit_purchase: {
        Args: {
          p_amount: number
          p_order_id: string
          p_paid_at: string
          p_provider_payment_id: string
        }
        Returns: string
      }
      approve_initial_catalog: {
        Args: {
          p_acceptance_source?: string
          p_actor_id: string
          p_note?: string
          p_tenant_id: string
        }
        Returns: {
          approved_at: string
          item_count: number
          tenant_id: string
          tenant_slug: string
        }[]
      }
      can_manage_tenant_team: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      capture_studio_credits: {
        Args: { p_job_id: string; p_tenant_id: string }
        Returns: boolean
      }
      charge_order_to_credit: {
        Args: {
          p_account_id: string
          p_actor_id: string
          p_note?: string
          p_order_id: string
        }
        Returns: {
          charged_amount: number
          debt_after: number
          loan_id: string
          stored_balance_after: number
          stored_balance_used: number
        }[]
      }
      convert_quote_to_order: {
        Args: {
          p_acceptance_source: string
          p_actor_id: string
          p_quote_id: string
        }
        Returns: {
          order_id: string
          result: string
        }[]
      }
      create_checkout_plan_instances: {
        Args: { p_cart_id: string; p_order_id: string }
        Returns: number
      }
      create_plan_period_order: {
        Args: { p_period_number: number; p_subscription_id: string }
        Returns: string
      }
      create_quote_revision: {
        Args: { p_actor_id: string; p_quote_id: string; p_reason?: string }
        Returns: {
          quote_id: string
          version: number
        }[]
      }
      create_tenant_with_catalog: {
        Args: {
          p_business_type: string
          p_catalog_template_key?: string
          p_demo_key?: string
          p_is_demo?: boolean
          p_name: string
          p_owner_user_id: string
          p_site_template_id?: string
          p_slug: string
        }
        Returns: {
          id: string
          name: string
          products_created: number
          services_created: number
          slug: string
        }[]
      }
      ensure_due_periods: {
        Args: {
          p_now?: string
          p_subscription_id?: string
          p_tenant_id: string
        }
        Returns: number
      }
      expire_studio_credits: { Args: { p_tenant_id: string }; Returns: number }
      grant_studio_subscription_credits: {
        Args: {
          p_amount: number
          p_authorized_payment_id: string
          p_ends_at: string
          p_paid_at: string
          p_provider_payment_id: string
          p_starts_at: string
          p_subscription_id: string
        }
        Returns: string
      }
      growth_activation_board: {
        Args: { p_actor_id: string; p_owner?: string; p_workspace_id: string }
        Returns: {
          activation: string
          business_name: string
          giro: string
          lead_id: string
          municipio: string
          owner_user_id: string
          paid_orders_30d: number
          registered_at: string
          tenant_id: string
          tenant_slug: string
        }[]
      }
      growth_activation_stage: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      growth_add_lead: {
        Args: { p_actor_id: string; p_row: Json; p_workspace_id: string }
        Returns: Json
      }
      growth_ai_answer_hit: {
        Args: { p_knowledge_version: string; p_question_key: string }
        Returns: undefined
      }
      growth_assign_leads: {
        Args: {
          p_actor_id: string
          p_lead_ids: string[]
          p_owner_id: string
          p_workspace_id: string
        }
        Returns: number
      }
      growth_bulk_drop: {
        Args: {
          p_actor_id: string
          p_lead_ids: string[]
          p_reason?: string
          p_workspace_id: string
        }
        Returns: number
      }
      growth_can_act: {
        Args: {
          p_actor_id: string
          p_lead: Omit<
            Database["public"]["Tables"]["growth_leads"]["Row"],
            Database["public"]["Tables"]["growth_leads"]["ComputedFields"]
          >
        }
        Returns: boolean
      }
      growth_can_act_on: {
        Args: { p_actor_id: string; p_lead_id: string }
        Returns: boolean
      }
      growth_claim_due_enrollments: {
        Args: { p_limit: number }
        Returns: {
          address: string
          business_name: string
          colonia: string
          current_step: number
          email: string
          email_status: string
          enrollment_id: string
          giro: string
          lead_id: string
          mailbox_id: string
          municipio: string
          stage: string
          thread_message_id: string
          variant: string
        }[]
      }
      growth_claim_import: {
        Args: { p_import_id: string; p_seconds?: number }
        Returns: {
          assign_to: string | null
          created_at: string
          created_by: string | null
          cursors: NonNullable<Json>
          error: string | null
          finished_at: string | null
          found: number
          giros: string[]
          id: string
          imported: number
          locked_until: string | null
          municipios: string[]
          only_with_contact: boolean
          skipped: number
          source: string
          status: string
          updated: number
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "growth_imports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      growth_cold_leads: {
        Args: {
          p_actor_id: string
          p_min_days?: number
          p_owner?: string
          p_workspace_id: string
        }
        Returns: {
          business_name: string
          colonia: string
          giro: string
          id: string
          last_whatsapp_at: string
          municipio: string
          owner_user_id: string
          whatsapp_attempts: number
        }[]
      }
      growth_contact_owner: {
        Args: { p_email: string; p_phone: string; p_workspace_id: string }
        Returns: {
          lead_id: string
          owner_name: string
          since: string
          stage: string
          suppressed: boolean
        }[]
      }
      growth_cron_tick: { Args: Record<PropertyKey, never>; Returns: number }
      growth_enroll_email_leads: {
        Args: { p_limit: number; p_workspace_id?: string }
        Returns: number
      }
      growth_follow_up: {
        Args: {
          p_action: string
          p_actor_id?: string
          p_at?: string
          p_lead_id: string
          p_note?: string
        }
        Returns: {
          activity: string | null
          address: string | null
          appointment_at: string | null
          business_name: string
          catalog_template_key: string | null
          colonia: string | null
          created_at: string
          denue_id: string | null
          drop_reason: string | null
          email: string | null
          email_status: string
          giro: string
          id: string
          last_activity_at: string | null
          last_whatsapp_at: string | null
          lat: number | null
          legal_name: string | null
          lng: number | null
          municipio: string
          next_channel: string
          next_step: string | null
          next_step_at: string | null
          next_step_note: string | null
          owned_at: string | null
          owner_user_id: string | null
          phone_e164: string | null
          phone_status: string
          postal_code: string | null
          registered_tenant_id: string | null
          reserved_by: string | null
          reserved_kind: string | null
          reserved_until: string | null
          revisit_at: string | null
          snoozed_until: string | null
          source: string
          source_detail: string | null
          staff_range: string | null
          stage: string
          updated_at: string
          visit_attempts: number
          visit_status: string
          website: string | null
          whatsapp_attempts: number
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "growth_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      growth_funnel: {
        Args: { p_from: string; p_to: string; p_workspace_id?: string }
        Returns: Json
      }
      growth_in_zones: {
        Args: { p_colonia: string; p_municipio: string; p_zones: Json }
        Returns: boolean
      }
      growth_is_suppressed: {
        Args: { p_email: string; p_phone: string; p_workspace_id?: string }
        Returns: boolean
      }
      growth_lead_next_action: { Args: { p_lead_id: string }; Returns: Json }
      growth_link_registration: {
        Args: {
          p_email: string
          p_heard_from?: string
          p_phone: string
          p_tenant_id: string
          p_token_hash?: string
          p_utm?: Json
        }
        Returns: {
          bucket: string
          channel: string
          lead_id: string
        }[]
      }
      growth_lock_for_actor: {
        Args: { p_actor_id: string; p_lead_id: string }
        Returns: {
          activity: string | null
          address: string | null
          appointment_at: string | null
          business_name: string
          catalog_template_key: string | null
          colonia: string | null
          created_at: string
          denue_id: string | null
          drop_reason: string | null
          email: string | null
          email_status: string
          giro: string
          id: string
          last_activity_at: string | null
          last_whatsapp_at: string | null
          lat: number | null
          legal_name: string | null
          lng: number | null
          municipio: string
          next_channel: string
          next_step: string | null
          next_step_at: string | null
          next_step_note: string | null
          owned_at: string | null
          owner_user_id: string | null
          phone_e164: string | null
          phone_status: string
          postal_code: string | null
          registered_tenant_id: string | null
          reserved_by: string | null
          reserved_kind: string | null
          reserved_until: string | null
          revisit_at: string | null
          snoozed_until: string | null
          source: string
          source_detail: string | null
          staff_range: string | null
          stage: string
          updated_at: string
          visit_attempts: number
          visit_status: string
          website: string | null
          whatsapp_attempts: number
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "growth_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      growth_map_points: {
        Args: {
          p_actor_id: string
          p_giro?: string
          p_limit?: number
          p_max_lat: number
          p_max_lng: number
          p_min_lat: number
          p_min_lng: number
          p_owner?: string
          p_workspace_id: string
        }
        Returns: {
          business_name: string
          colonia: string
          giro: string
          has_phone: boolean
          id: string
          lat: number
          lng: number
          municipio: string
          owner_user_id: string
          stage: string
          total: number
        }[]
      }
      growth_mark_registered: {
        Args: { p_actor_id: string; p_lead_id: string; p_tenant_id: string }
        Returns: {
          activity: string | null
          address: string | null
          appointment_at: string | null
          business_name: string
          catalog_template_key: string | null
          colonia: string | null
          created_at: string
          denue_id: string | null
          drop_reason: string | null
          email: string | null
          email_status: string
          giro: string
          id: string
          last_activity_at: string | null
          last_whatsapp_at: string | null
          lat: number | null
          legal_name: string | null
          lng: number | null
          municipio: string
          next_channel: string
          next_step: string | null
          next_step_at: string | null
          next_step_note: string | null
          owned_at: string | null
          owner_user_id: string | null
          phone_e164: string | null
          phone_status: string
          postal_code: string | null
          registered_tenant_id: string | null
          reserved_by: string | null
          reserved_kind: string | null
          reserved_until: string | null
          revisit_at: string | null
          snoozed_until: string | null
          source: string
          source_detail: string | null
          staff_range: string | null
          stage: string
          updated_at: string
          visit_attempts: number
          visit_status: string
          website: string | null
          whatsapp_attempts: number
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "growth_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      growth_member_role: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: string
      }
      growth_my_day: {
        Args: { p_actor_id: string; p_workspace_id: string }
        Returns: Json
      }
      growth_nearby_leads: {
        Args: {
          p_actor_id?: string
          p_lat: number
          p_limit?: number
          p_lng: number
          p_workspace_id?: string
        }
        Returns: {
          address: string
          business_name: string
          colonia: string
          distance_m: number
          giro: string
          id: string
          lat: number
          lng: number
          municipio: string
          phone_e164: string
          revisit_at: string
          visit_status: string
        }[]
      }
      growth_next_channel: {
        Args: {
          p_lead: Omit<
            Database["public"]["Tables"]["growth_leads"]["Row"],
            Database["public"]["Tables"]["growth_leads"]["ComputedFields"]
          >
        }
        Returns: string
      }
      growth_para_design_stats: {
        Args: { p_since?: string; p_workspace_id: string }
        Returns: {
          claimed: number
          design: string
          median_seconds: number
          reached_store: number
          registered: number
          visitors: number
        }[]
      }
      growth_pipeline_counts: {
        Args: {
          p_giro?: string
          p_municipio?: string
          p_owner_id?: string
          p_workspace_id?: string
        }
        Returns: Json
      }
      growth_record_outcome: {
        Args: {
          p_actor?: string
          p_actor_id?: string
          p_lead_id: string
          p_outcome: string
          p_payload?: Json
          p_revisit_at?: string
          p_template_id?: string
        }
        Returns: {
          activity: string | null
          address: string | null
          appointment_at: string | null
          business_name: string
          catalog_template_key: string | null
          colonia: string | null
          created_at: string
          denue_id: string | null
          drop_reason: string | null
          email: string | null
          email_status: string
          giro: string
          id: string
          last_activity_at: string | null
          last_whatsapp_at: string | null
          lat: number | null
          legal_name: string | null
          lng: number | null
          municipio: string
          next_channel: string
          next_step: string | null
          next_step_at: string | null
          next_step_note: string | null
          owned_at: string | null
          owner_user_id: string | null
          phone_e164: string | null
          phone_status: string
          postal_code: string | null
          registered_tenant_id: string | null
          reserved_by: string | null
          reserved_kind: string | null
          reserved_until: string | null
          revisit_at: string | null
          snoozed_until: string | null
          source: string
          source_detail: string | null
          staff_range: string | null
          stage: string
          updated_at: string
          visit_attempts: number
          visit_status: string
          website: string | null
          whatsapp_attempts: number
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "growth_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      growth_reserve_batch: {
        Args: {
          p_actor_id?: string
          p_giro?: string
          p_kind: string
          p_limit?: number
          p_minutes?: number
          p_municipio?: string
          p_workspace_id?: string
        }
        Returns: {
          activity: string | null
          address: string | null
          appointment_at: string | null
          business_name: string
          catalog_template_key: string | null
          colonia: string | null
          created_at: string
          denue_id: string | null
          drop_reason: string | null
          email: string | null
          email_status: string
          giro: string
          id: string
          last_activity_at: string | null
          last_whatsapp_at: string | null
          lat: number | null
          legal_name: string | null
          lng: number | null
          municipio: string
          next_channel: string
          next_step: string | null
          next_step_at: string | null
          next_step_note: string | null
          owned_at: string | null
          owner_user_id: string | null
          phone_e164: string | null
          phone_status: string
          postal_code: string | null
          registered_tenant_id: string | null
          reserved_by: string | null
          reserved_kind: string | null
          reserved_until: string | null
          revisit_at: string | null
          snoozed_until: string | null
          source: string
          source_detail: string | null
          staff_range: string | null
          stage: string
          updated_at: string
          visit_attempts: number
          visit_status: string
          website: string | null
          whatsapp_attempts: number
          workspace_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "growth_leads"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      growth_save_template_version: {
        Args: {
          p_body: string
          p_channel: string
          p_created_by: string
          p_giro: string
          p_step: string
          p_subject: string
          p_variant: string
          p_workspace_id?: string
        }
        Returns: {
          body: string
          channel: string
          created_at: string
          created_by: string | null
          giro: string | null
          id: string
          status: string
          step: string
          subject: string | null
          variant: string
          version: number
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "growth_templates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      growth_sweep_remaining: {
        Args: {
          p_actor_id?: string
          p_giro?: string
          p_kind: string
          p_municipio?: string
          p_workspace_id?: string
        }
        Returns: number
      }
      growth_tenant_role: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: string
      }
      growth_tenant_workspace: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: string
      }
      growth_track_link: {
        Args: {
          p_event: string
          p_payload?: Json
          p_seconds?: number
          p_token_hash: string
        }
        Returns: {
          became_hot: boolean
          business_name: string
          lead_id: string
          municipio: string
          view_count: number
        }[]
      }
      growth_update_lead_email: {
        Args: { p_actor_id?: string; p_email: string; p_lead_id: string }
        Returns: {
          activity: string | null
          address: string | null
          appointment_at: string | null
          business_name: string
          catalog_template_key: string | null
          colonia: string | null
          created_at: string
          denue_id: string | null
          drop_reason: string | null
          email: string | null
          email_status: string
          giro: string
          id: string
          last_activity_at: string | null
          last_whatsapp_at: string | null
          lat: number | null
          legal_name: string | null
          lng: number | null
          municipio: string
          next_channel: string
          next_step: string | null
          next_step_at: string | null
          next_step_note: string | null
          owned_at: string | null
          owner_user_id: string | null
          phone_e164: string | null
          phone_status: string
          postal_code: string | null
          registered_tenant_id: string | null
          reserved_by: string | null
          reserved_kind: string | null
          reserved_until: string | null
          revisit_at: string | null
          snoozed_until: string | null
          source: string
          source_detail: string | null
          staff_range: string | null
          stage: string
          updated_at: string
          visit_attempts: number
          visit_status: string
          website: string | null
          whatsapp_attempts: number
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "growth_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      growth_update_lead_phone: {
        Args: { p_actor_id?: string; p_lead_id: string; p_phone: string }
        Returns: {
          activity: string | null
          address: string | null
          appointment_at: string | null
          business_name: string
          catalog_template_key: string | null
          colonia: string | null
          created_at: string
          denue_id: string | null
          drop_reason: string | null
          email: string | null
          email_status: string
          giro: string
          id: string
          last_activity_at: string | null
          last_whatsapp_at: string | null
          lat: number | null
          legal_name: string | null
          lng: number | null
          municipio: string
          next_channel: string
          next_step: string | null
          next_step_at: string | null
          next_step_note: string | null
          owned_at: string | null
          owner_user_id: string | null
          phone_e164: string | null
          phone_status: string
          postal_code: string | null
          registered_tenant_id: string | null
          reserved_by: string | null
          reserved_kind: string | null
          reserved_until: string | null
          revisit_at: string | null
          snoozed_until: string | null
          source: string
          source_detail: string | null
          staff_range: string | null
          stage: string
          updated_at: string
          visit_attempts: number
          visit_status: string
          website: string | null
          whatsapp_attempts: number
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "growth_leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      growth_upsert_leads: {
        Args: { p_rows: Json; p_workspace_id?: string }
        Returns: {
          inserted: number
          merged_contacts: number
          updated: number
        }[]
      }
      growth_variant_stats: {
        Args: { p_days?: number; p_step: string; p_workspace_id: string }
        Returns: {
          claimed: number
          opened: number
          replied: number
          sent: number
          variant: string
        }[]
      }
      is_tenant_member: { Args: { p_tenant_id: string }; Returns: boolean }
      jsonb_uuid_list: { Args: { p_value: Json }; Returns: string[] }
      plan_period_bounds: {
        Args: {
          p_anchor: string
          p_count: number
          p_period: number
          p_unit: string
        }
        Returns: Record<string, unknown>
      }
      platform_overview: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      platform_users_overview: {
        Args: {
          p_desc?: boolean
          p_filters?: Json
          p_page?: number
          p_per_page?: number
          p_sort?: string
        }
        Returns: Json
      }
      provision_assisted_tenant: {
        Args: {
          p_actor_id: string
          p_billing_mode: string
          p_business_type: string
          p_catalog_template_key: string
          p_name: string
          p_notes?: string
          p_owner_email: string
          p_owner_name: string
          p_owner_phone: string
          p_owner_user_id: string
          p_provisioning_key: string
          p_site_template_id: string
          p_slug: string
        }
        Returns: {
          onboarding_id: string
          tenant_id: string
          tenant_slug: string
        }[]
      }
      recompute_device_fulfillment: {
        Args: { p_device_id: string }
        Returns: undefined
      }
      recompute_order_fulfillment: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      release_studio_credits: {
        Args: { p_job_id: string; p_tenant_id: string }
        Returns: boolean
      }
      reorder_catalog_items: {
        Args: { p_item_ids: string[]; p_tenant_id: string }
        Returns: undefined
      }
      replace_quote_draft_items: {
        Args: { p_actor_id: string; p_items: Json; p_quote_id: string }
        Returns: {
          quote_id: string
          subtotal: number
          total: number
        }[]
      }
      reserve_studio_credits: {
        Args: { p_amount: number; p_job_id: string; p_tenant_id: string }
        Returns: string
      }
      save_offer_plan: {
        Args: { p_items?: Json; p_plan: Json }
        Returns: string
      }
      save_product_commerce_details: {
        Args: {
          p_care_instructions?: string
          p_has_variants: boolean
          p_material_info?: string
          p_product_id: string
          p_size_guide?: string
          p_variants?: Json
        }
        Returns: Json
      }
      save_promotion: {
        Args: { p_items?: Json; p_promotion: Json }
        Returns: string
      }
      save_promotion_v2: {
        Args: { p_items?: Json; p_promotion: Json }
        Returns: string
      }
      studio_adjust_credits: {
        Args: {
          p_actor_id: string
          p_amount: number
          p_key: string
          p_reason: string
          p_tenant_id: string
        }
        Returns: string
      }
      studio_apply_placement: {
        Args: {
          p_actor_id: string
          p_alt: string
          p_end: string
          p_key: string
          p_render_id: string
          p_start: string
          p_surface: string
          p_tenant_id: string
          p_title: string
          p_url: string
          p_version_id: string
        }
        Returns: Json
      }
      studio_begin_checkout: {
        Args: {
          p_actor_id: string
          p_catalog_version: number
          p_key: string
          p_plan_code: string
          p_tenant_id: string
        }
        Returns: Json
      }
      studio_cancel_job: {
        Args: { p_actor_id: string; p_job_id: string; p_tenant_id: string }
        Returns: boolean
      }
      studio_claim_job: { Args: { p_job_id: string }; Returns: Json }
      studio_claim_review: {
        Args: {
          p_actor_id: string
          p_evaluator: string
          p_route_id: string
          p_tenant_id: string
          p_version_id: string
        }
        Returns: Json
      }
      studio_confirm_plan_change: {
        Args: {
          p_amount: number
          p_plan_code: string
          p_subscription_id: string
        }
        Returns: boolean
      }
      studio_create_version: {
        Args: {
          p_actor_id: string
          p_design_id: string
          p_preparation: boolean
          p_revision: number
          p_scene: Json
          p_tenant_id: string
        }
        Returns: Json
      }
      studio_cron_tick: { Args: Record<PropertyKey, never>; Returns: number }
      studio_enqueue_generation: {
        Args: {
          p_actor_id: string
          p_idempotency_key: string
          p_quote_id: string
        }
        Returns: Json
      }
      studio_finish_job: {
        Args: {
          p_asset_id: string
          p_error?: string
          p_job_id: string
          p_lease_token: string
        }
        Returns: boolean
      }
      studio_flag_partial_refund: {
        Args: { p_provider_payment_id: string; p_refunded_mxn: number }
        Returns: boolean
      }
      studio_has_permission: {
        Args: { p_actor_id?: string; p_permission: string; p_tenant_id: string }
        Returns: boolean
      }
      studio_membership_active: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      studio_orphan_storage_paths: {
        Args: { p_limit?: number }
        Returns: {
          storage_path: string
        }[]
      }
      studio_pending_job: {
        Args: {
          p_job_id: string
          p_lease_token: string
          p_polling_url: string
          p_request_id: string
        }
        Returns: boolean
      }
      studio_rate_limit: {
        Args: { p_limit: number; p_scope: string }
        Returns: boolean
      }
      studio_reconcile_state: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      studio_reconcile_tick: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      studio_resolve_credit_review: {
        Args: {
          p_actor_id: string
          p_key: string
          p_reason: string
          p_tenant_id: string
        }
        Returns: boolean
      }
      studio_resolve_placements: {
        Args: {
          p_channel: string
          p_source_ids?: string[]
          p_surface: string
          p_tenant_id: string
        }
        Returns: {
          alt_text: string
          applied_by: string
          channel: string
          created_at: string
          design_id: string
          design_version_id: string
          destination_url: string
          disabled_reason: string | null
          ends_at: string | null
          id: string
          idempotency_key: string
          is_active: boolean
          render_id: string
          source_hash: string
          source_id: string | null
          source_type: string
          starts_at: string
          surface: string
          target_key: string
          tenant_id: string
          title: string
        }[]
        SetofOptions: {
          from: "*"
          to: "studio_placements"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      studio_retry_job: {
        Args: { p_error: string; p_job_id: string; p_lease_token: string }
        Returns: boolean
      }
      studio_reverse_payment: {
        Args: {
          p_disputed: boolean
          p_provider_payment_id: string
          p_refunded_mxn?: number
        }
        Returns: boolean
      }
      studio_save_design: {
        Args: {
          p_actor_id: string
          p_changes: Json
          p_design_id: string
          p_revision: number
          p_tenant_id: string
        }
        Returns: Json
      }
      studio_source_eligible: {
        Args: {
          p_channel: string
          p_source_hash: string
          p_source_id: string
          p_tenant_id: string
          p_type: string
        }
        Returns: boolean
      }
      studio_source_fingerprint: {
        Args: { p_source_id: string; p_tenant_id: string; p_type: string }
        Returns: string
      }
      studio_take_job: { Args: Record<PropertyKey, never>; Returns: Json }
      submit_table_order: {
        Args: {
          p_device_fingerprint: string
          p_display_name: string
          p_items: Json
          p_qr_token: string
        }
        Returns: {
          added_items: number
          device_id: string
          order_id: string
        }[]
      }
      submit_table_order_v2: {
        Args: {
          p_customer_note?: string
          p_device_fingerprint: string
          p_display_name: string
          p_priced_items: Json
          p_qr_token: string
        }
        Returns: {
          added_items: number
          batch_id: string
          device_id: string
          order_id: string
        }[]
      }
      track_storefront_view: {
        Args: { p_tenant_id: string; p_visitor_hash: string }
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
