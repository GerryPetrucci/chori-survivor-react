import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
  CircularProgress,
} from '@mui/material';
// ...icons not needed; using brand PNG in Avatar
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabaseServices } from '../services/supabase';
import { supabase } from '../config/supabase';
import type { LoginForm } from '../types';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [passwordResetData, setPasswordResetData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  // Detectar si venimos del link de recovery de Supabase
  useEffect(() => {
    const urlType = searchParams.get('type');
    const isRecovery = searchParams.get('recovery') === 'true';
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashType = hashParams.get('type');
    const hasAccessToken = hashParams.has('access_token') || searchParams.has('access_token');
    
    console.log('🔍 Checking recovery mode:', {
      urlType,
      isRecovery,
      hashType, 
      hasAccessToken,
      fullURL: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    });
    
    // Detectar recovery por diferentes métodos
    if (urlType === 'recovery' || 
        isRecovery ||
        hashType === 'recovery' || 
        hasAccessToken) {
      console.log('✅ Recovery mode detected, switching to password reset form');
      setIsRecoveryMode(true);
    }
    
    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ Supabase PASSWORD_RECOVERY event detected');
        setIsRecoveryMode(true);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // ...existing code...
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      // Error handling is done in AuthContext
    }
  };

  const handlePasswordResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordResetData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordResetData.newPassword || !passwordResetData.confirmPassword) {
      setRecoveryMessage({ type: 'error', text: 'Por favor completa todos los campos' });
      return;
    }

    if (passwordResetData.newPassword !== passwordResetData.confirmPassword) {
      setRecoveryMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (passwordResetData.newPassword.length < 6) {
      setRecoveryMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setIsResetting(true);
    setRecoveryMessage(null);

    try {
      const { success, error } = await supabaseServices.auth.updatePassword(passwordResetData.newPassword);
      
      if (success) {
        setRecoveryMessage({ 
          type: 'success', 
          text: '¡Contraseña actualizada exitosamente! Puedes iniciar sesión con tu nueva contraseña.' 
        });
        
        // Cambiar al modo de login después de 2 segundos
        setTimeout(() => {
          setIsRecoveryMode(false);
          setPasswordResetData({ newPassword: '', confirmPassword: '' });
          setRecoveryMessage(null);
        }, 2000);
      } else {
        setRecoveryMessage({ 
          type: 'error', 
          text: error || 'Error al actualizar la contraseña. Intenta nuevamente.' 
        });
      }
    } catch (error: any) {
      setRecoveryMessage({ 
        type: 'error', 
        text: 'Error al actualizar la contraseña. Intenta nuevamente.' 
      });
    } finally {
      setIsResetting(false);
    }
  };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      transition: 'all 0.3s ease',
      '& fieldset': {
        borderColor: 'rgba(102, 126, 234, 0.3)',
        borderWidth: 1.5,
      },
      '&:hover fieldset': {
        borderColor: 'rgba(102, 126, 234, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#667eea',
        borderWidth: 2,
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
      }
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(102, 126, 234, 0.8)',
      '&.Mui-focused': {
        color: '#667eea',
        fontWeight: 600
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 420,
          mx: 2,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          position: 'relative',
          zIndex: 1
        }}
      >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Avatar
              src="/assets/logos/chori_survivor.png"
              sx={{ m: 1, width: "100%", height: "100%", bgcolor: 'transparent' }}
              alt="Chori Survivor"
            />
            <Typography
              variant={isRecoveryMode ? "h5" : "subtitle1"}
              color={isRecoveryMode ? "primary" : "text.secondary"}
              sx={{ 
                mt: 0.5, 
                fontStyle: isRecoveryMode ? 'normal' : 'italic', 
                textAlign: 'center',
                fontWeight: isRecoveryMode ? 'bold' : 'normal'
              }}
            >
              {isRecoveryMode ? 'Cambiar Contraseña' : 'NFL Survivor Pool'}
            </Typography>
          </Box>

          {(error || recoveryMessage) && (
            <Alert severity={recoveryMessage ? recoveryMessage.type : "error"} sx={{ mt: 2, width: '100%' }}>
              {recoveryMessage ? recoveryMessage.text : error}
            </Alert>
          )}

          {isRecoveryMode ? (
            // Formulario de cambio de contraseña
            <Box component="form" onSubmit={handlePasswordReset} sx={{ mt: 3, width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Ingresa tu nueva contraseña
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="Nueva Contraseña"
                type="password"
                id="newPassword"
                autoComplete="new-password"
                autoFocus
                value={passwordResetData.newPassword}
                onChange={handlePasswordResetChange}
                disabled={isResetting}
                sx={textFieldSx}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar Nueva Contraseña"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={passwordResetData.confirmPassword}
                onChange={handlePasswordResetChange}
                disabled={isResetting}
                sx={textFieldSx}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
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
                disabled={isResetting || !passwordResetData.newPassword || !passwordResetData.confirmPassword}
              >
                {isResetting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Cambiar Contraseña'
                )}
              </Button>
              
              <Button
                fullWidth
                variant="text"
                sx={{ mb: 2 }}
                onClick={() => {
                  setIsRecoveryMode(false);
                  setPasswordResetData({ newPassword: '', confirmPassword: '' });
                  setRecoveryMessage(null);
                }}
                disabled={isResetting}
              >
                Cancelar
              </Button>
            </Box>
          ) : (
            // Formulario de login normal
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                sx={textFieldSx}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                sx={textFieldSx}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
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
                disabled={isLoading || !formData.email || !formData.password}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </Box>
          )}

          {!isRecoveryMode && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Ingresa tus credenciales para acceder al pool de supervivencia NFL
              </Typography>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/activate-token')}
                  sx={{ textTransform: 'none' }}
                >
                  ¿Tienes un token? Actívalo aquí
                </Button>
              </Box>
              
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/request-password-reset')}
                  sx={{ textTransform: 'none', color: 'text.secondary' }}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </Box>
            </>
          )}
        </Paper>
    </Box>
  );
}