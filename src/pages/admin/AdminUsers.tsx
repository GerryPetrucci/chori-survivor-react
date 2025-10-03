import { Typography, Box, Paper, Alert } from '@mui/material';

export default function AdminUsers() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Gestionar Usuarios
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Administra los usuarios del pool de supervivencia.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Alert severity="info">
          La gestión de usuarios estará disponible próximamente. Aquí podrás crear, editar y eliminar usuarios del pool.
        </Alert>
      </Paper>
    </Box>
  );
}