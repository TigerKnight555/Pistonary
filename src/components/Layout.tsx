import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BuildIcon from '@mui/icons-material/Build';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';
import LoginDialog from './LoginDialog';
import SettingsMenu from './SettingsMenu';

const drawerWidth = 280;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Ändere auf 'sm' für bessere mobile Erkennung

  // Update bottom navigation value based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') setBottomNavValue(0);
    else if (path === '/maintenance') setBottomNavValue(1);
    else if (path === '/manage') setBottomNavValue(2);
    else if (path === '/cars') setBottomNavValue(3);
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleBottomNavChange = (event: React.SyntheticEvent, newValue: number) => {
    setBottomNavValue(newValue);
    const routes = ['/dashboard', '/maintenance', '/manage', '/cars'];
    navigate(routes[newValue]);
  };

  const drawer = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      overflow: 'hidden',
      '&::-webkit-scrollbar': {
        display: 'none'
      },
      scrollbarWidth: 'none'
    }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Pistonary
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ 
        flexGrow: 1, 
        overflow: 'hidden',
        px: 1,
        py: 1
      }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/dashboard')}>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/maintenance')}>
            <ListItemIcon>
              <BuildIcon />
            </ListItemIcon>
            <ListItemText primary="Wartung & Service" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/manage')}>
            <ListItemIcon>
              <ManageAccountsIcon />
            </ListItemIcon>
            <ListItemText primary="Daten verwalten" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/cars')}>
            <ListItemIcon>
              <DirectionsCarIcon />
            </ListItemIcon>
            <ListItemText primary="Garage" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      width: '100%'
    }}>
      <CssBaseline />
      
      {/* Desktop AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          display: { xs: 'none', sm: 'block' }  // Verstecke auf Mobile (xs), zeige ab sm
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Pistonary
          </Typography>
          
          {/* Settings Menu */}
          <SettingsMenu />
          
          {/* Auth Buttons */}
          <Box sx={{ ml: 2 }}>
            {user ? (
              <Button
                color="inherit"
                onClick={logout}
                startIcon={<LogoutIcon />}
                size="small"
              >
                {user.name}
              </Button>
            ) : (
              <Button
                color="inherit"
                onClick={() => setIsLoginDialogOpen(true)}
                startIcon={<LoginIcon />}
                size="small"
              >
                Anmelden
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile AppBar - vereinfacht für Mobile */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          display: { xs: 'block', sm: 'none' }  // Nur auf Mobile sichtbar (xs)
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Pistonary
          </Typography>
          
          {/* Settings Menu für Mobile */}
          <SettingsMenu />
          
          {/* Auth Buttons für Mobile */}
          <Box sx={{ ml: 2 }}>
            {user ? (
              <IconButton
                color="inherit"
                onClick={logout}
                size="small"
              >
                <LogoutIcon />
              </IconButton>
            ) : (
              <IconButton
                color="inherit"
                onClick={() => setIsLoginDialogOpen(true)}
                size="small"
              >
                <LoginIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Desktop Navigation Drawer - komplett ausgeblendet auf Mobile */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{ width: drawerWidth, flexShrink: 0 }}
        >
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                backgroundColor: 'background.paper',
                height: '100vh',
                overflow: 'hidden',
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                scrollbarWidth: 'none'
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 0, sm: 0.5, md: 1 }, // Noch weniger Padding für maximale Breite
          width: { xs: '100vw', sm: `calc(100% - ${drawerWidth}px)` },  // Volle Viewport-Breite auf Mobile
          mt: { xs: 8, sm: 8 },  // AppBar height
          mb: { xs: 8, sm: 0 },  // Bottom Navigation height on mobile
          position: 'relative',
          zIndex: 1,
          minHeight: { xs: 'calc(100vh - 128px)', sm: 'calc(100vh - 64px)' },
          overflow: 'auto'
        }}
      >
        <Outlet />
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1300,
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            boxShadow: 3
          }}
        >
          <BottomNavigation
            value={bottomNavValue}
            onChange={handleBottomNavChange}
            showLabels
            sx={{
              height: 64,
              width: '100%',
              '& .MuiBottomNavigationAction-root': {
                color: 'text.secondary',
                fontSize: '0.75rem',
                minWidth: 'auto',
                '&.Mui-selected': {
                  color: 'primary.main'
                }
              }
            }}
          >
            <BottomNavigationAction 
              label="Dashboard" 
              icon={<DashboardIcon />} 
            />
            <BottomNavigationAction 
              label="Wartung" 
              icon={<BuildIcon />} 
            />
            <BottomNavigationAction 
              label="Verwalten" 
              icon={<ManageAccountsIcon />} 
            />
            <BottomNavigationAction 
              label="Garage" 
              icon={<DirectionsCarIcon />} 
            />
          </BottomNavigation>
        </Box>
      )}

      <LoginDialog
        open={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
      />
    </Box>
  );
}
