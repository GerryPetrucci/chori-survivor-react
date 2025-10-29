import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  People as PeopleIcon,
  PersonOff as PersonOffIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Token as TokenIcon,
  TrendingUp as TrendingUpIcon,
  Sports as SportsIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import TokenGeneratorModal from '../../components/admin/TokenGeneratorModal';

interface AdminStats {
  totalUsers: number;
  activeEntries: number;
  eliminatedEntries: number;
  usersWithoutPicks: number;
  currentWeek: number;
  totalMatches: number;
  pendingMatches: number;
  completedMatches: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      
      // Obtener temporada activa primero
      const { data: seasons } = await supabase
        .from('seasons')
        .select('id, current_week')
        .eq('is_active', true)
        .single();

      const seasonId = seasons?.id;

      if (!seasonId) {
        throw new Error('No active season found');
      }

      // Obtener estadísticas básicas
      const { data: users } = await supabase
        .from('user_profiles')
        .select('*');

      const { data: entries } = await supabase
        .from('entries')
        .select('*')
        .eq('season_id', seasonId);

      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('season_id', seasonId);

      const currentWeek = seasons?.current_week || 5;
      
      // Calcular entradas sin picks en la semana actual
      const activeEntriesList = entries?.filter((e: any) => e.is_active) || [];
      const activeEntryIds = activeEntriesList.map((e: any) => e.id);
      
      // Obtener picks de la semana actual
      const { data: currentWeekPicks } = await supabase
        .from('picks')
        .select('entry_id')
        .eq('season_id', seasonId)
        .eq('week', currentWeek);
      
      const entriesWithPicks = new Set(currentWeekPicks?.map((p: any) => p.entry_id) || []);
      const entriesWithoutPicks = activeEntryIds.filter(id => !entriesWithPicks.has(id));
      
      setStats({
        totalUsers: users?.length || 0,
        activeEntries: activeEntriesList.length,
        eliminatedEntries: entries?.filter((e: any) => !e.is_active).length || 0,
        usersWithoutPicks: entriesWithoutPicks.length,
        currentWeek: currentWeek,
        totalMatches: matches?.length || 0,
        pendingMatches: matches?.filter((m: any) => m.status === 'scheduled' || m.status === 'in_progress').length || 0,
        completedMatches: matches?.filter((m: any) => m.status === 'completed').length || 0
      });

    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = () => {
    setTokenModalOpen(true);
  };

  const handleCloseTokenModal = () => {
    setTokenModalOpen(false);
    // Recargar stats después de generar token
    loadAdminStats();
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Panel de Administración
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  const survivalRate = stats && (stats.activeEntries + stats.eliminatedEntries) > 0 
    ? Math.round((stats.activeEntries / (stats.activeEntries + stats.eliminatedEntries)) * 100)
    : 0;

  // Determinar color de supervivencia
  const getSurvivalColor = () => {
    if (survivalRate >= 70) return 'success.main';
    if (survivalRate >= 40) return 'warning.main';
    return 'error.main';
  };

  return (
    <Box>
      {/* Header con gradiente */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white', 
        p: 3, 
        borderRadius: 2, 
        mb: 3,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
            🛠️ Panel de Administración
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Semana {stats?.currentWeek} - Temporada 2025 NFL
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<TokenIcon />}
          onClick={handleGenerateToken}
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            '&:hover': { 
              bgcolor: 'rgba(255,255,255,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }
          }}
        >
          Generar Token
        </Button>
      </Box>

      {/* KPIs Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3, mb: 4 }}>
        <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PeopleIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Total Usuarios</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {stats?.totalUsers}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Registrados en el sistema
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircleIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Entradas Vivas</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {stats?.activeEntries}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Aún en competencia
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonOffIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Entradas Eliminadas</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {stats?.eliminatedEntries}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Fuera de competencia
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WarningIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Sin Picks</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {stats?.usersWithoutPicks}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Semana {stats?.currentWeek}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Segunda fila de KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SportsIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">Partidos Totales</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {stats?.totalMatches}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip 
                size="small" 
                label={`${stats?.completedMatches} Completados`}
                color="success"
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`${stats?.pendingMatches} Pendientes`}
                color="warning"
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Semana Actual</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {stats?.currentWeek}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              de 18 semanas totales
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon sx={{ mr: 1, color: getSurvivalColor() }} />
              <Typography variant="h6">Tasa de Supervivencia</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color={getSurvivalColor()}>
              {survivalRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats?.activeEntries} de {stats && (stats.activeEntries + stats.eliminatedEntries)} entradas vivas
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Mensaje de éxito */}
      <Alert severity="info" icon={false} sx={{ mt: 2 }}>
        📊 Panel actualizado • Semana {stats?.currentWeek} • {stats?.activeEntries} entradas activas de {stats && (stats.activeEntries + stats.eliminatedEntries)} totales
      </Alert>

      {/* Modal de generación de tokens */}
      <TokenGeneratorModal 
        open={tokenModalOpen} 
        onClose={handleCloseTokenModal} 
      />
    </Box>
  );
}