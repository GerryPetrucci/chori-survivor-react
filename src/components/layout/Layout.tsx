import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Sports as SportsIcon,
  CalendarMonth as CalendarIcon,
  Leaderboard as LeaderboardIcon,
  Person as PersonIcon,
  Gavel as RulesIcon,
  History as HistoryIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationsButton from '../NotificationsButton';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { text: 'Hacer Picks', path: '/picks', icon: <SportsIcon /> },
  { text: 'Partidos', path: '/matches', icon: <CalendarIcon /> },
  { text: 'Tendencias', path: '/trends', icon: <TrendingIcon /> },
  { text: 'Ranking', path: '/ranking', icon: <LeaderboardIcon /> },
  { text: 'Perfil', path: '/profile', icon: <PersonIcon /> },
  { text: 'Reglas', path: '/rules', icon: <RulesIcon /> },
  { text: 'Historial', path: '/history', icon: <HistoryIcon /> },
];

const adminMenuItems = [
  { text: 'Partidos', path: '/matches', icon: <CalendarIcon /> },
  { text: 'Tendencias', path: '/trends', icon: <TrendingIcon /> },
  { text: 'Ranking', path: '/ranking', icon: <LeaderboardIcon /> },
  { text: 'Perfil', path: '/profile', icon: <PersonIcon /> },
  { text: 'Reglas', path: '/rules', icon: <RulesIcon /> },
  { text: 'Historial', path: '/history', icon: <HistoryIcon /> },
];

const adminItems = [
  { text: 'Admin Panel', path: '/admin', icon: <AdminIcon /> },
  { text: 'Show Picks', path: '/admin/show-picks', icon: <SportsIcon /> },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const drawer = (
    <Box sx={{ 
      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
      height: '100%',
      color: 'white'
    }}>
      <Toolbar sx={{ 
        flexDirection: 'column', 
        py: 3,
        borderBottom: '1px solid rgba(255,255,255,0.15)'
      }}>
        <Box
          component="img"
          src="/assets/logos/diablo_survivor.png"
          alt="Diablo Survivor Logo"
          sx={{
            height: "50%",
            width: "50%",
            mb: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)'
            }
          }}
        />
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          fontWeight="bold" 
          textAlign="center"
          sx={{
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            fontSize: '1.1rem'
          }}
        >
          Chori Survivor
        </Typography>
      </Toolbar>
      
      <List sx={{ px: 1, pt: 2 }}>
        {(user?.user_type === 'admin' ? adminMenuItems : menuItems).map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                backdropFilter: isActive(item.path) ? 'blur(10px)' : 'none',
                border: isActive(item.path) ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: isActive(item.path) 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(255,255,255,0.1)',
                  transform: 'translateX(4px)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: 'white',
                minWidth: 40,
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: isActive(item.path) ? 600 : 400,
                    fontSize: '0.95rem'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        
        {user?.user_type === 'admin' && (
          <>
            <Box sx={{ 
              borderTop: '1px solid rgba(255,255,255,0.2)', 
              mx: 2, 
              my: 2,
              position: 'relative',
              '&::before': {
                content: '"Admin"',
                position: 'absolute',
                top: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                px: 1,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                borderRadius: 1
              }
            }} />
            {adminItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                    color: 'white',
                    backdropFilter: isActive(item.path) ? 'blur(10px)' : 'none',
                    border: isActive(item.path) ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: isActive(item.path) 
                        ? 'rgba(255,255,255,0.3)' 
                        : 'rgba(255,255,255,0.1)',
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: 'white',
                    minWidth: 40,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: isActive(item.path) ? 600 : 400,
                        fontSize: '0.95rem'
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ 
          minHeight: { xs: 64, sm: 72 },
          px: { xs: 2, sm: 3 }
        }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              component="img"
              src="/assets/logos/diablo_survivor.png"
              alt="Chori Survivor Logo"
              sx={{
                height: { xs: 32, sm: 36 },
                width: { xs: 32, sm: 36 },
                mr: 1.2,
                borderRadius: 1.5,
                boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
                display: { xs: 'inline-block', md: 'none' },
                background: 'white',
                objectFit: 'contain',
                p: 0.5
              }}
            />
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              sx={{
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                letterSpacing: '0.5px'
              }}
            >
              NFL Survivor Pool
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsButton />
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 1, 
                display: { xs: 'none', sm: 'block' },
                fontWeight: 500,
                opacity: 0.9,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              Hola, {user?.username}
            </Typography>
            <IconButton 
              onClick={handleProfileMenuOpen} 
              sx={{ 
                p: 0.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }
              }}
            >
              <Avatar 
                src={user?.avatar_url || undefined}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  border: '2px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 }
                }}
              >
                {!user?.avatar_url && user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 180,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.05)',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                transform: 'translateX(4px)',
              },
              '&:last-child': {
                mb: 1,
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                }
              }
            }
          }
        }}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); handleNavigation('/profile'); }}>
          <PersonIcon sx={{ mr: 1.5, color: 'primary.main' }} />
          Perfil
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1.5, color: 'error.main' }} />
          Cerrar Sesión
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          background: 'linear-gradient(180deg, #f8faff 0%, #f0f4ff 50%, #e8f2ff 100%)',
          minHeight: '100vh',
          boxSizing: 'border-box'
        }}
      >
        <Toolbar />
        {/* Center page horizontally similar to Login page */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: { xs: 0.25, sm: 0.5 }, 
          mt: { xs: 1, sm: 2 },
          px: { xs: 0, sm: 1 }
        }}>
          <Box sx={{ 
            width: '100%', 
            maxWidth: 1100,
            px: { xs: 0, sm: 1 }
          }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}