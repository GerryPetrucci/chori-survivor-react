import { Typography, Box, Paper, Alert } from '@mui/material';

export default function HistoryPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Historial
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Revisa el historial de todos tus picks y resultados.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Alert severity="info">
          La página de historial estará disponible próximamente. Aquí podrás ver todos tus picks anteriores y sus resultados.
        </Alert>
      </Paper>
    </Box>
  );
}