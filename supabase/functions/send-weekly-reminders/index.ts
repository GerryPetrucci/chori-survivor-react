// ARCHIVO COMPLETO PARA: supabase/functions/send-weekly-reminders/index.ts
// Copia este código completo en el dashboard de Supabase o sobrescribe el archivo local

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface EntryStatus {
  entry_name: string;
  has_pick: boolean;
  team_picked?: string;
}

interface MatchOdds {
  home_team: string;
  away_team: string;
  home_percentage: number;
  away_percentage: number;
  difference: number;
}

interface WeeklyReminderRequest {
  to: string;
  userName: string;
  currentWeek: number;
  deadline: string;
  entries: EntryStatus[];
  topMatches: MatchOdds[];
  byeTeams: string[];
  from?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateWeeklyReminderHTML(data: WeeklyReminderRequest): string {
  const entriesWithPicks = data.entries.filter(e => e.has_pick);
  const entriesWithoutPicks = data.entries.filter(e => !e.has_pick);
  
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
            <!-- Header con logo -->
            <tr>
              <td align="center" style="padding:30px 20px 10px 20px; background-color:#764ba2; border-top-left-radius:10px; border-top-right-radius:10px;">
                <img src="https://i.imgur.com/CkMST9l.png" alt="Chori Survivor" width="120" style="display:block; margin:auto;">
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 20px 20px 20px; background-color:#764ba2; color:#fff;">
                <h2 style="margin:0; font-size:24px; font-weight:bold;">⚠️ Recordatorio - Semana ${data.currentWeek}</h2>
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
                        ${entriesWithoutPicks.map(entry => `<li><strong>${entry.entry_name}</strong></li>`).join('')}
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
                      <table width="100%" cellpadding="5" cellspacing="0">
                        ${entriesWithPicks.map(entry => `
                          <tr>
                            <td style="color:#1864ab;"><strong>${entry.entry_name}</strong></td>
                            <td style="color:#1864ab; text-align:right;">${entry.team_picked || 'N/A'}</td>
                          </tr>
                        `).join('')}
                      </table>
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                <!-- Top Partidos Más Desiguales -->
                ${data.topMatches.length > 0 ? `
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa; border-radius:10px; margin:25px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <h3 style="margin:0 0 15px 0; color:#495057;">🔥 Top ${data.topMatches.length} Partidos Más Desiguales</h3>
                      <p style="margin:0 0 15px 0; color:#6c757d; font-size:14px;">Partidos con mayor diferencia en los momios</p>
                      ${data.topMatches.map((match) => `
                        <table width="100%" cellpadding="10" cellspacing="0" style="background:#fff; border:1px solid #dee2e6; border-radius:8px; margin-bottom:10px;">
                          <tr>
                            <td width="45%" align="center" style="background:${match.home_percentage > match.away_percentage ? '#e7f5ff' : '#fff'}; border-radius:8px 0 0 8px;">
                              <div style="font-weight:bold; color:#495057;">${match.home_team}</div>
                              <div style="font-size:20px; font-weight:bold; color:${match.home_percentage > match.away_percentage ? '#1864ab' : '#868e96'}; margin:5px 0;">${match.home_percentage}%</div>
                            </td>
                            <td width="10%" align="center" style="color:#adb5bd; font-weight:bold;">vs</td>
                            <td width="45%" align="center" style="background:${match.away_percentage > match.home_percentage ? '#e7f5ff' : '#fff'}; border-radius:0 8px 8px 0;">
                              <div style="font-weight:bold; color:#495057;">${match.away_team}</div>
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
                      <h3 style="margin:0 0 10px 0; color:#856404;">🚫 Equipos en Bye Week</h3>
                      <p style="margin:0; color:#856404;">Estos equipos NO juegan esta semana:</p>
                      <div style="margin-top:10px; color:#856404; font-weight:bold;">
                        ${data.byeTeams.join(' • ')}
                      </div>
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                <!-- Call to Action -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                  <tr>
                    <td align="center">
                      <a href="https://chori-survivor-react.vercel.app/picks" style="display:inline-block; background-color:#764ba2; color:#fff; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px; border:none;">
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: WeeklyReminderRequest = await req.json();

    if (!requestData.to || !requestData.userName || !requestData.currentWeek) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, userName, currentWeek' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = generateWeeklyReminderHTML(requestData);
    const subject = `⚠️ Recordatorio: Elige tu pick - Semana ${requestData.currentWeek}`;
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
        message: 'Weekly reminder sent successfully',
        id: result.id
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
