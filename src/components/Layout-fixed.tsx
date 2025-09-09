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
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import type { Car } from '../database/entities/Car';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import AddCarDialog from './AddCarDialog';
import LoginDialog from './LoginDialog';

const drawerWidth = 280;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCarId, token, user, logout } = useAuth();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Prüfe ob wir auf dem Dashboard sind
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  // Bestimme das Hintergrundbild nur für das Dashboard
  const getBackgroundImage = () => {
    // Hintergrundbild nur auf Dashboard und nur auf Desktop
    if (isMobile || !isDashboard) {
      return null;
    }
    
    console.log(`Getting background image. Cars available: ${cars.length}, selectedCarId: ${selectedCarId}`);
    
    // Verwende das ausgewählte Auto aus dem Auth-Context
    if (selectedCarId) {
      const authSelectedCar = cars.find(car => car.id === selectedCarId);
      if (authSelectedCar && authSelectedCar.image) {
        console.log(`Using auth selected car background: ${authSelectedCar.manufacturer} ${authSelectedCar.model}`);
        return authSelectedCar.image;
      }
    }
    
    // Fallback: Erstes Auto mit Bild für Dashboard
    const carWithImage = cars.find(car => car.image);
    if (carWithImage) {
      console.log(`Using dashboard background: ${carWithImage.manufacturer} ${carWithImage.model}`);
      return carWithImage.image;
    } else {
      console.log('No car with image found for dashboard background');
    }
    
    return null;
  };

  // Reaktive Berechnung des Hintergrundbilds - nur für Dashboard
  const backgroundImage = isDashboard ? getBackgroundImage() : null;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const fetchCars = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/cars`, { headers });
      if (!response.ok) throw new Error('Fehler beim Laden der Fahrzeuge');
      const data = await response.json();
      console.log('Cars loaded in Layout:', data.length, 'cars');
      setCars(data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const handleCarMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCarMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCarSelect = (car: Car) => {
    setSelectedCar(car);
    handleCarMenuClose();
    
    // Update route to selected car
    navigate(`/cars/${car.id}/overview`);
  };

  const handleAddCar = async (newCar: Omit<Car, 'id' | 'created_at' | 'updated_at' | 'refuelings'>) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/cars`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newCar),
      });
      if (!response.ok) throw new Error('Fehler beim Speichern');
      const car = await response.json();
      await fetchCars();
      setIsAddDialogOpen(false);
      navigate(`/cars/${car.id}/overview`);
    } catch (error) {
      console.error('Error adding car:', error);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [token]);

  // Update selected car when route changes
  useEffect(() => {
    const match = location.pathname.match(/\/cars\/(\d+)/);
    if (match) {
      const carId = parseInt(match[1]);
      const car = cars.find(c => c.id === carId);
      if (car) {
        setSelectedCar(car);
      }
    } else {
      setSelectedCar(null);
    }
  }, [location.pathname, cars]);

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Pistonary
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/dashboard')}>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem>
          <Typography variant="subtitle2" color="textSecondary">
            MEINE FAHRZEUGE
          </Typography>
        </ListItem>
        {cars.map((car) => (
          <ListItem key={car.id} disablePadding>
            <ListItemButton 
              selected={selectedCar?.id === car.id}
              onClick={() => navigate(`/cars/${car.id}/overview`)}
            >
              <ListItemIcon>
                <DirectionsCarIcon />
              </ListItemIcon>
              <ListItemText 
                primary={`${car.manufacturer} ${car.model}`}
                secondary={car.licensePlate}
              />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setIsAddDialogOpen(true)}
            variant="text"
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Fahrzeug hinzufügen
          </Button>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Hintergrundbild nur für Dashboard */}
      {!isMobile && isDashboard && backgroundImage && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: -2,
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              zIndex: 1
            }
          }}
        />
      )}
      
      {/* Debug Info nur für Dashboard */}
      {!isMobile && isDashboard && (
        <Box sx={{ position: 'fixed', top: 10, right: 10, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', p: 1, fontSize: '12px' }}>
          Background: {backgroundImage ? 'YES' : 'NO'} | Cars: {cars.length}
        </Box>
      )}
      
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: (isDashboard && backgroundImage && !isMobile) ? 'rgba(255, 255, 255, 0.95)' : 'primary.main',
          backdropFilter: (isDashboard && backgroundImage && !isMobile) ? 'blur(10px)' : 'none',
          color: (isDashboard && backgroundImage && !isMobile) ? 'text.primary' : 'primary.contrastText'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          {selectedCar ? (
            <>
              <Button
                color="inherit"
                onClick={handleCarMenuClick}
                endIcon={<DirectionsCarIcon />}
                sx={{ flexGrow: 1, justifyContent: 'flex-start' }}
              >
                {`${selectedCar.manufacturer} ${selectedCar.model}`}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCarMenuClose}
              >
                {cars.map((car) => (
                  <MenuItem
                    key={car.id}
                    onClick={() => handleCarSelect(car)}
                    selected={selectedCar.id === car.id}
                  >
                    {`${car.manufacturer} ${car.model} (${car.licensePlate})`}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Dashboard
            </Typography>
          )}
          
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
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: (isDashboard && backgroundImage && !isMobile) ? 'rgba(255, 255, 255, 0.95)' : 'background.paper',
              backdropFilter: (isDashboard && backgroundImage && !isMobile) ? 'blur(10px)' : 'none'
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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          position: 'relative',
          zIndex: 1,
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Outlet />
      </Box>
      <AddCarDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddCar}
      />
      <LoginDialog
        open={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
      />
    </Box>
  );
}
