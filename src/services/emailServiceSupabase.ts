// Email Service con Supabase como primario y EmailJS como fallback
// Migración segura sin interrumpir el servicio actual

import emailjs from '@emailjs/browser';

// Configuración de EmailJS (FALLBACK)
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Configuración de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Feature flag para migración gradual
const USE_SUPABASE_EMAIL = import.meta.env.VITE_USE_SUPABASE_EMAIL === 'true';

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

interface EmailResponse {
  success: boolean;
  error?: string;
  provider?: 'supabase' | 'emailjs';
}

// Generar HTML del email con el token
const generateTokenEmailHTML = (data: TokenEmailData): string => {
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
            <!-- Header -->
            <tr>
              <td align="center" style="padding:30px 20px 10px 20px; background-color:#667eea; border-top-left-radius:10px; border-top-right-radius:10px;">
                <h1 style="color:#fff; margin:0;">🏈 Chori Survivor</h1>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 20px 20px 20px; background-color:#667eea; color:#fff;">
                <h2 style="margin:0; font-size:24px; font-weight:bold;">Token de Activación</h2>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:30px;">
                <p>¡Bienvenido al Pool de Supervivencia NFL! 🎉</p>
                <p>Hemos generado un token especial para que puedas unirte.</p>
                
                <!-- Token Box -->
                <table width="100%" style="background-color:#667eea; border-radius:10px; margin:25px 0;">
                  <tr>
                    <td align="center" style="padding:20px; color:#fff;">
                      <h3 style="margin:0 0 10px 0; color:#fff;">🔑 Tu Token</h3>
                      <div style="font-size:22px; font-weight:bold; color:#667eea; letter-spacing:2px; font-family:monospace; background:#fff; padding:12px; border-radius:8px; display:inline-block;">${data.token}</div>
                    </td>
                  </tr>
                </table>
                
                <p><strong>📊 Entradas permitidas:</strong> ${data.entriesCount}</p>
                <p><strong>⏰ Válido hasta:</strong> ${data.expiryDate}</p>
                
                <p style="text-align:center; margin:30px 0;">
                  <a href="https://chori-survivor-react.vercel.app/activate-token" style="display:inline-block; background-color:#667eea; color:#fff; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold;">
                    🚀 Activar Token Ahora
                  </a>
                </p>
                
                <p><strong>⚠️ Importante:</strong></p>
                <ul>
                  <li>Token válido por 15 días</li>
                  <li>Solo puede usarse una vez</li>
                  <li>Usa el email ${data.recipientEmail} al registrarte</li>
                </ul>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="background:#333; color:#fff; padding:20px; border-bottom-left-radius:10px; border-bottom-right-radius:10px;">
                <p style="margin:0;">© 2025 Chori Survivor - NFL Survivor Pool</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

// Generar HTML para recordatorio semanal
const generateWeeklyReminderHTML = (data: WeeklyReminderData): string => {
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
};

// Generar HTML para estadísticas semanales
const generateWeeklyStatsHTML = (data: WeeklyStatsData): string => {
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
};

// ============================================================
// SUPABASE EMAIL FUNCTIONS (PRIMARY)
// ============================================================

const sendEmailViaSupabase = async (
  to: string,
  subject: string,
  html: string
): Promise<EmailResponse> => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Supabase no configurado');
      return { success: false, error: 'Supabase no configurado', provider: 'supabase' };
    }

    // Llamar a Supabase Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        from: SENDER_EMAIL
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Email enviado con Supabase:', result);
      return { success: true, provider: 'supabase' };
    } else {
      console.error('❌ Error de Supabase:', result);
      return { success: false, error: result.error || 'Error al enviar email', provider: 'supabase' };
    }
  } catch (error: any) {
    console.error('❌ Error enviando email con Supabase:', error);
    return { success: false, error: error.message || 'Error desconocido', provider: 'supabase' };
  }
};

// ============================================================
// EMAILJS FUNCTIONS (FALLBACK)
// ============================================================

const sendEmailViaEmailJS = async (
  to: string,
  subject: string,
  html: string
): Promise<EmailResponse> => {
  try {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      return { success: false, error: 'EmailJS no configurado', provider: 'emailjs' };
    }

    const templateParams = {
      to_email: to,
      to_name: 'Usuario',
      subject: subject,
      html_content: html
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    if (result.status === 200) {
      console.log('✅ Email enviado con EmailJS (fallback):', result);
      return { success: true, provider: 'emailjs' };
    } else {
      return { success: false, error: 'Error al enviar email', provider: 'emailjs' };
    }
  } catch (error: any) {
    console.error('❌ Error enviando email con EmailJS:', error);
    return { success: false, error: error.message || 'Error desconocido', provider: 'emailjs' };
  }
};

// ============================================================
// UNIFIED EMAIL SENDER (CON FALLBACK AUTOMÁTICO)
// ============================================================

const sendEmailWithFallback = async (
  to: string,
  subject: string,
  html: string
): Promise<EmailResponse> => {
  console.log(`📧 Enviando email a: ${to}`);
  console.log(`📧 Provider configurado: ${USE_SUPABASE_EMAIL ? 'Supabase' : 'EmailJS'}`);

  // Intentar con Supabase si está habilitado
  if (USE_SUPABASE_EMAIL) {
    const supabaseResult = await sendEmailViaSupabase(to, subject, html);
    
    if (supabaseResult.success) {
      return supabaseResult;
    }

    // Si Supabase falla, intentar con EmailJS como fallback
    console.warn('⚠️ Supabase falló, intentando con EmailJS...');
    const emailJSResult = await sendEmailViaEmailJS(to, subject, html);
    
    if (emailJSResult.success) {
      console.log('✅ Email enviado con EmailJS (fallback exitoso)');
      return emailJSResult;
    }

    // Ambos fallaron
    return {
      success: false,
      error: `Supabase: ${supabaseResult.error}, EmailJS: ${emailJSResult.error}`,
      provider: 'supabase'
    };
  }

  // Si Supabase no está habilitado, usar EmailJS directamente
  return await sendEmailViaEmailJS(to, subject, html);
};

// ============================================================
// PUBLIC API
// ============================================================

export const emailServiceSupabase = {
  // Inicializar EmailJS (para fallback)
  init: () => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  },

  // Enviar email con token
  sendTokenEmail: async (data: TokenEmailData): Promise<EmailResponse> => {
    const html = generateTokenEmailHTML(data);
    const subject = `Token de Activación - Chori Survivor (${data.entriesCount} entrada(s))`;
    
    return await sendEmailWithFallback(data.recipientEmail, subject, html);
  },

  // Enviar recordatorio semanal
  sendWeeklyReminder: async (data: WeeklyReminderData): Promise<EmailResponse> => {
    const html = generateWeeklyReminderHTML(data);
    const subject = `⚠️ Recordatorio: Elige tu pick - Semana ${data.currentWeek}`;
    
    return await sendEmailWithFallback(data.recipientEmail, subject, html);
  },

  // Enviar estadísticas semanales
  sendWeeklyStats: async (data: WeeklyStatsData): Promise<EmailResponse> => {
    const html = generateWeeklyStatsHTML(data);
    const subject = `📊 Resumen Semanal - Semana ${data.weekNumber}`;
    
    return await sendEmailWithFallback(data.recipientEmail, subject, html);
  },

  // Método de utilidad para verificar configuración
  getConfiguration: () => {
    return {
      primary: USE_SUPABASE_EMAIL ? 'supabase' : 'emailjs',
      supabaseConfigured: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
      emailjsConfigured: !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY),
      senderEmail: SENDER_EMAIL,
      senderName: SENDER_NAME
    };
  }
};

// Inicializar EmailJS al cargar el módulo
emailServiceSupabase.init();

export default emailServiceSupabase;
