// Email Service usando Resend vía Supabase Edge Functions
// Migración desde EmailJS a Resend para mejor escalabilidad

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SENDER_EMAIL = import.meta.env.VITE_SENDER_EMAIL || 'noreply@chori-survivor.com';
const SENDER_NAME = import.meta.env.VITE_SENDER_NAME || 'Chori Survivor';

export interface TokenEmailData {
  token: string;
  recipientEmail: string;
  entriesCount: number;
  expiryDate: string;
}

export interface WeeklyReminderData {
  recipientEmail: string;
  recipientName: string;
  currentWeek: number;
  deadline: string;
  entryNames: string[];
}

export interface WeeklyStatsData {
  recipientEmail: string;
  recipientName: string;
  weekNumber: number;
  userStats: {
    wins: number;
    losses: number;
    currentStreak: number;
    longestStreak: number;
  };
  weekHighlights: {
    bestPick: string;
    worstPick: string;
    totalAlive: number;
    totalEliminated: number;
  };
}

export const emailServiceResend = {
  // Generar HTML del email con el token (template completo)
  generateTokenEmailHTML: (data: TokenEmailData): string => {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Token de Activación - Chori Survivor</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
      <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="margin:0; padding:0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.08); margin:20px auto;">
              <!-- Header con logo -->
              <tr>
                <td align="center" style="padding:30px 20px 10px 20px; background-color:#667eea; border-top-left-radius:10px; border-top-right-radius:10px;">
                  <img src="https://i.imgur.com/CkMST9l.png" alt="Chori Survivor" width="120" style="display:block; margin:auto;">
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:0 20px 20px 20px; background-color:#667eea; color:#fff;">
                  <h2 style="margin:0; font-size:24px; font-weight:bold;">NFL Survivor Pool - Token de Activación</h2>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding:30px 30px 10px 30px;">
                  <h3 style="margin-top:0;">¡Bienvenido al Pool de Supervivencia NFL! 🎉</h3>
                  <p>Hemos generado un token especial para que puedas unirte a nuestro emocionante pool de supervivencia de la NFL.</p>
                  <!-- Token Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#667eea; border-radius:10px; margin:25px 0;">
                    <tr>
                      <td align="center" style="padding:20px; color:#fff;">
                        <h3 style="margin:0 0 10px 0; color:#fff;">🔑 Tu Token de Activación</h3>
                        <div style="font-size:22px; font-weight:bold; color:#667eea; letter-spacing:2px; font-family:'Courier New', monospace; background:#fff; padding:12px; border-radius:8px; border:2px dashed #667eea; display:inline-block;">${data.token}</div>
                        <p style="margin:10px 0 0 0; color:#fff;"><strong>¡Guarda este token en un lugar seguro!</strong></p>
                      </td>
                    </tr>
                  </table>
                  <!-- Info Grid -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:25px 0;">
                    <tr>
                      <td style="background:#f8f9fa; padding:15px; border-radius:8px; border-left:4px solid #667eea;">
                        <strong>🎯 Entradas Permitidas:</strong> ${data.entriesCount} entrada(s)
                      </td>
                      <td style="background:#f8f9fa; padding:15px; border-radius:8px; border-left:4px solid #764ba2;">
                        <strong>⏰ Válido Hasta:</strong> ${data.expiryDate}
                      </td>
                    </tr>
                  </table>
                  <!-- Call to Action (botón compatible) -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                    <tr>
                      <td align="center">
                        <a href="https://chori-survivor-react.vercel.app/activate-token" style="display:inline-block; background-color:#667eea; color:#fff; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px; border:none;">🚀 Activar Token Ahora</a>
                      </td>
                    </tr>
                  </table>
                  <!-- Steps -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa; border-radius:10px; margin:25px 0;">
                    <tr><td style="padding:20px;">
                      <h3 style="margin-top:0;">� Pasos para Activar tu Token</h3>
                      <ol style="padding-left:18px;">
                        <li><strong>Haz clic en "Activar Token Ahora"</strong> o ve a la página de login y selecciona "¿Tienes un token? Actívalo aquí"</li>
                        <li><strong>Ingresa tu token</strong> (copia y pega el token que aparece arriba)</li>
                        <li><strong>Crea tu cuenta</strong> (completa el formulario con tu información personal)</li>
                        <li><strong>Nombra tus entradas</strong> (elige nombres únicos para tus ${data.entriesCount} entrada(s) al pool)</li>
                        <li><strong>¡Comienza a jugar!</strong> (accede al dashboard y haz tus picks semanales)</li>
                      </ol>
                    </td></tr>
                  </table>
                  <!-- Warning -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd; border:1px solid #ffeaa7; color:#856404; padding:15px; border-radius:8px; margin:20px 0;">
                    <tr><td>
                      <strong>⚠️ Importante:</strong>
                      <ul style="margin:10px 0; padding-left:20px;">
                        <li>Este token es válido por <strong>15 días</strong> desde su generación</li>
                        <li>Solo puede ser usado <strong>una vez</strong></li>
                        <li>Debes usar el mismo correo electrónico (${data.recipientEmail}) al registrarte</li>
                        <li>Los nombres de entradas deben ser únicos en todo el pool</li>
                      </ul>
                    </td></tr>
                  </table>
                  <p>Si tienes alguna pregunta o problema, contacta al administrador del pool.</p>
                  <p><strong>¡Que tengas suerte en el Survivor Pool! 🍀</strong></p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td align="center" style="background:#333; color:#fff; padding:25px; border-bottom-left-radius:10px; border-bottom-right-radius:10px;">
                  <p style="margin:0;">© 2025 Chori Survivor - NFL Survivor Pool</p>
                  <p style="margin:0;"><strong>Remitente:</strong> ${SENDER_NAME} <span style="color:#667eea; text-decoration:none;">${SENDER_EMAIL.replace('@', '&#64;')}</span></p>
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
  },

  // Generar HTML para recordatorio semanal
  generateWeeklyReminderHTML: (data: WeeklyReminderData): string => {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recordatorio - Semana ${data.currentWeek}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
      <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table width="600" style="background:#fff; border-radius:10px; margin:20px auto;">
              <tr>
                <td align="center" style="padding:30px 20px; background-color:#764ba2; border-top-left-radius:10px; border-top-right-radius:10px;">
                  <h1 style="color:#fff; margin:0;">⚠️ ¡Recordatorio!</h1>
                  <h2 style="color:#fff; margin:10px 0 0 0;">Semana ${data.currentWeek} - NFL</h2>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;">
                  <p>Hola <strong>${data.recipientName}</strong>,</p>
                  
                  <p>Aún no has elegido tu pick para la <strong>Semana ${data.currentWeek}</strong>.</p>
                  
                  <div style="background:#fff3cd; border-left:4px solid #ffc107; padding:15px; margin:20px 0;">
                    <p style="margin:0;"><strong>⏰ Fecha límite:</strong> ${data.deadline}</p>
                  </div>
                  
                  <p><strong>Entradas sin pick:</strong></p>
                  <ul>
                    ${data.entryNames.map(name => `<li>${name}</li>`).join('')}
                  </ul>
                  
                  <p style="text-align:center; margin:30px 0;">
                    <a href="https://chori-survivor-react.vercel.app/picks" style="display:inline-block; background-color:#764ba2; color:#fff; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold;">
                      🏈 Hacer mi Pick Ahora
                    </a>
                  </p>
                  
                  <p style="color:#666; font-size:14px;">
                    Si no eliges a tiempo, se te asignará automáticamente el equipo visitante del último partido de la semana.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="background:#333; color:#fff; padding:20px; border-bottom-left-radius:10px; border-bottom-right-radius:10px;">
                  <p style="margin:0;">© 2025 Chori Survivor</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  },

  // Generar HTML para estadísticas semanales
  generateWeeklyStatsHTML: (data: WeeklyStatsData): string => {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Estadísticas - Semana ${data.weekNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
      <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table width="600" style="background:#fff; border-radius:10px; margin:20px auto;">
              <tr>
                <td align="center" style="padding:30px 20px; background-color:#667eea; border-top-left-radius:10px; border-top-right-radius:10px;">
                  <h1 style="color:#fff; margin:0;">📊 Resumen Semanal</h1>
                  <h2 style="color:#fff; margin:10px 0 0 0;">Semana ${data.weekNumber}</h2>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;">
                  <p>Hola <strong>${data.recipientName}</strong>,</p>
                  
                  <p>Aquí está el resumen de la <strong>Semana ${data.weekNumber}</strong>:</p>
                  
                  <h3>🎯 Tus Estadísticas</h3>
                  <table width="100%" style="background:#f8f9fa; border-radius:8px; padding:15px;">
                    <tr>
                      <td><strong>✅ Victorias:</strong> ${data.userStats.wins}</td>
                      <td><strong>❌ Derrotas:</strong> ${data.userStats.losses}</td>
                    </tr>
                    <tr>
                      <td><strong>🔥 Racha actual:</strong> ${data.userStats.currentStreak}</td>
                      <td><strong>🏆 Mejor racha:</strong> ${data.userStats.longestStreak}</td>
                    </tr>
                  </table>
                  
                  <h3>🏈 Resumen del Pool</h3>
                  <ul>
                    <li><strong>Mejor pick:</strong> ${data.weekHighlights.bestPick}</li>
                    <li><strong>Peor pick:</strong> ${data.weekHighlights.worstPick}</li>
                    <li><strong>Jugadores vivos:</strong> ${data.weekHighlights.totalAlive}</li>
                    <li><strong>Eliminados esta semana:</strong> ${data.weekHighlights.totalEliminated}</li>
                  </ul>
                  
                  <p style="text-align:center; margin:30px 0;">
                    <a href="https://chori-survivor-react.vercel.app/ranking" style="display:inline-block; background-color:#667eea; color:#fff; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold;">
                      📈 Ver Ranking Completo
                    </a>
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="background:#333; color:#fff; padding:20px; border-bottom-left-radius:10px; border-bottom-right-radius:10px;">
                  <p style="margin:0;">© 2025 Chori Survivor</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  },

  // Enviar email con token usando Supabase Edge Function + Resend
  sendTokenEmail: async (data: TokenEmailData): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('❌ Supabase no configurado');
        return { success: false, error: 'Configuración de Supabase faltante' };
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: data.recipientEmail,
          subject: `Token de Activación - Chori Survivor (${data.entriesCount} entrada(s))`,
          html: emailServiceResend.generateTokenEmailHTML(data),
          from: `${SENDER_NAME} <${SENDER_EMAIL}>`
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Email enviado vía Supabase + Resend:', result);
        return { success: true };
      } else {
        console.error('❌ Error al enviar email:', result);
        return { success: false, error: result.error || 'Error al enviar email' };
      }
    } catch (error: any) {
      console.error('❌ Error enviando email:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  },

  // Enviar recordatorio semanal usando Supabase Edge Function + Resend
  sendWeeklyReminder: async (data: WeeklyReminderData): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return { success: false, error: 'Configuración de Supabase faltante' };
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: data.recipientEmail,
          subject: `⚠️ Recordatorio: Elige tu pick - Semana ${data.currentWeek}`,
          html: emailServiceResend.generateWeeklyReminderHTML(data),
          from: `${SENDER_NAME} <${SENDER_EMAIL}>`
        })
      });

      const result = await response.json();
      return response.ok && result.success
        ? { success: true } 
        : { success: false, error: result.error || 'Error al enviar email' };
    } catch (error: any) {
      console.error('❌ Error enviando recordatorio:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  },

  // Enviar estadísticas semanales usando Supabase Edge Function + Resend
  sendWeeklyStats: async (data: WeeklyStatsData): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return { success: false, error: 'Configuración de Supabase faltante' };
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: data.recipientEmail,
          subject: `📊 Resumen Semanal - Semana ${data.weekNumber}`,
          html: emailServiceResend.generateWeeklyStatsHTML(data),
          from: `${SENDER_NAME} <${SENDER_EMAIL}>`
        })
      });

      const result = await response.json();
      return response.ok && result.success
        ? { success: true } 
        : { success: false, error: result.error || 'Error al enviar email' };
    } catch (error: any) {
      console.error('❌ Error enviando estadísticas:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }
};

export default emailServiceResend;
