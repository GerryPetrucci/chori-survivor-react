import { supabase } from '../config/supabase';

// Tipos para las estadísticas de trends
export interface TeamTrendStats {
  team_id: number;
  team_name: string;
  team_abbreviation: string;
  pick_count: number;
  win_count: number;
  loss_count: number;
  tie_count: number;
  win_rate: number;
  avg_points: number;
  popularity_rank: number;
  success_rank: number;
  risk_level: 'low' | 'medium' | 'high';
  logo_url?: string;
}

export interface WeeklyTrendData {
  week: number;
  pick_count: number;
  win_count: number;
  loss_count: number;
  tie_count: number;
  win_rate: number;
  active_entries: number;
  total_points: number;
  avg_points_per_pick: number;
}

export interface PickDistribution {
  team_id: number;
  team_name: string;
  team_abbreviation: string;
  pick_count: number;
  win_count: number; // Agregado win_count
  loss_count: number; // Agregado loss_count
  percentage: number;
  color: string;
  logo_url?: string;
}

export interface TrendsData {
  teamStats: TeamTrendStats[];
  weeklyTrends: WeeklyTrendData[];
  pickDistribution: PickDistribution[];
  selectedWeek: number | null; // Puede ser null para "todas las semanas"
  availableWeeks: number[];
  currentSeason: any;
}

export class TrendsService {
  private static readonly CHART_COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
    '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
  ];

  /**
   * Obtiene todas las semanas disponibles de la temporada actual
   */
  static async getAvailableWeeks(): Promise<{ weeks: number[], error: any }> {
    try {
      console.log('📅 Getting available weeks...');
      
      // Obtener temporada activa
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('id, current_week, year')
        .eq('is_active', true)
        .single();

      console.log('🏈 Season for weeks:', season, 'Error:', seasonError);

      if (seasonError || !season) {
        return { weeks: [], error: seasonError || new Error('No active season found') };
      }

      // Obtener semanas con partidos
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('week')
        .eq('season_id', season.id)
        .order('week', { ascending: false });

      console.log('🏈 Matches found:', matches?.length, 'Error:', matchesError);

      if (matchesError) {
        return { weeks: [], error: matchesError };
      }

      const uniqueWeeks = [...new Set(matches?.map(m => m.week) || [])];
      console.log('📅 Unique weeks found:', uniqueWeeks);
      
      return { weeks: uniqueWeeks, error: null };
    } catch (error) {
      console.error('💥 Error getting available weeks:', error);
      return { weeks: [], error };
    }
  }

  /**
   * Obtiene estadísticas de equipos más populares y exitosos
   */
  static async getTeamStats(seasonId?: number): Promise<{ stats: TeamTrendStats[], error: any }> {
    try {
      // Primero obtener temporada activa si no se especifica
      let currentSeasonId = seasonId;
      if (!currentSeasonId) {
        const { data: season } = await supabase
          .from('seasons')
          .select('id')
          .eq('is_active', true)
          .single();
        currentSeasonId = season?.id;
      }

      if (!currentSeasonId) {
        return { stats: [], error: new Error('No active season found') };
      }

      // Query simplificada para picks
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select(`
          selected_team_id,
          result,
          points_earned,
          entries!inner(season_id)
        `)
        .eq('entries.season_id', currentSeasonId);

      if (picksError) {
        return { stats: [], error: picksError };
      }

      // Obtener información de todos los equipos
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, abbreviation, logo_url');

      if (teamsError) {
        return { stats: [], error: teamsError };
      }

      // Procesar estadísticas por equipo
      const teamStatsMap = new Map<number, TeamTrendStats>();

      // Inicializar todos los equipos
      teams?.forEach(team => {
        teamStatsMap.set(team.id, {
          team_id: team.id,
          team_name: team.name,
          team_abbreviation: team.abbreviation,
          pick_count: 0,
          win_count: 0,
          loss_count: 0,
          tie_count: 0,
          win_rate: 0,
          avg_points: 0,
          popularity_rank: 0,
          success_rank: 0,
          risk_level: 'medium',
          logo_url: team.logo_url || `/assets/logos/${team.abbreviation?.toLowerCase()}_logo.png`
        });
      });

      // Agregar datos de picks
      picks?.forEach(pick => {
        const teamId = pick.selected_team_id;
        const teamStats = teamStatsMap.get(teamId);
        
        if (teamStats) {
          teamStats.pick_count += 1;
          
          // Determinar si el pick fue ganador, perdedor o empate basado en el campo 'result'
          // Posibles valores: 'W' (win), 'L' (loss), 'T' (tie), 'pending'
          if (pick.result === 'W') {
            teamStats.win_count += 1;
          } else if (pick.result === 'L') {
            teamStats.loss_count += 1;
          } else if (pick.result === 'T') {
            teamStats.tie_count += 1;
          }
          // Los picks con result 'pending' no se cuentan en ninguna categoría
          
          teamStats.avg_points += pick.points_earned || 0;
        }
      });

      // Calcular métricas finales
      const statsArray = Array.from(teamStatsMap.values()).map(stats => {
        const totalDecided = stats.win_count + stats.loss_count + stats.tie_count;
        // Win rate considerando wins y empates como "no perdidas"
        stats.win_rate = totalDecided > 0 ? ((stats.win_count + stats.tie_count * 0.5) / totalDecided) * 100 : 0;
        stats.avg_points = stats.pick_count > 0 ? stats.avg_points / stats.pick_count : 0;
        
        // Determinar nivel de riesgo
        if (stats.win_rate >= 70 && stats.pick_count >= 3) {
          stats.risk_level = 'low';
        } else if (stats.win_rate >= 50 || stats.pick_count < 3) {
          stats.risk_level = 'medium';
        } else {
          stats.risk_level = 'high';
        }
        
        return stats;
      });

      // Asignar rankings
      statsArray.sort((a, b) => b.pick_count - a.pick_count);
      statsArray.forEach((stats, index) => {
        stats.popularity_rank = index + 1;
      });

      // Ranking por éxito (win rate con mínimo de picks)
      const teamsWithMinPicks = statsArray.filter(t => t.pick_count >= 2);
      teamsWithMinPicks.sort((a, b) => b.win_rate - a.win_rate);
      teamsWithMinPicks.forEach((stats, index) => {
        stats.success_rank = index + 1;
      });

      return { stats: statsArray, error: null };
    } catch (error) {
      return { stats: [], error };
    }
  }

  /**
   * Obtiene tendencias semanales de la temporada
   */
  static async getWeeklyTrends(seasonId?: number): Promise<{ trends: WeeklyTrendData[], error: any }> {
    try {
      // Obtener temporada activa si no se especifica
      let currentSeasonId = seasonId;
      if (!currentSeasonId) {
        const { data: season } = await supabase
          .from('seasons')
          .select('id')
          .eq('is_active', true)
          .single();
        currentSeasonId = season?.id;
      }

      if (!currentSeasonId) {
        return { trends: [], error: new Error('No active season found') };
      }

      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select(`
          week,
          result,
          points_earned,
          entries!inner(season_id, is_active)
        `)
        .eq('entries.season_id', currentSeasonId);

      if (picksError) {
        return { trends: [], error: picksError };
      }

      // Procesar datos por semana
      const weeklyDataMap = new Map<number, WeeklyTrendData>();

      picks?.forEach(pick => {
        const week = pick.week;
        
        if (!weeklyDataMap.has(week)) {
          weeklyDataMap.set(week, {
            week,
            pick_count: 0,
            win_count: 0,
            loss_count: 0,
            tie_count: 0,
            win_rate: 0,
            active_entries: 0,
            total_points: 0,
            avg_points_per_pick: 0
          });
        }
        
        const weekData = weeklyDataMap.get(week)!;
        weekData.pick_count += 1;
        weekData.total_points += pick.points_earned || 0;
        
        // Usar el campo 'result' para clasificar picks
        // Posibles valores: 'W' (win), 'L' (loss), 'T' (tie), 'pending'
        if (pick.result === 'W') {
          weekData.win_count += 1;
        } else if (pick.result === 'L') {
          weekData.loss_count += 1;
        } else if (pick.result === 'T') {
          weekData.tie_count += 1;
        }
        // Los picks 'pending' no se cuentan en ninguna categoría
      });

      // Calcular métricas finales
      const trendsArray = Array.from(weeklyDataMap.values()).map(trend => {
        const totalDecided = trend.win_count + trend.loss_count + trend.tie_count;
        // Win rate considerando wins y empates como "no perdidas"
        trend.win_rate = totalDecided > 0 ? ((trend.win_count + trend.tie_count * 0.5) / totalDecided) * 100 : 0;
        trend.avg_points_per_pick = trend.pick_count > 0 ? trend.total_points / trend.pick_count : 0;
        trend.active_entries = trend.pick_count; // Simplificación, cada pick representa una entrada activa
        
        return trend;
      });

      trendsArray.sort((a, b) => a.week - b.week);
      return { trends: trendsArray, error: null };
    } catch (error) {
      return { trends: [], error };
    }
  }

  /**
   * Obtiene distribución de picks para una semana específica o todas las semanas
   */
  static async getPickDistribution(week?: number, seasonId?: number): Promise<{ distribution: PickDistribution[], error: any }> {
    try {
      console.log('📊 getPickDistribution - week:', week, 'seasonId:', seasonId);
      
      // Obtener temporada activa si no se especifica
      let currentSeasonId = seasonId;
      
      if (!currentSeasonId) {
        const { data: season } = await supabase
          .from('seasons')
          .select('id')
          .eq('is_active', true)
          .single();
        currentSeasonId = season?.id;
      }

      if (!currentSeasonId) {
        console.error('❌ No active season found for pick distribution');
        return { distribution: [], error: new Error('No active season found') };
      }

      console.log('🎯 Using seasonId:', currentSeasonId, 'for week:', week || 'ALL');

      let query = supabase
        .from('picks')
        .select(`
          selected_team_id,
          result,
          entries!inner(season_id)
        `)
        .eq('entries.season_id', currentSeasonId);

      // Solo filtrar por semana si se especifica
      if (week !== undefined) {
        query = query.eq('week', week);
      }

      const { data: picks, error: picksError } = await query;

      console.log('📋 Picks data:', picks?.length, 'picks found, error:', picksError);

      if (picksError) {
        return { distribution: [], error: picksError };
      }

      // Obtener información de equipos
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, abbreviation, logo_url');

      if (teamsError) {
        return { distribution: [], error: teamsError };
      }

      // Contar picks, victorias y derrotas por equipo
      const teamStats = new Map<number, { pickCount: number; winCount: number; lossCount: number }>();
      picks?.forEach(pick => {
        const teamId = pick.selected_team_id;
        const result = pick.result; // Suponiendo que result puede ser 'W', 'L' o 'T'

        if (!teamStats.has(teamId)) {
          teamStats.set(teamId, { pickCount: 0, winCount: 0, lossCount: 0 });
        }

        const stats = teamStats.get(teamId);
        if (stats) {
          stats.pickCount += 1;
          if (result === 'W' || result === 'T') {
            stats.winCount += 1;
          } else if (result === 'L') {
            stats.lossCount += 1;
          } // Ignorar resultados "pending" u otros valores no definidos
        }
      });

      // Crear distribución
      const distribution: PickDistribution[] = [];
      let colorIndex = 0;

      const totalPicks = picks?.length || 0; // Mover al inicio de la función para asegurar el alcance

      teamStats.forEach((stats, teamId) => {
        const team = teams?.find(t => t.id === teamId);
        if (team) {
          distribution.push({
            team_id: teamId,
            team_name: team.name,
            team_abbreviation: team.abbreviation,
            pick_count: stats.pickCount,
            win_count: stats.winCount, // Agregar win_count
            loss_count: stats.lossCount, // Agregar loss_count
            percentage: totalPicks > 0 ? (stats.pickCount / totalPicks) * 100 : 0,
            color: TrendsService.CHART_COLORS[colorIndex % TrendsService.CHART_COLORS.length],
            logo_url: team.logo_url || `/assets/logos/${team.abbreviation?.toLowerCase()}_logo.png`
          });
          colorIndex++;
        }
      });

      // Ordenar por cantidad de picks
      distribution.sort((a, b) => b.pick_count - a.pick_count);

      console.log('📈 Final distribution:', distribution.length, 'teams');
      console.log('📊 Distribution data:', distribution.slice(0, 3)); // Solo los primeros 3 para no saturar logs

      return { distribution, error: null };
    } catch (error) {
      console.error('💥 Error in getPickDistribution:', error);
      return { distribution: [], error };
    }
  }

  /**
   * Obtiene todos los datos de trends para una semana específica
   */
  static async getAllTrendsData(selectedWeek?: number): Promise<{ data: TrendsData | null, error: any }> {
    try {
      console.log('🔍 TrendsService: Iniciando carga de datos...');
      
      // Obtener temporada activa
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .single();

      console.log('🏈 Temporada activa:', season, 'Error:', seasonError);

      if (seasonError || !season) {
        console.error('❌ No se encontró temporada activa');
        return { data: null, error: seasonError || new Error('No active season found') };
      }

      // Obtener semanas disponibles
      const { weeks, error: weeksError } = await this.getAvailableWeeks();
      console.log('📅 Semanas disponibles:', weeks, 'Error:', weeksError);
      
      if (weeksError) {
        return { data: null, error: weeksError };
      }

      // Convertir 'current' al número de semana actual
      let targetWeek = selectedWeek;
      if (selectedWeek === undefined || (typeof selectedWeek === 'string' && selectedWeek === 'current')) {
        targetWeek = undefined; // undefined = todas las semanas
      }
      
      console.log('🎯 Semana objetivo:', targetWeek, 'selectedWeek original:', selectedWeek, 'weeks available:', weeks, 'current_week:', season.current_week);

      // Obtener todos los datos en paralelo
      console.log('📊 Obteniendo datos en paralelo...');
      const [
        { stats: teamStats, error: teamError },
        { trends: weeklyTrends, error: trendsError },
        { distribution: pickDistribution, error: distributionError }
      ] = await Promise.all([
        this.getTeamStats(season.id),
        this.getWeeklyTrends(season.id),
        this.getPickDistribution(targetWeek, season.id) // Puede ser undefined
      ]);

      console.log('📊 Resultados:');
      console.log('- Team stats:', teamStats?.length, 'items, error:', teamError);
      console.log('- Weekly trends:', weeklyTrends?.length, 'items, error:', trendsError);
      console.log('- Pick distribution:', pickDistribution?.length, 'items, error:', distributionError);

      if (teamError || trendsError || distributionError) {
        const firstError = teamError || trendsError || distributionError;
        console.error('❌ Error en datos:', firstError);
        return { 
          data: null, 
          error: firstError
        };
      }

      const result = {
        teamStats,
        weeklyTrends,
        pickDistribution,
        selectedWeek: targetWeek || null, // Convertir undefined a null
        availableWeeks: weeks,
        currentSeason: season
      };

      console.log('✅ Datos completos preparados:', result);

      return {
        data: result,
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Obtiene análisis de riesgo detallado por categorías
   */
  static async getRiskAnalysis(seasonId?: number): Promise<{ 
    safePicks: TeamTrendStats[],
    moderatePicks: TeamTrendStats[],
    riskyPicks: TeamTrendStats[],
    error: any 
  }> {
    try {
      const { stats, error } = await this.getTeamStats(seasonId);
      
      if (error) {
        return { safePicks: [], moderatePicks: [], riskyPicks: [], error };
      }

      // Filtrar solo equipos con al menos 2 picks para análisis válido
      const teamsWithSufficientData = stats.filter(team => team.pick_count >= 2);

      const safePicks = teamsWithSufficientData
        .filter(team => team.risk_level === 'low')
        .sort((a, b) => b.win_rate - a.win_rate);

      const moderatePicks = teamsWithSufficientData
        .filter(team => team.risk_level === 'medium')
        .sort((a, b) => b.win_rate - a.win_rate);

      const riskyPicks = teamsWithSufficientData
        .filter(team => team.risk_level === 'high')
        .sort((a, b) => a.win_rate - b.win_rate); // Los más riesgosos primero

      return {
        safePicks,
        moderatePicks,
        riskyPicks,
        error: null
      };
    } catch (error) {
      return { safePicks: [], moderatePicks: [], riskyPicks: [], error };
    }
  }
}

export default TrendsService;