import emailjs from '@emailjs/browser';

// Configuración de EmailJS desde variables de entorno
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const DEV_EMAIL = import.meta.env.VITE_DEV_EMAIL || 'gerry_petrucci_developer@outlook.com';
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
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #1976d2, #dc004e);
                color: white;
                text-align: center;
                padding: 30px 20px;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
                font-size: 16px;
            }
            .content {
                padding: 40px 30px;
            }
            .token-box {
                background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
                border: 2px solid #1976d2;
                border-radius: 10px;
                padding: 25px;
                margin: 25px 0;
                text-align: center;
            }
            .token {
                font-size: 24px;
                font-weight: bold;
                color: #1976d2;
                letter-spacing: 2px;
                font-family: 'Courier New', monospace;
                background: #ffffff;
                padding: 15px;
                border-radius: 8px;
                margin: 10px 0;
                border: 2px dashed #1976d2;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 25px 0;
            }
            .info-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #1976d2;
            }
            .info-label {
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            .info-value {
                color: #666;
                font-size: 18px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #1976d2, #1565c0);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3);
                transition: all 0.3s ease;
            }
            .steps {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 10px;
                margin: 25px 0;
            }
            .step {
                display: flex;
                align-items: center;
                margin: 15px 0;
                padding: 10px;
                background: white;
                border-radius: 8px;
                border-left: 4px solid #4caf50;
            }
            .step-number {
                background: #4caf50;
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                margin-right: 15px;
                font-size: 14px;
            }
            .footer {
                background: #333;
                color: white;
                text-align: center;
                padding: 25px;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                }
                .content {
                    padding: 20px 15px;
                }
                .info-grid {
                    grid-template-columns: 1fr;
                }
                .token {
                    font-size: 18px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>🏈 Chori Survivor</h1>
                <p>NFL Survivor Pool - Token de Activación</p>
            </div>

            <!-- Content -->
            <div class="content">
                <h2>¡Bienvenido al Pool de Supervivencia NFL! 🎉</h2>
                <p>Hemos generado un token especial para que puedas unirte a nuestro emocionante pool de supervivencia de la NFL.</p>

                <!-- Token Box -->
                <div class="token-box">
                    <h3>🔑 Tu Token de Activación</h3>
                    <div class="token">${data.token}</div>
                    <p><strong>¡Guarda este token en un lugar seguro!</strong></p>
                </div>

                <!-- Info Grid -->
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">🎯 Entradas Permitidas</div>
                        <div class="info-value">${data.entriesCount} entrada(s)</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">⏰ Válido Hasta</div>
                        <div class="info-value">${data.expiryDate}</div>
                    </div>
                </div>

                <!-- Call to Action -->
                <div style="text-align: center;">
                    <a href="http://localhost:5173/activate-token" class="cta-button">
                        🚀 Activar Token Ahora
                    </a>
                </div>

                <!-- Steps -->
                <div class="steps">
                    <h3>📋 Pasos para Activar tu Token</h3>
                    
                    <div class="step">
                        <div class="step-number">1</div>
                        <div>
                            <strong>Haz clic en "Activar Token Ahora"</strong><br>
                            O ve a la página de login y selecciona "¿Tienes un token? Actívalo aquí"
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-number">2</div>
                        <div>
                            <strong>Ingresa tu token</strong><br>
                            Copia y pega el token que aparece arriba
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-number">3</div>
                        <div>
                            <strong>Crea tu cuenta</strong><br>
                            Completa el formulario con tu información personal
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-number">4</div>
                        <div>
                            <strong>Nombra tus entradas</strong><br>
                            Elige nombres únicos para tus ${data.entriesCount} entrada(s) al pool
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-number">5</div>
                        <div>
                            <strong>¡Comienza a jugar!</strong><br>
                            Accede al dashboard y haz tus picks semanales
                        </div>
                    </div>
                </div>

                <!-- Warning -->
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Este token es válido por <strong>15 días</strong> desde su generación</li>
                        <li>Solo puede ser usado <strong>una vez</strong></li>
                        <li>Debes usar el mismo correo electrónico (${data.recipientEmail}) al registrarte</li>
                        <li>Los nombres de entradas deben ser únicos en todo el pool</li>
                    </ul>
                </div>

                <p>Si tienes alguna pregunta o problema, contacta al administrador del pool.</p>
                <p><strong>¡Que tengas suerte en el Survivor Pool! 🍀</strong></p>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>© 2025 Chori Survivor - NFL Survivor Pool</p>
                <p><strong>Remitente:</strong> ${SENDER_NAME} &lt;${SENDER_EMAIL}&gt;</p>
                <p>Este es un correo automático, no responder.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  },

  // Enviar email con token
  sendTokenEmail: async (data: TokenEmailData): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sobrescribir email por el del desarrollador
      const emailData = {
        ...data,
        recipientEmail: 'gerry_petrucci_developer@outlook.com'
      };

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
    console.log('📧 Original recipient:', data.recipientEmail);
    console.log('📧 Actual recipient (DEV):', DEV_EMAIL);
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
http://localhost:5173/activate-token

===========================================
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
        to_email: DEV_EMAIL,
        to_name: 'Usuario',
        from_email: SENDER_EMAIL,
        from_name: SENDER_NAME,
        subject: `Token de Activación - Chori Survivor (${data.entriesCount} entrada(s))`,
        html_content: emailService.generateTokenEmailHTML(data),
        token: data.token,
        entries_count: data.entriesCount,
        expiry_date: data.expiryDate,
        activation_link: 'http://localhost:5173/activate-token',
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
http://localhost:5173/activate-token

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
// emailService.init(); // Descomentar cuando tengas las credenciales

export default emailService;