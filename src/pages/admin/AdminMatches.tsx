import { Typography, Box, Paper, Alert } from '@mui/material';

export default function AdminMatches() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Gestionar Partidos
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Administra los partidos de NFL y sus resultados.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Alert severity="info">
          La gestión de partidos estará disponible próximamente. Aquí podrás actualizar resultados y programar nuevos partidos.
        </Alert>
      </Paper>
    </Box>
  );
}