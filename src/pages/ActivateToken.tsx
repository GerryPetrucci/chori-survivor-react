import React, { useState } from 'react';
import { Container, Paper, Typography, Box, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { tokensService, authService } from '../services/supabase';

const ActivateToken: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [tokenForm, setTokenForm] = useState({ token: '' });
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: ''
  });

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

  const handleValidateToken = async () => {
    if (!tokenForm.token.trim()) {
      setError('Por favor ingresa un token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await tokensService.validateToken(tokenForm.token);
      if (error || !data) {
        setError(error?.message || 'Token inválido');
        return;
      }
      setSuccess(`Token válido! Tienes ${data.entries_count} entrada(s).`);
      setUserForm(prev => ({ ...prev, email: data.email }));
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Error al validar token');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.username || !userForm.email || !userForm.password || !userForm.confirm_password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (userForm.password !== userForm.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (userForm.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Primero crear el usuario con Supabase Auth
      const { data: authData, error: authError } = await authService.signUp(
        userForm.email,
        userForm.password,
        userForm.username,
        userForm.username
      );

      if (authError || !authData?.user) {
        setError(authError || 'Error al crear usuario');
        return;
      }

      // Luego marcar el token como usado
      const { error: tokenError } = await tokensService.useToken(
        tokenForm.token,
        authData.user.id
      );

      if (tokenError) {
        setError('Usuario creado pero error al procesar token: ' + tokenError.message);
        return;
      }

      setSuccess('¡Usuario creado exitosamente! Redirigiendo al login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: 3,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom fontWeight="bold">
          🎫 Activar Token
        </Typography>
        
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Activa tu token para unirte al pool
        </Typography>
      </Box>
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 4,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          position: 'relative',
          zIndex: 1
        }}
      >

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {step === 1 && (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleValidateToken(); }}>
            <Typography variant="h6" gutterBottom>Paso 1: Validar Token</Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Token de Activación"
              value={tokenForm.token}
              onChange={(e) => setTokenForm({ token: e.target.value.toLowerCase().trim() })}
              disabled={loading}
              autoFocus
              sx={textFieldSx}
            />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              sx={{ 
                mt: 3, 
                mb: 2,
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
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Validar Token'}
            </Button>
          </Box>
        )}

        {step === 2 && (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }}>
            <Typography variant="h6" gutterBottom>Paso 2: Crear Usuario</Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Nombre de Usuario"
              value={userForm.username}
              onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
              disabled={loading}
              autoFocus
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading || !!userForm.email}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Contraseña"
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
              disabled={loading}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirmar Contraseña"
              type="password"
              value={userForm.confirm_password}
              onChange={(e) => setUserForm(prev => ({ ...prev, confirm_password: e.target.value }))}
              disabled={loading}
              sx={textFieldSx}
            />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              sx={{ 
                mt: 3, 
                mb: 2,
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
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Crear Usuario'}
            </Button>
          </Box>
        )}

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
    </Container>
  );
};

export default ActivateToken;