import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface EntryStatus {
  entry_name: string;
  has_pick: boolean;
  team_picked?: string;
  status: 'alive' | 'last_chance' | 'eliminated';
}

interface MatchOdds {
  home_team: string;
  away_team: string;
  home_percentage: number;
  away_percentage: number;
  difference: number;
}

interface WeeklyReminderRequest {
  // Para envío masivo automático
  mode?: 'auto_all_users' | 'auto_no_picks_only';
  force_week?: number; // Opcional para testing
  preview?: boolean; // Opcional para ver datos sin enviar emails
}

// NFL Team logos mapping usando dominio personalizado
const NFL_LOGOS: { [key: string]: string } = {
  'Cardinals': 'https://chori-survivor.com/assets/logos/cardinals_logo.png',
  'Falcons': 'https://chori-survivor.com/assets/logos/falcons_logo.png',
  'Ravens': 'https://chori-survivor.com/assets/logos/ravens_logo.png',
  'Bills': 'https://chori-survivor.com/assets/logos/bills_logo.png',
  'Panthers': 'https://chori-survivor.com/assets/logos/panthers_logo.png',
  'Bears': 'https://chori-survivor.com/assets/logos/bears_logo.png',
  'Bengals': 'https://chori-survivor.com/assets/logos/bengals_logo.png',
  'Browns': 'https://chori-survivor.com/assets/logos/browns_logo.png',
  'Cowboys': 'https://chori-survivor.com/assets/logos/cowboys_logo.png',
  'Broncos': 'https://chori-survivor.com/assets/logos/broncos_logo.png',
  'Lions': 'https://chori-survivor.com/assets/logos/lions_logo.png',
  'Packers': 'https://chori-survivor.com/assets/logos/packers_logo.png',
  'Texans': 'https://chori-survivor.com/assets/logos/texans_logo.png',
  'Colts': 'https://chori-survivor.com/assets/logos/colts_logo.png',
  'Jaguars': 'https://chori-survivor.com/assets/logos/jaguars_logo.png',
  'Chiefs': 'https://chori-survivor.com/assets/logos/chiefs_logo.png',
  'Raiders': 'https://chori-survivor.com/assets/logos/raiders_logo.png',
  'Chargers': 'https://chori-survivor.com/assets/logos/chargers_logo.png',
  'Rams': 'https://chori-survivor.com/assets/logos/rams_logo.png',
  'Dolphins': 'https://chori-survivor.com/assets/logos/dolphins_logo.png',
  'Vikings': 'https://chori-survivor.com/assets/logos/vikings_logo.png',
  'Patriots': 'https://chori-survivor.com/assets/logos/patriots_logo.png',
  'Saints': 'https://chori-survivor.com/assets/logos/saints_logo.png',
  'Giants': 'https://chori-survivor.com/assets/logos/giants_logo.png',
  'Jets': 'https://chori-survivor.com/assets/logos/jets_logo.png',
  'Eagles': 'https://chori-survivor.com/assets/logos/eagles_logo.png',
  'Steelers': 'https://chori-survivor.com/assets/logos/steelers_logo.png',
  '49ers': 'https://chori-survivor.com/assets/logos/49ers_logo.png',
  'Seahawks': 'https://chori-survivor.com/assets/logos/seahawks_logo.png',
  'Buccaneers': 'https://chori-survivor.com/assets/logos/buccaneers_logo.png',
  'Titans': 'https://chori-survivor.com/assets/logos/titans_logo.png',
  'Commanders': 'https://chori-survivor.com/assets/logos/commanders_logo.png'
};

function getTeamLogo(teamName: string): string {
  return NFL_LOGOS[teamName] || '';
}

// Helper functions para obtener datos automáticamente
async function getCurrentNFLWeek(supabase: any): Promise<number> {
  try {
    const { data: season } = await supabase
      .from('seasons')
      .select('current_week')
      .eq('is_active', true)
      .single();
    
    return season?.current_week || 1;
  } catch (error) {
    console.error('Error getting current week:', error);
    return 1;
  }
}

async function calculateDeadline(supabase: any, week: number): Promise<string> {
  try {
    // Obtener el último partido de la semana (el más tardío)
    const { data: matches } = await supabase
      .from('matches')
      .select('game_date')
      .eq('week', week)
      .order('game_date', { ascending: false })
      .limit(1);
    
    if (matches && matches.length > 0) {
      // La fecha ya viene en hora CDMX desde la base de datos
      const gameDate = new Date(matches[0].game_date);
      // Deadline 15 minutos antes del último partido
      gameDate.setMinutes(gameDate.getMinutes() - 15);
      
      // Formatear en español sin conversión de zona horaria (ya está en CDMX)
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      
      const formattedDate = gameDate.toLocaleString('es-MX', options);
      return `${formattedDate} hora CDMX`;
    }
  } catch (error) {
    console.error('Error calculating deadline:', error);
  }
  
  // Fallback: Domingo a las 12:00 PM CDMX
  const sunday = new Date();
  sunday.setDate(sunday.getDate() + (7 - sunday.getDay()));
  sunday.setHours(12, 0, 0, 0);
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  const formattedDate = sunday.toLocaleString('es-MX', options);
  return `${formattedDate} hora CDMX`;
}

async function getTopMatchesWithOdds(supabase: any, week: number): Promise<MatchOdds[]> {
  try {
    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single();
    
    if (!season) return [];

    // Obtener odds de la tabla weekly_odds
    const { data: odds } = await supabase
      .from('weekly_odds')
      .select(`
        *,
        match:matches!inner(
          id,
          week,
          status,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        )
      `)
      .eq('match.week', week)
      .eq('match.status', 'scheduled')
      .order('spread', { ascending: false })
      .limit(5);
    
    if (!odds || odds.length === 0) return [];
    
    // Calcular porcentajes basados en el spread
    return odds.map((odd: any) => {
      const spread = Math.abs(odd.spread || 0);
      // Convertir spread a porcentaje aproximado (spread de 7 ≈ 70% vs 30%)
      const favoritePercentage = Math.min(50 + (spread * 3), 85);
      const underdogPercentage = 100 - favoritePercentage;
      
      const isFavoriteHome = odd.spread < 0;
      
      return {
        home_team: odd.match.home_team.name,
        away_team: odd.match.away_team.name,
        home_percentage: isFavoriteHome ? Math.round(favoritePercentage) : Math.round(underdogPercentage),
        away_percentage: isFavoriteHome ? Math.round(underdogPercentage) : Math.round(favoritePercentage),
        difference: Math.round(Math.abs(favoritePercentage - underdogPercentage))
      };
    });
  } catch (error) {
    console.error('Error getting matches with odds:', error);
    return [];
  }
}

async function getByeTeams(supabase: any, week: number): Promise<string[]> {
  try {
    // Obtener todos los equipos
    const { data: allTeams } = await supabase
      .from('teams')
      .select('name');
    
    // Obtener equipos que juegan esta semana
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .eq('week', week);
    
    if (!allTeams || !matches) return [];
    
    const playingTeams = new Set();
    matches.forEach((match: any) => {
      playingTeams.add(match.home_team.name);
      playingTeams.add(match.away_team.name);
    });
    
    return allTeams
      .map((team: any) => team.name)
      .filter((teamName: string) => !playingTeams.has(teamName));
  } catch (error) {
    console.error('Error getting bye teams:', error);
    return [];
  }
}

async function getUsersForReminder(supabase: any, mode: string, week: number) {
  try {
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single();
    
    if (seasonError) {
      console.error('Error getting active season:', seasonError);
      throw new Error('No active season found');
    }
    
    if (!season) throw new Error('No active season found');
    
    console.log('Active season ID:', season.id);
    
    if (mode === 'auto_all_users') {
      // Todos los usuarios con entradas activas
      // Primero obtener todas las entradas activas
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('user_id')
        .eq('season_id', season.id)
        .eq('is_active', true);
      
      console.log('Entries found for auto_all_users:', entries?.length || 0);
      if (entriesError) console.error('Error getting entries:', entriesError);
      
      if (!entries || entries.length === 0) return [];
      
      // Obtener usuarios únicos
      const userIds = [...new Set(entries.map((e: any) => e.user_id))];
      console.log('Unique user IDs:', userIds.length);
      
      // Obtener información de usuarios
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, username, email')
        .in('id', userIds);
      
      console.log('Users found for auto_all_users:', users?.length || 0);
      if (usersError) console.error('Error getting users:', usersError);
      
      return users || [];
    } 
    
    if (mode === 'auto_no_picks_only') {
      // Solo usuarios con entradas sin picks para la semana actual
      // 1. Obtener todas las entradas activas de la temporada
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('id, user_id, entry_name')
        .eq('season_id', season.id)
        .eq('is_active', true);
      
      console.log('Entries found:', entries?.length || 0);
      if (entriesError) console.error('Error getting entries:', entriesError);
      
      if (!entries || entries.length === 0) return [];
      
      // 2. Obtener todos los picks de la semana actual
      const entryIds = entries.map((e: any) => e.id);
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select('entry_id')
        .eq('week', week)
        .in('entry_id', entryIds);
      
      console.log('Picks found for week', week, ':', picks?.length || 0);
      if (picksError) console.error('Error getting picks:', picksError);
      
      // 3. Encontrar entradas que NO tienen pick
      const entriesWithPicks = new Set(picks?.map((p: any) => p.entry_id) || []);
      const entriesWithoutPicks = entries.filter((e: any) => !entriesWithPicks.has(e.id));
      
      console.log('Entries without picks:', entriesWithoutPicks.length);
      
      if (entriesWithoutPicks.length === 0) return [];
      
      // 4. Obtener usuarios únicos de esas entradas
      const userIds = [...new Set(entriesWithoutPicks.map((e: any) => e.user_id))];
      
      console.log('Unique user IDs:', userIds.length);
      
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, username, email')
        .in('id', userIds);
      
      console.log('Users found for auto_no_picks_only:', users?.length || 0);
      if (usersError) console.error('Error getting users:', usersError);
      
      return users || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting users for reminder:', error);
    return [];
  }
}

async function getUserEntriesStatus(supabase: any, userId: string, week: number): Promise<EntryStatus[]> {
  try {
    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single();
    
    if (!season) return [];
    
    // Obtener TODAS las entradas del usuario (no filtrar por is_active)
    const { data: entries } = await supabase
      .from('entries')
      .select('id, entry_name, status')
      .eq('user_id', userId)
      .eq('season_id', season.id);
    
    if (!entries || entries.length === 0) return [];
    
    const entryIds = entries.map((e: any) => e.id);
    
    // Obtener picks de la semana específica
    const { data: picks } = await supabase
      .from('picks')
      .select(`
        entry_id,
        teams:teams(name)
      `)
      .eq('week', week)
      .in('entry_id', entryIds);
    
    // Mapear entradas con su estado de pick y status
    return entries.map((entry: any) => {
      const weekPick = picks?.find((p: any) => p.entry_id === entry.id);
      return {
        entry_name: entry.entry_name,
        has_pick: !!weekPick,
        team_picked: weekPick?.teams?.name,
        status: entry.status || 'alive'
      };
    });
  } catch (error) {
    console.error('Error getting user entries status:', error);
    return [];
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyReminderData {
  userName: string;
  currentWeek: number;
  deadline: string;
  entries: EntryStatus[];
  topMatches: MatchOdds[];
  byeTeams: string[];
}

function generateWeeklyReminderHTML(data: WeeklyReminderData): string {
  const entriesWithPicks = data.entries.filter(e => e.has_pick);
  const entriesWithoutPicks = data.entries.filter(e => !e.has_pick);
  
  // Helper para obtener el estilo del badge de status
  const getStatusBadge = (status: string) => {
    const styles = {
      alive: { bg: '#d3f9d8', color: '#2b8a3e', text: 'Vivo' },
      last_chance: { bg: '#fff3bf', color: '#e67700', text: 'Última Oportunidad' },
      eliminated: { bg: '#ffe0e0', color: '#c92a2a', text: 'Eliminado' }
    };
    const style = styles[status as keyof typeof styles] || styles.alive;
    return `<span style="display:inline-block; background-color:${style.bg}; color:${style.color}; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold; margin-top:4px;">${style.text}</span>`;
  };
  
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recordatorio Semanal - Semana ${data.currentWeek}</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
    <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="margin:0; padding:0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.08); margin:20px auto;">
            <!-- Header con gradiente unificado -->
            <tr>
              <td align="center" style="padding:30px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-top-left-radius:10px; border-top-right-radius:10px;">
                <img src="https://i.imgur.com/CkMST9l.png" alt="Chori Survivor" width="120" style="display:block; margin:auto;">
                <h2 style="margin:15px 0 0 0; font-size:24px; font-weight:bold; color:#fff;">⚠️ Recordatorio - Semana ${data.currentWeek}</h2>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding:30px 30px 10px 30px;">
                <h3 style="margin-top:0;">¡Hola ${data.userName}! 👋</h3>
                <p>Te recordamos que aún tienes entradas sin pick para la <strong>Semana ${data.currentWeek}</strong> de la NFL.</p>
                
                <!-- Deadline Box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff3cd; border:1px solid #ffc107; border-radius:8px; margin:25px 0;">
                  <tr>
                    <td style="padding:15px;">
                      <strong style="color:#856404;">⏰ Fecha límite:</strong> <span style="color:#856404;">${data.deadline}</span>
                    </td>
                  </tr>
                </table>
                
                <!-- Entradas sin Pick -->
                ${entriesWithoutPicks.length > 0 ? `
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffe5e5; border:1px solid #ff6b6b; border-radius:8px; margin:20px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 15px 0; color:#c92a2a;">❌ Entradas SIN pick (${entriesWithoutPicks.length})</h3>
                      <ul style="margin:0; padding-left:20px; color:#c92a2a;">
                        ${entriesWithoutPicks.map(entry => `
                          <li>
                            <strong>${entry.entry_name}</strong>
                            <div>${getStatusBadge(entry.status)}</div>
                          </li>
                        `).join('')}
                      </ul>
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                <!-- Entradas con Pick -->
                ${entriesWithPicks.length > 0 ? `
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#e7f5ff; border:1px solid #4dabf7; border-radius:8px; margin:20px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 15px 0; color:#1864ab;">✅ Entradas CON pick (${entriesWithPicks.length})</h3>
                      <table width="100%" cellpadding="8" cellspacing="0">
                        ${entriesWithPicks.map(entry => `
                          <tr>
                            <td style="color:#1864ab;">
                              <strong>${entry.entry_name}</strong>
                              <div>${getStatusBadge(entry.status)}</div>
                            </td>
                            <td style="color:#1864ab; text-align:right;">
                              <table cellpadding="0" cellspacing="0" style="float:right;">
                                <tr>
                                  <td>
                                    ${entry.team_picked && getTeamLogo(entry.team_picked) ? `<img src="${getTeamLogo(entry.team_picked)}" alt="${entry.team_picked}" width="24" height="24" style="vertical-align:middle; margin-right:8px; max-width:24px; max-height:24px; object-fit:contain;">` : ''}
                                    ${entry.team_picked || 'N/A'}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        `).join('')}
                      </table>
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                <!-- Top Partidos Recomendados -->
                ${data.topMatches.length > 0 ? `
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa; border-radius:10px; margin:25px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 15px 0; color:#495057;">🔥 Top ${data.topMatches.length} partidos recomendados</h3>
                      <p style="margin:0 0 15px 0; color:#6c757d; font-size:14px;">Partidos con mayor diferencia en los momios</p>
                      ${data.topMatches.map((match) => `
                        <table width="100%" cellpadding="15" cellspacing="0" style="background:#fff; border:1px solid #dee2e6; border-radius:8px; margin-bottom:15px;">
                          <tr>
                            <td width="45%" align="center" style="background:${match.home_percentage > match.away_percentage ? '#e7f5ff' : '#fff'}; border-radius:8px 0 0 8px;">
                              ${getTeamLogo(match.home_team) ? `<img src="${getTeamLogo(match.home_team)}" alt="${match.home_team}" width="40" height="40" style="display:block; margin:0 auto 8px auto; max-width:40px; max-height:40px; object-fit:contain;">` : ''}
                              <div style="font-weight:bold; color:#495057; font-size:14px;">${match.home_team}</div>
                              <div style="font-size:20px; font-weight:bold; color:${match.home_percentage > match.away_percentage ? '#1864ab' : '#868e96'}; margin:5px 0;">${match.home_percentage}%</div>
                            </td>
                            <td width="10%" align="center" style="color:#adb5bd; font-weight:bold;">vs</td>
                            <td width="45%" align="center" style="background:${match.away_percentage > match.home_percentage ? '#e7f5ff' : '#fff'}; border-radius:0 8px 8px 0;">
                              ${getTeamLogo(match.away_team) ? `<img src="${getTeamLogo(match.away_team)}" alt="${match.away_team}" width="40" height="40" style="display:block; margin:0 auto 8px auto; max-width:40px; max-height:40px; object-fit:contain;">` : ''}
                              <div style="font-weight:bold; color:#495057; font-size:14px;">${match.away_team}</div>
                              <div style="font-size:20px; font-weight:bold; color:${match.away_percentage > match.home_percentage ? '#1864ab' : '#868e96'}; margin:5px 0;">${match.away_percentage}%</div>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="3" align="center" style="padding:5px; background:#f1f3f5; border-radius:0 0 8px 8px;">
                              <span style="font-size:12px; color:#868e96;">Diferencia: <strong>${match.difference}%</strong></span>
                            </td>
                          </tr>
                        </table>
                      `).join('')}
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                <!-- Equipos en Bye Week -->
                ${data.byeTeams.length > 0 ? `
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd; border:1px solid #ffeaa7; border-radius:8px; margin:20px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 15px 0; color:#856404;">🚫 Equipos en Bye Week</h3>
                      <p style="margin:0 0 15px 0; color:#856404;">Estos equipos NO juegan esta semana:</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          ${data.byeTeams.map((team, index) => `
                            ${index % 4 === 0 && index > 0 ? '</tr><tr>' : ''}
                            <td width="25%" align="center" style="padding:10px;">
                              ${getTeamLogo(team) ? `<img src="${getTeamLogo(team)}" alt="${team}" width="30" height="30" style="display:block; margin:0 auto 5px auto; max-width:30px; max-height:30px; object-fit:contain;">` : ''}
                              <div style="color:#856404; font-weight:bold; font-size:12px; text-align:center;">${team}</div>
                            </td>
                          `).join('')}
                          ${data.byeTeams.length % 4 !== 0 ? Array(4 - (data.byeTeams.length % 4)).fill('<td width="25%"></td>').join('') : ''}
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                <!-- Call to Action -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                  <tr>
                    <td align="center">
                      <a href="https://chori-survivor.com/picks" style="display:inline-block; background-color:#764ba2; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px; border:none; box-shadow: 0 4px 15px rgba(118, 75, 162, 0.3);">
                        🎯 Hacer mis Picks Ahora
                      </a>
                    </td>
                  </tr>
                </table>
                
                <p style="text-align:center; color:#868e96; font-size:14px;">¡No pierdas la oportunidad de seguir en la competencia! 🏈</p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td align="center" style="background:#333; color:#fff; padding:25px; border-bottom-left-radius:10px; border-bottom-right-radius:10px;">
                <p style="margin:0;">© 2025 Chori Survivor - NFL Survivor Pool</p>
                <p style="margin:0;">Este es un correo automático, no responder.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: WeeklyReminderRequest = await req.json();
    const mode = requestData.mode || 'auto_all_users';

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar modo
    if (mode !== 'auto_all_users' && mode !== 'auto_no_picks_only') {
      return new Response(
        JSON.stringify({ error: 'Invalid mode. Use auto_all_users or auto_no_picks_only' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Modo automático - obtener datos de la BD
    const currentWeek = requestData.force_week || await getCurrentNFLWeek(supabase);
    const deadline = await calculateDeadline(supabase, currentWeek);
    const topMatches = await getTopMatchesWithOdds(supabase, currentWeek);
    const byeTeams = await getByeTeams(supabase, currentWeek);
    const users = await getUsersForReminder(supabase, mode, currentWeek);

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users found for reminder',
          mode,
          currentWeek 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Modo preview - solo devolver datos sin enviar emails
    const preview = requestData.preview === true;
    
    if (preview) {
      const previewData = [];
      
      for (const user of users) {
        try {
          const entries = await getUserEntriesStatus(supabase, user.id, currentWeek);
          
          // Para modo 'auto_no_picks_only', solo incluir usuarios con entradas sin picks
          if (mode === 'auto_no_picks_only') {
            const hasEntriesWithoutPicks = entries.some((e: any) => !e.has_pick);
            if (!hasEntriesWithoutPicks) continue;
          }
          
          previewData.push({
            user: {
              id: user.id,
              email: user.email,
              username: user.username
            },
            emailData: {
              subject: `⚠️ Recordatorio: Elige tu pick - Semana ${currentWeek}`,
              userName: user.username || user.email || 'Usuario',
              currentWeek,
              deadline,
              entries,
              topMatches,
              byeTeams
            },
            stats: {
              total_entries: entries.length,
              entries_without_picks: entries.filter((e: any) => !e.has_pick).length,
              entries_with_picks: entries.filter((e: any) => e.has_pick).length
            }
          });
          
          // Solo mostrar un ejemplo de cada tipo
          if (previewData.length >= 2) break;
          
        } catch (error: any) {
          console.error(`Error processing user ${user.email}:`, error);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          mode,
          currentWeek,
          preview: true,
          total_users_found: users.length,
          sample_users: previewData
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    const from = 'Chori Survivor <noreply@chori-survivor.com>';
    const subject = `⚠️ Recordatorio: Elige tu pick - Semana ${currentWeek}`;

    // Enviar emails a cada usuario
    for (const user of users) {
      try {
        const entries = await getUserEntriesStatus(supabase, user.id, currentWeek);
        
        // Para modo 'auto_no_picks_only', solo incluir usuarios con entradas sin picks
        if (mode === 'auto_no_picks_only') {
          const hasEntriesWithoutPicks = entries.some((e: any) => !e.has_pick);
          if (!hasEntriesWithoutPicks) continue;
        }

        const html = generateWeeklyReminderHTML({
          userName: user.username || user.email || 'Usuario',
          currentWeek,
          deadline,
          entries,
          topMatches,
          byeTeams
        });

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from,
            to: [user.email],
            subject,
            html
          })
        });

        const result = await response.json();

        if (response.ok) {
          await supabase.from('email_logs').insert({
            recipient: user.email,
            subject,
            provider: 'resend',
            status: 'sent',
            resend_id: result.id,
            sent_at: new Date().toISOString()
          });

          results.push({ 
            user: user.email, 
            status: 'sent', 
            id: result.id,
            entries_count: entries.length,
            entries_without_picks: entries.filter((e: any) => !e.has_pick).length
          });
        } else {
          console.error(`Failed to send to ${user.email}:`, result);
          results.push({ 
            user: user.email, 
            status: 'failed', 
            error: result.message || 'Unknown error' 
          });
        }

        // Pausa entre emails para respetar rate limit de Resend (2 requests/segundo)
        await new Promise(resolve => setTimeout(resolve, 600));

      } catch (userError: any) {
        console.error(`Error processing user ${user.email}:`, userError);
        results.push({ 
          user: user.email, 
          status: 'error', 
          error: userError.message 
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Weekly reminders processed for ${results.length} users`,
        mode,
        currentWeek,
        results: results.slice(0, 10), // Limitar a 10 resultados para evitar respuestas muy grandes
        total_processed: results.length,
        successful: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status !== 'sent').length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-weekly-reminders function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});