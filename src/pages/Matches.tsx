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
import { seasonsService, teamsService } from '../services/supabase';
import { supabase } from '../config/supabase';
import OddsTooltip from '../components/ui/OddsTooltip';
import { teamRecordsService } from '../services/supabase';

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
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [availableWeeks] = useState<number[]>(Array.from({ length: 18 }, (_, i) => i + 1));
  const [teamRecords, setTeamRecords] = useState<Record<number, { wins: number; losses: number; ties: number }> | null>(null);

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
    loadAllTeams();
  }, []);

  // Cargar todos los equipos
  const loadAllTeams = async () => {
    const { data, error } = await teamsService.getAll();
    if (!error && data) setAllTeams(data);
  };
  // Equipos en bye (no juegan esta semana)
  const byeTeamIds = allTeams.length > 0
    ? allTeams.map(t => t.id).filter(
        id => !matches.some(m => m.home_team_id === id || m.away_team_id === id)
      )
    : [];
  const byeTeams = allTeams.filter(t => byeTeamIds.includes(t.id));

  // Cargar partidos cuando cambia la semana
  useEffect(() => {
    if (currentSeason) {
      loadMatches();
      loadTeamRecords();
    }
  }, [selectedWeek, currentSeason]);

  const loadTeamRecords = async () => {
    if (!currentSeason) return;
    try {
      const { data, error } = await teamRecordsService.getRecordsByWeek(currentSeason.year, selectedWeek);
      if (error) {
        setTeamRecords(null);
        return;
      }
      // Map by team_id for quick lookup
      const recordsMap: Record<number, { wins: number; losses: number; ties: number }> = {};
      for (const rec of data) {
        recordsMap[rec.team_id] = {
          wins: rec.wins,
          losses: rec.losses,
          ties: rec.ties
        };
      }
      setTeamRecords(recordsMap);
    } catch (err) {
      setTeamRecords(null);
    }
  };

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
      return `${match.away_score} - ${match.home_score}`;
    } else if (match.status === 'in_progress' && match.home_score !== null && match.away_score !== null) {
      return `${match.away_score} - ${match.home_score}`;
    } else {
      return '–';
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
        {/* Bloque de equipos en BYE debajo del subtítulo */}
        {byeTeams.length > 0 && (
          <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white', minWidth: 40 }}>Bye:</Typography>
            {byeTeams.map(team => (
              <Box key={team.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <img
                  src={getTeamLogo(team.name, team.city)}
                  alt={team.name}
                  style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4, border: '1px solid #eee', background: '#fff' }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'white', ml: 0.5 }}>{team.abbreviation}</Typography>
              </Box>
            ))}
          </Box>
        )}
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
            >
              {availableWeeks.map((week) => (
                <MenuItem key={week} value={week}>
                  Semana {week} {currentSeason?.current_week === week ? '(Actual)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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
                  <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Fecha y Hora</strong></TableCell>
                  <TableCell align="center"><strong>Resultado</strong></TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Estado</strong></TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Odds</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.map((match) => (
                    <TableRow key={match.id} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                        {/* Away Team Logo + Record */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box
                            component="img"
                            src={getTeamLogo(match.away_team?.name || '', match.away_team?.city || '')}
                            alt={`${match.away_team?.city} ${match.away_team?.name}`}
                            sx={{
                              width: { xs: 24, sm: 28 },
                              height: { xs: 24, sm: 28 },
                              objectFit: 'contain',
                              borderRadius: 1,
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}
                          />
                          {teamRecords && match.away_team?.id && teamRecords[match.away_team.id] && (
                            <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: 'text.secondary', mt: 0.2, letterSpacing: 0.2 }}>
                              {`${teamRecords[match.away_team.id].wins}-${teamRecords[match.away_team.id].losses}`}
                              {teamRecords[match.away_team.id].ties > 0 ? `-${teamRecords[match.away_team.id].ties}` : ''}
                            </Typography>
                          )}
                        </Box>
                        {/* Away Team Abbreviation - oculto en xs */}
                        <Typography variant="body2" fontWeight="bold" sx={{ minWidth: { xs: 0, sm: 35 }, textAlign: 'center', fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'block' } }}>
                          {match.away_team?.abbreviation || 'TBD'}
                        </Typography>
                        
                        {/* @ Separator */}
                        <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mx: { xs: 0.5, sm: 0.5 } }}>
                          @
                        </Typography>
                        
                        {/* Home Team Abbreviation - oculto en xs */}
                        <Typography variant="body2" fontWeight="bold" sx={{ minWidth: { xs: 0, sm: 35 }, textAlign: 'center', fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'block' } }}>
                          {match.home_team?.abbreviation || 'TBD'}
                        </Typography>
                        {/* Home Team Logo + Record */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box
                            component="img"
                            src={getTeamLogo(match.home_team?.name || '', match.home_team?.city || '')}
                            alt={`${match.home_team?.city} ${match.home_team?.name}`}
                            sx={{
                              width: { xs: 24, sm: 28 },
                              height: { xs: 24, sm: 28 },
                              objectFit: 'contain',
                              borderRadius: 1,
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}
                          />
                          {teamRecords && match.home_team?.id && teamRecords[match.home_team.id] && (
                            <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: 'text.secondary', mt: 0.2, letterSpacing: 0.2 }}>
                              {`${teamRecords[match.home_team.id].wins}-${teamRecords[match.home_team.id].losses}`}
                              {teamRecords[match.home_team.id].ties > 0 ? `-${teamRecords[match.home_team.id].ties}` : ''}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    {/* Fecha y Hora en columna separada para md+ */}
                    <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                        {formatDate(match.game_date)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'top', px: { xs: 0.5, sm: 2 } }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                          {getScoreDisplay(match)}
                        </Typography>
                        {/* Fecha y Odds en XS debajo del marcador */}
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mt: 0.5, width: '100%' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                            {formatDate(match.game_date)}
                          </Typography>
                          <Box sx={{ width: '100%', display: { xs: 'flex', sm: 'none' }, justifyContent: 'center' }}>
                            <OddsTooltip
                              matchId={match.id}
                              homeTeam={match.home_team!}
                              awayTeam={match.away_team!}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Chip 
                        label={getStatusText(match.status)}
                        color={getStatusColor(match.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <OddsTooltip
                        matchId={match.id}
                        homeTeam={match.home_team!}
                        awayTeam={match.away_team!}
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