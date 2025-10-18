import { 
  Typography, 
  Box, 
  Paper, 
  Alert, 
  Card, 
  CardContent, 
  Chip, 
  Divider,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Tab,
  Tabs,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { 
  TrendingUp, 
  EmojiEvents, 
  Sports, 
  Settings,
  Brightness4,
  Language,
  AccessTime,
  Notifications 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { statsService } from '../services/supabase';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    theme: 'light',
    timezone: 'America/Mexico_City',
    language: 'es',
    notifications: true,
    dateFormat: 'DD/MM/YYYY'
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      if (user?.id) {
        setLoading(true);
        try {
          const { data, error } = await statsService.getUserStats(user.id);
          if (error) {
            console.error('Error fetching user stats:', error);
          } else {
            setUserStats(data);
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserStats();
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

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
        <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
          {user?.username?.charAt(0).toUpperCase() || '👤'}
        </Avatar>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          {user?.username || 'Usuario'}
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          {user?.user_type === 'admin' ? 'Administrador' : 'Miembro del Survivor Pool'}
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<TrendingUp />} label="Estadísticas" />
          <Tab icon={<Settings />} label="Configuración" />
          <Tab icon={<Brightness4 />} label="Preferencias" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                Cargando estadísticas...
              </Typography>
            </Box>
          ) : userStats ? (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <EmojiEvents sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">Estadísticas Generales</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="h4" color="success.main">
                            {userStats.totalWins}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Victorias
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h4" color="error.main">
                            {userStats.totalLosses}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Derrotas
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h4" color="primary.main">
                            {userStats.winPercentage}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            % Efectividad
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h4" color="warning.main">
                            {userStats.bestStreak}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Mejor Racha
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Sports sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">Equipos Favoritos</Typography>
                      </Box>
                      {userStats.favoriteTeams.length > 0 ? (
                        userStats.favoriteTeams.map((team: any, index: number) => (
                          <Box key={team.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip
                                label={team.abbreviation}
                                size="small"
                                sx={{ mr: 1, minWidth: 50 }}
                              />
                              <Typography variant="body2">{team.name}</Typography>
                            </Box>
                            <Chip
                              label={`${team.count}x`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No hay picks registrados aún
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Timeline sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">Por Temporada</Typography>
                      </Box>
                      {userStats.seasonStats.map((season: any) => (
                        <Box key={season.seasonId} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1">
                              Temporada {season.seasonYear}
                            </Typography>
                            <Chip
                              label={`${season.entries.length} entrada${season.entries.length > 1 ? 's' : ''}`}
                              size="small"
                              color="primary"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="body2">
                              <strong>Victorias:</strong> {season.totalWins}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Derrotas:</strong> {season.totalLosses}
                            </Typography>
                          </Box>
                          <Divider sx={{ mt: 1 }} />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Alert severity="info">
                No se encontraron estadísticas. ¡Comienza participando en una temporada!
              </Alert>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información de la Cuenta
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre de Usuario"
                  value={user?.username || ''}
                  variant="outlined"
                  helperText="Este es tu nombre de usuario único"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user?.email || ''}
                  variant="outlined"
                  helperText="Email asociado a tu cuenta"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tipo de Usuario"
                  value={user?.user_type === 'admin' ? 'Administrador' : 'Usuario'}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Cambiar Contraseña
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="password"
                  label="Contraseña Actual"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="password"
                  label="Nueva Contraseña"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirmar Contraseña"
                  variant="outlined"
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              sx={{ mt: 2 }}
              disabled
            >
              Cambiar Contraseña (Próximamente)
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preferencias de la Aplicación
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Brightness4 />
                </ListItemIcon>
                <ListItemText 
                  primary="Tema Oscuro" 
                  secondary="Cambiar entre tema claro y oscuro"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.theme === 'dark'}
                      onChange={(e) => handlePreferenceChange('theme', e.target.checked ? 'dark' : 'light')}
                    />
                  }
                  label=""
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText 
                  primary="Notificaciones" 
                  secondary="Recibir notificaciones de la app"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifications}
                      onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                    />
                  }
                  label=""
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <AccessTime />
                </ListItemIcon>
                <ListItemText primary="Zona Horaria" />
                <FormControl sx={{ minWidth: 200 }}>
                  <Select
                    value={preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                    size="small"
                  >
                    <MenuItem value="America/Mexico_City">México (CDMX)</MenuItem>
                    <MenuItem value="America/New_York">New York (EST)</MenuItem>
                    <MenuItem value="America/Los_Angeles">Los Angeles (PST)</MenuItem>
                  </Select>
                </FormControl>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <Language />
                </ListItemIcon>
                <ListItemText primary="Idioma" />
                <FormControl sx={{ minWidth: 200 }}>
                  <Select
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    size="small"
                  >
                    <MenuItem value="es">Español</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </ListItem>
            </List>

            <Button
              variant="contained"
              sx={{ mt: 2 }}
              disabled
            >
              Guardar Preferencias (Próximamente)
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}