import { Typography, Box, Paper, Alert } from '@mui/material';

export default function PicksPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Hacer Picks
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Selecciona tus equipos para la semana actual.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Alert severity="info">
          La página de picks estará disponible próximamente. Aquí podrás seleccionar tus equipos para cada semana.
        </Alert>
      </Paper>
    </Box>
  );
}