import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Button,
  Popper,
  Fade,
  ClickAwayListener
} from '@mui/material';
import { supabase } from '../../config/supabase';

interface OddsData {
  id: number;
  match_id: number;
  home_team_id: number;
  away_team_id: number;
  spread: string;
  home_spread_odds: number;
  away_spread_odds: number;
  home_moneyline: number;
  away_moneyline: number;
  over_under: string;
  over_odds: number;
  under_odds: number;
  home_is_favorite: boolean;
  away_is_favorite: boolean;
  provider_name: string;
}

interface Team {
  id: number;
  name: string;
  city: string;
  abbreviation: string;
  logo_url?: string;
}

interface OddsTooltipProps {
  matchId: number;
  homeTeam: Team;
  awayTeam: Team;
}

const formatOdds = (odds: number): string => {
  if (odds > 0) return `+${odds}`;
  return odds.toString();
};

// Mapeo de abreviaciones a nombres de archivos de logos
const teamLogoMap: { [key: string]: string } = {
  'SF': '49ers',
  'CHI': 'bears',
  'CIN': 'bengals',
  'BUF': 'bills',
  'DEN': 'broncos',
  'CLE': 'browns',
  'TB': 'buccaneers',
  'ARI': 'cardinals',
  'LAC': 'chargers',
  'KC': 'chiefs',
  'IND': 'colts',
  'WAS': 'commanders',
  'DAL': 'cowboys',
  'MIA': 'dolphins',
  'PHI': 'eagles',
  'ATL': 'falcons',
  'NYG': 'giants',
  'JAX': 'jaguars',
  'NYJ': 'jets',
  'DET': 'lions',
  'GB': 'packers',
  'CAR': 'panthers',
  'NE': 'patriots',
  'LV': 'raiders',
  'LAR': 'rams',
  'BAL': 'ravens',
  'NO': 'saints',
  'SEA': 'seahawks',
  'PIT': 'steelers',
  'HOU': 'texans',
  'TEN': 'titans',
  'MIN': 'vikings'
};

const getTeamLogo = (logoUrl?: string, abbreviation?: string) => {
  // Si tenemos la abreviación del equipo, usar el mapeo para obtener el nombre correcto del archivo
  if (abbreviation && teamLogoMap[abbreviation]) {
    return `/assets/logos/${teamLogoMap[abbreviation]}_logo.png`;
  }
  
  // Si tenemos la abreviación pero no está en el mapeo, usar directamente la abreviación
  if (abbreviation) {
    return `/assets/logos/${abbreviation.toLowerCase()}_logo.png`;
  }
  
  // Si tenemos logo_url y es válida, usarla
  if (logoUrl && logoUrl.startsWith('http')) {
    return logoUrl;
  }
  
  // Si tenemos logo_url que empieza con /assets/, usarla directamente
  if (logoUrl && logoUrl.startsWith('/assets/')) {
    return logoUrl;
  }
  
  // Fallback final
  return '/assets/logos/nfl_logo.png';
};

export default function OddsTooltip({ matchId, homeTeam, awayTeam }: OddsTooltipProps) {
  const [odds, setOdds] = useState<OddsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen((previousOpen) => !previousOpen);
    if (!odds && !loading) {
      loadOdds();
    }
  };

  const handleClickAway = () => {
    setOpen(false);
  };

  const loadOdds = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: oddsError } = await supabase
        .from('weekly_odds')
        .select('*')
        .eq('match_id', matchId)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (oddsError) {
        console.error('Error loading odds:', oddsError);
        setError('No hay odds disponibles');
        return;
      }

      setOdds(data);
    } catch (err) {
      console.error('Error loading odds:', err);
      setError('Error al cargar odds');
    } finally {
      setLoading(false);
    }
  };

  const tooltipContent = () => {
    if (loading) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <CircularProgress size={20} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Cargando odds...
          </Typography>
        </Box>
      );
    }

    if (error || !odds) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {error || 'No hay odds disponibles'}
          </Typography>
        </Box>
      );
    }

    return (
      <Paper sx={{ p: 2, minWidth: 280, maxWidth: 350 }}>
        <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold' }}>
          Odds del Partido
        </Typography>
        
        {/* Header con equipos */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mb: 2 }}>
          {/* Away Team */}
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={getTeamLogo(awayTeam.logo_url, awayTeam.abbreviation)}
                alt={awayTeam.name}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.src = '/assets/logos/nfl_logo.png';
                }}
              />
              {odds.away_is_favorite && (
                <Chip
                  label="FAV"
                  size="small"
                  color="success"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.6rem',
                    height: 16
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
              {awayTeam.abbreviation}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @ {homeTeam.abbreviation}
            </Typography>
          </Box>

          <Typography variant="h6" color="text.secondary" sx={{ mx: 2 }}>
            vs
          </Typography>

          {/* Home Team */}
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={getTeamLogo(homeTeam.logo_url, homeTeam.abbreviation)}
                alt={homeTeam.name}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.src = '/assets/logos/nfl_logo.png';
                }}
              />
              {odds.home_is_favorite && (
                <Chip
                  label="FAV"
                  size="small"
                  color="success"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.6rem',
                    height: 16
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
              {homeTeam.abbreviation}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (Local)
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Odds Table */}
        <Box>
          {/* Spread */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" fontWeight="bold" sx={{ minWidth: 60, fontSize: '0.75rem' }}>
              Spread
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flex: 1, ml: 2 }}>
              <Typography variant="caption" sx={{ textAlign: 'center', flex: 1, fontSize: '0.7rem' }}>
                +{Math.abs(parseFloat(odds.spread))} ({formatOdds(odds.away_spread_odds)})
              </Typography>
              <Typography variant="caption" sx={{ textAlign: 'center', flex: 1, fontSize: '0.7rem' }}>
                {odds.spread} ({formatOdds(odds.home_spread_odds)})
              </Typography>
            </Box>
          </Box>

          {/* Moneyline */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" fontWeight="bold" sx={{ minWidth: 60, fontSize: '0.75rem' }}>
              Moneyline
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flex: 1, ml: 2 }}>
              <Typography variant="caption" sx={{ textAlign: 'center', flex: 1, fontSize: '0.7rem' }}>
                {formatOdds(odds.away_moneyline)}
              </Typography>
              <Typography variant="caption" sx={{ textAlign: 'center', flex: 1, fontSize: '0.7rem' }}>
                {formatOdds(odds.home_moneyline)}
              </Typography>
            </Box>
          </Box>

          {/* Over/Under */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" fontWeight="bold" sx={{ minWidth: 60, fontSize: '0.75rem' }}>
              Total
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', flex: 1, ml: 2, gap: 1 }}>
              <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
                O {odds.over_under} ({formatOdds(odds.over_odds)})
              </Typography>
              <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
                U {odds.over_under} ({formatOdds(odds.under_odds)})
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />
        
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
          📊 {odds.provider_name}
        </Typography>
      </Paper>
    );
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleClick}
          sx={{
            minWidth: 'auto',
            px: 1,
            py: 0.5,
            fontSize: '0.75rem',
            height: 24
          }}
        >
          odds
        </Button>
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="top"
          transition
          sx={{ zIndex: 1300 }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <div>{tooltipContent()}</div>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}