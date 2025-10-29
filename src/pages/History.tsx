import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import {
  SportsFootball,
  PersonAdd,
  Update,
  CheckCircle,
  Warning,
  Info,
  DateRange,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { notificationsService } from '../services/supabase';

interface ActivityGroup {
  date: string;
  activities: any[];
}

export default function HistoryPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    loadUserActivities();
  }, [user]);

  const loadUserActivities = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data: userActivities, error } = await notificationsService.getUserActivities(user.id);
      
      if (error) {
        console.error('Error loading user activities:', error);
        return;
      }
      
      setActivities(userActivities || []);
    } catch (error) {
      console.error('Error loading user activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'pick_created':
      case 'pick_updated':
        return <SportsFootball color="primary" />;
      case 'entry_created':
        return <PersonAdd color="success" />;
      case 'profile_updated':
        return <Update color="info" />;
      case 'achievement':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <Info color="action" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'pick_created':
      case 'pick_updated':
        return 'primary';
      case 'entry_created':
      case 'achievement':
        return 'success';
      case 'profile_updated':
        return 'info';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupActivitiesByDate = (activities: any[]): ActivityGroup[] => {
    const groups: { [key: string]: any[] } = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });

    return Object.entries(groups)
      .map(([date, activities]) => ({
        date,
        activities: activities.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const recentActivities = activities.slice(0, 10);
  const groupedActivities = groupActivitiesByDate(activities);
  
  const getActivityStats = () => {
    const stats = {
      total: activities.length,
      picks: activities.filter(a => a.activity_type?.includes('pick')).length,
      profile: activities.filter(a => a.activity_type === 'profile_updated').length,
      achievements: activities.filter(a => a.activity_type === 'achievement').length
    };
    return stats;
  };

  const stats = getActivityStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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
          📊 Historial de Actividades
        </Typography>
        
        <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 2 }}>
          Revisa el historial completo de todas tus actividades
        </Typography>

        <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold">{stats.total}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Total</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold">{stats.picks}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Picks</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold">{stats.achievements}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Logros</Typography>
          </Box>
        </Stack>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ mb: 3 }}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab 
          label="Recientes" 
          icon={<TrendingUp />} 
          iconPosition="start"
        />
        <Tab 
          label="Por Fecha" 
          icon={<DateRange />} 
          iconPosition="start"
        />
      </Tabs>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Actividades Recientes
          </Typography>
          
          {recentActivities.length === 0 ? (
            <Alert severity="info">
              No hay actividades recientes para mostrar.
            </Alert>
          ) : (
            <List>
              {recentActivities.map((activity, index) => (
                <ListItem key={index} divider={index < recentActivities.length - 1}>
                  <ListItemIcon>
                    {getActivityIcon(activity.activity_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.description}
                    secondary={
                      <>
                        <Chip
                          label={activity.activity_type?.replace('_', ' ') || 'Actividad'}
                          size="small"
                          color={getActivityColor(activity.activity_type) as any}
                          variant="outlined"
                          sx={{ mr: 1, mt: 0.5 }}
                        />
                        <Typography component="span" variant="caption" color="text.secondary">
                          {formatDate(activity.created_at)} a las {formatTime(activity.created_at)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {tabValue === 1 && (
        <Box>
          {groupedActivities.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Alert severity="info">
                No hay actividades para mostrar.
              </Alert>
            </Paper>
          ) : (
            groupedActivities.map((group, groupIndex) => (
              <Card key={groupIndex} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'primary.main',
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}>
                    {formatDate(group.date)}
                  </Typography>
                  
                  <List dense>
                    {group.activities.map((activity, activityIndex) => (
                      <ListItem 
                        key={activityIndex} 
                        divider={activityIndex < group.activities.length - 1}
                        sx={{ py: 1 }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getActivityIcon(activity.activity_type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.description}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={activity.activity_type?.replace('_', ' ') || 'Actividad'}
                                size="small"
                                color={getActivityColor(activity.activity_type) as any}
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatTime(activity.created_at)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}