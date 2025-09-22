import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Fab
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  LocalGasStation as FuelIcon,
  CalendarToday as YearIcon,
  Speed as PowerIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import { formatPowerValue } from '../utils/powerConversion';
import type { Car } from '../database/entities/Car';

export default function CarListPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const loadCars = async () => {
    if (!token) {
      setError('Nicht angemeldet');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/cars`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCars(data);
    } catch (err) {
      console.error('Error loading cars:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Autos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCars();
  }, [token]);

  const handleCarClick = (carId: number) => {
    navigate(`/cars/${carId}`);
  };

  const handleAddCar = () => {
    navigate('/cars/new');
  };

  const getFuelTypeColor = (fuelType: string) => {
    switch (fuelType.toLowerCase()) {
      case 'benzin':
      case 'gasoline':
        return 'primary';
      case 'diesel':
        return 'secondary';
      case 'elektro':
      case 'electric':
        return 'success';
      case 'hybrid':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Lade Fahrzeuge...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Meine Garage
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {cars.length} {cars.length === 1 ? 'Fahrzeug' : 'Fahrzeuge'}
        </Typography>
      </Box>

      {cars.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CarIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Noch keine Fahrzeuge vorhanden
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Füge dein erstes Fahrzeug hinzu, um zu beginnen.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {cars.map((car) => (
            <Grid item xs={12} sm={6} md={4} key={car.id}>
              <Card 
                sx={{ 
                  height: 420,
                  width: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => handleCarClick(car.id)}
              >
                {car.image ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={car.image}
                    alt={`${car.manufacturer} ${car.model}`}
                    sx={{ objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'grey.100',
                      flexShrink: 0
                    }}
                  >
                    <CarIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                  </Box>
                )}
                
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" component="h2" gutterBottom noWrap>
                    {car.manufacturer} {car.model}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {car.licensePlate}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, flexGrow: 1 }}>
                    <Chip
                      icon={<YearIcon sx={{ fontSize: '16px !important' }} />}
                      label={car.year}
                      size="small"
                      variant="outlined"
                      sx={{ px: 1.5, py: 0.5 }}
                    />
                    <Chip
                      icon={<PowerIcon sx={{ fontSize: '16px !important' }} />}
                      label={formatPowerValue(car.power, 'PS')}
                      size="small"
                      variant="outlined"
                      sx={{ px: 1.5, py: 0.5 }}
                    />
                    <Chip
                      icon={<FuelIcon sx={{ fontSize: '16px !important' }} />}
                      label={car.fuel}
                      size="small"
                      color={getFuelTypeColor(car.fuel) as any}
                      variant="outlined"
                      sx={{ px: 1.5, py: 0.5 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Zum Bearbeiten anklicken
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCarClick(car.id);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button zum Hinzufügen */}
      <Fab
        color="primary"
        aria-label="Fahrzeug hinzufügen"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={handleAddCar}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}