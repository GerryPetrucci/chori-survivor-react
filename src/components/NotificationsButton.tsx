import { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Button,
  Chip
} from '@mui/material';
import {
  Notifications,
  SportsFootball,
  PersonAdd,
  Update,
  CheckCircle,
  Warning,
  Info,
  MarkEmailRead
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { notificationsService } from '../services/supabase';

interface Notification {
  id: number;
  activity_type: string;
  title: string;
  description: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'pick_created':
    case 'pick_updated':
      return <SportsFootball fontSize="small" />;
    case 'entry_created':
      return <PersonAdd fontSize="small" />;
    case 'profile_updated':
      return <Update fontSize="small" />;
    case 'achievement':
      return <CheckCircle fontSize="small" color="success" />;
    case 'warning':
      return <Warning fontSize="small" color="warning" />;
    default:
      return <Info fontSize="small" />;
  }
};

const getActivityColor = (activityType: string) => {
  switch (activityType) {
    case 'pick_created':
    case 'pick_updated':
      return 'primary';
    case 'entry_created':
      return 'secondary';
    case 'achievement':
      return 'success';
    case 'warning':
      return 'warning';
    default:
      return 'default';
  }
};

export default function NotificationsButton() {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data: unreadData } = await notificationsService.getUnreadNotifications(user.id);
      const { count } = await notificationsService.getUnreadCount(user.id);
      
      setNotifications(unreadData || []);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Fetch every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleClick = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    
    // Auto-mark all notifications as read when opening the menu
    if (unreadCount > 0 && user?.id) {
      try {
        await notificationsService.markAllAsRead(user.id);
        setUnreadCount(0);
      } catch (error) {
        console.error('Error auto-marking notifications as read:', error);
      }
    }
    
    // Fetch recent activities (both read and unread) for the menu
    if (user?.id) {
      setLoading(true);
      try {
        const { data: recentActivities } = await notificationsService.getUserActivities(user.id, 10);
        setNotifications(recentActivities || []);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await notificationsService.markAllAsRead(user.id);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const formatNotificationTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    // Para períodos más largos, mostrar la fecha actual
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? '2-digit' : undefined
    });
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ 
          mr: 1,
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Badge 
          badgeContent={unreadCount > 0 ? unreadCount : undefined} 
          color="error"
          variant="dot"
          invisible={unreadCount === 0}
        >
          <Notifications />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: 350,
            mt: 1
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Actividad Reciente
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<MarkEmailRead />}
                onClick={handleMarkAllAsRead}
              >
                Marcar todo
              </Button>
            )}
          </Box>
          {unreadCount > 0 ? (
            <Typography variant="body2" color="text.secondary">
              {unreadCount} nueva{unreadCount > 1 ? 's' : ''} • Marcadas como leídas al abrir
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Todas las notificaciones han sido leídas
            </Typography>
          )}
        </Box>

        {loading ? (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              Cargando...
            </Typography>
          </MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No hay actividad reciente
              </Typography>
            </Box>
          </MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <MenuItem 
              key={notification.id} 
              sx={{ 
                py: 1.5,
                opacity: notification.is_read ? 0.7 : 1,
                backgroundColor: notification.is_read ? 'transparent' : 'rgba(25, 118, 210, 0.04)'
              }}
            >
              <ListItemIcon>
                {getActivityIcon(notification.activity_type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {notification.title}
                    </Typography>
                    <Chip
                      label={formatNotificationTime(notification.created_at)}
                      size="small"
                      color={getActivityColor(notification.activity_type) as any}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {notification.description.length > 60 
                      ? notification.description.substring(0, 60) + '...'
                      : notification.description
                    }
                  </Typography>
                }
              />
            </MenuItem>
          ))
        )}

        {notifications.length > 0 && (
          <>
            <Divider />
            <MenuItem onClick={handleClose}>
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="body2" color="primary">
                  Ver historial completo
                </Typography>
              </Box>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}