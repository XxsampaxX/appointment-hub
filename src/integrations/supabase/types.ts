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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          company_id: string
          created_at: string
          date: string
          email_reminder_sent: boolean
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          professional_id: string
          reminder_sent: boolean
          service_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          time: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_id: string
          created_at?: string
          date: string
          email_reminder_sent?: boolean
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          professional_id: string
          reminder_sent?: boolean
          service_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_id?: string
          created_at?: string
          date?: string
          email_reminder_sent?: boolean
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          professional_id?: string
          reminder_sent?: boolean
          service_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          created_by: string
          date: string
          id: string
          reason: string
          time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          created_by: string
          date: string
          id?: string
          reason: string
          time: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          reason?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          business_type: string | null
          created_at: string
          created_by: string | null
          document: string | null
          id: string
          logo: string | null
          max_appointments_month: number | null
          name: string
          phone: string | null
          slot_duration: number | null
          slot_interval: number | null
          slug: string
          status: string
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at: string
          working_days: number[] | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          id?: string
          logo?: string | null
          max_appointments_month?: number | null
          name: string
          phone?: string | null
          slot_duration?: number | null
          slot_interval?: number | null
          slug: string
          status?: string
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          id?: string
          logo?: string | null
          max_appointments_month?: number | null
          name?: string
          phone?: string | null
          slot_duration?: number | null
          slot_interval?: number | null
          slug?: string
          status?: string
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_whatsapp: {
        Row: {
          access_token_encrypted: string | null
          company_id: string
          created_at: string
          display_phone: string | null
          meta_business_id: string | null
          phone_number_id: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          waba_id: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          company_id: string
          created_at?: string
          display_phone?: string | null
          meta_business_id?: string | null
          phone_number_id?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          waba_id?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          company_id?: string
          created_at?: string
          display_phone?: string | null
          meta_business_id?: string | null
          phone_number_id?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          waba_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_whatsapp_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string | null
          company_id: string
          created_at: string
          id: string
          last_message_at: string | null
          phone_number: string
          status: string
          unread_count: number
        }
        Insert: {
          client_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          phone_number: string
          status?: string
          unread_count?: number
        }
        Update: {
          client_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          phone_number?: string
          status?: string
          unread_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      global_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          company_id: string
          content: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          message_type: string
          meta_message_id: string | null
          status: string
        }
        Insert: {
          company_id: string
          content?: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          message_type?: string
          meta_message_id?: string | null
          status?: string
        }
        Update: {
          company_id?: string
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          message_type?: string
          meta_message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          available: boolean | null
          avatar: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          role: string | null
          updated_at: string
        }
        Insert: {
          available?: boolean | null
          avatar?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          available?: boolean | null
          avatar?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          cpf?: string
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          duration: number
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          max_appointments_month: number | null
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_appointments_month?: number | null
          plan?: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_appointments_month?: number | null
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_auto_replies: {
        Row: {
          after_hours_message: string | null
          business_hours_end: string | null
          business_hours_start: string | null
          company_id: string
          created_at: string
          is_after_hours_enabled: boolean
          is_welcome_enabled: boolean
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          after_hours_message?: string | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          company_id: string
          created_at?: string
          is_after_hours_enabled?: boolean
          is_welcome_enabled?: boolean
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          after_hours_message?: string | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          company_id?: string
          created_at?: string
          is_after_hours_enabled?: boolean
          is_welcome_enabled?: boolean
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_auto_replies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_logs: {
        Row: {
          appointment_id: string | null
          company_id: string | null
          created_at: string
          error_message: string | null
          id: string
          message_type: string
          phone: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_type: string
          phone: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_type?: string
          phone?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      appointment_slots: {
        Row: {
          company_id: string | null
          date: string | null
          professional_id: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          time: string | null
        }
        Insert: {
          company_id?: string | null
          date?: string | null
          professional_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time?: string | null
        }
        Update: {
          company_id?: string | null
          date?: string | null
          professional_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_appointment_limit: {
        Args: { _company_id: string }
        Returns: boolean
      }
      get_member_role: {
        Args: { _company_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_staff: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_master_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "profissional" | "recepcionista" | "user"
      appointment_status:
        | "agendado"
        | "confirmado"
        | "concluido"
        | "cancelado"
        | "nao_compareceu"
      payment_method: "pix" | "dinheiro" | "credito" | "debito"
      subscription_status: "free" | "pro" | "premium"
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
      app_role: ["admin", "profissional", "recepcionista", "user"],
      appointment_status: [
        "agendado",
        "confirmado",
        "concluido",
        "cancelado",
        "nao_compareceu",
      ],
      payment_method: ["pix", "dinheiro", "credito", "debito"],
      subscription_status: ["free", "pro", "premium"],
    },
  },
} as const
