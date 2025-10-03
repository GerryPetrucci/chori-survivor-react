import { Typography, Box, Paper, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Mi Perfil
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Información de tu cuenta y configuración.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información de la Cuenta
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Usuario:</strong> {user?.username}
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Email:</strong> {user?.email}
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          <strong>Tipo de Usuario:</strong> {user?.user_type === 'admin' ? 'Administrador' : 'Usuario'}
        </Typography>

        <Alert severity="info">
          Las opciones de configuración del perfil estarán disponibles próximamente.
        </Alert>
      </Paper>
    </Box>
  );
}