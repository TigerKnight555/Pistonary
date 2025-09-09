import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Button, Alert, Stack, useTheme, useMediaQuery } from '@mui/material';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AddCarDialog from './AddCarDialog';
import AddRefuelingDialog from './AddRefuelingDialog';
import type { Car } from '../database/entities/Car';
import type { Refueling } from '../database/entities/Refueling';
import { API_BASE_URL } from '../config/api';

export default function Dashboard() {
    const [cars, setCars] = useState<Car[]>([]);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [isAddRefuelingDialogOpen, setIsAddRefuelingDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const navigateToCar = (carId: number) => {
        window.location.href = `/car/${carId}`;
    };

    const fetchCars = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${API_BASE_URL}/cars`, { headers });
            if (!response.ok) {
                throw new Error(`Fehler beim Laden der Fahrzeuge: ${response.status}`);
            }
            const data = await response.json();
            setCars(data);
            setError(null);
            
            // Debug: Zeige Bildinformationen in der Konsole
            console.log('Geladene Autos:', data);
            data.forEach((car: Car) => {
                console.log(`Auto ${car.id}: ${car.manufacturer} ${car.model}`);
                console.log(`  Hat Bild: ${!!car.image}`);
                if (car.image) {
                    console.log(`  Bildlänge: ${car.image.length}`);
                    console.log(`  Bild beginnt mit: ${car.image.substring(0, 50)}`);
                    console.log(`  Ist Base64: ${car.image.startsWith('data:image/')}`);
                } else {
                    console.log('  Kein Bild vorhanden');
                }
            });
        } catch (error) {
            console.error('Error fetching cars:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Laden der Fahrzeuge');
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    const handleAddCar = async (newCar: Omit<Car, 'id' | 'created_at' | 'updated_at' | 'refuelings'>) => {
        try {
            const response = await fetch(`${API_BASE_URL}/cars`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newCar),
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Fehler beim Speichern (${response.status}): ${errorData}`);
            }
            
            await response.json();
            await fetchCars();
            setIsAddCarDialogOpen(false);
            setError(null);
        } catch (error) {
            console.error('Error adding car:', error);
            if (error instanceof Error) {
                if (error.message.includes('entity too large')) {
                    setError('Das Bild ist zu groß. Bitte wählen Sie ein kleineres Bild oder komprimieren Sie es.');
                } else {
                    setError(error.message);
                }
            } else {
                setError('Fehler beim Hinzufügen des Fahrzeugs');
            }
        }
    };

    const handleAddRefueling = async (newRefueling: Omit<Refueling, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await fetch(`${API_BASE_URL}/refuelings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRefueling),
            });
            if (!response.ok) {
                throw new Error(`Fehler beim Speichern: ${response.status}`);
            }
            await response.json();
            await fetchCars();
            setIsAddRefuelingDialogOpen(false);
            setError(null);
        } catch (error) {
            console.error('Error adding refueling:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Hinzufügen der Tankung');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 } }}>
            <Stack spacing={{ xs: 2, md: 3 }}>
                <Paper sx={{ p: { xs: 2, md: 3 }, textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                    <Typography 
                        component="h1" 
                        variant={isMobile ? "h5" : "h4"} 
                        color="primary" 
                        gutterBottom
                    >
                        Willkommen bei Pistonary
                    </Typography>
                    <Typography 
                        variant={isMobile ? "body2" : "subtitle1"} 
                        color="text.secondary" 
                        gutterBottom
                    >
                        Ihr persönlicher Fahrzeug-Manager
                    </Typography>
                </Paper>

                <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                    <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={2} 
                        justifyContent="space-between" 
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                    >
                        <Typography component="h2" variant="h6" color="primary">
                            Schnellzugriff
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<LocalGasStationIcon />}
                                onClick={() => setIsAddRefuelingDialogOpen(true)}
                                fullWidth={isMobile}
                                size={isMobile ? "large" : "medium"}
                            >
                                Neue Tankung
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<DirectionsCarIcon />}
                                onClick={() => setIsAddCarDialogOpen(true)}
                                fullWidth={isMobile}
                                size={isMobile ? "large" : "medium"}
                            >
                                Neues Fahrzeug
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>
                        Meine Fahrzeuge {cars.length > 0 && `(${cars.length} Fahrzeuge, ${cars.filter(car => car.image).length} mit Bildern)`}
                    </Typography>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {cars.length === 0 ? (
                        <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                            Noch keine Fahrzeuge vorhanden. Fügen Sie Ihr erstes Fahrzeug hinzu!
                        </Typography>
                    ) : (
                        <Box 
                            sx={{ 
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(auto-fill, minmax(250px, 1fr))',
                                    md: 'repeat(auto-fill, minmax(300px, 1fr))'
                                },
                                gap: { xs: 2, md: 3 },
                                mt: 2
                            }}
                        >
                            {cars.map((car) => (
                                <Paper 
                                    key={car.id}
                                    sx={{ 
                                        p: { xs: 2, md: 3 },
                                        display: 'flex',
                                        flexDirection: { xs: 'row', md: 'column' },
                                        alignItems: { xs: 'center', md: 'center' },
                                        gap: { xs: 2, md: 1 },
                                        height: { xs: 'auto', md: '280px' },
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 1)',
                                            transform: { xs: 'none', md: 'translateY(-4px)' },
                                            boxShadow: { xs: 1, md: 4 }
                                        }
                                    }}
                                    onClick={() => navigateToCar(car.id)}
                                >
                                    {/* Mobile: Bild links, Text rechts */}
                                    {isMobile && (
                                        <Box
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                flexShrink: 0,
                                                backgroundColor: 'grey.100',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderRadius: 1
                                            }}
                                        >
                                            {car.image ? (
                                                <img
                                                    src={car.image}
                                                    alt={`${car.manufacturer} ${car.model}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        borderRadius: 4
                                                    }}
                                                    onError={(e) => {
                                                        console.log(`Fehler beim Laden des Bildes für Auto ${car.id}:`, e);
                                                        console.log(`Bildquelle: ${car.image?.substring(0, 100)}...`);
                                                    }}
                                                />
                                            ) : (
                                                <DirectionsCarIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                                            )}
                                        </Box>
                                    )}
                                    
                                    {/* Text Content */}
                                    <Box sx={{ 
                                        flex: 1, 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        justifyContent: { xs: 'center', md: 'flex-end' },
                                        alignItems: { xs: 'flex-start', md: 'center' },
                                        textAlign: { xs: 'left', md: 'center' },
                                        pb: { xs: 0, md: 2 },
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        <Typography 
                                            variant={isMobile ? "h6" : "h5"} 
                                            component="h3" 
                                            sx={{ 
                                                fontWeight: 'bold',
                                                mb: 0.5
                                            }}
                                        >
                                            {car.manufacturer} {car.model}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                        >
                                            {car.licensePlate}
                                        </Typography>
                                    </Box>

                                    {/* Desktop: Icon overlay wenn kein Bild */}
                                    {!isMobile && !car.image && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 0
                                            }}
                                        >
                                            <DirectionsCarIcon sx={{ fontSize: 120, color: 'grey.200' }} />
                                        </Box>
                                    )}
                                </Paper>
                            ))}
                        </Box>
                    )}
                </Paper>
            </Stack>

            <AddCarDialog
                open={isAddCarDialogOpen}
                onClose={() => setIsAddCarDialogOpen(false)}
                onAdd={handleAddCar}
            />
            <AddRefuelingDialog 
                open={isAddRefuelingDialogOpen}
                onClose={() => setIsAddRefuelingDialogOpen(false)}
                onAdd={handleAddRefueling}
                cars={cars}
            />
        </Container>
    );
}
