import emailjs from '@emailjs/browser';

// Configuración de EmailJS desde variables de entorno
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SENDER_EMAIL = import.meta.env.VITE_SENDER_EMAIL || 'tokens@chori-survivor.com';
const SENDER_NAME = import.meta.env.VITE_SENDER_NAME || 'Chori Survivor - Sistema de Tokens';

export interface TokenEmailData {
  token: string;
  recipientEmail: string;
  entriesCount: number;
  expiryDate: string;
}



export const emailService = {
  // Inicializar EmailJS
  init: () => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  },

  // Generar HTML del email con el token
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
                        <h3 style="margin-top:0;">📋 Pasos para Activar tu Token</h3>
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



  // Enviar email con token
  sendTokenEmail: async (data: TokenEmailData): Promise<{ success: boolean; error?: string }> => {
    try {
      // Usar el email del formulario (no hardcodeado)
      const emailData = data;

      const templateParams = {
        to_email: emailData.recipientEmail,
        to_name: 'Usuario',
        subject: `Token de Activación - Chori Survivor (${emailData.entriesCount} entrada(s))`,
        html_content: emailService.generateTokenEmailHTML(emailData),
        token: emailData.token,
        entries_count: emailData.entriesCount,
        expiry_date: emailData.expiryDate
      };

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      if (result.status === 200) {
        return { success: true };
      } else {
        return { success: false, error: 'Error al enviar email' };
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  },

  // Método de prueba (sin EmailJS configurado)
  sendTokenEmailMock: async (data: TokenEmailData): Promise<{ success: boolean; error?: string }> => {
    console.log('📧 ENVIANDO EMAIL CON DEBUGGING:');
    console.log('📧 Recipient email:', data.recipientEmail);
    console.log('🔑 Token:', data.token);
    console.log('🎯 Entries:', data.entriesCount);
    console.log('⏰ Expires:', data.expiryDate);
    
    // Verificar configuración de EmailJS
    const isEmailJSConfigured = EMAILJS_SERVICE_ID && 
                                EMAILJS_TEMPLATE_ID && 
                                EMAILJS_PUBLIC_KEY &&
                                !EMAILJS_SERVICE_ID.includes('service_xxx') &&
                                !EMAILJS_PUBLIC_KEY.includes('xxx') &&
                                EMAILJS_SERVICE_ID !== 'service_chori_survivor';
    
    if (!isEmailJSConfigured) {
      console.warn('⚠️ EmailJS no configurado correctamente - usando modo simulación');
      
      // Crear un email completo para copiar/pegar manualmente
          const emailContent = `
===========================================
CHORI SURVIVOR - TOKEN DE ACTIVACIÓN
===========================================

De: ${SENDER_NAME} <${SENDER_EMAIL}>
Para: ${data.recipientEmail}
Asunto: Token de Activación - Chori Survivor (${data.entriesCount} entrada(s))

Token: ${data.token}
Entradas: ${data.entriesCount}
Expira: ${data.expiryDate}

Link de activación:
https://chori-survivor-react.vercel.app/activate-token===========================================
      `;
      
      console.log('📋 CONTENIDO DEL EMAIL PARA COPIAR:');
      console.log(emailContent);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return { 
        success: false, 
        error: `Modo simulación - EmailJS no configurado. Token generado: ${data.token}` 
      };
    }
    
    try {
      console.log('📧 Configuración EmailJS:');
      console.log('- Service ID:', EMAILJS_SERVICE_ID);
      console.log('- Template ID:', EMAILJS_TEMPLATE_ID);
      console.log('- Public Key:', EMAILJS_PUBLIC_KEY ? 'Configurado' : 'NO CONFIGURADO');
      
      // Intentar envío real con EmailJS
      const templateParams = {
        to_email: data.recipientEmail,
        to_name: 'Usuario',
        from_email: SENDER_EMAIL,
        from_name: SENDER_NAME,
        subject: `Token de Activación - Chori Survivor (${data.entriesCount} entrada(s))`,
        html_content: emailService.generateTokenEmailHTML(data),
        token: data.token,
        entries_count: data.entriesCount,
        expiry_date: data.expiryDate,
        activation_link: 'https://chori-survivor-react.vercel.app/activate-token',
        original_email: data.recipientEmail
      };
      
      console.log('📧 Parámetros del template:', templateParams);
      
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      console.log('✅ Email enviado exitosamente:', result);
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ Error al enviar email:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Error desconocido';
      
      if (error) {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.text) {
          errorMessage = error.text;
        } else if (error.status) {
          errorMessage = `Error HTTP ${error.status}: ${error.statusText || 'Error de servicio'}`;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = `Error de EmailJS: ${JSON.stringify(error)}`;
        }
        
        // Si es error de configuración de EmailJS, cambiar a modo simulación
        if (errorMessage.includes('Public Key is invalid') || 
            errorMessage.includes('Service ID') || 
            errorMessage.includes('Template ID')) {
          
          console.warn('⚠️ EmailJS mal configurado, cambiando a modo simulación');
          
          // Mostrar el contenido del email en la consola
          const emailContent = `
===========================================
CHORI SURVIVOR - TOKEN DE ACTIVACIÓN
===========================================

De: ${SENDER_NAME} <${SENDER_EMAIL}>
Para: ${data.recipientEmail}
Asunto: Token de Activación - Chori Survivor (${data.entriesCount} entrada(s))

Token: ${data.token}
Entradas: ${data.entriesCount}
Expira: ${data.expiryDate}

Link de activación:
https://chori-survivor-react.vercel.app/activate-token

===========================================
          `;
          
          console.log('📧 CONTENIDO DEL EMAIL:');
          console.log(emailContent);
          
          return { 
            success: false, 
            error: `EmailJS no configurado. Token generado: ${data.token}. Revisa la consola para el contenido completo del email.` 
          };
        }
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }
};

// Inicializar EmailJS al cargar el módulo
emailService.init();

export default emailService;