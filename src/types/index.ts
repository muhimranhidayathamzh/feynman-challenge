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

/** Why an attempt could not be scored ('none' = scored normally). */
export type AudioIssue = "none" | "silent" | "too_short" | "unintelligible" | "off_topic";

/**
 * One entry in an attempt's `coverage` jsonb array. Older rows only have
 * topic/status/note; newer ones add the 1-based outline_index and a short
 * quote from the transcript as evidence.
 */
export type Coverage = {
  topic: string;
  status: CoverageStatus;
  note: string;
  evidence: string;
  outline_index?: number;
};

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
          timezone: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          streak_count?: number;
          best_streak?: number;
          last_active_date?: string | null;
          timezone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          streak_count?: number;
          best_streak?: number;
          last_active_date?: string | null;
          timezone?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          /** Calendar day "YYYY-MM-DD" in the user's timezone. */
          deadline: string | null;
          last_attempt_at: string | null;
          /** Leitner box 0..5 (src/lib/utils/review.ts). */
          review_box: number;
          /** Calendar day of the next spaced review, or null. */
          next_review_at: string | null;
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
          last_attempt_at?: string | null;
          review_box?: number;
          next_review_at?: string | null;
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
          last_attempt_at?: string | null;
          review_box?: number;
          next_review_at?: string | null;
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
          keywords: string[];
          guiding_question: string | null;
          is_user_added: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          order_index: number;
          title: string;
          description?: string | null;
          keywords?: string[];
          guiding_question?: string | null;
          is_user_added?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          order_index?: number;
          title?: string;
          description?: string | null;
          keywords?: string[];
          guiding_question?: string | null;
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
          unexplained_jargon: Json | null;
          follow_up_questions: Json | null;
          audio_issue: AudioIssue | null;
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
          unexplained_jargon?: Json | null;
          follow_up_questions?: Json | null;
          audio_issue?: AudioIssue | null;
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
          unexplained_jargon?: Json | null;
          follow_up_questions?: Json | null;
          audio_issue?: AudioIssue | null;
          evaluation_status?: EvaluationStatus;
          evaluation_started_at?: string | null;
          evaluation_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attempt_followups: {
        Row: {
          id: string;
          attempt_id: string;
          question_index: number;
          question: string;
          outline_index: number | null;
          audio_storage_path: string | null;
          transcript: string | null;
          verdict: "tepat" | "sebagian" | "keliru" | null;
          feedback: string | null;
          hint: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_index: number;
          question: string;
          outline_index?: number | null;
          audio_storage_path?: string | null;
          transcript?: string | null;
          verdict?: "tepat" | "sebagian" | "keliru" | null;
          feedback?: string | null;
          hint?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_index?: number;
          question?: string;
          outline_index?: number | null;
          audio_storage_path?: string | null;
          transcript?: string | null;
          verdict?: "tepat" | "sebagian" | "keliru" | null;
          feedback?: string | null;
          hint?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      /** Wins the evaluation claim: returns the attempt row, or nothing. */
      claim_attempt_evaluation: {
        Args: { p_attempt_id: string };
        Returns: Database["public"]["Tables"]["attempts"]["Row"][];
      };
      /** Persists attempt result + challenge mastery + streak in one transaction. */
      finalize_attempt_evaluation: {
        Args: {
          p_attempt_id: string;
          p_transcript: string;
          p_overall_score: number;
          p_comprehensiveness_score: number;
          p_accuracy_score: number;
          p_clarity_score: number;
          p_feedback: string;
          p_strengths: Json;
          p_improvements: Json;
          p_coverage: Json;
          p_unexplained_jargon: Json;
          p_follow_up_questions: Json;
          p_mastery_state: MasteryState;
          p_mastery_changed: boolean;
          p_review_box: number;
          p_next_review_at: string;
          p_streak_count: number;
          p_best_streak: number;
          p_last_active_date: string | null;
        };
        Returns: undefined;
      };
      /** Completes an attempt whose audio could not be judged (no scores). */
      finalize_attempt_rejected: {
        Args: {
          p_attempt_id: string;
          p_transcript: string;
          p_audio_issue: Exclude<AudioIssue, "none">;
          p_feedback: string;
        };
        Returns: undefined;
      };
      /** Checks + records one AI use for the caller (security definer). */
      consume_ai_quota: {
        Args: { p_kind: string; p_per_day: number; p_per_minute: number };
        Returns: { allowed: boolean; retry_after_seconds: number }[];
      };
    };
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
