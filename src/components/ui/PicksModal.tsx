import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Radio,
  FormControlLabel,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Sports as SportsIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { matchesService, picksService, seasonsService } from '../../services/supabase';
import PickSuccessModal from './PickSuccessModal';
import ConfirmPickChangeModal from './ConfirmPickChangeModal';
import OddsTooltip from './OddsTooltip';

interface PicksModalProps {
  open: boolean;
  onClose: () => void;
  entryId: number | null;
  entryName?: string;
}

interface Match {
  id: number;
  home_team_id: number;
  away_team_id: number;
  week: number;
  game_date: string;
  status: string;
  home_team?: {
    id: number;
    name: string;
    city: string;
    abbreviation: string;
    logo_url: string;
  };
  away_team?: {
    id: number;
    name: string;
    city: string;
    abbreviation: string;
    logo_url: string;
  };
}

interface ExistingPick {
  id: number;
  match_id: number;
  selected_team_id: number;
  week: number;
  selected_team?: {
    id: number;
    name: string;
    city: string;
    abbreviation: string;
    logo_url: string;
  };
}

export default function PicksModal({ open, onClose, entryId, entryName }: PicksModalProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [usedTeams, setUsedTeams] = useState<number[]>([]);
  const [existingPick, setExistingPick] = useState<ExistingPick | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{ week: number; team: any } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{ currentTeam: any; newTeam: any } | null>(null);

  useEffect(() => {
    if (open && entryId) {
      loadInitialData();
    }
  }, [open, entryId]);

  useEffect(() => {
    if (currentSeason && selectedWeek) {
      loadWeekData();
    }
  }, [selectedWeek, currentSeason]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener temporada actual
      const { data: season, error: seasonError } = await seasonsService.getCurrent();
      if (seasonError || !season) {
        throw new Error('No se pudo obtener la temporada actual');
      }

      setCurrentSeason(season);
      setSelectedWeek(season.current_week);

      // Generar semanas disponibles (1 a 18 para NFL)
      const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
      setAvailableWeeks(weeks);

      // Obtener equipos ya utilizados por la entrada
      const { data: usedTeamsData, error: usedTeamsError } = await picksService.getUsedTeams(entryId!, season.id);
      if (usedTeamsError) {
        console.error('Error al cargar equipos utilizados:', usedTeamsError);
      }

      setUsedTeams(usedTeamsData || []);

    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos iniciales');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWeekData = async () => {
    if (!currentSeason || !entryId) return;

    try {
      setLoading(true);
      setError(null);

      // Limpiar selecciones previas
      setSelectedMatch(null);
      setSelectedTeam(null);
      setExistingPick(null);

      // Obtener partidos de la semana seleccionada
      const { data: matchesData, error: matchesError } = await matchesService.getByWeek(selectedWeek, currentSeason.id);
      if (matchesError) {
        throw new Error('Error al cargar los partidos');
      }

      setMatches(matchesData || []);

      // Verificar si ya existe un pick para esta semana
      const { data: existingPickData } = await picksService.getEntryPickForWeek(entryId, selectedWeek, currentSeason.id);
      
      if (existingPickData) {
        setExistingPick(existingPickData);
        setSelectedMatch(existingPickData.match_id);
        setSelectedTeam(existingPickData.selected_team_id);
      }

    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de la semana');
      console.error('Error loading week data:', err);
    } finally {
      setLoading(false);
    }
  };


  const isGameStarted = (gameDate: string) => {
    const gameTime = new Date(gameDate);
    const now = new Date();
    return now >= gameTime;
  };

  const canSelectTeam = (teamId: number, match: Match) => {
    // No se puede seleccionar si el equipo ya fue utilizado
    if (usedTeams.includes(teamId)) {
      return false;
    }

    // No se puede seleccionar si el juego ya comenzó
    if (isGameStarted(match.game_date)) {
      return false;
    }

    // Si hay un pick existente para esta semana y el partido ya comenzó, no permitir cambios
    if (existingPick && existingPick.match_id === match.id && isGameStarted(match.game_date)) {
      return false;
    }

    return true;
  };

  const handleTeamSelection = (matchId: number, teamId: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (!canSelectTeam(teamId, match)) {
      return;
    }

    // Si hay un pick existente y el juego ya comenzó, no permitir cambios
    if (existingPick && isGameStarted(match.game_date)) {
      setError('No puedes cambiar tu selección porque el partido ya ha comenzado');
      return;
    }

    setSelectedMatch(matchId);
    setSelectedTeam(teamId);
    setError(null);
  };

  const handleConfirmPickChange = async () => {
    if (!selectedMatch || !selectedTeam || !entryId || !currentSeason || !existingPick) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setShowConfirmModal(false);

      // Actualizar pick existente
      const result = await picksService.update(existingPick.id, selectedMatch, selectedTeam);

      if (result.error) {
        throw new Error(result.error.message || 'Error al actualizar el pick');
      }

      const selectedMatchData = matches.find(m => m.id === selectedMatch);
      const selectedTeamData = selectedMatchData?.home_team_id === selectedTeam 
        ? selectedMatchData?.home_team 
        : selectedMatchData?.away_team;

      // Mostrar modal de éxito
      setSuccessData({
        week: selectedWeek,
        team: selectedTeamData
      });
      setShowSuccessModal(true);

      // Cerrar el modal principal después de un breve delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Error al actualizar el pick');
      console.error('Error updating pick:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePick = async () => {
    if (!selectedMatch || !selectedTeam || !entryId || !currentSeason) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Si hay un pick existente, verificar si el partido original ya comenzó
      if (existingPick) {
        const existingMatch = matches.find(m => m.id === existingPick.match_id);
        if (existingMatch && isGameStarted(existingMatch.game_date)) {
          throw new Error('No puedes cambiar tu pick porque el partido ya ha comenzado o terminado');
        }
      }

      const selectedMatchData = matches.find(m => m.id === selectedMatch);
      if (!selectedMatchData) {
        throw new Error('Partido no encontrado');
      }

      // Verificar nuevamente si el juego ya comenzó
      if (isGameStarted(selectedMatchData.game_date)) {
        throw new Error('No puedes seleccionar este equipo porque el partido ya ha comenzado');
      }

      let result;
      const selectedTeamData = selectedMatchData.home_team_id === selectedTeam 
        ? selectedMatchData.home_team 
        : selectedMatchData.away_team;

      if (existingPick) {
        // Si hay un pick existente, mostrar modal de confirmación
        setConfirmData({
          currentTeam: existingPick.selected_team,
          newTeam: selectedTeamData
        });
        setShowConfirmModal(true);
        setLoading(false);
        return;
      } else {
        // Crear nuevo pick
        result = await picksService.create(
          entryId,
          selectedMatch,
          selectedTeam,
          selectedWeek,
          currentSeason.id
        );
      }

      if (result.error) {
        throw new Error(result.error.message || 'Error al guardar el pick');
      }

      // Mostrar modal de éxito
      setSuccessData({
        week: selectedWeek,
        team: selectedTeamData
      });
      setShowSuccessModal(true);

      // Cerrar el modal principal después de un breve delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Error al guardar el pick');
      console.error('Error saving pick:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamLogo = (logoUrl: string | undefined) => {
    if (!logoUrl) return '/assets/logos/nfl_logo.png';
    return logoUrl.startsWith('/assets/') ? logoUrl : `/assets${logoUrl}`;
  };

  if (loading && matches.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress size={60} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
            boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,255,255,0.3)'
          }
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <SportsIcon sx={{ color: 'white' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                Hacer Pick
              </Typography>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                Entrada: {entryName}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 1, sm: 2, md: 3 }, maxWidth: '100%', overflowX: 'hidden' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {existingPick && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Ya tienes un pick para esta semana. Puedes cambiarlo si el partido no ha comenzado.
            </Alert>
          )}

          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Typography variant="h6">
              Selecciona la semana:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Semana</InputLabel>
              <Select
                value={selectedWeek}
                label="Semana"
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
              >
                {availableWeeks.map((week) => (
                  <MenuItem key={week} value={week}>
                    Semana {week}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Typography variant="h6" gutterBottom>
            Partidos de la Semana {selectedWeek}
          </Typography>

          <Box sx={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'auto' }}>
            {matches.map((match) => (
              <Card key={match.id} sx={{ mb: 2, border: selectedMatch === match.id ? 2 : 1, borderColor: selectedMatch === match.id ? 'primary.main' : 'divider', cursor: 'pointer', minWidth: { xs: '100%', sm: 'auto' } }}>
                <CardContent sx={{ py: 2 }}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center" 
                    gap={{ xs: 0, sm: 2, md: 3 }} 
                    flexDirection={{ xs: 'row', sm: 'row' }}
                    flexWrap={{ xs: 'wrap', md: 'wrap' }}
                  >
                    {/* Away Team: círculo, logo, abrev */}
                    <Box display="flex" alignItems="center" gap={1}>
                      <FormControlLabel
                        value={match.away_team_id}
                        control={
                          <Radio 
                            checked={selectedTeam === match.away_team_id}
                            onChange={() => handleTeamSelection(match.id, match.away_team_id)}
                            disabled={!canSelectTeam(match.away_team_id, match) || loading}
                            size="small"
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                      <img
                        src={getTeamLogo(match.away_team?.logo_url)}
                        alt={match.away_team?.name}
                        style={{ 
                          width: 28, 
                          height: 28, 
                          objectFit: 'contain',
                          opacity: canSelectTeam(match.away_team_id, match) ? 1 : 0.4,
                          filter: canSelectTeam(match.away_team_id, match) ? 'none' : 'grayscale(100%)'
                        }}
                      />
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        sx={{ minWidth: 32, textAlign: 'center', fontSize: '0.75rem', display: { xs: 'none', sm: 'block' } }}
                      >
                        {match.away_team?.abbreviation}
                      </Typography>
                      {usedTeams.includes(match.away_team_id) && (
                        <Chip label="Usado" size="small" color="error" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                      )}
                    </Box>
                    {/* @ */}
                    <Typography variant="h6" color="text.secondary" sx={{ my: { xs: 0.5, sm: 0 } }}>
                      @
                    </Typography>
                    {/* Home Team: abrev, logo, círculo */}
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        sx={{ minWidth: 32, textAlign: 'center', fontSize: '0.75rem', display: { xs: 'none', sm: 'block' } }}
                      >
                        {match.home_team?.abbreviation}
                      </Typography>
                      <img
                        src={getTeamLogo(match.home_team?.logo_url)}
                        alt={match.home_team?.name}
                        style={{ 
                          width: 28, 
                          height: 28, 
                          objectFit: 'contain',
                          opacity: canSelectTeam(match.home_team_id, match) ? 1 : 0.4,
                          filter: canSelectTeam(match.home_team_id, match) ? 'none' : 'grayscale(100%)'
                        }}
                      />
                      <FormControlLabel
                        value={match.home_team_id}
                        control={
                          <Radio 
                            checked={selectedTeam === match.home_team_id}
                            onChange={() => handleTeamSelection(match.id, match.home_team_id)}
                            disabled={!canSelectTeam(match.home_team_id, match) || loading}
                            size="small"
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                      {usedTeams.includes(match.home_team_id) && (
                        <Chip label="Usado" size="small" color="error" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                      )}
                    </Box>
                    {/* Fecha y Odds en columna en xs */}
                    <Box 
                      display="flex" 
                      flexDirection="column" 
                      alignItems="center" 
                      sx={{ minWidth: 100, mt: { xs: 1, sm: 0 } }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                        {new Date(match.game_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                      <OddsTooltip
                        matchId={match.id}
                        homeTeam={match.home_team!}
                        awayTeam={match.away_team!}
                      />
                    </Box>
                  </Box>
                  {isGameStarted(match.game_date) && (
                    <Box mt={1} display="flex" justifyContent="center">
                      <Chip label="Partido iniciado" size="small" color="warning" />
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSavePick}
            variant="contained"
            disabled={!selectedTeam || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
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
            {loading ? 'Guardando...' : (existingPick ? 'Actualizar Pick' : 'Guardar Pick')}
          </Button>
        </DialogActions>
      </Dialog>

      <PickSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        week={successData?.week || 0}
        team={successData?.team}
      />

      <ConfirmPickChangeModal
        open={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setLoading(false);
        }}
        onConfirm={handleConfirmPickChange}
        week={selectedWeek}
        currentTeam={confirmData?.currentTeam}
        newTeam={confirmData?.newTeam}
      />
    </>
  );
}