import { Typography, Box, Paper, List, ListItem, ListItemText, Alert, Chip } from '@mui/material';

export default function RulesPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ textAlign: 'center', mb: 1 }}>
        🏈 Reglas del NFL Survivor Pool 🏈
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        ¡Bienvenido al emocionante mundo del Survivor Pool! Aquí están las reglas del juego.
      </Typography>

      {/* Conceptos Básicos */}
      <Paper sx={{ p: 3, mt: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🎯 Conceptos Básicos
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          <Box sx={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              👤 Entradas
            </Typography>
            <Typography variant="body2">
              Un jugador puede tener una o varias entradas en el pool. Cada entrada compite de forma independiente.
            </Typography>
          </Box>
          <Box sx={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              🏆 Objetivo
            </Typography>
            <Typography variant="body2">
              Sobrevivir eligiendo equipos ganadores cada semana sin poder repetir equipos.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Los Dos Pools */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🏊‍♂️ Los Dos Pools de Competencia
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1, border: '2px solid #4caf50', borderRadius: 2, p: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#4caf50' }}>
              💚 Pool Principal (Alives)
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="🎯 Objetivo: Ser el último jugador vivo" />
              </ListItem>
              <ListItem>
                <ListItemText primary="💰 Premio: El más grande del pool" />
              </ListItem>
              <ListItem>
                <ListItemText primary="🏁 Victoria: Último superviviente gana" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⏰ Ejemplo: Si después de la semana 10 solo queda 1 jugador vivo, ¡gana el premio principal!" />
              </ListItem>
            </List>
          </Box>
          
          <Box sx={{ flex: 1, border: '2px solid #ff9800', borderRadius: 2, p: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#ff9800' }}>
              🧡 Pool Last Chance
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="🎯 Objetivo: Obtener la mayor puntuación" />
              </ListItem>
              <ListItem>
                <ListItemText primary="💸 Premio: Más pequeño que el principal" />
              </ListItem>
              <ListItem>
                <ListItemText primary="📊 Victoria: Entrada con más puntos gana" />
              </ListItem>
              <ListItem>
                <ListItemText primary="🔄 Nota: No importa cuántos partidos ganados tengas" />
              </ListItem>
            </List>
          </Box>
        </Box>
      </Paper>

      {/* Reglas de Juego */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📋 Reglas Principales de Juego
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🗓️ <strong>Selección Semanal</strong>
                </Typography>
              }
              secondary="Cada entrada debe seleccionar un equipo por semana antes del inicio de los partidos."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🚫 <strong>Regla de Un Solo Uso</strong>
                </Typography>
              }
              secondary="Una vez que seleccionas un equipo, NO puedes volver a seleccionarlo durante toda la temporada."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  💀 <strong>Eliminación</strong>
                </Typography>
              }
              secondary="Si tu equipo seleccionado pierde, quedas eliminado del pool principal pero continúas en el Last Chance."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  � <strong>Cambios de Picks Permitidos</strong>
                </Typography>
              }
              secondary="Puedes cambiar tu pick siempre y cuando NI el partido del pick actual NI el del nuevo pick hayan empezado."
            />
          </ListItem>
        </List>
      </Paper>

      {/* Sistema de Puntos */}
      <Paper sx={{ p: 3, mt: 3, backgroundColor: '#f8f9fa' }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📊 Sistema de Puntuación
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          <Box sx={{ flex: 1, backgroundColor: '#4caf50', color: 'white', p: 2, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              ⏰ La Anticipación Premia
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Las <strong>horas antes</strong> de que escojas tu pick serán el <strong>multiplicador</strong> si tu equipo gana.
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1, backgroundColor: '#f44336', color: 'white', p: 2, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              💔 Penalización por Pérdida
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Cuando una entrada pierda, se le <strong>restarán 300 puntos</strong> a su puntaje total.
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1, backgroundColor: '#2196f3', color: 'white', p: 2, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              📈 Ejemplo de Puntos
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Pick 24 horas antes + Equipo gana = <strong>24 puntos</strong>
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Criterios de Desempate */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚖️ Criterios de Desempate (Pool Principal)
        </Typography>
        
        <Typography variant="body1" gutterBottom sx={{ fontStyle: 'italic', mb: 3 }}>
          Si al final de la temporada hay dos o más jugadores sin derrotas:
        </Typography>
        
        <List>
          <ListItem sx={{ backgroundColor: '#e3f2fd', borderRadius: 1, mb: 1 }}>
            <Chip label="1°" color="primary" sx={{ mr: 2 }} />
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🏆 <strong>Puntuación Total</strong>
                </Typography>
              }
              secondary="El jugador con mayor puntuación gana (considerando las horas de anticipación)."
            />
          </ListItem>
          
          <ListItem sx={{ backgroundColor: '#fff3e0', borderRadius: 1, mb: 1 }}>
            <Chip label="2°" color="warning" sx={{ mr: 2 }} />
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  ✈️ <strong>Equipos Visitantes Ganadores</strong>
                </Typography>
              }
              secondary="Quien haya escogido más equipos visitantes ganadores en la temporada."
            />
          </ListItem>
          
          <ListItem sx={{ backgroundColor: '#f3e5f5', borderRadius: 1 }}>
            <Chip label="3°" color="secondary" sx={{ mr: 2 }} />
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🤝 <strong>División del Premio</strong>
                </Typography>
              }
              secondary="Si después de los dos criterios anteriores siguen empatados, los jugadores dividirán el premio en partes iguales."
            />
          </ListItem>
        </List>
      </Paper>

      {/* Timing y Fechas Límite */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          ⏱️ Fechas Límite y Timing
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>📅 Inicio de Semana:</strong> Cada semana NFL comienza a las 00:00 del día después de que se juega el último partido de la semana anterior.
          </Typography>
        </Alert>
        
        <List>
          <ListItem>
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🕐 <strong>Fecha Límite Individual por Pick</strong>
                </Typography>
              }
              secondary="La fecha límite para cada pick es la hora exacta en que empieza el partido del equipo que quieres seleccionar."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🔄 <strong>Cambios Flexibles</strong>
                </Typography>
              }
              secondary="Puedes cambiar tu pick siempre que ninguno de los dos partidos (actual y nuevo) haya comenzado."
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🎯 <strong>Ventaja por Anticipación</strong>
                </Typography>
              }
              secondary="Mientras más temprano hagas tu pick, más puntos ganarás si tu equipo es victorioso."
            />
          </ListItem>
        </List>
      </Paper>

      {/* Regla de Asignación Automática */}
      <Paper sx={{ p: 3, mt: 3, border: '2px solid #f44336' }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f44336' }}>
          ⚠️ Regla de Asignación Automática
        </Typography>
        
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>🚨 IMPORTANTE:</strong> Si no eliges pick antes de que inicie el último partido de la semana, se te asignará automáticamente un pick.
          </Typography>
        </Alert>
        
        <List>
          <ListItem sx={{ backgroundColor: '#ffebee', borderRadius: 1, mb: 1 }}>
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  ✈️ <strong>Primera Opción: Equipo Visitante</strong>
                </Typography>
              }
              secondary="Se te asignará el equipo VISITANTE del último partido de la semana si es elegible (no lo has usado antes)."
            />
          </ListItem>
          
          <ListItem sx={{ backgroundColor: '#ffcdd2', borderRadius: 1, mb: 1 }}>
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  💀 <strong>Segunda Opción: Equipo Perdedor</strong>
                </Typography>
              }
              secondary="Si el equipo visitante no es elegible, se te asignará AL AZAR un equipo que haya PERDIDO esa semana y que sea elegible para ti."
            />
          </ListItem>
          
          <ListItem sx={{ backgroundColor: '#d32f2f', color: 'white', borderRadius: 1 }}>
            <ListItemText 
              primary={
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  ⚡ <strong>Resultado: Derrota Automática</strong>
                </Typography>
              }
              secondary="Como el equipo asignado automáticamente perdió, significa una DERROTA AUTOMÁTICA para tu entrada."
            />
          </ListItem>
        </List>
        
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>💡 Consejo:</strong> ¡Siempre haz tu pick a tiempo para evitar esta penalización! El sistema te dará las mejores oportunidades solo si participas activamente.
          </Typography>
        </Alert>
      </Paper>

      {/* Advertencias Importantes */}
      <Alert severity="warning" sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          ⚠️ <strong>Importante</strong>
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="• Las decisiones del administrador son finales en casos de disputa." />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Asegúrate de entender todas las reglas antes de participar." />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Revisa siempre tus picks antes de confirmar, no hay cambios permitidos." />
          </ListItem>
          <ListItem>
            <ListItemText primary="• El sistema de puntos se calcula automáticamente según las horas de anticipación." />
          </ListItem>
        </List>
      </Alert>

      {/* Mensaje de Buena Suerte */}
      <Paper sx={{ p: 3, mt: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', textAlign: 'center' }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
          🍀 ¡Que Tengas Suerte! 🍀
        </Typography>
        <Typography variant="body1">
          ¡Bienvenido al emocionante mundo del NFL Survivor Pool! Que tus picks sean acertados y tu estrategia te lleve a la victoria. 🏆
        </Typography>
      </Paper>
    </Box>
  );
}