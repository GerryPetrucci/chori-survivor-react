import { Typography, Box, Paper, Alert } from '@mui/material';

export default function RankingPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Ranking
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Ve las posiciones de todos los participantes en el pool.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Alert severity="info">
          La página de ranking estará disponible próximamente. Aquí verás las posiciones de todos los participantes.
        </Alert>
      </Paper>
    </Box>
  );
}