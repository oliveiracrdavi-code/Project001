export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type TenantMemberRole = 'owner' | 'admin' | 'professional'
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'unpaid'
  | 'paused'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          timezone: string
          phone: string | null
          address: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          subscription_status: SubscriptionStatus | null
          subscription_period_end: string | null
          whatsapp_consent_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          timezone?: string
          phone?: string | null
          address?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          subscription_status?: SubscriptionStatus | null
          subscription_period_end?: string | null
          whatsapp_consent_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          timezone?: string
          phone?: string | null
          address?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          subscription_status?: SubscriptionStatus | null
          subscription_period_end?: string | null
          whatsapp_consent_enabled?: boolean
          updated_at?: string
        }
      }
      tenant_members: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: TenantMemberRole
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          role?: TenantMemberRole
          created_at?: string
        }
        Update: {
          role?: TenantMemberRole
        }
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string
          email: string | null
          notes: string | null
          whatsapp_consent: boolean
          whatsapp_consent_date: string | null
          lgpd_consent: boolean
          lgpd_consent_date: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone: string
          email?: string | null
          notes?: string | null
          whatsapp_consent?: boolean
          whatsapp_consent_date?: string | null
          lgpd_consent?: boolean
          lgpd_consent_date?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          phone?: string
          email?: string | null
          notes?: string | null
          whatsapp_consent?: boolean
          whatsapp_consent_date?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          duration_minutes: number
          price_cents: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          duration_minutes: number
          price_cents: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          duration_minutes?: number
          price_cents?: number
          active?: boolean
          updated_at?: string
        }
      }
      professionals: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string | null
          specialties: string[]
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone?: string | null
          specialties?: string[]
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          phone?: string | null
          specialties?: string[]
          active?: boolean
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          professional_id: string
          service_id: string
          start_time: string
          end_time: string
          status: AppointmentStatus
          notes: string | null
          reminder_sent: boolean
          return_reminder_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          professional_id: string
          service_id: string
          start_time: string
          end_time: string
          status?: AppointmentStatus
          notes?: string | null
          reminder_sent?: boolean
          return_reminder_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: AppointmentStatus
          notes?: string | null
          reminder_sent?: boolean
          return_reminder_sent?: boolean
          updated_at?: string
        }
      }
      lgpd_consents: {
        Row: {
          id: string
          client_id: string
          tenant_id: string
          consent_type: string
          granted: boolean
          policy_version: string
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          tenant_id: string
          consent_type: string
          granted: boolean
          policy_version: string
          ip_address?: string | null
          created_at?: string
        }
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: {
      my_tenant_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      get_active_tenant_id: {
        Args: Record<string, never>
        Returns: string | null
      }
    }
    Enums: {
      appointment_status: AppointmentStatus
      tenant_member_role: TenantMemberRole
    }
  }
}
