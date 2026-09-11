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
      carpool_children: {
        Row: {
          approved_at: string | null
          child_name: string
          created_at: string
          drop_address: string
          guardian_contact: string
          guardian_name: string
          has_permission: boolean
          id: string
          is_far: boolean
          otp_code: string
          otp_expires_at: string
          parent_id: string
          scholar_number: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          child_name: string
          created_at?: string
          drop_address: string
          guardian_contact?: string
          guardian_name: string
          has_permission?: boolean
          id?: string
          is_far?: boolean
          otp_code?: string
          otp_expires_at?: string
          parent_id: string
          scholar_number: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          child_name?: string
          created_at?: string
          drop_address?: string
          guardian_contact?: string
          guardian_name?: string
          has_permission?: boolean
          id?: string
          is_far?: boolean
          otp_code?: string
          otp_expires_at?: string
          parent_id?: string
          scholar_number?: string
          status?: string
        }
        Relationships: []
      }
      pickup_logs: {
        Row: {
          child_id: string | null
          created_at: string
          id: string
          kind: string
          log_date: string
          parent_id: string
          points: number
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          log_date?: string
          parent_id: string
          points?: number
        }
        Update: {
          child_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          log_date?: string
          parent_id?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "pickup_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "carpool_children"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          arrival_time: string
          created_at: string
          distance_km: number
          full_name: string
          home_address: string
          id: string
          is_ev: boolean
          onboarded: boolean
          phone: string
          updated_at: string
          vehicle_number: string
          vehicle_seats: number
        }
        Insert: {
          arrival_time?: string
          created_at?: string
          distance_km?: number
          full_name?: string
          home_address?: string
          id: string
          is_ev?: boolean
          onboarded?: boolean
          phone?: string
          updated_at?: string
          vehicle_number?: string
          vehicle_seats?: number
        }
        Update: {
          arrival_time?: string
          created_at?: string
          distance_km?: number
          full_name?: string
          home_address?: string
          id?: string
          is_ev?: boolean
          onboarded?: boolean
          phone?: string
          updated_at?: string
          vehicle_number?: string
          vehicle_seats?: number
        }
        Relationships: []
      }
      wards: {
        Row: {
          child_name: string
          created_at: string
          grade: string
          id: string
          parent_id: string
          scholar_number: string
        }
        Insert: {
          child_name: string
          created_at?: string
          grade?: string
          id?: string
          parent_id: string
          scholar_number: string
        }
        Update: {
          child_name?: string
          created_at?: string
          grade?: string
          id?: string
          parent_id?: string
          scholar_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_carpool_child: {
        Args: { p_child_id: string; p_code: string }
        Returns: string
      }
      get_leaderboard: {
        Args: never
        Returns: {
          children_helped: number
          full_name: string
          is_ev: boolean
          parent_id: string
          total_points: number
        }[]
      }
      log_pickups: {
        Args: { p_child_ids: string[]; p_date: string }
        Returns: Json
      }
      regenerate_carpool_otp: { Args: { p_child_id: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
