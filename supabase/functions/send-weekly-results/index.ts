import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface UserPick {
  entry_name: string;
  team_picked: string;
  result: 'W' | 'T' | 'L';
  score: string;
}

interface WeekStats {
  total_picks: number;
  correct_picks: number;
  wins: number;
  ties: number;
  losses: number;
}

interface CompetitionStats {
  alive: number;
  last_chance: number;
  eliminated: number;
}

interface WeeklyResultsRequest {
  mode?: 'auto_all_users';
  week?: number;  // Semana específica para enviar resultados (usado por el workflow automático)
  force_week?: number;  // Deprecated: usar 'week' en su lugar
  preview?: boolean;
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Funciones helper para obtener datos automáticamente
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

async function getUsersForResults(supabase: any): Promise<any[]> {
  try {
    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single();
    
    if (!season) throw new Error('No active season found');
    
    console.log('Season found:', season.id);
    
    const { data: activeEntries } = await supabase
      .from('entries')
      .select('user_id')
      .eq('season_id', season.id)
      .eq('is_active', true);
    
    if (!activeEntries || activeEntries.length === 0) {
      console.log('No active entries found');
      return [];
    }
    
    console.log('Active entries found:', activeEntries.length);
    
    const userIds = [...new Set(activeEntries.map(entry => entry.user_id))];
    console.log('Unique user IDs:', userIds.length);
    
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, username, email')
      .in('id', userIds);
    
    console.log('Users retrieved:', users?.length || 0);
    return users || [];
  } catch (error) {
    console.error('Error getting users for results:', error);
    return [];
  }
}

async function getUserPicksForWeek(supabase: any, userId: string, week: number): Promise<UserPick[]> {
  try {
    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single();
    
    if (!season) return [];
    
    console.log(`Getting picks for user ${userId}, week ${week}, season ${season.id}`);
    
    const { data: userEntries } = await supabase
      .from('entries')
      .select('id, entry_name')
      .eq('user_id', userId)
      .eq('season_id', season.id)
      .eq('is_active', true);
    
    if (!userEntries || userEntries.length === 0) {
      console.log(`No active entries found for user ${userId}`);
      return [];
    }
    
    console.log(`Found ${userEntries.length} entries for user ${userId}`);
    
    const entryIds = userEntries.map(entry => entry.id);
    
    const { data: picks } = await supabase
      .from('picks')
      .select(`
        entry_id,
        teams:teams(name),
        matches:matches(
          home_score,
          away_score,
          status,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        )
      `)
      .eq('week', week)
      .in('entry_id', entryIds);
    
    if (!picks) {
      console.log(`No picks found for user ${userId} entries in week ${week}`);
      return [];
    }
    
    console.log(`Found ${picks.length} picks for user ${userId} in week ${week}`);
    
    return picks.map((pick: any) => {
      const entry = userEntries.find(e => e.id === pick.entry_id);
      const entryName = entry ? entry.entry_name : 'Unknown Entry';
      
      const match = pick.matches;
      let result: 'W' | 'T' | 'L' = 'L';
      let score = '';
      
      if (match && match.status === 'completed') {
        const homeWin = match.home_score > match.away_score;
        const awayWin = match.away_score > match.home_score;
        const tie = match.home_score === match.away_score;
        
        const selectedTeam = pick.teams.name;
        const isHomeTeam = selectedTeam === match.home_team.name;
        const isAwayTeam = selectedTeam === match.away_team.name;
        
        if (tie) {
          result = 'T';
        } else if ((isHomeTeam && homeWin) || (isAwayTeam && awayWin)) {
          result = 'W';
        } else {
          result = 'L';
        }
        
        score = `${match.home_team.name} ${match.home_score} - ${match.away_score} ${match.away_team.name}`;
      }
      
      return {
        entry_name: entryName,
        team_picked: pick.teams.name,
        result,
        score
      };
    });
  } catch (error) {
    console.error('Error getting user picks for week:', error);
    return [];
  }
}

async function getWeekStats(supabase: any, week: number): Promise<WeekStats> {
  try {
    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single();
    
    if (!season) return { total_picks: 0, correct_picks: 0, wins: 0, ties: 0, losses: 0 };
    
    const { data: picks } = await supabase
      .from('picks')
      .select(`
        teams:teams(name),
        matches:matches(
          home_score,
          away_score,
          status,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        ),
        entries:entries!inner(season_id, is_active)
      `)
      .eq('week', week)
      .eq('entries.season_id', season.id)
      .eq('entries.is_active', true);
    
    if (!picks) return { total_picks: 0, correct_picks: 0, wins: 0, ties: 0, losses: 0 };
    
    let wins = 0;
    let ties = 0;
    let losses = 0;
    
    picks.forEach((pick: any) => {
      const match = pick.matches;
      if (match && match.status === 'completed') {
        const homeWin = match.home_score > match.away_score;
        const awayWin = match.away_score > match.home_score;
        const tie = match.home_score === match.away_score;
        
        const selectedTeam = pick.teams.name;
        const isHomeTeam = selectedTeam === match.home_team.name;
        const isAwayTeam = selectedTeam === match.away_team.name;
        
        if (tie) {
          ties++;
        } else if ((isHomeTeam && homeWin) || (isAwayTeam && awayWin)) {
          wins++;
        } else {
          losses++;
        }
      }
    });
    
    return {
      total_picks: picks.length,
      correct_picks: wins + ties,
      wins,
      ties,
      losses
    };
  } catch (error) {
    console.error('Error getting week stats:', error);
    return { total_picks: 0, correct_picks: 0, wins: 0, ties: 0, losses: 0 };
  }
}

async function getCompetitionStats(supabase: any): Promise<CompetitionStats> {
  try {
    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single();
    
    if (!season) return { alive: 0, last_chance: 0, eliminated: 0 };
    
    // Query para obtener TODAS las entradas (activas e inactivas) con su status
    const { data: entries, error } = await supabase
      .from('entries')
      .select('id, status, is_active')
      .eq('season_id', season.id);

    if (error) {
      console.error('Error querying entries for competition stats:', error);
      return { alive: 0, last_chance: 0, eliminated: 0 };
    }

    if (!entries || entries.length === 0) {
      console.log('No entries found for competition stats');
      return { alive: 0, last_chance: 0, eliminated: 0 };
    }

    let alive = 0;
    let lastChance = 0;
    let eliminated = 0;

    entries.forEach((entry: any) => {
      const status = entry.status;

      if (status === 'alive') {
        alive++;
      } else if (status === 'last_chance') {
        lastChance++;
      } else if (status === 'eliminated') {
        eliminated++;
      }
    });

    console.log(`Competition stats computed: alive=${alive}, last_chance=${lastChance}, eliminated=${eliminated}`);

    return { alive, last_chance: lastChance, eliminated };
  } catch (error) {
    console.error('Error getting competition stats:', error);
    return { alive: 0, last_chance: 0, eliminated: 0 };
  }
}

function generateBarChart(value: number, total: number, color: string): string {
  // Evitar división por cero
  const safeTotal = (typeof total === 'number' && total > 0) ? total : 0;
  const percentage = safeTotal > 0 ? Math.round((value / safeTotal) * 100) : 0;
  const barWidth = safeTotal > 0 ? Math.floor((percentage / 100) * 200) : 0;

  return `
    <tr>
      <td style="padding:8px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:80px; font-size:12px; color:${color}; font-weight:bold;">
              ${value} (${percentage}%)
            </td>
            <td style="padding-left:10px;">
              <div style="background-color:#e5e7eb; height:12px; border-radius:6px; width:200px; overflow:hidden;">
                <div style="background-color:${color}; height:12px; width:${barWidth}px; border-radius:6px; transition:width 0.3s ease;"></div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

interface WeeklyResultsData {
  userName: string;
  currentWeek: number;
  userPicks: UserPick[];
  weekStats: WeekStats;
  competitionStats: CompetitionStats;
}

function generateWeeklyResultsHTML(data: WeeklyResultsData): string {
  const winRate = data.userPicks.length > 0 
    ? Math.round((data.userPicks.filter(p => p.result === 'W').length / data.userPicks.length) * 100)
    : 0;
  
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultados de la Semana ${data.currentWeek}</title>
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
                <h2 style="margin:15px 0 0 0; font-size:24px; font-weight:bold; color:#fff;">📊 Resultados - Semana ${data.currentWeek}</h2>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding:30px 30px 10px 30px;">
                <h3 style="margin-top:0;">¡Hola ${data.userName}! 👋</h3>
                <p>Aquí tienes el resumen de los resultados de la <strong>Semana ${data.currentWeek}</strong> de la NFL.</p>
                
                <!-- Tus Picks -->
                ${data.userPicks.length > 0 ? `
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa; border-radius:10px; margin:25px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 15px 0; color:#495057;">🎯 Tus Picks (${data.userPicks.length})</h3>
                      <p style="margin:0 0 15px 0; color:#6c757d;">Tu porcentaje de aciertos: <strong style="color:#1864ab;">${winRate}%</strong></p>
                      
                      ${data.userPicks.map(pick => `
                        <table width="100%" cellpadding="15" cellspacing="0" style="background:#fff; border:1px solid #dee2e6; border-radius:8px; margin-bottom:15px;">
                          <tr>
                            <td width="40%" align="center">
                              <table cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                  <td align="center" style="padding-bottom:8px;">
                                    ${getTeamLogo(pick.team_picked) ? `<img src="${getTeamLogo(pick.team_picked)}" alt="${pick.team_picked}" width="60" height="60" style="max-width:60px; max-height:60px; object-fit:contain;">` : ''}
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center">
                                    <div style="font-weight:bold; color:#495057; font-size:13px; margin-bottom:3px;">${pick.entry_name}</div>
                                    <div style="color:#6c757d; font-size:11px;">${pick.team_picked}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                            <td width="20%" align="center">
                              <div style="font-size:32px; font-weight:bold;">
                                ${pick.result === 'W' ? '✅' : pick.result === 'T' ? '🟡' : '❌'}
                              </div>
                              <div style="font-size:12px; color:#6c757d; margin-top:5px; font-weight:bold;">
                                ${pick.result === 'W' ? 'GANÓ' : pick.result === 'T' ? 'EMPATE' : 'PERDIÓ'}
                              </div>
                            </td>
                            <td width="40%" align="center" style="color:#495057; font-size:11px; line-height:1.4;">
                              ${pick.score || 'Partido pendiente'}
                            </td>
                          </tr>
                        </table>
                      `).join('')}
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                <!-- Estadísticas de la Semana -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#e7f5ff; border:1px solid #4dabf7; border-radius:10px; margin:25px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 20px 0; color:#1864ab;">📈 Estadísticas de la Semana ${data.currentWeek}</h3>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color:#1864ab; font-weight:bold; padding-bottom:15px;">
                            Picks Totales: ${data.weekStats.total_picks}
                          </td>
                        </tr>
                        <tr>
                          <td style="color:#28a745; font-weight:bold;">
                            ✅ Ganados: 
                          </td>
                        </tr>
                        ${generateBarChart(data.weekStats.wins, data.weekStats.total_picks, '#28a745')}
                        ${data.weekStats.ties > 0 ? `
                        <tr>
                          <td style="color:#ffc107; font-weight:bold;">
                            🟡 Empates:
                          </td>
                        </tr>
                        ${generateBarChart(data.weekStats.ties, data.weekStats.total_picks, '#ffc107')}
                        ` : ''}
                        <tr>
                          <td style="color:#dc3545; font-weight:bold;">
                            ❌ Perdidos:
                          </td>
                        </tr>
                        ${generateBarChart(data.weekStats.losses, data.weekStats.total_picks, '#dc3545')}
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Estado de la Competencia -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd; border:1px solid #ffeaa7; border-radius:10px; margin:25px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 20px 0; color:#856404;">🏆 Estado de la Competencia</h3>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color:#28a745; font-weight:bold;">
                            💚 Vivos (0 derrotas):
                          </td>
                        </tr>
                        ${generateBarChart(data.competitionStats.alive, data.competitionStats.alive + data.competitionStats.last_chance + data.competitionStats.eliminated, '#28a745')}
                        <tr>
                          <td style="color:#ffc107; font-weight:bold;">
                            ⚠️ Última oportunidad (1 derrota):
                          </td>
                        </tr>
                        ${generateBarChart(data.competitionStats.last_chance, data.competitionStats.alive + data.competitionStats.last_chance + data.competitionStats.eliminated, '#ffc107')}
                        <tr>
                          <td style="color:#dc3545; font-weight:bold;">
                            💀 Eliminados (2+ derrotas):
                          </td>
                        </tr>
                        ${generateBarChart(data.competitionStats.eliminated, data.competitionStats.alive + data.competitionStats.last_chance + data.competitionStats.eliminated, '#dc3545')}
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Call to Action -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                  <tr>
                    <td align="center">
                      <a href="https://chori-survivor.com/ranking" style="display:inline-block; background-color:#764ba2; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px; border:none; box-shadow: 0 4px 15px rgba(118, 75, 162, 0.3);">
                        📊 Ver Ranking Completo
                      </a>
                    </td>
                  </tr>
                </table>
                
                <p style="text-align:center; color:#868e96; font-size:14px;">¡Sigue compitiendo y que tengas suerte la próxima semana! �</p>
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

    const requestData: WeeklyResultsRequest = await req.json();
    const mode = requestData.mode || 'auto_all_users';

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar modo
    if (mode !== 'auto_all_users') {
      return new Response(
        JSON.stringify({ error: 'Invalid mode. Use auto_all_users' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determinar qué semana usar para los resultados
    // Prioridad: week > force_week > semana actual
    let weekToSend: number;
    
    if (requestData.week !== undefined && requestData.week !== null) {
      // Si viene 'week' del workflow automático (martes), usar ese valor
      weekToSend = requestData.week;
      console.log(`Using week from request: ${weekToSend}`);
    } else if (requestData.force_week !== undefined && requestData.force_week !== null) {
      // Deprecated: mantener compatibilidad con force_week
      weekToSend = requestData.force_week;
      console.log(`Using force_week (deprecated): ${weekToSend}`);
    } else {
      // Por defecto, usar la semana actual
      weekToSend = await getCurrentNFLWeek(supabase);
      console.log(`Using current NFL week: ${weekToSend}`);
    }

    console.log(`📊 Sending weekly results for week ${weekToSend}`);

    // Modo automático - obtener datos de la BD
    const users = await getUsersForResults(supabase);
    const weekStats = await getWeekStats(supabase, weekToSend);
    const competitionStats = await getCompetitionStats(supabase);

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users found for results',
          mode,
          week: weekToSend
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
          const userPicks = await getUserPicksForWeek(supabase, user.id, weekToSend);
          
          previewData.push({
            user: {
              id: user.id,
              email: user.email,
              username: user.username
            },
            emailData: {
              subject: `📊 Resultados de la Semana ${weekToSend}`,
              userName: user.username || user.email || 'Usuario',
              currentWeek: weekToSend,
              userPicks,
              weekStats,
              competitionStats
            },
            stats: {
              picks_count: userPicks.length,
              wins: userPicks.filter((p: any) => p.result === 'W').length,
              ties: userPicks.filter((p: any) => p.result === 'T').length,
              losses: userPicks.filter((p: any) => p.result === 'L').length
            }
          });
          
          // Solo mostrar un ejemplo
          if (previewData.length >= 2) break;
          
        } catch (error: any) {
          console.error(`Error processing user ${user.email}:`, error);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          mode,
          week: weekToSend,
          preview: true,
          total_users_found: users.length,
          weekStats,
          competitionStats,
          sample_users: previewData
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    const from = 'Chori Survivor <noreply@chori-survivor.com>';
    const subject = `📊 Resultados de la Semana ${weekToSend}`;

    // Enviar emails a cada usuario
    for (const user of users) {
      try {
        const userPicks = await getUserPicksForWeek(supabase, user.id, weekToSend);

        const html = generateWeeklyResultsHTML({
          userName: user.username || user.email || 'Usuario',
          currentWeek: weekToSend,
          userPicks,
          weekStats,
          competitionStats
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
            picks_count: userPicks.length,
            wins: userPicks.filter(p => p.result === 'W').length
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
        message: `Weekly results processed for ${results.length} users`,
        mode,
        week: weekToSend,
        weekStats,
        competitionStats,
        results: results.slice(0, 10), // Limitar a 10 resultados para evitar respuestas muy grandes
        total_processed: results.length,
        successful: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status !== 'sent').length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-weekly-results function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
