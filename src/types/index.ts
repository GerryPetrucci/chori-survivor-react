// Types for NFL Survivor application based on Flask backend models

export interface User {
  id: string; // UUID string from Supabase
  email: string;
  username: string;
  full_name?: string;
  user_type: 'user' | 'admin';
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
}

export interface Match {
  id: number;
  semana: number;
  season: string;
  match_time: string;
  local_id: number;
  visitante_id: number;
  marcador_local: number | null;
  marcador_visitante: number | null;
  
  // Populated from relationships
  home?: string;
  away?: string;
  home_id?: number;
  away_id?: number;
  date?: string;
  time?: string;
  score_home?: string;
  score_away?: string;
}

export interface Entry {
  id: number;
  original_entry_id: string;
  owner_user_id: number;
  entry_name: string;
  season: number;
  created_at: string;
  status: 'active' | 'last_chance' | 'eliminated';
  points: number;
}

export interface Pick {
  id: number;
  entry_id: number;
  season: number;
  semana: number;
  team_id: number;
  created_at: string;
  result: 'W' | 'L' | 'T' | null;
  
  // Populated data
  equipo?: string;
  entry_name?: string;
  timestamp?: string;
}

export interface Token {
  id: number;
  token: string;
  id_compra?: string;
  entries_count: number;
  created_at: string;
  expires_at?: string;
  used_by_email?: string;
  used_at?: string;
  used_flag: boolean;
}

export interface RankingEntry {
  pos: number;
  user: string;
  entry_name: string;
  status: string;
  points: number;
  weeks_survived?: number;
}

export interface UserEntry {
  entry_id: string;
  entry_name: string;
  status: string;
  points: number;
}

export interface KPIs {
  active_entries: number;
  total_picks: number;
  user_points: number;
}

export interface AdminKPIs {
  total_users: number;
  new_users_today: number;
  total_entries: number;
  active_entries: number;
  active_tokens: number;
  unused_tokens: number;
}

export interface AdminStats {
  picks_this_week: number;
  active_users_today: number;
  eliminated_entries: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    email: string;
    username: string;
    type_user: string;
  };
  error?: string;
}

export interface DashboardData {
  // Dashboard statistics
  entradas_activas: number;
  victorias: number;
  derrotas: number;
  posicion_ranking: number;
  semana_actual: number;
  
  // Recent activity
  picks_recientes?: {
    semana: number;
    equipo_seleccionado: string;
    resultado?: string;
  }[];
  
  // Original properties
  matches?: Match[];
  ranking?: RankingEntry[];
  weeks?: number[];
  selected_week?: number;
  kpis?: KPIs;
  admin_kpis?: AdminKPIs;
  admin_stats?: AdminStats;
  user_entries?: UserEntry[];
  user_picks?: Pick[];
  selected_entry?: string;
  user_picked_teams?: string[];
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegistrationForm {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  token: string;
}

export interface PickForm {
  entry_id: string;
  semana: number;
  equipo: string;
}

// Navigation and UI types
export interface NavItem {
  label: string;
  path: string;
  icon?: React.ComponentType;
  adminOnly?: boolean;
}

export type UserType = 'user' | 'admin';
export type EntryStatus = 'active' | 'last_chance' | 'eliminated';
export type PickResult = 'W' | 'L' | 'T' | null;