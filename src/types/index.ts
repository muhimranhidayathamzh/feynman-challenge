// ============================================================================
// Feynman Challenge — Shared types
// Mirrors the database schema in supabase/migrations/001_initial_schema.sql (§7).
// `Database` is shaped for the supabase-js generic:
//   createClient<Database>(...)
// Each table includes `Relationships` and the schema includes `CompositeTypes`
// so the type satisfies postgrest-js's GenericSchema/GenericTable constraints
// (otherwise queries resolve to `never`).
// ============================================================================

// --- JSON helper (for jsonb columns) ---
export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// --- Enum-like string unions (match CHECK constraints) ---
export type MasteryState =
  "not_started" | "attempted" | "developing" | "proficient" | "mastered" | "solidified";

export type ChallengeStatus = "active" | "parked" | "completed";

export type SourceType = "video" | "article" | "book" | "paper" | "other";

export type HintLevel = "none" | "keywords" | "guiding_questions" | "outline";

export type EvaluationStatus = "pending" | "processing" | "completed" | "error";

export type CoverageStatus = "covered" | "partial" | "missing";

/** One entry in an attempt's `coverage` jsonb array. */
export interface Coverage {
  topic: string;
  status: CoverageStatus;
  note: string;
}

// ----------------------------------------------------------------------------
// Database — consumed by the Supabase client generic
// ----------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          streak_count: number;
          best_streak: number;
          last_active_date: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          streak_count?: number;
          best_streak?: number;
          last_active_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          streak_count?: number;
          best_streak?: number;
          last_active_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          deadline: string | null;
          extended_deadline: string | null;
          mastery_state: MasteryState;
          mastery_updated_at: string;
          latest_score: number | null;
          best_score: number | null;
          recording_duration_sec: number | null;
          status: ChallengeStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          deadline?: string | null;
          extended_deadline?: string | null;
          mastery_state?: MasteryState;
          mastery_updated_at?: string;
          latest_score?: number | null;
          best_score?: number | null;
          recording_duration_sec?: number | null;
          status?: ChallengeStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          deadline?: string | null;
          extended_deadline?: string | null;
          mastery_state?: MasteryState;
          mastery_updated_at?: string;
          latest_score?: number | null;
          best_score?: number | null;
          recording_duration_sec?: number | null;
          status?: ChallengeStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      challenge_outlines: {
        Row: {
          id: string;
          challenge_id: string;
          order_index: number;
          title: string;
          description: string | null;
          is_user_added: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          order_index: number;
          title: string;
          description?: string | null;
          is_user_added?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          order_index?: number;
          title?: string;
          description?: string | null;
          is_user_added?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      challenge_sources: {
        Row: {
          id: string;
          challenge_id: string;
          title: string;
          url: string | null;
          source_type: SourceType;
          is_ai_suggested: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          title: string;
          url?: string | null;
          source_type?: SourceType;
          is_ai_suggested?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          title?: string;
          url?: string | null;
          source_type?: SourceType;
          is_ai_suggested?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      challenge_notes: {
        Row: {
          id: string;
          challenge_id: string;
          content: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          content?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          content?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attempts: {
        Row: {
          id: string;
          challenge_id: string;
          attempt_number: number;
          audio_storage_path: string | null;
          duration_seconds: number | null;
          hint_level_used: HintLevel;
          max_possible_score: number | null;
          transcript: string | null;
          overall_score: number | null;
          comprehensiveness_score: number | null;
          accuracy_score: number | null;
          clarity_score: number | null;
          feedback: string | null;
          strengths: Json | null;
          improvements: Json | null;
          coverage: Json | null;
          evaluation_status: EvaluationStatus;
          evaluation_started_at: string | null;
          evaluation_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          attempt_number: number;
          audio_storage_path?: string | null;
          duration_seconds?: number | null;
          hint_level_used?: HintLevel;
          max_possible_score?: number | null;
          transcript?: string | null;
          overall_score?: number | null;
          comprehensiveness_score?: number | null;
          accuracy_score?: number | null;
          clarity_score?: number | null;
          feedback?: string | null;
          strengths?: Json | null;
          improvements?: Json | null;
          coverage?: Json | null;
          evaluation_status?: EvaluationStatus;
          evaluation_started_at?: string | null;
          evaluation_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          attempt_number?: number;
          audio_storage_path?: string | null;
          duration_seconds?: number | null;
          hint_level_used?: HintLevel;
          max_possible_score?: number | null;
          transcript?: string | null;
          overall_score?: number | null;
          comprehensiveness_score?: number | null;
          accuracy_score?: number | null;
          clarity_score?: number | null;
          feedback?: string | null;
          strengths?: Json | null;
          improvements?: Json | null;
          coverage?: Json | null;
          evaluation_status?: EvaluationStatus;
          evaluation_started_at?: string | null;
          evaluation_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// ----------------------------------------------------------------------------
// Convenience row aliases
// ----------------------------------------------------------------------------
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
export type ChallengeOutline = Database["public"]["Tables"]["challenge_outlines"]["Row"];
export type ChallengeSource = Database["public"]["Tables"]["challenge_sources"]["Row"];
export type ChallengeNote = Database["public"]["Tables"]["challenge_notes"]["Row"];
export type Attempt = Database["public"]["Tables"]["attempts"]["Row"];
