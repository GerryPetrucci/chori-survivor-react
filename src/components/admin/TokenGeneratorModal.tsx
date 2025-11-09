import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Avatar,
  Fade,
  Slide,
  Zoom
} from '@mui/material';
import {
  Email as EmailIcon,
  Groups as GroupsIcon,
  Security as SecurityIcon,
  Token as TokenIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import { tokensService } from '../../services/supabase';
import { emailServiceResend } from '../../services/emailServiceResend';

interface TokenGeneratorModalProps {
  open: boolean;
  onClose: () => void;
}

interface TokenFormData {
  email: string;
  entriesCount: number;
  adminPassword: string;
  idCompra?: string;
}

interface TokenResult {
  token: string;
  expiryDate: string;
  emailSent: boolean;
  error?: string;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const steps = [
  'Datos del Usuario', 
  'Validación de Admin', 
  'Generación de Token'
];

export default function TokenGeneratorModal({ open, onClose }: TokenGeneratorModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TokenFormData>({
    email: '',
    entriesCount: 1,
    adminPassword: '',
    idCompra: ''
  });
  const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!loading) {
      setActiveStep(0);
      setFormData({ email: '', entriesCount: 1, adminPassword: '', idCompra: '' });
      setTokenResult(null);
      setError(null);
      onClose();
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email || !emailRegex.test(formData.email)) {
        setError('Por favor ingresa un email válido');
        return;
      }
      if (formData.entriesCount < 1 || formData.entriesCount > 5) {
        setError('El número de entradas debe ser entre 1 y 5');
        return;
      }
      setError(null);
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Validar contraseña admin
      if (!formData.adminPassword || formData.adminPassword.length < 4) {
        setError('La contraseña de administrador es requerida (mínimo 4 caracteres)');
        return;
      }
      setError(null);
      handleGenerateToken();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setError(null);
    }
  };

  const handleGenerateToken = async () => {
    setLoading(true);
    setError(null);

    try {
      // Generar token
      const { data, error: tokenError, token } = await tokensService.generateToken(
        formData.entriesCount,
        formData.adminPassword,
        formData.idCompra
      );

      if (tokenError || !data || !token) {
        if (tokenError?.message.includes('Contraseña')) {
          setError('❌ Contraseña de administrador incorrecta');
        } else if (tokenError?.message.includes('administradores')) {
          setError('❌ Solo administradores pueden generar tokens');
        } else if (tokenError?.message.includes('autenticado')) {
          setError('❌ Debes estar autenticado como administrador');
        } else {
          setError('❌ Error al generar token: ' + (tokenError?.message || 'Error desconocido'));
        }
        return;
      }

      // Formatear fecha de expiración
      const expiryDate = new Date(data.expires_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Enviar email
      let emailSent = false;
      let emailError = '';
      
      try {
        const emailResult = await emailServiceResend.sendTokenEmail({
          token,
          recipientEmail: formData.email,
          entriesCount: formData.entriesCount,
          expiryDate
        });

        emailSent = emailResult.success;
        if (!emailResult.success) {
          emailError = emailResult.error || 'Error desconocido al enviar email';
        }
      } catch (err: any) {
        emailError = err.message || err.toString();
      }

      // Establecer resultado
      setTokenResult({
        token,
        expiryDate,
        emailSent,
        error: emailError || undefined
      });

      setActiveStep(2);
    } catch (err: any) {
      console.error('Error generating token:', err);
      setError('Error al generar token: ' + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <EmailIcon />
              </Avatar>
              <Typography variant="h6">
                Información del Usuario
              </Typography>
            </Box>
            
            <TextField
              fullWidth
              label="Correo Electrónico"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                <GroupsIcon />
              </Avatar>
              <Typography variant="h6">
                Número de Entradas
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {[1, 2, 3, 4, 5].map((count) => (
                <Chip
                  key={count}
                  label={count}
                  variant={formData.entriesCount === count ? "filled" : "outlined"}
                  color={formData.entriesCount === count ? "primary" : "default"}
                  onClick={() => setFormData({ ...formData, entriesCount: count })}
                  sx={{ 
                    cursor: 'pointer',
                    minWidth: 40,
                    '&:hover': { 
                      bgcolor: formData.entriesCount === count ? 'primary.dark' : 'action.hover' 
                    }
                  }}
                />
              ))}
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Cada entrada permite al usuario participar independientemente en la liga.
            </Typography>

            <TextField
              fullWidth
              label="ID de Compra (opcional)"
              value={formData.idCompra || ''}
              onChange={(e) => setFormData({ ...formData, idCompra: e.target.value })}
              placeholder="Ej: MP-12345, PayPal-67890"
              helperText="Identificador de la transacción de pago"
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <SecurityIcon />
              </Avatar>
              <Typography variant="h6">
                Validación de Administrador
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Resumen:</strong><br/>
                📧 Usuario: {formData.email}<br/>
                🎯 Entradas: {formData.entriesCount}<br/>
                💳 ID Compra: {formData.idCompra || 'No especificado'}<br/>
                ⏰ Validez: 15 días
              </Typography>
            </Alert>
            
            <TextField
              fullWidth
              label="Contraseña de Administrador"
              type="password"
              value={formData.adminPassword}
              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
              placeholder="Ingresa tu contraseña de admin"
              InputProps={{
                startAdornment: <SecurityIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Esta contraseña se verificará contra tu perfil de administrador.
            </Typography>
          </Box>
        );

      case 2:
        return tokenResult ? (
          <Box>
            <Zoom in={true}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: tokenResult.emailSent ? 'success.main' : 'warning.main', 
                  mx: 'auto', 
                  mb: 2,
                  width: 64,
                  height: 64
                }}>
                  {tokenResult.emailSent ? <CheckCircleIcon fontSize="large" /> : <TokenIcon fontSize="large" />}
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {tokenResult.emailSent ? '🎉 ¡Token Enviado!' : '⚠️ Token Generado'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {tokenResult.emailSent 
                    ? 'El token ha sido generado y enviado por correo exitosamente'
                    : 'El token fue generado pero hubo problemas con el email'
                  }
                </Typography>
              </Box>
            </Zoom>

            <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
              <Typography variant="subtitle2" color="primary.main" gutterBottom>
                DETALLES DEL TOKEN
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Token:</Typography>
                  <Typography variant="body1" fontFamily="monospace" sx={{ 
                    bgcolor: 'white', 
                    p: 1, 
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                    wordBreak: 'break-all'
                  }}>
                    {tokenResult.token}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Email:</Typography>
                  <Typography variant="body1">{formData.email}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Entradas permitidas:</Typography>
                  <Typography variant="body1">{formData.entriesCount}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">ID de Compra:</Typography>
                  <Typography variant="body1">{formData.idCompra || 'No especificado'}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Fecha de expiración:</Typography>
                  <Typography variant="body1">{tokenResult.expiryDate}</Typography>
                </Box>
              </Box>
            </Paper>

            {tokenResult.emailSent ? (
              <Alert severity="success">
                <Typography variant="body2">
                  ✅ Email enviado a: <strong>{formData.email}</strong><br/>
                  📱 El usuario puede activar el token en: <strong>https://chori-survivor-react.vercel.app/activate-token</strong>
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning">
                <Typography variant="body2">
                  ⚠️ Token generado correctamente pero el email no se pudo enviar:<br/>
                  <strong>{tokenResult.error}</strong><br/>
                  <em>Por favor, envía el token manualmente al usuario.</em>
                </Typography>
              </Alert>
            )}
          </Box>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '60vh',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
          boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        gap: 1,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'rgba(255,255,255,0.3)'
        }
      }}>
        <TokenIcon sx={{ color: 'white' }} />
        <Typography component="span" variant="h5" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          Generar Token de Activación
        </Typography>
        <Box sx={{ flex: 1 }} />
        {!loading && (
          <Button
            onClick={handleClose}
            sx={{ 
              color: 'rgba(255,255,255,0.8)', 
              minWidth: 'auto', 
              p: 1,
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <CloseIcon />
          </Button>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3, minHeight: '400px' }}>
        {activeStep < 2 && (
          <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {error && (
          <Fade in={true}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          </Fade>
        )}

        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Generando token y enviando email...
            </Typography>
          </Box>
        )}

        {!loading && renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        {activeStep === 2 ? (
          <Button
            onClick={handleClose}
            variant="contained"
            startIcon={<CheckCircleIcon />}
            fullWidth
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              }
            }}
          >
            Finalizar
          </Button>
        ) : (
          <>
            <Button 
              onClick={handleBack} 
              disabled={activeStep === 0 || loading}
            >
              Atrás
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={loading}
              startIcon={activeStep === 1 ? <SendIcon /> : undefined}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                },
                '&:disabled': {
                  background: 'rgba(102, 126, 234, 0.3)',
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              {activeStep === 0 ? 'Continuar' : 'Generar Token'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}