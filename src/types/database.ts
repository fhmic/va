// This file mirrors what `npm run db:types` (supabase gen types typescript
// --linked) would generate once these migrations are applied to a linked
// project. Regenerate for real after `supabase db push --linked` to catch
// any drift — this hand-maintained version exists only so the app
// typechecks against the Foundation Hardening schema before a live
// Supabase project is linked in this environment.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: string;
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          plan: "free" | "pro";
          onboarding_completed_at: string | null;
          terms_accepted_at: string | null;
          profession:
            | "Student"
            | "Professional"
            | "Manager"
            | "Executive"
            | "Founder"
            | "Consultant"
            | "Job Seeker"
            | null;
          experience_level: "Beginner" | "Intermediate" | "Advanced" | null;
          primary_goal:
            | "Improve Confidence"
            | "Executive Presence"
            | "Ace Interviews"
            | "Improve Presentations"
            | "Improve Meetings"
            | "Become More Persuasive"
            | "Leadership Communication"
            | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          plan?: "free" | "pro";
          onboarding_completed_at?: string | null;
          terms_accepted_at?: string | null;
          profession?:
            | "Student"
            | "Professional"
            | "Manager"
            | "Executive"
            | "Founder"
            | "Consultant"
            | "Job Seeker"
            | null;
          experience_level?: "Beginner" | "Intermediate" | "Advanced" | null;
          primary_goal?:
            | "Improve Confidence"
            | "Executive Presence"
            | "Ace Interviews"
            | "Improve Presentations"
            | "Improve Meetings"
            | "Become More Persuasive"
            | "Leadership Communication"
            | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          plan?: "free" | "pro";
          onboarding_completed_at?: string | null;
          terms_accepted_at?: string | null;
          profession?:
            | "Student"
            | "Professional"
            | "Manager"
            | "Executive"
            | "Founder"
            | "Consultant"
            | "Job Seeker"
            | null;
          experience_level?: "Beginner" | "Intermediate" | "Advanced" | null;
          primary_goal?:
            | "Improve Confidence"
            | "Executive Presence"
            | "Ace Interviews"
            | "Improve Presentations"
            | "Improve Meetings"
            | "Become More Persuasive"
            | "Leadership Communication"
            | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      legal_documents: {
        Row: {
          id: string;
          name: string;
          slug: string;
          version: string;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          version: string;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          version?: string;
          published_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      legal_acceptances: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          accepted_at: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          accepted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          accepted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legal_acceptances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "legal_acceptances_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "legal_documents";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: "light" | "dark" | "system";
          voice_enabled: boolean;
          tts_speed: number;
          mentor_style: "supportive" | "balanced" | "challenging";
          coaching_intensity: "low" | "medium" | "high";
          voice_gender: "auto" | "male" | "female";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: "light" | "dark" | "system";
          voice_enabled?: boolean;
          tts_speed?: number;
          mentor_style?: "supportive" | "balanced" | "challenging";
          coaching_intensity?: "low" | "medium" | "high";
          voice_gender?: "auto" | "male" | "female";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: "light" | "dark" | "system";
          voice_enabled?: boolean;
          tts_speed?: number;
          mentor_style?: "supportive" | "balanced" | "challenging";
          coaching_intensity?: "low" | "medium" | "high";
          voice_gender?: "auto" | "male" | "female";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      mentors: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          tagline: string;
          persona_prompt: string;
          mentor_style: "supportive" | "balanced" | "challenging";
          best_fit_goals: string[];
          voice_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          display_name: string;
          tagline: string;
          persona_prompt: string;
          mentor_style: "supportive" | "balanced" | "challenging";
          best_fit_goals?: string[];
          voice_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          display_name?: string;
          tagline?: string;
          persona_prompt?: string;
          mentor_style?: "supportive" | "balanced" | "challenging";
          best_fit_goals?: string[];
          voice_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      conversation_sessions: {
        Row: {
          id: string;
          user_id: string;
          mentor_id: string;
          title: string | null;
          started_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mentor_id: string;
          title?: string | null;
          started_at?: string;
          last_message_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mentor_id?: string;
          title?: string | null;
          started_at?: string;
          last_message_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_mentor_id_fkey";
            columns: ["mentor_id"];
            isOneToOne: false;
            referencedRelation: "mentors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: "user" | "mentor" | "system";
          content: string;
          input_mode: "text" | "voice";
          audio_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          role: "user" | "mentor" | "system";
          content: string;
          input_mode?: "text" | "voice";
          audio_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          role?: "user" | "mentor" | "system";
          content?: string;
          input_mode?: "text" | "voice";
          audio_path?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "conversation_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_mentor_assignments: {
        Row: {
          id: string;
          user_id: string;
          mentor_id: string;
          reason: string;
          assigned_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mentor_id: string;
          reason: string;
          assigned_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mentor_id?: string;
          reason?: string;
          assigned_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_mentor_assignments_mentor_id_fkey";
            columns: ["mentor_id"];
            isOneToOne: false;
            referencedRelation: "mentors";
            referencedColumns: ["id"];
          },
        ];
      };
      memory_items: {
        Row: {
          id: string;
          user_id: string;
          type: "fact" | "preference" | "goal_reference" | "episodic_summary";
          content: string;
          source_message_id: string | null;
          importance: number;
          embedding: number[] | null;
          superseded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "fact" | "preference" | "goal_reference" | "episodic_summary";
          content: string;
          source_message_id?: string | null;
          importance?: number;
          embedding?: number[] | null;
          superseded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "fact" | "preference" | "goal_reference" | "episodic_summary";
          content?: string;
          source_message_id?: string | null;
          importance?: number;
          embedding?: number[] | null;
          superseded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: "active" | "paused" | "completed" | "abandoned";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: "active" | "paused" | "completed" | "abandoned";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: "active" | "paused" | "completed" | "abandoned";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      progress_snapshots: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string | null;
          source: "activity" | "assessment";
          metric_key: string;
          metric_value: number;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id?: string | null;
          source: "activity" | "assessment";
          metric_key: string;
          metric_value: number;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_id?: string | null;
          source?: "activity" | "assessment";
          metric_key?: string;
          metric_value?: number;
          recorded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "progress_snapshots_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases used throughout the app instead of reaching
// into Database["public"]["Tables"][...] everywhere.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type LegalDocument = Database["public"]["Tables"]["legal_documents"]["Row"];
export type LegalAcceptance = Database["public"]["Tables"]["legal_acceptances"]["Row"];
export type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];
export type Mentor = Database["public"]["Tables"]["mentors"]["Row"];
export type ConversationSession = Database["public"]["Tables"]["conversation_sessions"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type UserMentorAssignment = Database["public"]["Tables"]["user_mentor_assignments"]["Row"];
export type MemoryItem = Database["public"]["Tables"]["memory_items"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type ProgressSnapshot = Database["public"]["Tables"]["progress_snapshots"]["Row"];
