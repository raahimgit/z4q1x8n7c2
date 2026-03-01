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
      active_matches: {
        Row: {
          ended_at: string | null
          id: string
          owner_a: string
          owner_b: string
          started_at: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          owner_a: string
          owner_b: string
          started_at?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          owner_a?: string
          owner_b?: string
          started_at?: string | null
        }
        Relationships: []
      }
      command_cooldowns: {
        Row: {
          command: string
          id: string
          last_used: string | null
          owner_id: string
        }
        Insert: {
          command: string
          id?: string
          last_used?: string | null
          owner_id: string
        }
        Update: {
          command?: string
          id?: string
          last_used?: string | null
          owner_id?: string
        }
        Relationships: []
      }
      currency: {
        Row: {
          amount: number | null
          id: string
          owner_id: string
        }
        Insert: {
          amount?: number | null
          id?: string
          owner_id: string
        }
        Update: {
          amount?: number | null
          id?: string
          owner_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string | null
          id: string
          items: Json | null
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          items?: Json | null
          owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json | null
          owner_id?: string
        }
        Relationships: []
      }
      match_history: {
        Row: {
          created_at: string | null
          id: string
          kind: string | null
          log: Json | null
          owner_a: string | null
          owner_b: string | null
          score_a: number | null
          score_b: number | null
          team_a: string | null
          team_b: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind?: string | null
          log?: Json | null
          owner_a?: string | null
          owner_b?: string | null
          score_a?: number | null
          score_b?: number | null
          team_a?: string | null
          team_b?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string | null
          log?: Json | null
          owner_a?: string | null
          owner_b?: string | null
          score_a?: number | null
          score_b?: number | null
          team_a?: string | null
          team_b?: string | null
        }
        Relationships: []
      }
      match_queue: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          message_id: string | null
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          message_id?: string | null
          owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          message_id?: string | null
          owner_id?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          rating: number | null
          role: string | null
          stamina: number | null
          team_id: string | null
          traits: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          rating?: number | null
          role?: string | null
          stamina?: number | null
          team_id?: string | null
          traits?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          rating?: number | null
          role?: string | null
          stamina?: number | null
          team_id?: string | null
          traits?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_claims: {
        Row: {
          claimed: boolean | null
          claimed_at: string | null
          id: string
          owner_id: string
          rank_name: string | null
          season_id: string | null
        }
        Insert: {
          claimed?: boolean | null
          claimed_at?: string | null
          id?: string
          owner_id: string
          rank_name?: string | null
          season_id?: string | null
        }
        Update: {
          claimed?: boolean | null
          claimed_at?: string | null
          id?: string
          owner_id?: string
          rank_name?: string | null
          season_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_claims_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          created_at: string | null
          id: string
          last_reset: string | null
          owner_id: string
          season_id: string | null
          stars: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_reset?: string | null
          owner_id: string
          season_id?: string | null
          stars?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_reset?: string | null
          owner_id?: string
          season_id?: string | null
          stars?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      season_snapshots: {
        Row: {
          created_at: string | null
          final_ovr: number | null
          final_rank: string
          id: string
          matches_played: number | null
          owner_id: string
          season_id: string | null
        }
        Insert: {
          created_at?: string | null
          final_ovr?: number | null
          final_rank: string
          id?: string
          matches_played?: number | null
          owner_id: string
          season_id?: string | null
        }
        Update: {
          created_at?: string | null
          final_ovr?: number | null
          final_rank?: string
          id?: string
          matches_played?: number | null
          owner_id?: string
          season_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_snapshots_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          ended_at: string | null
          id: string
          name: string | null
          rating_cap: number
          started_at: string | null
          theme: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          name?: string | null
          rating_cap: number
          started_at?: string | null
          theme?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          name?: string | null
          rating_cap?: number
          started_at?: string | null
          theme?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          active_lineup: Json | null
          alive: boolean | null
          attack: number | null
          created_at: string | null
          defense: number | null
          formation: string | null
          id: string
          name: string
          ovr: number | null
          owner_id: string
          players: Json | null
          stamina: number | null
          starting_ovr: number | null
          tactic: string | null
          tactics: Json | null
        }
        Insert: {
          active_lineup?: Json | null
          alive?: boolean | null
          attack?: number | null
          created_at?: string | null
          defense?: number | null
          formation?: string | null
          id?: string
          name: string
          ovr?: number | null
          owner_id: string
          players?: Json | null
          stamina?: number | null
          starting_ovr?: number | null
          tactic?: string | null
          tactics?: Json | null
        }
        Update: {
          active_lineup?: Json | null
          alive?: boolean | null
          attack?: number | null
          created_at?: string | null
          defense?: number | null
          formation?: string | null
          id?: string
          name?: string
          ovr?: number | null
          owner_id?: string
          players?: Json | null
          stamina?: number | null
          starting_ovr?: number | null
          tactic?: string | null
          tactics?: Json | null
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          id: string
          joined_at: string | null
          owner_id: string
          team_snapshot: Json | null
          tournament_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          owner_id: string
          team_snapshot?: Json | null
          tournament_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          owner_id?: string
          team_snapshot?: Json | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string | null
          format: string | null
          guild_id: string
          host_id: string
          id: string
          locked: boolean | null
          message_channel: string | null
          message_id: string | null
          name: string | null
          start_at: string | null
        }
        Insert: {
          created_at?: string | null
          format?: string | null
          guild_id: string
          host_id: string
          id?: string
          locked?: boolean | null
          message_channel?: string | null
          message_id?: string | null
          name?: string | null
          start_at?: string | null
        }
        Update: {
          created_at?: string | null
          format?: string | null
          guild_id?: string
          host_id?: string
          id?: string
          locked?: boolean | null
          message_channel?: string | null
          message_id?: string | null
          name?: string | null
          start_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          discord_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          discord_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          discord_id?: string
          id?: string
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
