// ARCHIVO COMPLETO PARA: supabase/functions/send-weekly-results/index.ts
// Copia este código completo en el dashboard de Supabase o colócalo en la carpeta correspondiente

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
  to: string;
  userName: string;
  currentWeek: number;
  userPicks: UserPick[];
  weekStats: WeekStats;
  competitionStats: CompetitionStats;
  from?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateBarChart(value: number, total: number, color: string): string {
  const percentage = Math.round((value / total) * 100);
  const barWidth = Math.floor((percentage / 100) * 30); // Max 30 caracteres
  const bar = '█'.repeat(barWidth) + '░'.repeat(30 - barWidth);
  
  return `
    <tr>
      <td style="padding:8px 0;">
        <div style="font-family:monospace; font-size:12px; color:${color}; display:flex; align-items:center;">
          <span style="display:inline-block; min-width:80px;">${value} (${percentage}%)</span>
          <span style="letter-spacing:2px;">${bar}</span>
        </div>
      </td>
    </tr>
  `;
}

function generateWeeklyResultsHTML(data: WeeklyResultsRequest): string {
  const wins = data.userPicks.filter(p => p.result === 'W').length;
  const ties = data.userPicks.filter(p => p.result === 'T').length;
  const losses = data.userPicks.filter(p => p.result === 'L').length;
  const totalUserPicks = data.userPicks.length;
  
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultados Semanales - Semana ${data.currentWeek}</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
    <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="margin:0; padding:0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.08); margin:20px auto;">
            <!-- Header con logo -->
            <tr>
              <td align="center" style="padding:30px 20px 10px 20px; background-color:#10b981; border-top-left-radius:10px; border-top-right-radius:10px;">
                <img src="https://i.imgur.com/CkMST9l.png" alt="Chori Survivor" width="120" style="display:block; margin:auto;">
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 20px 20px 20px; background-color:#10b981; color:#fff;">
                <h2 style="margin:0; font-size:24px; font-weight:bold;">📊 Resultados - Semana ${data.currentWeek}</h2>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding:30px 30px 10px 30px;">
                <h3 style="margin-top:0;">¡Hola ${data.userName}! 👋</h3>
                <p>Aquí están los resultados de tus picks de la <strong>Semana ${data.currentWeek}</strong>.</p>
                
                <!-- Resumen de Picks del Usuario -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa; border-radius:10px; margin:25px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 15px 0; color:#495057;">🎯 Tus Resultados</h3>
                      
                      ${data.userPicks.map(pick => {
                        const bgColor = pick.result === 'W' ? '#d1fae5' : pick.result === 'T' ? '#fef3c7' : '#fee2e2';
                        const borderColor = pick.result === 'W' ? '#10b981' : pick.result === 'T' ? '#f59e0b' : '#ef4444';
                        const emoji = pick.result === 'W' ? '✅' : pick.result === 'T' ? '⚖️' : '❌';
                        const resultText = pick.result === 'W' ? 'Victoria' : pick.result === 'T' ? 'Empate' : 'Derrota';
                        
                        return `
                          <table width="100%" cellpadding="10" cellspacing="0" style="background:${bgColor}; border:2px solid ${borderColor}; border-radius:8px; margin-bottom:12px;">
                            <tr>
                              <td>
                                <div style="font-weight:bold; color:#1f2937; margin-bottom:5px;">
                                  ${emoji} ${pick.entry_name}
                                </div>
                                <div style="color:#4b5563; font-size:14px; margin-bottom:5px;">
                                  <strong>Pick:</strong> ${pick.team_picked}
                                </div>
                                <div style="color:#6b7280; font-size:13px; margin-bottom:5px;">
                                  ${pick.score}
                                </div>
                                <div style="font-weight:bold; color:${borderColor}; font-size:14px;">
                                  ${resultText}
                                </div>
                              </td>
                            </tr>
                          </table>
                        `;
                      }).join('')}
                      
                      <!-- Resumen Personal -->
                      <table width="100%" cellpadding="10" cellspacing="0" style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; margin-top:15px;">
                        <tr>
                          <td width="33%" align="center" style="border-right:1px solid #e5e7eb;">
                            <div style="font-size:24px; font-weight:bold; color:#10b981;">${wins}</div>
                            <div style="font-size:12px; color:#6b7280;">VICTORIAS</div>
                          </td>
                          <td width="33%" align="center" style="border-right:1px solid #e5e7eb;">
                            <div style="font-size:24px; font-weight:bold; color:#f59e0b;">${ties}</div>
                            <div style="font-size:12px; color:#6b7280;">EMPATES</div>
                          </td>
                          <td width="34%" align="center">
                            <div style="font-size:24px; font-weight:bold; color:#ef4444;">${losses}</div>
                            <div style="font-size:12px; color:#6b7280;">DERROTAS</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Estadísticas de la Semana (Todos los Picks) -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa; border-radius:10px; margin:25px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 15px 0; color:#495057;">📈 Estadísticas de la Semana</h3>
                      <p style="margin:0 0 15px 0; color:#6b7280; font-size:14px;">Total de ${data.weekStats.total_picks} picks registrados en el pool</p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:15px;">
                        <tr>
                          <td style="padding:8px 0; color:#10b981; font-weight:bold;">
                            ✅ Victorias
                          </td>
                        </tr>
                        ${generateBarChart(data.weekStats.wins, data.weekStats.total_picks, '#10b981')}
                        
                        <tr>
                          <td style="padding:8px 0; color:#f59e0b; font-weight:bold;">
                            ⚖️ Empates
                          </td>
                        </tr>
                        ${generateBarChart(data.weekStats.ties, data.weekStats.total_picks, '#f59e0b')}
                        
                        <tr>
                          <td style="padding:8px 0; color:#ef4444; font-weight:bold;">
                            ❌ Derrotas
                          </td>
                        </tr>
                        ${generateBarChart(data.weekStats.losses, data.weekStats.total_picks, '#ef4444')}
                        
                        <tr>
                          <td style="padding:15px 0 0 0; border-top:1px solid #e5e7eb; margin-top:10px;">
                            <div style="font-size:14px; color:#6b7280;">
                              <strong style="color:#1f2937;">Tasa de aciertos:</strong> 
                              ${Math.round((data.weekStats.correct_picks / data.weekStats.total_picks) * 100)}% 
                              (${data.weekStats.correct_picks} correctos de ${data.weekStats.total_picks})
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Estado de la Competencia -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa; border-radius:10px; margin:25px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 15px 0; color:#495057;">🏆 Estado de la Competencia</h3>
                      
                      <table width="100%" cellpadding="12" cellspacing="0" style="background:#fff; border:1px solid #e5e7eb; border-radius:8px;">
                        <tr style="border-bottom:1px solid #e5e7eb;">
                          <td width="33%" align="center" style="padding:15px;">
                            <div style="font-size:32px; font-weight:bold; color:#10b981;">${data.competitionStats.alive}</div>
                            <div style="font-size:12px; color:#6b7280; margin-top:5px;">🟢 ALIVE</div>
                            <div style="font-size:11px; color:#9ca3af;">Sin derrotas</div>
                          </td>
                          <td width="33%" align="center" style="padding:15px; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb;">
                            <div style="font-size:32px; font-weight:bold; color:#f59e0b;">${data.competitionStats.last_chance}</div>
                            <div style="font-size:12px; color:#6b7280; margin-top:5px;">🟡 LAST CHANCE</div>
                            <div style="font-size:11px; color:#9ca3af;">Una derrota</div>
                          </td>
                          <td width="34%" align="center" style="padding:15px;">
                            <div style="font-size:32px; font-weight:bold; color:#ef4444;">${data.competitionStats.eliminated}</div>
                            <div style="font-size:12px; color:#6b7280; margin-top:5px;">🔴 ELIMINADOS</div>
                            <div style="font-size:11px; color:#9ca3af;">Dos+ derrotas</div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin:15px 0 0 0; color:#6b7280; font-size:13px; text-align:center;">
                        Total de usuarios activos: ${data.competitionStats.alive + data.competitionStats.last_chance + data.competitionStats.eliminated}
                      </p>
                    </td>
                  </tr>
                </table>
                
                <!-- Call to Action -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                  <tr>
                    <td align="center">
                      <a href="https://chori-survivor-react.vercel.app/ranking" style="display:inline-block; background-color:#10b981; color:#fff; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px; border:none;">
                        📊 Ver Ranking Completo
                      </a>
                    </td>
                  </tr>
                </table>
                
                <p style="text-align:center; color:#868e96; font-size:14px;">¡Sigue así y buena suerte en la siguiente semana! 🏈</p>
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: WeeklyResultsRequest = await req.json();

    if (!requestData.to || !requestData.userName || !requestData.currentWeek) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, userName, currentWeek' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = generateWeeklyResultsHTML(requestData);
    const subject = `📊 Resultados de la Semana ${requestData.currentWeek}`;
    const from = requestData.from || 'Chori Survivor <noreply@chori-survivor.com>';

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from,
        to: [requestData.to],
        subject,
        html
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error from Resend:', result);
      return new Response(
        JSON.stringify({ error: result.message || 'Failed to send email', details: result }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('email_logs').insert({
      recipient: requestData.to,
      subject,
      provider: 'resend',
      status: 'sent',
      resend_id: result.id,
      sent_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Weekly results sent successfully',
        id: result.id
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
