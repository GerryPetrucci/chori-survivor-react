import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Avatar
} from '@mui/material';
import { supabase } from '../../config/supabase';
import UserStatsModal from '../../components/ui/UserStatsModal';

interface Pick {
  id: number;
  week: number;
  selected_team_id: number;
  result: 'W' | 'L' | 'T' | 'pending';
  points_earned: number;
  entry_id: number;
  entry_name: string;
  username: string;
  user_id: string;
  avatar_url?: string;
  team_name: string;
  team_abbreviation: string;
  logo_url: string;
  is_active: boolean;
}

export default function ShowPicks() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<{ username: string; avatarUrl?: string } | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentWeek > 0) {
      loadPicks(selectedWeek);
    }
  }, [selectedWeek, currentWeek]);

  const loadInitialData = async () => {
    try {
      // Obtener temporada activa y semana actual
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('id, current_week')
        .eq('is_active', true)
        .single();

      if (seasonError) throw seasonError;

      const week = seasonData?.current_week || 1;
      setCurrentWeek(week);
      setSelectedWeek(week);

      // Obtener semanas disponibles (1 a 18)
      const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
      setAvailableWeeks(weeks);

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error al cargar datos iniciales');
    }
  };

  const loadPicks = async (week: number) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener temporada activa
      const { data: seasonData } = await supabase
        .from('seasons')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!seasonData) {
        setError('No hay temporada activa');
        return;
      }

      // Obtener picks con información de entrada, usuario y equipo
      const { data: picksData, error: picksError } = await supabase
        .from('picks')
        .select(`
          id,
          week,
          selected_team_id,
          result,
          points_earned,
          entry_id,
          entries!inner (
            entry_name,
            is_active,
            user_id
          ),
          selected_team:teams!inner (
            name,
            abbreviation,
            logo_url
          )
        `)
        .eq('season_id', seasonData.id)
        .eq('week', week)
        .order('entry_id', { ascending: true });

      if (picksError) throw picksError;

      // Obtener los user_ids únicos
      const userIds = [...new Set((picksData || []).map((pick: any) => pick.entries.user_id))];

      // Obtener información de usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Crear un mapa de user_id a datos de usuario
      const userMap = new Map(
        (usersData || []).map((user: any) => [user.id, { username: user.username, avatar_url: user.avatar_url }])
      );

      // Transformar datos de picks
      const transformedPicks: Pick[] = (picksData || []).map((pick: any) => {
        const userData = userMap.get(pick.entries.user_id) || { username: 'Unknown', avatar_url: null };
        return {
          id: pick.id,
          week: pick.week,
          selected_team_id: pick.selected_team_id,
          result: pick.result,
          points_earned: pick.points_earned,
          entry_id: pick.entry_id,
          entry_name: pick.entries.entry_name,
          username: userData.username,
          user_id: pick.entries.user_id,
          avatar_url: userData.avatar_url,
          team_name: pick.selected_team.name,
          team_abbreviation: pick.selected_team.abbreviation,
          logo_url: pick.selected_team.logo_url,
          is_active: pick.entries.is_active
        };
      });

      // Obtener todas las entradas activas de la temporada
      const { data: allEntriesData, error: entriesError } = await supabase
        .from('entries')
        .select(`
          id,
          entry_name,
          is_active,
          user_id
        `)
        .eq('season_id', seasonData.id)
        .eq('is_active', true);

      if (entriesError) throw entriesError;

      // Obtener user_ids de todas las entradas
      const allUserIds = [...new Set((allEntriesData || []).map((entry: any) => entry.user_id))];

      // Obtener información de todos los usuarios
      const { data: allUsersData, error: allUsersError } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url')
        .in('id', allUserIds);

      if (allUsersError) throw allUsersError;

      // Crear mapa de usuarios
      const allUserMap = new Map(
        (allUsersData || []).map((user: any) => [user.id, { username: user.username, avatar_url: user.avatar_url }])
      );

      // Identificar entradas sin pick para esta semana
      const entryIdsWithPicks = new Set(transformedPicks.map(p => p.entry_id));
      const entriesWithoutPicks = (allEntriesData || [])
        .filter((entry: any) => !entryIdsWithPicks.has(entry.id))
        .map((entry: any) => {
          const userData = allUserMap.get(entry.user_id) || { username: 'Unknown', avatar_url: null };
          return {
            id: 0, // Sin pick ID
            week: week,
            selected_team_id: 0,
            result: 'pending' as const,
            points_earned: 0,
            entry_id: entry.id,
            entry_name: entry.entry_name,
            username: userData.username,
            user_id: entry.user_id,
            avatar_url: userData.avatar_url,
            team_name: '-',
            team_abbreviation: '—',
            logo_url: '',
            is_active: entry.is_active
          };
        });

      // Combinar picks con entradas sin picks
      setPicks([...transformedPicks, ...entriesWithoutPicks]);

    } catch (err) {
      console.error('Error loading picks:', err);
      setError('Error al cargar los picks');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = (userId: string, username: string, avatarUrl?: string) => {
    setSelectedUserId(userId);
    setSelectedUserData({ username, avatarUrl });
    setShowStatsModal(true);
  };

  const handleCloseStatsModal = () => {
    setShowStatsModal(false);
    setSelectedUserId(null);
    setSelectedUserData(null);
  };

  const getTeamLogo = (logoUrl?: string): string => {
    if (logoUrl) {
      return logoUrl.startsWith('/assets/') ? logoUrl : `/assets${logoUrl}`;
    }
    return '/assets/logos/nfl_logo.png';
  };

  const getResultDisplay = (result: string) => {
    switch (result) {
      case 'W':
        return <Chip label="Ganó" color="success" size="small" />;
      case 'L':
        return <Chip label="Perdió" color="error" size="small" />;
      case 'T':
        return <Chip label="Empate" color="warning" size="small" />;
      case 'pending':
        return <Chip label="Pendiente" color="default" size="small" />;
      default:
        return <Chip label="—" color="default" size="small" />;
    }
  };

  if (loading && picks.length === 0) {
    return (
      <Box>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            p: 3,
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
            📋 Picks de Usuarios
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Consulta todos los picks realizados por semana
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            p: 3,
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
            📋 Picks de Usuarios
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Consulta todos los picks realizados por semana
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: 3,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          📋 Picks de Usuarios
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Consulta todos los picks realizados por semana
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        {/* Filtro de Semana */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 180 } }}>
            <InputLabel>Semana</InputLabel>
            <Select
              value={selectedWeek}
              label="Semana"
              onChange={(e) => setSelectedWeek(e.target.value as number)}
              MenuProps={{
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              {availableWeeks.map((week) => (
                <MenuItem key={week} value={week}>
                  Semana {week} {currentWeek === week ? '(Actual)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Semana {selectedWeek} - {picks.length} picks
          </Typography>
        </Box>

        {picks.length === 0 ? (
          <Alert severity="info">
            No hay picks registrados para la Semana {selectedWeek}
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Entrada</strong></TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Semana</strong></TableCell>
                  <TableCell align="center"><strong>Equipo</strong></TableCell>
                  <TableCell align="center"><strong>Resultado</strong></TableCell>
                  <TableCell align="center"><strong>Puntos</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {picks.map((pick) => (
                  <TableRow 
                    key={pick.id || `no-pick-${pick.entry_id}`}
                    sx={{
                      backgroundColor: pick.id === 0 
                        ? 'rgba(255, 152, 0, 0.08)' // Naranja suave para sin picks
                        : !pick.is_active 
                          ? 'rgba(244, 67, 54, 0.05)' 
                          : 'inherit',
                      opacity: !pick.is_active ? 0.7 : 1
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                        <Avatar 
                          src={pick.avatar_url || undefined}
                          onClick={() => handleAvatarClick(pick.user_id, pick.username, pick.avatar_url)}
                          sx={{ 
                            width: { xs: 24, sm: 32 }, 
                            height: { xs: 24, sm: 32 }, 
                            bgcolor: 'primary.main', 
                            fontSize: { xs: '0.75rem', sm: '1rem' },
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }
                          }}
                        >
                          {!pick.avatar_url && pick.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {pick.entry_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                            {pick.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography variant="body2">{pick.week}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {pick.id === 0 ? (
                        <Typography variant="body2" color="warning.main" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>
                          -
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Box
                            component="img"
                            src={getTeamLogo(pick.logo_url)}
                            alt={pick.team_name}
                            sx={{
                              width: { xs: 24, sm: 28 },
                              height: { xs: 24, sm: 28 },
                              objectFit: 'contain'
                            }}
                          />
                          <Typography variant="body2" sx={{ display: { xs: 'none', md: 'inline' }, fontSize: '0.875rem' }}>
                            {pick.team_abbreviation}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {pick.id === 0 ? (
                        <Chip label="Sin pick" color="warning" size="small" variant="outlined" />
                      ) : (
                        getResultDisplay(pick.result)
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold">
                        {pick.points_earned}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <UserStatsModal
        open={showStatsModal}
        onClose={handleCloseStatsModal}
        userId={selectedUserId || ''}
        username={selectedUserData?.username || ''}
        avatarUrl={selectedUserData?.avatarUrl}
      />
    </Box>
  );
}
