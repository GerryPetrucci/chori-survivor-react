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
import { supabase } from '../config/supabase';
import SuccessModal from '../components/ui/SuccessModal';
import ImageCropper from '../components/ui/ImageCropper';

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
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [originalFileName, setOriginalFileName] = useState<string>('');
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

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSuccessMessage('Tipo de archivo no válido. Usa JPG, PNG, GIF o WEBP.');
      setSuccessModalOpen(true);
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSuccessMessage('La imagen es muy grande. Máximo 5MB.');
      setSuccessModalOpen(true);
      return;
    }

    // Crear URL temporal para el cropper
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setOriginalFileName(file.name);
      setCropperOpen(true);
      setAvatarDialogOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      if (!user?.id) {
        setSuccessMessage('Error: No se pudo identificar el usuario.');
        setSuccessModalOpen(true);
        return;
      }

      console.log('Starting avatar upload for user:', user.id);

      // Verificar sesión activa
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        console.error('Session error:', sessionError);
        setSuccessMessage('No hay sesión activa. Por favor, cierra sesión y vuelve a iniciar sesión.');
        setSuccessModalOpen(true);
        setCropperOpen(false);
        return;
      }

      console.log('Session is valid, uploading avatar...');

      // Crear File desde el Blob
      const croppedFile = new File([croppedBlob], originalFileName || 'avatar.jpg', {
        type: 'image/jpeg'
      });

      // Subir imagen a Supabase Storage
      const { data: uploadData, error: uploadError } = await storageService.uploadAvatar(user.id, croppedFile);
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        setSuccessMessage(`Error al subir la imagen: ${uploadError}`);
        setSuccessModalOpen(true);
        setCropperOpen(false);
        return;
      }

      if (!uploadData) {
        setSuccessMessage('Error: No se recibió respuesta del servidor.');
        setSuccessModalOpen(true);
        setCropperOpen(false);
        return;
      }

      console.log('Upload successful:', uploadData);

      // Eliminar avatar anterior si existe y es del storage
      if (user.avatar_url && user.avatar_url.includes('profile_avatar')) {
        console.log('Deleting old avatar:', user.avatar_url);
        await storageService.deleteAvatar(user.avatar_url);
      }

      // Guardar URL en la base de datos
      const { error: updateError } = await userProfilesService.updateProfile(user.id, {
        avatar_url: uploadData.url
      });

      if (updateError) {
        console.error('Error updating avatar URL in database:', updateError);
        setSuccessMessage('Error al actualizar el perfil. Intenta de nuevo.');
        setSuccessModalOpen(true);
        setCropperOpen(false);
        return;
      }

      console.log('Avatar updated successfully in database');

      // Actualizar estado local
      setSelectedAvatar(uploadData.url);
      setCustomAvatarUrl(uploadData.url);
      setCropperOpen(false);
      
      // Mostrar modal de éxito
      setSuccessMessage('¡Tu foto de perfil se actualizó correctamente!');
      setSuccessModalOpen(true);

    } catch (err) {
      console.error('Unexpected error uploading avatar:', err);
      setSuccessMessage('Error inesperado al subir la imagen. Revisa la consola para más detalles.');
      setSuccessModalOpen(true);
      setCropperOpen(false);
    }
  };

  const getCurrentAvatar = () => {
    if (selectedAvatar) {
      return selectedAvatar;
    }
    return user?.username?.charAt(0).toUpperCase() || '👤';
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: 1200, 
      mx: 'auto',
      px: { xs: 1, sm: 2, md: 3 },
      py: { xs: 1, sm: 2 }
    }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: { xs: 2, sm: 3 },
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          width: '100%',
          boxSizing: 'border-box'
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
        <Typography 
          variant="h5" 
          sx={{ 
            mt: 2, 
            fontWeight: 'bold',
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            wordBreak: 'break-word'
          }}
        >
          {user?.username || 'Perfil'}
        </Typography>
      </Box>
      <Paper sx={{ 
        p: { xs: 1, sm: 2, md: 3 }, 
        mt: { xs: 2, sm: 3 }, 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            minHeight: { xs: 48, sm: 48 },
            '& .MuiTab-root': {
              minWidth: { xs: 60, sm: 120 },
              fontSize: { xs: '0.7rem', sm: '0.875rem' },
              padding: { xs: '6px 8px', sm: '12px 16px' }
            }
          }}
        >
          <Tab 
            icon={<TrendingUp sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />} 
            label="Estadísticas"
            sx={{ 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 0.25, sm: 0.5 }
            }}
          />
          <Tab 
            icon={<Settings sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />} 
            label="Configuración"
            sx={{ 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 0.25, sm: 0.5 }
            }}
          />
          <Tab 
            icon={<Brightness4 sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />} 
            label="Preferencias"
            sx={{ 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 0.25, sm: 0.5 }
            }}
          />
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
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: { xs: 1.5, sm: 2, md: 3 }, 
                mb: { xs: 2, sm: 3 } 
              }}>
                <Card sx={{ 
                  flex: { xs: '1 1 100%', md: '1 1 300px' },
                  minWidth: 0
                }}>
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

                <Card sx={{ 
                  flex: { xs: '1 1 100%', md: '1 1 300px' },
                  minWidth: 0
                }}>
                  <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 2 } }}>
                      <Sports sx={{ mr: 1, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                      <Typography 
                        variant="h6"
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        Equipos Favoritos
                      </Typography>
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
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: { xs: 1.5, sm: 2 }, 
              mb: { xs: 2, sm: 3 } 
            }}>
              <TextField
                sx={{ 
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 250px' },
                  minWidth: 0
                }}
                label="Nombre de Usuario"
                value={user?.username || ''}
                variant="outlined"
                helperText="Este es tu nombre de usuario único"
                InputProps={{ readOnly: true }}
                size="small"
              />
              <TextField
                sx={{ 
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 250px' },
                  minWidth: 0
                }}
                label="Email"
                value={user?.email || ''}
                variant="outlined"
                helperText="Email asociado a tu cuenta"
                InputProps={{ readOnly: true }}
                size="small"
              />
              <TextField
                sx={{ 
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 250px' },
                  minWidth: 0
                }}
                label="Tipo de Usuario"
                value={user?.user_type === 'admin' ? 'Administrador' : 'Usuario'}
                variant="outlined"
                InputProps={{ readOnly: true }}
                size="small"
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
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: '100%' },
            maxWidth: { xs: '400px', sm: '600px' }
          }
        }}
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
            gridTemplateColumns: { 
              xs: 'repeat(auto-fit, minmax(50px, 1fr))',
              sm: 'repeat(auto-fit, minmax(70px, 1fr))'
            }, 
            gap: { xs: 1, sm: 2 }, 
            mb: { xs: 2, sm: 3 }
          }}>
            {predefinedAvatars.map((avatar, index) => (
              <Avatar
                key={index}
                sx={{
                  width: { xs: 45, sm: 60 },
                  height: { xs: 45, sm: 60 },
                  cursor: 'pointer',
                  fontSize: { xs: '1.2rem', sm: '1.5rem' },
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

      {/* Modal de Editor de Imagen */}
      <ImageCropper
        open={cropperOpen}
        imageSrc={imageToCrop}
        onClose={() => {
          setCropperOpen(false);
          setAvatarDialogOpen(true);
        }}
        onCropComplete={handleCropComplete}
      />

      {/* Modal de Éxito */}
      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message={successMessage}
        title="¡Perfecto!"
      />
    </Box>
  );
}