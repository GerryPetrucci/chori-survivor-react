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
  Leaderboard as LeaderboardIcon,
  Person as PersonIcon,
  Gavel as RulesIcon,
  History as HistoryIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { text: 'Hacer Picks', path: '/picks', icon: <SportsIcon /> },
  { text: 'Ranking', path: '/ranking', icon: <LeaderboardIcon /> },
  { text: 'Perfil', path: '/profile', icon: <PersonIcon /> },
  { text: 'Reglas', path: '/rules', icon: <RulesIcon /> },
  { text: 'Historial', path: '/history', icon: <HistoryIcon /> },
];

const adminItems = [
  { text: 'Admin Panel', path: '/admin', icon: <AdminIcon /> },
  { text: 'Gestionar Partidos', path: '/admin/matches', icon: <SportsIcon /> },
  { text: 'Gestionar Usuarios', path: '/admin/users', icon: <PersonIcon /> },
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
    <Box>
      <Toolbar sx={{ flexDirection: 'column', py: 2 }}>
        <Box
          component="img"
          src="/assets/logos/diablo_survivor.png"
          alt="Diablo Survivor Logo"
          sx={{
            height: 48,
            width: 48,
            mb: 1,
            borderRadius: 1,
          }}
        />
        <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold" textAlign="center">
          Chori Survivor
        </Typography>
      </Toolbar>
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                backgroundColor: isActive(item.path) ? 'primary.main' : 'transparent',
                color: isActive(item.path) ? 'white' : 'inherit',
                '&:hover': {
                  backgroundColor: isActive(item.path) ? 'primary.dark' : 'grey.100',
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive(item.path) ? 'white' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        
        {user?.user_type === 'admin' && (
          <>
            <Box sx={{ borderTop: 1, borderColor: 'divider', my: 1 }} />
            {adminItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    backgroundColor: isActive(item.path) ? 'primary.main' : 'transparent',
                    color: isActive(item.path) ? 'white' : 'inherit',
                    '&:hover': {
                      backgroundColor: isActive(item.path) ? 'primary.dark' : 'grey.100',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive(item.path) ? 'white' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
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
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              component="img"
              src="/assets/logos/diablo_survivor.png"
              alt="Diablo Survivor Logo"
              sx={{
                height: 32,
                width: 32,
                mr: 1.5,
                borderRadius: 0.5,
              }}
            />
            <Typography variant="h6" noWrap component="div">
              NFL Survivor Pool
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
              {user?.username}
            </Typography>
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={() => handleNavigation('/profile')}>
          <PersonIcon sx={{ mr: 1 }} />
          Perfil
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {/* Center page horizontally similar to Login page */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, mt: 2 }}>
          <Box sx={{ width: '100%', maxWidth: 1100 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}