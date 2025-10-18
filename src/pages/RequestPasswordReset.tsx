import { useState } from 'react';
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
import { Link } from 'react-router-dom';
import { supabaseServices } from '../services/supabase';

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'Por favor ingresa tu email' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Primero verificar que el usuario existe en user_profiles
      const { data: userProfile, error: profileError } = await supabaseServices.userProfiles.getByEmail(email);
      
      if (profileError || !userProfile) {
        setMessage({ 
          type: 'error', 
          text: 'No se encontró una cuenta asociada a este email' 
        });
        setIsLoading(false);
        return;
      }

      // Usar el sistema nativo de Supabase para enviar el email de recuperación
      const { success, error } = await supabaseServices.auth.requestPasswordReset(email);

      if (success) {
        setMessage({ 
          type: 'success', 
          text: `Se ha enviado un enlace de recuperación a ${email}. Revisa tu correo electrónico y la carpeta de spam.`
        });
        
        // Informar al usuario que puede cerrar esta ventana
        setTimeout(() => {
          setMessage({ 
            type: 'success', 
            text: 'Email enviado exitosamente. Puedes cerrar esta ventana y revisar tu correo.'
          });
        }, 3000);
      } else {
        setMessage({ 
          type: 'error', 
          text: error || 'Error al enviar el email de recuperación. Intenta nuevamente.' 
        });
      }

    } catch (error: any) {
      console.error('Error in password reset request:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al procesar la solicitud. Intenta nuevamente.' 
      });
    } finally {
      setIsLoading(false);
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
            variant="h5"
            component="h1"
            gutterBottom
            sx={{ mt: 1, textAlign: 'center', fontWeight: 'bold' }}
          >
            Recuperar Contraseña
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ mt: 0.5, fontStyle: 'italic', textAlign: 'center' }}
          >
            Ingresa tu email para recibir un código de recuperación
          </Typography>
        </Box>

        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mt: 2, width: '100%' }}
          >
            {message.text}
          </Alert>
        )}

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            type="email"
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
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Enviar Código de Recuperación'
            )}
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button
              variant="text"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              ← Volver al Login
            </Button>
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}