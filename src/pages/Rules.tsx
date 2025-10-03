import { Typography, Box, Paper, List, ListItem, ListItemText, Alert } from '@mui/material';

export default function RulesPage() {
  const rules = [
    'Cada participante debe seleccionar un equipo por semana.',
    'Una vez que seleccionas un equipo, no puedes volver a seleccionarlo durante toda la temporada.',
    'Si tu equipo seleccionado pierde, quedas eliminado del pool.',
    'El último participante que quede en pie gana el premio.',
    'Los picks deben realizarse antes del inicio de los partidos de cada semana.',
    'No se permiten cambios una vez que se ha enviado el pick.',
    'En caso de empate, se pueden aplicar reglas especiales de desempate.',
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Reglas del Juego
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Conoce las reglas del NFL Survivor Pool.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Reglas Principales
        </Typography>
        
        <List>
          {rules.map((rule, index) => (
            <ListItem key={index}>
              <ListItemText 
                primary={`${index + 1}. ${rule}`}
              />
            </ListItem>
          ))}
        </List>

        <Alert severity="warning" sx={{ mt: 3 }}>
          <strong>Importante:</strong> Asegúrate de entender todas las reglas antes de participar. 
          Las decisiones del administrador son finales en casos de disputa.
        </Alert>
      </Paper>
    </Box>
  );
}