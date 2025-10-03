import { supabase } from '../config/supabase';
import type { Database } from '../config/supabase';

// Tipos de conveniencia
type Tables = Database['public']['Tables'];
type UserProfile = Tables['user_profiles']['Row'];

// =====================================================
// AUTENTICACIÓN
// =====================================================

export const authService = {
  // Registrar nuevo usuario
  signUp: async (email: string, password: string, username: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          }
        }
      });

      if (error) throw error;
      
      // Crear perfil de usuario si el registro fue exitoso
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            username,
            full_name: fullName || '',
            email,
            user_type: 'user'
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Iniciar sesión
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Obtener perfil del usuario
      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        return { 
          data: { ...data, profile }, 
          error: null 
        };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Cerrar sesión
  signOut: () => supabase.auth.signOut(),

  // Obtener sesión actual
  getSession: () => supabase.auth.getSession(),

  // Obtener usuario actual
  getCurrentUser: () => supabase.auth.getUser(),

  // Escuchar cambios de autenticación
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// =====================================================
// EQUIPOS
// =====================================================

export const teamsService = {
  // Obtener todos los equipos
  getAll: async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('conference', { ascending: true })
      .order('division', { ascending: true })
      .order('city', { ascending: true });

    return { data: data || [], error };
  },

  // Obtener equipo por ID
  getById: async (id: number) => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  // Obtener equipos por conferencia
  getByConference: async (conference: 'AFC' | 'NFC') => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('conference', conference)
      .order('division')
      .order('city');

    return { data: data || [], error };
  }
};

// =====================================================
// TEMPORADAS
// =====================================================

export const seasonsService = {
  // Obtener temporada activa
  getCurrent: async () => {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('is_active', true)
      .single();

    return { data, error };
  },

  // Obtener todas las temporadas
  getAll: async () => {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .order('year', { ascending: false });

    return { data: data || [], error };
  }
};

// =====================================================
// PARTIDOS
// =====================================================

export const matchesService = {
  // Obtener partidos por semana
  getByWeek: async (week: number, seasonId?: number) => {
    let query = supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        season:seasons(*)
      `)
      .eq('week', week);

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data, error } = await query.order('game_date');

    return { data: data || [], error };
  },

  // Obtener próximos partidos
  getUpcoming: async (limit: number = 10) => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      `)
      .eq('status', 'scheduled')
      .gte('game_date', new Date().toISOString())
      .order('game_date')
      .limit(limit);

    return { data: data || [], error };
  },

  // Actualizar resultado de partido
  updateResult: async (matchId: number, homeScore: number, awayScore: number) => {
    const { data, error } = await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'completed'
      })
      .eq('id', matchId)
      .select()
      .single();

    return { data, error };
  }
};

// =====================================================
// ENTRADAS
// =====================================================

export const entriesService = {
  // Obtener entradas de usuario
  getUserEntries: async (userId: string, seasonId?: number) => {
    let query = supabase
      .from('entries')
      .select(`
        *,
        season:seasons(*),
        user_profile:user_profiles(*)
      `)
      .eq('user_id', userId);

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  // Crear nueva entrada
  create: async (userId: string, seasonId: number, entryName: string) => {
    const { data, error } = await supabase
      .from('entries')
      .insert({
        user_id: userId,
        season_id: seasonId,
        entry_name: entryName,
        is_active: true
      })
      .select()
      .single();

    return { data, error };
  },

  // Eliminar entrada (marcar como inactiva)
  eliminate: async (entryId: number, week: number) => {
    const { data, error } = await supabase
      .from('entries')
      .update({
        is_active: false,
        eliminated_week: week
      })
      .eq('id', entryId)
      .select()
      .single();

    return { data, error };
  }
};

// =====================================================
// PICKS
// =====================================================

export const picksService = {
  // Obtener picks de usuario para una temporada
  getUserPicks: async (userId: string, seasonId?: number) => {
    let query = supabase
      .from('picks')
      .select(`
        *,
        entry:entries(*),
        match:matches(*),
        selected_team:teams(*),
        season:seasons(*)
      `)
      .eq('entries.user_id', userId);

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data, error } = await query.order('week', { ascending: false });

    return { data: data || [], error };
  },

  // Crear nuevo pick
  create: async (
    entryId: number, 
    matchId: number, 
    teamId: number, 
    week: number, 
    seasonId: number,
    confidence: number = 1
  ) => {
    const { data, error } = await supabase
      .from('picks')
      .insert({
        entry_id: entryId,
        match_id: matchId,
        selected_team_id: teamId,
        week,
        season_id: seasonId,
        confidence,
        result: 'pending'
      })
      .select(`
        *,
        entry:entries(*),
        match:matches(*),
        selected_team:teams(*)
      `)
      .single();

    return { data, error };
  },

  // Actualizar resultado de pick
  updateResult: async (pickId: number, result: 'win' | 'loss', points: number = 0) => {
    const { data, error } = await supabase
      .from('picks')
      .update({ 
        result,
        points_earned: points 
      })
      .eq('id', pickId)
      .select()
      .single();

    return { data, error };
  },

  // Obtener picks por semana
  getPicksByWeek: async (week: number, seasonId?: number) => {
    let query = supabase
      .from('picks')
      .select(`
        *,
        entry:entries(*),
        match:matches(*),
        selected_team:teams(*),
        user_profile:entries(user_profiles(*))
      `)
      .eq('week', week);

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data, error } = await query.order('created_at');

    return { data: data || [], error };
  }
};

// =====================================================
// DASHBOARD Y ESTADÍSTICAS
// =====================================================

export const dashboardService = {
  // Obtener estadísticas del dashboard
  getUserStats: async (userId: string) => {
    try {
      // Obtener temporada activa
      const { data: season } = await supabase
        .from('seasons')
        .select('id, current_week, year, is_active')
        .eq('is_active', true)
        .single();

      if (!season) {
        // Intentar obtener la temporada más reciente aunque no esté activa
        const { data: latestSeason } = await supabase
          .from('seasons')
          .select('id, current_week, year')
          .order('year', { ascending: false })
          .limit(1)
          .single();

        if (latestSeason) {
          // Usar la temporada más reciente como fallback
          return {
            data: {
              entradas_activas: 0,
              victorias: 0,
              derrotas: 0,
              posicion_ranking: 0,
              semana_actual: latestSeason.current_week || 5,
              picks_recientes: []
            },
            error: null
          };
        }
        
        return { 
          data: null, 
          error: { 
            message: 'No active season found' 
          } 
        };
      }

      // Obtener entradas del usuario
      const { data: entries } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .eq('season_id', season.id);

      // Calcular estadísticas básicas
      const activeEntries = entries?.filter(e => e.is_active).length || 0;
      const totalWins = entries?.reduce((sum, e) => sum + (e.total_wins || 0), 0) || 0;
      const totalLosses = entries?.reduce((sum, e) => sum + (e.total_losses || 0), 0) || 0;

      // Obtener ranking (simplificado por ahora)
      const { data: allEntries } = await supabase
        .from('entries')
        .select('user_id, total_wins')
        .eq('season_id', season.id)
        .eq('is_active', true)
        .order('total_wins', { ascending: false });

      const userRank = allEntries ? allEntries.findIndex(e => e.user_id === userId) + 1 : 0;

      const dashboardData = {
        entradas_activas: activeEntries,
        victorias: totalWins,
        derrotas: totalLosses,
        posicion_ranking: userRank,
        semana_actual: season.current_week,
        picks_recientes: []
      };

      return { data: dashboardData, error: null };

    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  // Obtener ranking de temporada
  getSeasonRanking: async (seasonYear?: number) => {
    const { data, error } = await supabase
      .rpc('get_season_ranking', { season_year: seasonYear });

    return { data: data || [], error };
  }
};

// =====================================================
// PERFILES DE USUARIO
// =====================================================

export const userProfilesService = {
  // Obtener perfil de usuario
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  },

  // Actualizar perfil de usuario
  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Obtener todos los perfiles (para admin)
  getAll: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('username');

    return { data: data || [], error };
  }
};

// =====================================================
// UTILIDADES
// =====================================================

export const utilsService = {
  // Verificar si el usuario es admin
  isAdmin: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', userId)
      .single();

    return { 
      isAdmin: data?.user_type === 'admin', 
      error 
    };
  }
};

// Exportar todo como servicios
export const supabaseServices = {
  auth: authService,
  teams: teamsService,
  seasons: seasonsService,
  matches: matchesService,
  entries: entriesService,
  picks: picksService,
  dashboard: dashboardService,
  userProfiles: userProfilesService,
  utils: utilsService,
};

// Exportación por defecto
export default supabaseServices;