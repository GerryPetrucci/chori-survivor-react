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
  Chip
} from '@mui/material';
import { seasonsService } from '../services/supabase';
import { supabase } from '../config/supabase';

interface Match {
  id: number;
  week: number;
  game_date: string;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'in_progress' | 'completed';
  home_team?: {
    id: number;
    name: string;
    city: string;
    abbreviation: string;
  };
  away_team?: {
    id: number;
    name: string;
    city: string;
    abbreviation: string;
  };
}

export default function MatchesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [availableWeeks] = useState<number[]>(Array.from({ length: 18 }, (_, i) => i + 1));

  // Función para obtener el logo del equipo basado en el nombre/ciudad
  const getTeamLogo = (teamName: string, teamCity: string) => {
    const teamKey = teamName?.toLowerCase() || teamCity?.toLowerCase() || '';
    
    // Mapeo de nombres de equipos a archivos de logo
    const logoMap: { [key: string]: string } = {
      '49ers': '49ers_logo.png',
      'bears': 'bears_logo.png',
      'bengals': 'bengals_logo.png',
      'bills': 'bills_logo.png',
      'broncos': 'broncos_logo.png',
      'browns': 'browns_logo.png',
      'buccaneers': 'buccaneers_logo.png',
      'cardinals': 'cardinals_logo.png',
      'chargers': 'chargers_logo.png',
      'chiefs': 'chiefs_logo.png',
      'colts': 'colts_logo.png',
      'commanders': 'commanders_logo.png',
      'cowboys': 'cowboys_logo.png',
      'dolphins': 'dolphins_logo.png',
      'eagles': 'eagles_logo.png',
      'falcons': 'falcons_logo.png',
      'giants': 'giants_logo.png',
      'jaguars': 'jaguars_logo.png',
      'jets': 'jets_logo.png',
      'lions': 'lions_logo.png',
      'packers': 'packers_logo.png',
      'panthers': 'panthers_logo.png',
      'patriots': 'patriots_logo.png',
      'raiders': 'raiders_logo.png',
      'rams': 'rams_logo.png',
      'ravens': 'ravens_logo.png',
      'saints': 'saints_logo.png',
      'seahawks': 'seahawks_logo.png',
      'steelers': 'steelers_logo.png',
      'texans': 'texans_logo.png',
      'titans': 'titans_logo.png',
      'vikings': 'vikings_logo.png'
    };

    // Buscar coincidencia exacta primero
    if (logoMap[teamKey]) {
      return `/assets/logos/${logoMap[teamKey]}`;
    }

    // Buscar por palabras clave en el nombre
    for (const [key, logo] of Object.entries(logoMap)) {
      if (teamKey.includes(key) || teamCity?.toLowerCase().includes(key)) {
        return `/assets/logos/${logo}`;
      }
    }

    // Logo por defecto si no se encuentra
    return '/assets/logos/nfl_logo.png';
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar partidos cuando cambia la semana
  useEffect(() => {
    if (currentSeason) {
      loadMatches();
    }
  }, [selectedWeek, currentSeason]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener temporada activa
      const { data: season, error: seasonError } = await seasonsService.getCurrent();
      if (seasonError) {
        throw new Error('Error al obtener la temporada activa: ' + seasonError.message);
      }

      if (!season) {
        setError('No hay temporada activa');
        return;
      }

      setCurrentSeason(season);
      
      // Establecer la semana actual como default
      if (season.current_week) {
        setSelectedWeek(season.current_week);
      }

    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError(err.message || 'Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener partidos de la semana seleccionada
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, city, abbreviation),
          away_team:teams!matches_away_team_id_fkey(id, name, city, abbreviation)
        `)
        .eq('season_id', currentSeason.id)
        .eq('week', selectedWeek)
        .order('game_date');

      if (matchesError) {
        throw new Error('Error al obtener los partidos: ' + matchesError.message);
      }

      setMatches(matchesData || []);

    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError(err.message || 'Error al cargar los partidos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programado';
      case 'in_progress':
        return 'En Curso';
      case 'completed':
        return 'Finalizado';
      default:
        return status;
    }
  };

  const getScoreDisplay = (match: Match) => {
    if (match.status === 'completed' && match.home_score !== null && match.away_score !== null) {
      return `${match.home_score} - ${match.away_score}`;
    } else if (match.status === 'in_progress' && match.home_score !== null && match.away_score !== null) {
      return `${match.home_score} - ${match.away_score}`;
    } else {
      return 'vs';
    }
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
            🏈 Partidos
          </Typography>
          
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Consulta los partidos de la NFL por semana
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Cargando partidos...</Typography>
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
            🏈 Partidos
          </Typography>
          
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Consulta los partidos de la NFL por semana
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
          🏈 Partidos
        </Typography>
        
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Consulta los partidos de la NFL por semana
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        {/* Filtro de Semana */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Semana</InputLabel>
            <Select
              value={selectedWeek}
              label="Semana"
              onChange={(e) => setSelectedWeek(e.target.value as number)}
            >
              {availableWeeks.map((week) => (
                <MenuItem key={week} value={week}>
                  Semana {week} {currentSeason?.current_week === week ? '(Actual)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Semana {selectedWeek} - {matches.length} partidos
          </Typography>
        </Box>

        {matches.length === 0 ? (
          <Alert severity="info">
            No hay partidos programados para la Semana {selectedWeek}
          </Alert>
        ) : (
          /* Tabla de partidos */
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Equipos</strong></TableCell>
                  <TableCell align="center"><strong>Fecha y Hora</strong></TableCell>
                  <TableCell align="center"><strong>Resultado</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* Away Team */}
                        <Box
                          component="img"
                          src={getTeamLogo(match.away_team?.name || '', match.away_team?.city || '')}
                          alt={`${match.away_team?.city} ${match.away_team?.name}`}
                          sx={{
                            width: 28,
                            height: 28,
                            objectFit: 'contain',
                            borderRadius: 1,
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}
                        />
                        <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 35, textAlign: 'center' }}>
                          {match.away_team?.abbreviation || 'TBD'}
                        </Typography>
                        
                        {/* @ Separator */}
                        <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mx: 0.5 }}>
                          @
                        </Typography>
                        
                        <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 35, textAlign: 'center' }}>
                          {match.home_team?.abbreviation || 'TBD'}
                        </Typography>
                        {/* Home Team */}
                        <Box
                          component="img"
                          src={getTeamLogo(match.home_team?.name || '', match.home_team?.city || '')}
                          alt={`${match.home_team?.city} ${match.home_team?.name}`}
                          sx={{
                            width: 28,
                            height: 28,
                            objectFit: 'contain',
                            borderRadius: 1,
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatDate(match.game_date)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" fontWeight="bold">
                        {getScoreDisplay(match)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={getStatusText(match.status)}
                        color={getStatusColor(match.status) as any}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}