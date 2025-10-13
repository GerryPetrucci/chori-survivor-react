import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Button, TextField, Alert } from '@mui/material';
import { debugAuth } from '../utils/debugAuth';
import { supabase } from '../config/supabase';

const DebugAuth: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');

  const handleListProfiles = async () => {
    const result = await debugAuth.listAllProfiles();
    setResult(result);
  };

  const handleCheckAuthUser = async () => {
    if (!email) return;
    const result = await debugAuth.checkAuthUser(email);
    setResult(result);
  };

  const handleCheckProfile = async () => {
    if (!userId) return;
    const result = await debugAuth.checkUserProfile(userId);
    setResult(result);
  };

  const handleCheckTrigger = async () => {
    const result = await debugAuth.checkTrigger();
    setResult(result);
  };

  const handleCheckCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setResult({ currentUser: user });
  };

  const handleTestToken = async () => {
    // Verificar el token específico
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('token', 'kklmv3glxmpbigvat3g2m');
    
    setResult({ token: data, error });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Debug Authentication
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button onClick={handleListProfiles} variant="contained" sx={{ mr: 2, mb: 2 }}>
            Listar todos los perfiles
          </Button>
          
          <Button onClick={handleCheckTrigger} variant="contained" sx={{ mr: 2, mb: 2 }}>
            Verificar trigger
          </Button>
          
          <Button onClick={handleCheckCurrentUser} variant="contained" sx={{ mr: 2, mb: 2 }}>
            Usuario actual
          </Button>

          <Button onClick={handleTestToken} variant="contained" sx={{ mr: 2, mb: 2 }}>
            Verificar token específico
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mr: 2 }}
          />
          <Button onClick={handleCheckAuthUser} variant="outlined">
            Verificar en Auth
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            sx={{ mr: 2 }}
          />
          <Button onClick={handleCheckProfile} variant="outlined">
            Verificar perfil
          </Button>
        </Box>

        {result && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {JSON.stringify(result, null, 2)}
            </Typography>
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default DebugAuth;