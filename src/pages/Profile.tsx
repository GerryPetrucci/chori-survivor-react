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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Badge
} from '@mui/material';
import { 
  TrendingUp, 
  EmojiEvents, 
  Sports, 
  Settings,
  Brightness4,
  Language,
  AccessTime,
  Notifications,
  CameraAlt,
  PhotoCamera,
  Face
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { statsService, userProfilesService, storageService } from '../services/supabase';

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
  {value === index && <Box sx={{ pt: { xs: 1, sm: 3 }, width: '100%' }}>{children}</Box>}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>('');
  const [preferences, setPreferences] = useState({
    theme: 'light',
    timezone: 'America/Mexico_City',
    language: 'es',
    notifications: true,
    dateFormat: 'DD/MM/YYYY'
  });

  // Avatares predefinidos
  const predefinedAvatars = [
    '👤', '🏈', '🏆', '⭐', '🔥', '💪', 
    '🎯', '🚀', '⚡', '👑', '🦅', '🐻',
    '🐅', '🦁', '🐎', '🐺', '🦈', '🐉'
  ];

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
    
    // Cargar avatar desde el usuario autenticado
    if (user?.avatar_url) {
      setSelectedAvatar(user.avatar_url);
    } else {
      setSelectedAvatar(user?.username?.charAt(0).toUpperCase() || '👤');
    }
  }, [user]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleAvatarSelect = async (avatar: string) => {
    setSelectedAvatar(avatar);
    
    // Guardar emoji/predefinido directamente en la base de datos
    if (user?.id) {
      try {
        const { error } = await userProfilesService.updateProfile(user.id, {
          avatar_url: avatar
        });
        
        if (error) {
          console.error('Error updating avatar:', error);
        }
      } catch (err) {
        console.error('Error saving avatar:', err);
      }
    }
    
    setAvatarDialogOpen(false);
  };

  const handleCustomAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!user?.id) return;

      // Subir imagen a Supabase Storage
      const { data: uploadData, error: uploadError } = await storageService.uploadAvatar(user.id, file);
      
      if (uploadError) {
        alert(uploadError);
        return;
      }

      if (!uploadData) return;

      // Eliminar avatar anterior si existe y es del storage
      if (user.avatar_url && user.avatar_url.includes('profile_avatar')) {
        await storageService.deleteAvatar(user.avatar_url);
      }

      // Guardar URL en la base de datos
      const { error: updateError } = await userProfilesService.updateProfile(user.id, {
        avatar_url: uploadData.url
      });

      if (updateError) {
        console.error('Error updating avatar URL:', updateError);
        return;
      }

      // Actualizar estado local
      setSelectedAvatar(uploadData.url);
      setCustomAvatarUrl(uploadData.url);
      setAvatarDialogOpen(false);

    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Error al subir la imagen. Intenta de nuevo.');
    }
  };

  const getCurrentAvatar = () => {
    if (selectedAvatar) {
      return selectedAvatar;
    }
    return user?.username?.charAt(0).toUpperCase() || '👤';
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
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
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <IconButton
              size="small"
              onClick={() => setAvatarDialogOpen(true)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 28,
                height: 28,
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              }}
            >
              <CameraAlt sx={{ fontSize: 16 }} />
            </IconButton>
          }
        >
          <Box
            onClick={() => setAvatarDialogOpen(true)}
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }
            }}
          >
            <Avatar 
              sx={{ 
                width: 70, 
                height: 70, 
                bgcolor: selectedAvatar.startsWith('http') || selectedAvatar.length === 1 ? 'transparent' : 'rgba(255,255,255,0.2)',
                fontSize: selectedAvatar.length === 1 ? '2rem' : 'inherit',
              }}
              src={selectedAvatar.startsWith('http') ? selectedAvatar : undefined}
            >
              {!selectedAvatar.startsWith('http') ? getCurrentAvatar() : null}
            </Avatar>
          </Box>
        </Badge>
        <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>{user?.username || 'Perfil'}</Typography>
      </Box>
      <Paper sx={{ p: { xs: 1, sm: 3 }, mt: 3, width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                <Card sx={{ flex: '1 1 300px' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                      <EmojiEvents sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Estadísticas Generales</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
                      <Box sx={{ textAlign: 'center', flex: '1 1 100px', minWidth: 0 }}>
                        <Typography variant="h4" color="success.main">
                          {userStats.totalWins}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Victorias
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: '1 1 100px' }}>
                        <Typography variant="h4" color="error.main">
                          {userStats.totalLosses}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Derrotas
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: '1 1 100px' }}>
                        <Typography variant="h4" color="primary.main">
                          {userStats.winPercentage}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          % Efectividad
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: '1 1 100px' }}>
                        <Typography variant="h4" color="warning.main">
                          {userStats.bestStreak}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mejor Racha
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <Card sx={{ flex: '1 1 300px' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Sports sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Equipos Favoritos</Typography>
                    </Box>
                    {userStats.favoriteTeams.length > 0 ? (
                      userStats.favoriteTeams.map((team: any) => (
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
              </Box>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Por Temporada
                  </Typography>
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
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <TextField
                sx={{ flex: '1 1 250px' }}
                label="Nombre de Usuario"
                value={user?.username || ''}
                variant="outlined"
                helperText="Este es tu nombre de usuario único"
                InputProps={{ readOnly: true }}
              />
              <TextField
                sx={{ flex: '1 1 250px' }}
                label="Email"
                value={user?.email || ''}
                variant="outlined"
                helperText="Email asociado a tu cuenta"
                InputProps={{ readOnly: true }}
              />
              <TextField
                sx={{ flex: '1 1 250px' }}
                label="Tipo de Usuario"
                value={user?.user_type === 'admin' ? 'Administrador' : 'Usuario'}
                variant="outlined"
                InputProps={{ readOnly: true }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Cambiar Contraseña
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <TextField
                sx={{ flex: '1 1 200px' }}
                type="password"
                label="Contraseña Actual"
                variant="outlined"
              />
              <TextField
                sx={{ flex: '1 1 200px' }}
                type="password"
                label="Nueva Contraseña"
                variant="outlined"
              />
              <TextField
                sx={{ flex: '1 1 200px' }}
                type="password"
                label="Confirmar Contraseña"
                variant="outlined"
              />
            </Box>

            <Button
              variant="contained"
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

      {/* Modal de Selección de Avatar */}
      <Dialog
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Face sx={{ mr: 1 }} />
            Cambiar Avatar
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Avatares Predefinidos
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', 
            gap: 2, 
            mb: 3 
          }}>
            {predefinedAvatars.map((avatar, index) => (
              <Avatar
                key={index}
                sx={{
                  width: 60,
                  height: 60,
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  border: selectedAvatar === avatar ? '3px solid' : '2px solid transparent',
                  borderColor: selectedAvatar === avatar ? 'primary.main' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.light',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease',
                  justifySelf: 'center'
                }}
                onClick={() => handleAvatarSelect(avatar)}
              >
                {avatar}
              </Avatar>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Subir Imagen Personalizada
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
            >
              Seleccionar Imagen
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleCustomAvatarUpload}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              Formatos: JPG, PNG, GIF (máx. 5MB)
            </Typography>
          </Box>

          {customAvatarUrl && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" gutterBottom>
                Vista Previa:
              </Typography>
              <Avatar
                src={customAvatarUrl}
                sx={{ width: 80, height: 80, mx: 'auto' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setAvatarDialogOpen(false)}
            disabled={!selectedAvatar}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}