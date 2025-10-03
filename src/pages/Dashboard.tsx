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
} from '@mui/material';
import {
  Sports as SportsIcon,
  Leaderboard as LeaderboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { DashboardData } from '../types';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (user?.id) {
          // Fetch dashboard data from Supabase
          console.log('User ID:', user.id); // Debug log
          const { data, error } = await dashboardService.getUserStats(user.id);
          
          if (data && !error) {
            setDashboardData(data);
          } else if (error) {
            setError('Error al cargar el dashboard: ' + error.message);
            console.error('Dashboard service error:', error);
          } else {
            // Datos por defecto si no hay datos
            setDashboardData({
              entradas_activas: 0,
              victorias: 0,
              derrotas: 0,
              posicion_ranking: 0,
              semana_actual: 1,
              picks_recientes: []
            });
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
  }, []);

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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido, {user?.username}! Aquí tienes un resumen de tu pool de supervivencia.
      </Typography>

      <Stack spacing={3} sx={{ mt: 3 }}>
        {/* Stats Section */}
        <Box>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Estadísticas
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {dashboardData?.entradas_activas || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Entradas Activas
                </Typography>
              </CardContent>
            </Card>

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
                <Typography variant="h4" color="secondary.main" fontWeight="bold">
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
                color="primary"
                onClick={() => navigate('/picks')}
                startIcon={<SportsIcon />}
                size="large"
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
              <Typography color="text.secondary">
                Semana actual: {dashboardData.semana_actual || 'N/A'}
              </Typography>
            ) : (
              <Typography color="text.secondary">
                Cargando información del estado...
              </Typography>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              ¡Recuerda hacer tu pick antes de que comiencen los partidos de la semana!
            </Alert>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}