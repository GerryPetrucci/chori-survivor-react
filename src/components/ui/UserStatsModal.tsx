import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Avatar,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { supabase } from '../../config/supabase';

interface UserStatsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  username?: string;
  avatarUrl?: string;
}

interface UserStats {
  username: string;
  avatar_url?: string;
  total_picks: number;
  correct_picks: number;
  incorrect_picks: number;
  pending_picks: number;
  total_entries: number;
  active_entries: number;
  eliminated_entries: number;
  last_chance_entries: number;
}

export default function UserStatsModal({ open, onClose, userId, username: initialUsername, avatarUrl: initialAvatarUrl }: UserStatsModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (open && userId) {
      loadUserStats();
    }
  }, [open, userId]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('username, full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      // Obtener todas las entradas del usuario
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('id, status')
        .eq('user_id', userId);

      if (entriesError) {
        throw new Error('Error al cargar las entradas del usuario');
      }

      if (!entries || entries.length === 0) {
        setStats({
          username: profile?.username || initialUsername || 'Usuario',
          avatar_url: profile?.avatar_url || initialAvatarUrl,
          total_picks: 0,
          correct_picks: 0,
          incorrect_picks: 0,
          pending_picks: 0,
          total_entries: 0,
          active_entries: 0,
          eliminated_entries: 0,
          last_chance_entries: 0
        });
        return;
      }

      // Contar entradas por status
      const activeEntries = entries.filter(e => e.status === 'alive').length;
      const lastChanceEntries = entries.filter(e => e.status === 'last_chance').length;
      const eliminatedEntries = entries.filter(e => e.status === 'eliminated').length;

      // Obtener todos los picks de todas las entradas del usuario
      const entryIds = entries.map(e => e.id);
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select('result')
        .in('entry_id', entryIds);

      if (picksError) {
        throw new Error('Error al cargar los picks del usuario');
      }

      // Contar picks por resultado
      const totalPicks = picks?.length || 0;
      const correctPicks = picks?.filter(p => p.result === 'W' || p.result === 'win').length || 0;
      const incorrectPicks = picks?.filter(p => p.result === 'L' || p.result === 'loss').length || 0;
      const pendingPicks = picks?.filter(p => !p.result || p.result === 'pending' || p.result === null).length || 0;

      setStats({
        username: profile?.username || initialUsername || 'Usuario',
        avatar_url: profile?.avatar_url || initialAvatarUrl,
        total_picks: totalPicks,
        correct_picks: correctPicks,
        incorrect_picks: incorrectPicks,
        pending_picks: pendingPicks,
        total_entries: entries.length,
        active_entries: activeEntries,
        eliminated_entries: eliminatedEntries,
        last_chance_entries: lastChanceEntries
      });

    } catch (err: any) {
      console.error('Error loading user stats:', err);
      setError(err.message || 'Error al cargar las estadísticas del usuario');
    } finally {
      setLoading(false);
    }
  };

  const getWinRate = () => {
    if (!stats || stats.total_picks === 0) return 0;
    return Math.round((stats.correct_picks / stats.total_picks) * 100);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: { xs: '95%', sm: 500 }
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 2
      }}>
        <Box component="span" fontWeight="bold">
          Estadísticas del Usuario
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : stats ? (
          <Box>
            {/* Perfil del Usuario */}
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Avatar
                src={stats.avatar_url || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  mb: 2,
                  border: '4px solid',
                  borderColor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {!stats.avatar_url && stats.username.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {stats.username}
              </Typography>
              <Chip 
                label={`${stats.total_entries} ${stats.total_entries === 1 ? 'Entrada' : 'Entradas'}`}
                color="primary"
                size="small"
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Estadísticas de Entradas */}
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              Estado de Entradas
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Card sx={{ flex: 1, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent sx={{ py: 1.5, px: 1 }}>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.active_entries}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Activas
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent sx={{ py: 1.5, px: 1 }}>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.last_chance_entries}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Last Chance
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                <CardContent sx={{ py: 1.5, px: 1 }}>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.eliminated_entries}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Eliminadas
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Estadísticas de Picks */}
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              Rendimiento de Picks
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Tasa de Aciertos
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {getWinRate()}%
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Card sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 120, bgcolor: 'grey.50' }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {stats.total_picks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Picks
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 120, bgcolor: 'grey.50' }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.correct_picks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Correctos
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 120, bgcolor: 'grey.50' }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.incorrect_picks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Incorrectos
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 120, bgcolor: 'grey.50' }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.pending_picks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendientes
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
