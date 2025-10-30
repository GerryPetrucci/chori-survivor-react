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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
  Avatar,
  Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { userProfilesService, seasonsService } from '../services/supabase';
import { supabase } from '../config/supabase';

interface RankingEntry {
  position: number;
  user_id: string;
  username: string;
  entry_name: string;
  entry_id: number;
  status: 'alive' | 'last_chance' | 'eliminated';
  points: number;
  total_wins: number;
  isUserEntry?: boolean;
  avatar_url?: string;
}

export default function RankingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rankingData, setRankingData] = useState<RankingEntry[]>([]);
  const [filteredData, setFilteredData] = useState<RankingEntry[]>([]);
  const [filter, setFilter] = useState<'General' | 'Pool Principal' | 'Last Chance'>('General');
  const [showUserEntries, setShowUserEntries] = useState(false);
  const [userEntries, setUserEntries] = useState<RankingEntry[]>([]);

  // Función para obtener el emoji de la posición
  const getPositionDisplay = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return position.toString();
    }
  };

  // Función para obtener el color del chip de status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'alive':
        return 'success';
      case 'last_chance':
        return 'warning';
      case 'eliminated':
        return 'error';
      default:
        return 'default';
    }
  };

  // Función para obtener el texto del status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'alive':
        return 'Activo';
      case 'last_chance':
        return 'Last Chance';
      case 'eliminated':
        return 'Eliminado';
      default:
        return status;
    }
  };

  // Cargar datos del ranking
  const loadRankingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener temporada activa
      const { data: season, error: seasonError } = await seasonsService.getCurrent();
      if (seasonError) {
        throw new Error('Error al obtener la temporada activa: ' + seasonError.message);
      }

      if (!season) {
        setRankingData([]);
        setFilteredData([]);
        return;
      }

      // Obtener todas las entradas de la temporada actual usando supabase directamente
      // Necesitamos importar supabase para hacer una consulta sin filtro de usuario
      const { data: allEntries, error: entriesError } = await supabase
        .from('entries')
        .select(`
          id,
          user_id,
          entry_name,
          season_id,
          status,
          total_wins,
          total_losses,
          created_at,
          season:seasons(*)
        `)
        .eq('season_id', season.id)
        .order('total_wins', { ascending: false });
      
      if (entriesError) {
        throw new Error('Error al obtener las entradas: ' + entriesError.message);
      }

      if (!allEntries || allEntries.length === 0) {
        setRankingData([]);
        setFilteredData([]);
        return;
      }

      // Obtener perfiles de usuarios para cada entrada
      const entriesWithUserData = await Promise.all(
        allEntries.map(async (entry: any) => {
          try {
            const { data: userProfile } = await userProfilesService.getProfile(entry.user_id);
            return {
              ...entry,
              username: userProfile?.username || `Usuario ${entry.user_id.slice(-4)}`,
              full_name: userProfile?.full_name || userProfile?.username || `Usuario ${entry.user_id.slice(-4)}`,
              avatar_url: userProfile?.avatar_url
            };
          } catch {
            // Si no se puede obtener el perfil, usar datos por defecto
            return {
              ...entry,
              username: `Usuario ${entry.user_id.slice(-4)}`,
              full_name: `Usuario ${entry.user_id.slice(-4)}`
            };
          }
        })
      );

      // Convertir a formato de ranking y calcular puntos reales
      const rankingData: RankingEntry[] = [];
      
      for (const entry of entriesWithUserData) {
        // Usar el campo status directamente de la base de datos
        const status: 'alive' | 'last_chance' | 'eliminated' = entry.status;
        
        // Calcular puntos reales desde la base de datos
        const { data: entryPicks, error: picksError } = await supabase
          .from('picks')
          .select('points_earned')
          .eq('entry_id', entry.id);
        
        let realPoints = 0;
        if (entryPicks && !picksError) {
          realPoints = entryPicks.reduce((sum, pick) => sum + (pick.points_earned || 0), 0);
        }

        rankingData.push({
          position: 0, // Se calculará después del sort
          user_id: entry.user_id,
          username: entry.username,
          entry_name: entry.entry_name || `Entrada ${entry.id}`,
          entry_id: entry.id,
          status,
          points: realPoints, // Usar puntos reales
          total_wins: entry.total_wins || 0,
          isUserEntry: user ? entry.user_id === user.id : false,
          avatar_url: entry.avatar_url
        });
      }

      // Ordenar por puntos reales descendente, luego por total_wins descendente
      const sortedRankingData = rankingData
        .sort((a: any, b: any) => {
          // Ordenar por puntos descendente, luego por total_wins descendente
          if (b.points !== a.points) return b.points - a.points;
          return b.total_wins - a.total_wins;
        })
        .map((entry: any, index: number) => ({
          ...entry,
          position: index + 1
        }));

      setRankingData(sortedRankingData);
      
      // Identificar entradas del usuario
      if (user) {
        const userEntriesData = rankingData.filter(entry => entry.user_id === user.id);
        setUserEntries(userEntriesData);
      }

    } catch (err: any) {
      console.error('Error loading ranking data:', err);
      setError(err.message || 'Error al cargar el ranking');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar datos según el filtro seleccionado
  const applyFilter = () => {
    let filtered = [...rankingData];

    switch (filter) {
      case 'Pool Principal':
        filtered = filtered.filter(entry => entry.status === 'alive');
        break;
      case 'Last Chance':
        filtered = filtered.filter(entry => entry.status === 'last_chance');
        break;
      case 'General':
      default:
        // Mostrar todas las entradas
        break;
    }

    // Mostrar solo top 20 por defecto
    if (!showUserEntries) {
      filtered = filtered.slice(0, 20);
    } else {
      // Mostrar top 20 + entradas del usuario que no están en el top 20
      const top20 = filtered.slice(0, 20);
      const userEntriesOutsideTop20 = userEntries.filter(entry => 
        entry.position > 20 && !top20.find(topEntry => topEntry.entry_id === entry.entry_id)
      );
      filtered = [...top20, ...userEntriesOutsideTop20].sort((a, b) => {
        if (a.position <= 20 && b.position <= 20) return a.position - b.position;
        if (a.position <= 20) return -1;
        if (b.position <= 20) return 1;
        return a.position - b.position;
      });
    }

    setFilteredData(filtered);
  };

  useEffect(() => {
    loadRankingData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, showUserEntries, rankingData]);

  const toggleUserEntries = () => {
    setShowUserEntries(!showUserEntries);
  };

  if (loading) {
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
          <Typography variant="h4" gutterBottom fontWeight="bold">
            🏆 Ranking
          </Typography>
          
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Ve las posiciones de todos los participantes en el pool
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Cargando ranking...</Typography>
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
          <Typography variant="h4" gutterBottom fontWeight="bold">
            🏆 Ranking
          </Typography>
          
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Ve las posiciones de todos los participantes en el pool
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
        <Typography variant="h4" gutterBottom fontWeight="bold">
          🏆 Ranking
        </Typography>
        
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Ve las posiciones de todos los participantes en el pool
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        {/* Filtro */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filtrar por</InputLabel>
            <Select
              value={filter}
              label="Filtrar por"
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <MenuItem value="General">General</MenuItem>
              <MenuItem value="Pool Principal">Pool Principal</MenuItem>
              <MenuItem value="Last Chance">Last Chance</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {filter} - Top {filteredData.length}
          </Typography>
        </Box>

        {/* Tabla de ranking */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: { xs: '15%', sm: '10%' } }}><strong>Pos.</strong></TableCell>
                <TableCell><strong>Entrada</strong></TableCell>
                <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Pts</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((entry) => (
                <TableRow 
                  key={entry.entry_id}
                  sx={{
                    backgroundColor: entry.isUserEntry 
                      ? 'rgba(102, 126, 234, 0.1)' 
                      : 'inherit',
                    '&:hover': {
                      backgroundColor: entry.isUserEntry
                        ? 'rgba(102, 126, 234, 0.15)'
                        : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: '1rem', sm: '1.2rem' }, fontWeight: 'bold' }}>
                      {getPositionDisplay(entry.position)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                      <Avatar 
                        src={entry.avatar_url || undefined}
                        sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 }, bgcolor: 'primary.main', fontSize: { xs: '0.75rem', sm: '1rem' } }}
                      >
                        {!entry.avatar_url && entry.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {entry.entry_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: { xs: 'none', sm: 'block' } }}>
                          {entry.username}
                        </Typography>
                        <Chip 
                          label={getStatusText(entry.status)}
                          color={getStatusColor(entry.status) as any}
                          size="small"
                          sx={{ display: { xs: 'inline-flex', sm: 'none' }, height: 16, fontSize: '0.6rem', mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Chip 
                      label={getStatusText(entry.status)}
                      color={getStatusColor(entry.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {entry.points}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Link para mostrar entradas del usuario */}
        {user && userEntries.length > 0 && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="text"
              size="small"
              onClick={toggleUserEntries}
              sx={{ textTransform: 'none' }}
            >
              {showUserEntries ? '← Ver solo Top 20' : '📊 Mostrar mis entradas'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}