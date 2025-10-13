import React, { useState } from 'react';
import { Container, Paper, Typography, Box, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { tokensService, authService } from '../services/supabase';
import { supabase } from '../config/supabase';

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

    setLoading(true);
    setError(null);

    let attemptedRetry = false;

    const attemptSignUp = async () => {
      try {
        console.log('🚀 Iniciando creación de usuario:', {
          email: userForm.email,
          username: userForm.username,
          token: tokenForm.token
        });

        const { data, error } = await authService.signUp(
          userForm.email,
          userForm.password,
          userForm.username,
          userForm.username
        );

        console.log('📊 Resultado signUp:', { data, error });

        if (error || !data?.user) {
          // Detectar mensaje de rate-limit de Supabase y reintentar automáticamente una vez
          const errMsg = typeof error === 'string' ? error : error?.message || '';
          const match = /you can only request this after\s*(\d+)\s*seconds?/i.exec(errMsg);
          if (match && !attemptedRetry) {
            attemptedRetry = true;
            const waitSec = parseInt(match[1], 10) || 5;
            console.log(`⏳ Rate limit detected, waiting ${waitSec}s before retrying...`);
            await new Promise(res => setTimeout(res, (waitSec + 1) * 1000));
            return attemptSignUp();
          }

          console.error('❌ Error en signUp:', error);
          setError('Error al crear usuario: ' + (error?.message || error));
          return null;
        }

        return { data, error };

      } catch (err: any) {
        console.error('❌ Error general en attemptSignUp:', err);
        setError('Error: ' + err.message);
        return null;
      }
    };

    try {
      const result = await attemptSignUp();
      if (!result || !result.data || !result.data.user) {
        // Si after retry still no user, stop
        setLoading(false);
        return;
      }

      const data = result.data as any;

      console.log('✅ Usuario creado en Auth:', {
        id: data.user!.id,
        email: data.user!.email,
        confirmed: data.user!.email_confirmed_at
      });

      // Verificar si el perfil se creó automáticamente
      console.log('🔍 Verificando si el perfil se creó automáticamente...');
      const profileCheckResult = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user!.id)
        .single();
      
      console.log('📋 Resultado verificación perfil:', profileCheckResult);

      if (profileCheckResult.error) {
        console.log('⚠️ Perfil no existe, intentando crear manualmente...');
        // Si no existe el perfil, intentar crearlo manualmente
        const manualProfileResult = await supabase
          .from('user_profiles')
          .insert({
            id: data.user!.id,
            username: userForm.username,
            full_name: userForm.username,
            email: data.user!.email || userForm.email,
            user_type: 'user'
          })
          .select()
          .single();
        
        console.log('📊 Resultado creación manual de perfil:', manualProfileResult);
        
        if (manualProfileResult.error) {
          console.error('❌ Error al crear perfil manualmente:', manualProfileResult.error);
        }
      }

      console.log('🎫 Marcando token como usado...');
      const tokenResult = await tokensService.useToken(tokenForm.token, data.user!.id);
      console.log('📊 Resultado useToken:', tokenResult);

      if (tokenResult.error) {
        console.error('❌ Error al marcar token como usado:', tokenResult.error);
        setError('Usuario creado pero error al procesar token: ' + tokenResult.error.message);
        return;
      }

      setSuccess('Usuario creado exitosamente! ID: ' + data.user!.id);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      console.error('❌ Error general:', err);
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Activar Token - Sistema Mejorado
        </Typography>

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
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
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
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              helperText="Outlook/Hotmail se convertirán a Gmail automáticamente"
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
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Crear Usuario'}
            </Button>
          </Box>
        )}

      {/* Información técnica removida para no confundir al usuario final */}
      </Paper>
    </Container>
  );
};

export default ActivateToken;
