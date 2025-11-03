import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stack,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Sports as SportsIcon,
  Leaderboard as LeaderboardIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PersonOff as PersonOffIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardService, tokensService, entriesService, seasonsService, picksService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import EntriesModal from '../components/ui/EntriesModal';
import PicksModal from '../components/ui/PicksModal';
import type { DashboardData } from '../types';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEntriesModal, setShowEntriesModal] = useState(false);
  const [pendingEntriesCount, setPendingEntriesCount] = useState(0);
  const [creatingEntries, setCreatingEntries] = useState(false);
  const [userEntries, setUserEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const [recentPicks, setRecentPicks] = useState<any[]>([]);
  const [showPicksModal, setShowPicksModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const getResultChip = (result: string | null | undefined) => {
    switch (result) {
      case 'W':
        return <Chip label="Victoria" color="success" size="small" />;
      case 'L':
        return <Chip label="Derrota" color="error" size="small" />;
      case 'pending':
        return <Chip label="Pendiente" color="default" size="small" />;
      default:
        return <Chip label={result || "N/A"} color="default" size="small" />;
    }
  };

  const handleEntriesCreated = async (entryNames: string[]) => {
    try {
      setCreatingEntries(true);
      
      // Obtener la temporada actual
      const { data: currentSeason } = await seasonsService.getCurrent();
      if (!currentSeason) {
        throw new Error('No se pudo obtener la temporada actual');
      }
      
      // Crear todas las entradas
      for (const name of entryNames) {
        await entriesService.create(user!.id, currentSeason.id, name);
      }
      
      // Cerrar el modal
      setShowEntriesModal(false);
      setPendingEntriesCount(0);
      
      // Refrescar las entradas del usuario
      const { data: entries, error: entriesError } = await entriesService.getUserEntries(user!.id);
      if (entries && !entriesError) {
        setUserEntries(entries);
        
        // Si solo tiene una entrada, seleccionarla automáticamente
        if (entries.length === 1) {
          const entryId = entries[0].id;
          setSelectedEntry(entryId);
          
          // Cargar datos de la entrada
          const { data, error } = await dashboardService.getEntryStats(entryId);
          if (data && !error) {
            setDashboardData(data);
          }

          // Cargar picks de la entrada
          const { data: picks, error: picksError } = await picksService.getPicksByEntry(entryId);
          if (picks && !picksError) {
            setRecentPicks(picks);
          }
        }
      }
      
      console.log(`${entryNames.length} entradas creadas exitosamente`);
      
    } catch (err: any) {
      console.error('Error creando entradas:', err);
      setError('Error al crear las entradas: ' + (err.message || err.toString()));
    } finally {
      setCreatingEntries(false);
    }
  };

  const handleEntryChange = async (entryId: number) => {
    setSelectedEntry(entryId);
    setLoading(true);
    
    try {
      // Cargar estadísticas de la entrada
      const { data, error } = await dashboardService.getEntryStats(entryId);
      if (data && !error) {
        setDashboardData(data);
      } else {
        setError('Error al cargar los datos de la entrada: ' + (error?.message || 'Error desconocido'));
      }

      // Cargar picks de la entrada
      const { data: picks, error: picksError } = await picksService.getPicksByEntry(entryId);
      if (picks && !picksError) {
        setRecentPicks(picks);
      }
    } catch (err: any) {
      setError('Error al cargar los datos de la entrada: ' + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (user?.id) {
          // Verificar entradas pendientes primero
          const result = await tokensService.getUserPendingEntries(user.id);
          
          const { pendingCount } = result;
          setPendingEntriesCount(pendingCount);
          
          // Si hay entradas pendientes, mostrar el modal
          if (pendingCount > 0) {
            setShowEntriesModal(true);
          }

          // Obtener entradas del usuario
          const { data: entries, error: entriesError } = await entriesService.getUserEntries(user.id);
          
          if (entries && !entriesError) {
            setUserEntries(entries);
            
            // Si solo tiene una entrada, seleccionarla automáticamente
            if (entries.length === 1) {
              const entryId = entries[0].id;
              setSelectedEntry(entryId);
              
              // Cargar datos de la entrada
              const { data, error } = await dashboardService.getEntryStats(entryId);
              if (data && !error) {
                setDashboardData(data);
              }

              // Cargar picks de la entrada
              const { data: picks, error: picksError } = await picksService.getPicksByEntry(entryId);
              if (picks && !picksError) {
                setRecentPicks(picks);
              }
            } else if (entries.length === 0) {
              // Sin entradas, mostrar datos vacíos
              setDashboardData({
                entradas_activas: 0,
                victorias: 0,
                derrotas: 0,
                posicion_ranking: 0,
                semana_actual: 1,
                picks_recientes: []
              });
            }
            // Si tiene múltiples entradas, no cargar datos hasta que seleccione una
          } else {
            setError('Error al cargar las entradas: ' + (entriesError?.message || 'Error desconocido'));
          }
        }
        
      } catch (err: any) {
        setError('Error al cargar el dashboard: ' + (err.message || err.toString()));
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header con gradiente */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white', 
        p: 3, 
        borderRadius: 2, 
        mb: 3,
        textAlign: 'center'
      }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
          🏈 Dashboard - NFL Survivor Pool
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          ¡Bienvenido, {user?.username}! Aquí tienes un resumen de tu pool de supervivencia.
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        {/* Filtro de entradas - solo mostrar si tiene más de una entrada */}
        {userEntries.length > 1 && (
          <>
            <Typography variant="h6" color="text.primary" fontWeight="bold">
              Resumen de Entradas
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Seleccionar Entrada</InputLabel>
              <Select
                value={selectedEntry || ''}
                label="Seleccionar Entrada"
                onChange={(e) => handleEntryChange(Number(e.target.value))}
              >
                {userEntries.map((entry) => (
                  <MenuItem key={entry.id} value={entry.id}>
                    {entry.entry_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </Box>

      {/* Mostrar mensaje si tiene múltiples entradas pero no ha seleccionado ninguna */}
      {userEntries.length > 1 && !selectedEntry ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          Por favor selecciona una entrada para ver el dashboard
        </Alert>
      ) : (
        <Stack spacing={3} sx={{ mt: 3 }}>
          {/* Stats Section */}
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Estadísticas
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
              {(() => {
                const currentEntry = userEntries.find(entry => entry.id === selectedEntry);
                const entryStatus = currentEntry?.status;
                return (
                  <Card sx={{ flex: 1, bgcolor: 
                    entryStatus === 'alive' ? 'success.main' : 
                    entryStatus === 'last_chance' ? 'warning.main' : 'error.main',
                    color: 'white' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      {entryStatus === 'alive' && <CheckCircleIcon sx={{ fontSize: 40 }} />}
                      {entryStatus === 'last_chance' && <WarningIcon sx={{ fontSize: 40 }} />}
                      {entryStatus === 'eliminated' && <PersonOffIcon sx={{ fontSize: 40 }} />}
                      <Typography variant="body2" color="white" fontWeight="bold" sx={{ mt: 1 }}>
                        {entryStatus === 'alive' ? 'Alive' : 
                        entryStatus === 'last_chance' ? 'Last Chance' : 'Eliminated'}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })()}

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {dashboardData?.victorias || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Victorias
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {dashboardData?.derrotas || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Derrotas
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h4" 
                  color={
                    (dashboardData?.total_points || 0) >= 0 
                      ? "success.main" 
                      : "error.main"
                  }
                  fontWeight="bold"
                >
                  {dashboardData?.total_points || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Puntos
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.primary" fontWeight="bold">
                  #{dashboardData?.posicion_ranking || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Posición
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Box>

        {/* Quick Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Acciones Rápidas
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => setShowPicksModal(true)}
                startIcon={<SportsIcon />}
                size="large"
                disabled={!selectedEntry}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  },
                  '&:disabled': {
                    background: 'rgba(102, 126, 234, 0.3)',
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}
              >
                Hacer Pick
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/ranking')}
                startIcon={<LeaderboardIcon />}
                size="large"
              >
                Ver Ranking
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Estado Actual
            </Typography>
            
            {dashboardData ? (
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Semana actual: {dashboardData.semana_actual || 'N/A'}
              </Typography>
            ) : (
              <Typography color="text.secondary">
                Cargando información del estado...
              </Typography>
            )}

            {(() => {
              // Buscar el pick de la semana actual
              const currentWeek = dashboardData?.semana_actual;
              const currentWeekPick = recentPicks.find(pick => pick.week === currentWeek);

              if (!currentWeekPick) {
                // No hay pick para la semana actual
                return (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    ¡Recuerda registrar tu pick antes de que termine la semana actual!
                  </Alert>
                );
              }

              // Ya hay pick, revisar el resultado
              const result = currentWeekPick.result;

              if (result === 'W' || result === 'win') {
                return (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    ¡Felicidades, acertaste esta semana! 🎉
                  </Alert>
                );
              } else if (result === 'L' || result === 'loss') {
                return (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Suerte la próxima semana, tu equipo esta semana no ganó 😔
                  </Alert>
                );
              } else if (result === 'T' || result === 'tie') {
                return (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Tu equipo empató esta semana. ¡Sigue participando! 🤝
                  </Alert>
                );
              } else {
                // Resultado pendiente
                return (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    ✅ Tu entrada ya registró su pick para esta semana. ¡Buena suerte!
                  </Alert>
                );
              }
            })()}
          </CardContent>
        </Card>

        {/* Recent Picks */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Picks Recientes
            </Typography>
            
            {recentPicks.length > 0 ? (
              <TableContainer sx={{ maxHeight: 400, mt: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Semana</strong></TableCell>
                      <TableCell><strong>Pick</strong></TableCell>
                      <TableCell><strong>Resultado</strong></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Puntos</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentPicks.map((pick) => (
                      <TableRow key={pick.id} hover>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{pick.week}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                              <img
                                style={{
                                  width: window.innerWidth < 600 ? '30px' : '50px',
                                  height: window.innerWidth < 600 ? '30px' : '50px',
                                  objectFit: 'contain',
                                  verticalAlign: 'middle',
                                  margin: '0 6px',
                                  display: 'inline-block',
                                  position: 'relative',
                                  top: '2px',
                                  borderRadius: '4px',
                                  transition: 'background-color 0.2s'
                                }}
                                src={pick.selected_team?.logo_url
                                  ? pick.selected_team.logo_url.startsWith('/assets/')
                                    ? pick.selected_team.logo_url
                                    : `/assets${pick.selected_team.logo_url}`
                                  : '/assets/logos/nfl_logo.png'}
                                alt={pick.selected_team?.name || 'Team'}
                              />
                            <Box>
                              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {pick.selected_team?.city} {pick.selected_team?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                                S{pick.week} • {pick.points_earned ? (pick.points_earned > 0 ? `+${pick.points_earned}` : pick.points_earned) : '0'} pts
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getResultChip(pick.result)}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography 
                            variant="body2" 
                            color={
                              (pick.points_earned || 0) >= 0 
                                ? "success.main" 
                                : "error.main"
                            }
                            fontWeight="bold"
                          >
                            {pick.points_earned ? (pick.points_earned > 0 ? `+${pick.points_earned}` : pick.points_earned) : '0'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                No hay picks registrados para esta entrada.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>
      )}

      {/* Modal para crear entradas */}
      <EntriesModal
        open={showEntriesModal}
        onClose={() => setShowEntriesModal(false)}
        onConfirm={handleEntriesCreated}
        entriesCount={pendingEntriesCount}
        loading={creatingEntries}
      />

      {/* Modal para hacer picks */}
      <PicksModal
        open={showPicksModal}
        onClose={() => setShowPicksModal(false)}
        entryId={selectedEntry}
        entryName={userEntries.find(e => e.id === selectedEntry)?.entry_name}
      />
    </Box>
  );
}