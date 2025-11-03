// =====================================================
// TEAM RECORDS
// =====================================================

export const teamRecordsService = {
  // Obtener récord de un equipo para un año y semana
  getTeamRecord: async (teamId: number, year: number, week: number) => {
    const { data, error } = await supabase
      .from('team_records')
      .select('*')
      .eq('team_id', teamId)
      .eq('year', year)
      .eq('week', week)
      .single();
    return { data, error };
  },
  // Obtener todos los récords de una semana y año
  getRecordsByWeek: async (year: number, week: number) => {
    const { data, error } = await supabase
      .from('team_records')
      .select('*')
      .eq('year', year)
      .eq('week', week);
    return { data: data || [], error };
  }
};
import { supabase } from '../config/supabase';
import type { Database } from '../config/supabase';

// Tipos de conveniencia
type Tables = Database['public']['Tables'];
type UserProfile = Tables['user_profiles']['Row'];

// =====================================================
// UTILIDADES - RETRY CON EXPONENTIAL BACKOFF
// =====================================================

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Si es un error 429 (rate limit) y aún hay reintentos
      if (error?.status === 429 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s
        console.log(`⏳ Rate limit (429) alcanzado. Reintentando en ${delay}ms... (intento ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      
      // Para cualquier otro error o si se acabaron los reintentos
      throw error;
    }
  }
  
  throw lastError;
}

// =====================================================
// AUTENTICACIÓN
// =====================================================

export const authService = {
  // Registrar nuevo usuario
  signUp: async (originalEmail: string, password: string, username: string, fullName?: string) => {
    try {
      console.log('🚀 Supabase signUp called with:', { 
        email: originalEmail, 
        emailLength: originalEmail.length,
        emailType: typeof originalEmail,
        password: '***',
        username, 
        fullName 
      });
      
      // Intentar crear usuario con retry automático en caso de rate limiting (429)
      const signUpResult = await retryWithBackoff(async () => {
        return await supabase.auth.signUp({
          email: originalEmail,
          password,
          options: {
            data: {
              username,
              full_name: fullName,
            }
          }
        });
      }, 3, 2000); // 3 reintentos, comenzando con 2 segundos
      
      const { data, error } = signUpResult;

      console.log('🔄 Supabase signUp response:', { data, error });

      if (error) throw error;
      
      // El perfil se crea automáticamente via trigger handle_new_user
      if (data.user) {
        console.log('✅ Usuario creado en Auth:', {
          id: data.user.id,
          email: data.user.email,
          confirmed_at: data.user.email_confirmed_at
        });
        console.log('ℹ️ El perfil se creará automáticamente via trigger de base de datos');
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
  },

  // Solicitar reset de contraseña
  requestPasswordReset: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?recovery=true`
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Actualizar contraseña del usuario actual
  updatePassword: async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
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
        season:seasons(*)
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

    // Si la entrada se creó exitosamente, registrar la actividad
    if (data && !error) {
      try {
        await notificationsService.createActivity(
          userId,
          'entry_created',
          'Entrada creada',
          `Nueva entrada creada: ${entryName}`,
          {
            entry_id: data.id,
            entry_name: entryName,
            season_id: seasonId
          }
        );
      } catch (activityError) {
        // Log el error pero no fallar la operación principal
        console.error('Error creando actividad para entrada:', activityError);
      }
    }

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

    // Si el pick se creó exitosamente, registrar la actividad
    if (data && !error) {
      try {
        // Obtener información adicional para la descripción
        const entryName = data.entry?.entry_name || `Entrada ${entryId}`;
        const teamName = data.selected_team?.name || `Equipo ${teamId}`;
        
        await notificationsService.createActivity(
          data.entry.user_id,
          'pick_created',
          'Pick realizado',
          `Pick creado para ${entryName}: ${teamName} en semana ${week}`,
          {
            entry_id: entryId,
            match_id: matchId,
            team_id: teamId,
            week: week,
            season_id: seasonId
          }
        );
      } catch (activityError) {
        // Log el error pero no fallar la operación principal
        console.error('Error creando actividad para pick:', activityError);
      }
    }

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
  },

  // Obtener picks de una entrada específica
  getPicksByEntry: async (entryId: number) => {
    const { data, error } = await supabase
      .from('picks')
      .select(`
        *,
        selected_team:teams(*)
      `)
      .eq('entry_id', entryId)
      .order('week', { ascending: false });

    return { data: data || [], error };
  },

  // Obtener equipos ya utilizados por una entrada
  getUsedTeams: async (entryId: number, seasonId?: number) => {
    let query = supabase
      .from('picks')
      .select('selected_team_id')
      .eq('entry_id', entryId);

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data, error } = await query;

    return { 
      data: data?.map(pick => pick.selected_team_id) || [], 
      error 
    };
  },

  // Obtener pick existente para una entrada en una semana específica
  getEntryPickForWeek: async (entryId: number, week: number, seasonId?: number) => {
    let query = supabase
      .from('picks')
      .select(`
        *,
        match:matches(*),
        selected_team:teams(*)
      `)
      .eq('entry_id', entryId)
      .eq('week', week);

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data, error } = await query.maybeSingle();

    return { data, error };
  },

  // Actualizar pick existente
  update: async (
    pickId: number,
    matchId: number,
    teamId: number
  ) => {
    const { data, error } = await supabase
      .from('picks')
      .update({
        match_id: matchId,
        selected_team_id: teamId,
        result: 'pending'
      })
      .eq('id', pickId)
      .select(`
        *,
        entry:entries(*),
        match:matches(*),
        selected_team:teams(*)
      `)
      .single();

    return { data, error };
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
              total_points: 0,
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

      // Calcular puntos totales del usuario (suma de todas sus entradas)
      let totalPoints = 0;
      if (entries && entries.length > 0) {
        for (const entry of entries) {
          const { data: entryPicks } = await supabase
            .from('picks')
            .select('points_earned')
            .eq('entry_id', entry.id);
          
          const entryPoints = entryPicks?.reduce((sum, pick) => sum + (pick.points_earned || 0), 0) || 0;
          totalPoints += entryPoints;
        }
      }

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
        total_points: totalPoints,
        picks_recientes: []
      };

      return { data: dashboardData, error: null };

    } catch (err: any) {
      return { data: null, error: err };
    }
  },
    // Obtener estadísticas de una entrada específica
    getEntryStats: async (entryId: number) => {
      try {
        // Obtener la entrada
        const { data: entry, error: entryError } = await supabase
          .from('entries')
          .select('*')
          .eq('id', entryId)
          .single();

        if (!entry || entryError) {
          return { data: null, error: entryError || { message: 'Entrada no encontrada' } };
        }

        // Obtener temporada actual
        const { data: season } = await supabase
          .from('seasons')
          .select('id, current_week, year, is_active')
          .eq('is_active', true)
          .single();

        // Ranking: posición de la entrada en la temporada
        const { data: allEntries } = await supabase
          .from('entries')
          .select('id, total_wins')
          .eq('season_id', entry.season_id)
          .eq('is_active', true)
          .order('total_wins', { ascending: false });

        const entryRank = allEntries ? allEntries.findIndex(e => e.id === entryId) + 1 : 0;

        // Picks recientes de la entrada
        const { data: picks } = await supabase
          .from('picks')
          .select('*')
          .eq('entry_id', entryId)
          .order('week', { ascending: false })
          .limit(5);

        // Calcular total de puntos de la entrada
        const { data: allPicks } = await supabase
          .from('picks')
          .select('points_earned')
          .eq('entry_id', entryId);

        const totalPoints = allPicks?.reduce((sum, pick) => sum + (pick.points_earned || 0), 0) || 0;

        const dashboardData = {
          entradas_activas: entry.is_active ? 1 : 0,
          victorias: entry.total_wins || 0,
          derrotas: entry.total_losses || 0,
          posicion_ranking: entryRank,
          semana_actual: season?.current_week || null,
          picks_recientes: picks || [],
          entry_name: entry.entry_name,
          total_points: totalPoints,
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

    // Si el perfil se actualizó exitosamente, registrar la actividad
    if (data && !error) {
      try {
        const changedFields = Object.keys(updates).join(', ');
        await notificationsService.createActivity(
          userId,
          'profile_updated',
          'Perfil actualizado',
          `Perfil actualizado: ${changedFields}`,
          {
            changed_fields: Object.keys(updates),
            updates: updates
          }
        );
      } catch (activityError) {
        // Log el error pero no fallar la operación principal
        console.error('Error creando actividad para actualización de perfil:', activityError);
      }
    }

    return { data, error };
  },

  // Obtener todos los perfiles (para admin)
  getAll: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('username');

    return { data: data || [], error };
  },

  // Obtener perfil por email
  getByEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    return { data, error };
  }
};

// =====================================================
// TOKENS
// =====================================================

export const tokensService = {
  // Generar nuevo token
  generateToken: async (
    entriesCount: number, 
    adminPassword: string,
    idCompra?: string
  ) => {
    // Verificar que el usuario actual es admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: { message: 'Usuario no autenticado' }, token: null };
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return { data: null, error: { message: 'Solo administradores pueden generar tokens' }, token: null };
    }

    // Validar contraseña del admin (re-autenticación)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password: adminPassword
    });

    if (authError) {
      return { data: null, error: { message: 'Contraseña de administrador incorrecta' }, token: null };
    }

    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 15); // 15 días de expiración

    const { data, error } = await supabase
      .from('tokens')
      .insert({
        token,
        id_compra: idCompra,
        entries_count: entriesCount,
        expires_at: expiresAt.toISOString(),
        used_flag: false
      })
      .select()
      .single();

    // Registrar actividad del admin
    if (data && !error) {
      try {
        await supabase
          .from('user_activities')
          .insert({
            user_id: user.id,
            activity_type: 'admin_action',
            activity_message: `Generó token de activación para ${entriesCount} entrada${entriesCount > 1 ? 's' : ''}${idCompra ? ` (ID: ${idCompra})` : ''}`,
            metadata: {
              token_id: data.id,
              entries_count: entriesCount,
              id_compra: idCompra,
              expires_at: expiresAt.toISOString()
            }
          });
      } catch (activityError) {
        console.error('Error logging admin activity:', activityError);
        // No fallar la operación principal si falla el logging
      }
    }

    return { data, error, token };
  },

  // Validar token
  validateToken: async (token: string) => {
    console.log('🔍 Validating token:', token);
    const normalizedToken = token.toLowerCase().trim();
    console.log('🔍 Normalized token:', normalizedToken);

    try {
      // Intentar RPC seguro primero (recomendado)
      console.log('🔧 Intentando validar token mediante RPC validate_token_rpc...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('validate_token_rpc', { p_token: normalizedToken });
      console.log('📊 RPC response:', { rpcData, rpcError });

      if (!rpcError && rpcData) {
        // Supabase RPC devuelve JSONB; puede ser '{}' si no hay resultado
        const isEmpty = typeof rpcData === 'object' && Object.keys(rpcData).length === 0;
        if (!isEmpty) {
          const tokenRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
          if (tokenRow) {
            console.log('✅ Token válido (RPC):', tokenRow);
            return { data: tokenRow, error: null };
          }
        } else {
          console.log('🔍 RPC devolvió objeto vacío -> token no encontrado via RPC');
        }
      }

      // Si la RPC no existe o no devolvió resultados, intentar el SELECT tradicional
      console.log('🔁 RPC no disponible o sin resultado, intentando SELECT directo (puede verse afectado por RLS)...');
      const { data: tokenData, error: searchError } = await supabase
        .from('tokens')
        .select('*')
        .ilike('token', normalizedToken)
        .maybeSingle();

      console.log('📊 Token found (SELECT):', tokenData);
      console.log('❌ Search error (SELECT):', searchError);

      if (searchError || !tokenData) {
        return { data: null, error: { message: 'Token no encontrado' } };
      }

      if (tokenData.used_flag) {
        return { data: null, error: { message: 'Token ya ha sido utilizado' } };
      }

      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      console.log('⏰ Current time:', now.toISOString());
      console.log('⏰ Token expires at:', expiresAt.toISOString());

      if (now > expiresAt) {
        return { data: null, error: { message: 'Token expirado' } };
      }

      console.log('✅ Token is valid (SELECT)!');
      return { data: tokenData, error: null };

    } catch (err: any) {
      console.error('❌ validateToken error:', err);
      return { data: null, error: { message: err.message || String(err) } };
    }
  },

  // Marcar token como usado
  useToken: async (token: string, userId: string) => {
    // Normalizar el token a minúsculas
    const normalizedToken = token.toLowerCase().trim();
    
    console.log('🎫 useToken called with:', { token: normalizedToken, userId });
    
    try {
      // Intentar RPC seguro primero
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('use_token_rpc', { p_token: normalizedToken, p_user_id: userId });
        console.log('🔧 use_token_rpc response:', { rpcData, rpcError });
        if (!rpcError && rpcData && typeof rpcData === 'object' && Object.keys(rpcData).length > 0) {
          return { data: rpcData, error: null };
        }
        if (rpcError) {
          console.warn('⚠️ use_token_rpc error, falling back to update by id:', rpcError);
        }
      } catch (e) {
        console.warn('⚠️ use_token_rpc threw:', e);
      }

      // Primero buscar el token para obtener su ID
      const { data: tokenData, error: findError } = await supabase
        .from('tokens')
        .select('*')
        .ilike('token', normalizedToken)
        .maybeSingle();
      
      if (findError || !tokenData) {
        console.error('❌ Token not found:', findError);
        return { data: null, error: findError || { message: 'Token not found' } };
      }
      
      console.log('🔍 Token found for update:', tokenData);
      
      // Actualizar usando el ID del token en lugar de ilike
      const { data, error } = await supabase
        .from('tokens')
        .update({
          used_flag: true,
          used_by_user_id: userId,
          used_at: new Date().toISOString()
        })
        .eq('id', tokenData.id)
        .select()
        .maybeSingle();

      console.log('📊 useToken result:', { data, error });
      return { data, error };
      
    } catch (err: any) {
      console.error('❌ useToken error:', err);
      return { data: null, error: err };
    }
  },

  // Obtener todos los tokens (para admin)
  getAllTokens: async () => {
    const { data, error } = await supabase
      .from('tokens')
      .select(`
        *,
        user_profile:user_profiles(username, email)
      `)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  // Obtener entradas pendientes de crear para un usuario
  getUserPendingEntries: async (userId: string) => {
    try {
      // Try RPC first (preferred method)
      const { data, error } = await supabase.rpc('get_user_pending_entries', { p_user_id: userId });

      if (!error && data) {
        // rpc returns a JSONB object like { pending_count: <number> }
        const pendingCount = (data && (data as any).pending_count) ? Number((data as any).pending_count) : 0;
        console.log('✅ RPC get_user_pending_entries successful, pendingCount:', pendingCount);
        return { pendingCount, error: null };
      }

      // Fallback to client-side calculation if RPC not available
      console.warn('⚠️ RPC not available, using fallback method. Error:', error);

      // Obtener tokens usados por este usuario
      const { data: usedTokens, error: tokensError } = await supabase
        .from('tokens')
        .select('entries_count')
        .eq('used_by_user_id', userId)
        .eq('used_flag', true);

      if (tokensError) {
        console.error('Error fetching used tokens:', tokensError);
        return { pendingCount: 0, error: tokensError };
      }

      // Calcular total de entradas que debería tener
      const totalEntriesFromTokens = usedTokens?.reduce((sum, token) => sum + (token.entries_count || 0), 0) || 0;

      // Obtener entradas ya creadas
      const { data: existingEntries, error: entriesError } = await supabase
        .from('entries')
        .select('id')
        .eq('user_id', userId);

      if (entriesError) {
        console.error('Error fetching existing entries:', entriesError);
        return { pendingCount: 0, error: entriesError };
      }

      const existingCount = existingEntries?.length || 0;
      const pendingCount = Math.max(0, totalEntriesFromTokens - existingCount);

      console.log('📊 Fallback calculation - tokens:', totalEntriesFromTokens, 'existing:', existingCount, 'pending:', pendingCount);
      return { pendingCount, error: null };
    } catch (err: any) {
      console.error('Error in getUserPendingEntries:', err);
      return { pendingCount: 0, error: err };
    }
  }
};



// =====================================================
// NOTIFICACIONES Y ACTIVIDADES
// =====================================================

export const notificationsService = {
  // Crear nueva notificación/actividad
  createActivity: async (
    userId: string,
    activityType: string,
    title: string,
    description: string,
    metadata: any = {}
  ) => {
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        title,
        description,
        metadata
      })
      .select()
      .single();

    return { data, error };
  },

  // Obtener actividades de un usuario (para historial)
  getUserActivities: async (userId: string, limit: number = 50) => {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data: data || [], error };
  },

  // Obtener notificaciones no leídas (para el badge)
  getUnreadNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  // Marcar notificaciones como leídas
  markAsRead: async (activityIds: number[]) => {
    const { data, error } = await supabase
      .from('user_activities')
      .update({ is_read: true })
      .in('id', activityIds);

    return { data, error };
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_activities')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { data, error };
  },

  // Obtener conteo de notificaciones no leídas
  getUnreadCount: async (userId: string) => {
    const { count, error } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { count: count || 0, error };
  }
};

// =====================================================
// ESTADÍSTICAS
// =====================================================

export const statsService = {
  // Obtener estadísticas del usuario
  getUserStats: async (userId: string) => {
    try {
      // Obtener entradas del usuario
      const { data: entries } = await supabase
        .from('entries')
        .select('id, entry_name, total_wins, total_losses, longest_streak, current_streak, status, season_id, seasons(year)')
        .eq('user_id', userId);

      if (!entries) return { data: null, error: 'No entries found' };

      // Obtener picks del usuario
      const { data: picks } = await supabase
        .from('picks')
        .select(`
          result,
          selected_team:teams(name, abbreviation),
          season_id,
          week,
          entry_id
        `)
        .in('entry_id', entries.map(e => e.id));

      // Calcular estadísticas generales
      const totalEntries = entries.length;
      const totalWins = entries.reduce((sum, entry) => sum + (entry.total_wins || 0), 0);
      const totalLosses = entries.reduce((sum, entry) => sum + (entry.total_losses || 0), 0);
      const bestStreak = Math.max(...entries.map(entry => entry.longest_streak || 0));
      const activeEntries = entries.filter(entry => entry.status !== 'eliminated').length;

      // Equipos más seleccionados
      const teamCount: Record<string, { name: string, count: number, abbreviation: string }> = {};
      picks?.forEach(pick => {
        if (pick.selected_team && Array.isArray(pick.selected_team) && pick.selected_team.length > 0) {
          const team = pick.selected_team[0];
          const teamName = team.name;
          const teamAbbr = team.abbreviation;
          if (!teamCount[teamName]) {
            teamCount[teamName] = { name: teamName, abbreviation: teamAbbr, count: 0 };
          }
          teamCount[teamName].count++;
        }
      });

      const favoriteTeams = Object.values(teamCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Estadísticas por temporada
      const seasonStats = entries.reduce((acc: any[], entry: any) => {
        const existing = acc.find(s => s.seasonId === entry.season_id);
        const seasonYear = Array.isArray(entry.seasons) && entry.seasons.length > 0 ? entry.seasons[0].year : entry.seasons?.year;
        if (existing) {
          existing.entries.push(entry);
          existing.totalWins += entry.total_wins || 0;
          existing.totalLosses += entry.total_losses || 0;
        } else {
          acc.push({
            seasonId: entry.season_id,
            seasonYear: seasonYear,
            entries: [entry],
            totalWins: entry.total_wins || 0,
            totalLosses: entry.total_losses || 0
          });
        }
        return acc;
      }, []);

      return {
        data: {
          totalEntries,
          totalWins,
          totalLosses,
          bestStreak,
          activeEntries,
          favoriteTeams,
          seasonStats,
          winPercentage: totalWins + totalLosses > 0 ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(1) : '0'
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }
};

// =====================================================
// STORAGE SERVICE - Manejo de archivos
// =====================================================

export const storageService = {
  // Subir avatar de usuario
  uploadAvatar: async (userId: string, file: File) => {
    try {
      // Validar sesión activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        return { data: null, error: 'No hay sesión activa. Por favor, vuelve a iniciar sesión.' };
      }

      console.log('Session valid, uploading avatar...');

      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return { data: null, error: 'Tipo de archivo no válido. Usa JPG, PNG, GIF o WEBP.' };
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { data: null, error: 'La imagen es muy grande. Máximo 5MB.' };
      }

      // Generar nombre único para el archivo con timestamp para evitar caché
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${timestamp}.${fileExt}`;

      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);

      // Subir archivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile_avatar')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        return { data: null, error: `Error al subir: ${uploadError.message}` };
      }

      console.log('Upload successful:', uploadData);

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('profile_avatar')
        .getPublicUrl(fileName);

      console.log('Public URL:', urlData.publicUrl);

      return { data: { path: fileName, url: urlData.publicUrl }, error: null };
    } catch (error: any) {
      console.error('Storage error:', error);
      return { data: null, error: error.message || 'Error al subir la imagen' };
    }
  },

  // Eliminar avatar anterior
  deleteAvatar: async (avatarUrl: string) => {
    try {
      // Solo eliminar si es una ruta del storage
      if (!avatarUrl || !avatarUrl.includes('profile_avatar')) {
        return { error: null };
      }

      // Extraer nombre del archivo de la URL
      const parts = avatarUrl.split('/');
      const fileName = parts[parts.length - 1];
      
      if (!fileName) return { error: null };

      const { error } = await supabase.storage
        .from('profile_avatar')
        .remove([fileName]);

      return { error };
    } catch (error: any) {
      // No es crítico si falla, continuar
      return { error: null };
    }
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
  notifications: notificationsService,
  stats: statsService,
  storage: storageService,
  utils: utilsService,
};

// Exportación por defecto
export default supabaseServices;