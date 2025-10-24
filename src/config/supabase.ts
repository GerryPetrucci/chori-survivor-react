import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos TypeScript para la base de datos
export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: number;
          name: string;
          city: string;
          abbreviation: string;
          logo_url: string | null;
          conference: string | null;
          division: string | null;
          created_at: string;
        };
        Insert: {
          name: string;
          city: string;
          abbreviation: string;
          logo_url?: string | null;
          conference?: string | null;
          division?: string | null;
        };
        Update: {
          name?: string;
          city?: string;
          abbreviation?: string;
          logo_url?: string | null;
          conference?: string | null;
          division?: string | null;
        };
      };
      seasons: {
        Row: {
          id: number;
          year: number;
          current_week: number;
          max_weeks: number;
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          year: number;
          current_week?: number;
          max_weeks?: number;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: {
          year?: number;
          current_week?: number;
          max_weeks?: number;
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
        };
      };
      matches: {
        Row: {
          id: number;
          season_id: number;
          home_team_id: number;
          away_team_id: number;
          week: number;
          game_date: string;
          home_score: number | null;
          away_score: number | null;
          status: string;
          game_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          season_id: number;
          home_team_id: number;
          away_team_id: number;
          week: number;
          game_date: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: string;
          game_type?: string;
        };
        Update: {
          season_id?: number;
          home_team_id?: number;
          away_team_id?: number;
          week?: number;
          game_date?: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: string;
          game_type?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          user_type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          user_type?: string;
          is_active?: boolean;
        };
        Update: {
          username?: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          user_type?: string;
          is_active?: boolean;
        };
      };
      entries: {
        Row: {
          id: number;
          user_id: string;
          season_id: number;
          entry_name: string;
          is_active: boolean;
          eliminated_week: number | null;
          total_wins: number;
          total_losses: number;
          longest_streak: number;
          current_streak: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          season_id: number;
          entry_name: string;
          is_active?: boolean;
          eliminated_week?: number | null;
          total_wins?: number;
          total_losses?: number;
          longest_streak?: number;
          current_streak?: number;
        };
        Update: {
          user_id?: string;
          season_id?: number;
          entry_name?: string;
          is_active?: boolean;
          eliminated_week?: number | null;
          total_wins?: number;
          total_losses?: number;
          longest_streak?: number;
          current_streak?: number;
        };
      };
      picks: {
        Row: {
          id: number;
          entry_id: number;
          match_id: number;
          selected_team_id: number;
          week: number;
          season_id: number;
          result: string;
          confidence: number;
          points_earned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          entry_id: number;
          match_id: number;
          selected_team_id: number;
          week: number;
          season_id: number;
          result?: string;
          confidence?: number;
          points_earned?: number;
        };
        Update: {
          entry_id?: number;
          match_id?: number;
          selected_team_id?: number;
          week?: number;
          season_id?: number;
          result?: string;
          confidence?: number;
          points_earned?: number;
        };
      };
      user_activities: {
        Row: {
          id: number;
          user_id: string;
          activity_type: string;
          title: string;
          description: string;
          metadata: any | null;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          activity_type: string;
          title: string;
          description: string;
          metadata?: any | null;
          is_read?: boolean;
        };
        Update: {
          user_id?: string;
          activity_type?: string;
          title?: string;
          description?: string;
          metadata?: any | null;
          is_read?: boolean;
        };
      };
    };
    Functions: {
      get_season_ranking: {
        Args: { season_year?: number };
        Returns: {
          rank_position: number;
          user_id: string;
          username: string;
          full_name: string;
          entry_id: number;
          entry_name: string;
          total_wins: number;
          total_losses: number;
          current_streak: number;
          is_active: boolean;
          eliminated_week: number | null;
        }[];
      };
      get_user_dashboard_stats: {
        Args: { user_uuid: string };
        Returns: {
          entradas_activas: number;
          victorias: number;
          derrotas: number;
          posicion_ranking: number;
          semana_actual: number;
          picks_recientes: {
            semana: number;
            equipo_seleccionado: string;
            resultado: string;
            partido: string;
          }[];
        };
      };
    };
  };
};