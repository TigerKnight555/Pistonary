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
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import type { Car } from '../database/entities/Car';
import { API_BASE_URL } from '../config/api';
import AddCarDialog from './AddCarDialog';

const drawerWidth = 280;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const fetchCars = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars`);
      if (!response.ok) throw new Error('Fehler beim Laden der Fahrzeuge');
      const data = await response.json();
      setCars(data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    // Aktualisiere das ausgewählte Auto basierend auf der URL
    const carId = location.pathname.match(/\/cars\/(\d+)/)?.[1];
    if (carId) {
      const car = cars.find(c => c.id === parseInt(carId));
      setSelectedCar(car || null);
    } else {
      setSelectedCar(null);
    }
  }, [location.pathname, cars]);

  const handleCarMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCarMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCarSelect = (car: Car) => {
    navigate(`/cars/${car.id}/overview`);
    handleCarMenuClose();
  };

  const handleAddCar = async (newCar: Omit<Car, 'id' | 'created_at' | 'updated_at' | 'refuelings'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
            fullWidth
          >
            Fahrzeug hinzufügen
          </Button>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                {`${selectedCar.manufacturer} ${selectedCar.model}`}
              </Typography>
              <Button
                color="inherit"
                onClick={handleCarMenuClick}
                startIcon={<DirectionsCarIcon />}
              >
                Fahrzeug wechseln
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
            <Typography variant="h6" noWrap component="div">
              Dashboard
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
      <AddCarDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddCar}
      />
    </Box>
  );
}
