import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Button, Alert, useTheme, useMediaQuery, Card, CardContent, CardMedia, IconButton, ThemeProvider, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { useSwipeable } from 'react-swipeable';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EventIcon from '@mui/icons-material/Event';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AddRefuelingDialog from './AddRefuelingDialog';
import RecentRefuelings from './RecentRefuelings';
import RefuelingChart from './RefuelingChart';
import AddEventDialog from './AddEventDialog';
import MaintenanceStatusWidget from './MaintenanceStatusWidget';
import TotalCostsWidget from './TotalCostsWidget';
import { useAuth } from '../contexts/AuthContext';
import { useSimpleDynamicTheme } from '../hooks/useSimpleDynamicTheme';
import type { Car } from '../database/entities/Car';
import type { Refueling } from '../database/entities/Refueling';
import { API_BASE_URL } from '../config/api';
import { formatPowerValue } from '../utils/powerConversion';



export default function Dashboard() {
    const [cars, setCars] = useState<Car[]>([]);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [currentCarIndex, setCurrentCarIndex] = useState(0);
    const [isAddRefuelingDialogOpen, setIsAddRefuelingDialogOpen] = useState(false);
    const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refuelingUpdateTrigger, setRefuelingUpdateTrigger] = useState(0);

    const [isTransitioning, setIsTransitioning] = useState(false);
    
    const { setSelectedCar: setSelectedCarInAuth } = useAuth();
    const fallbackTheme = useTheme();
    const isMobile = useMediaQuery(fallbackTheme.breakpoints.down('md'));
    
    // Dynamisches Theme basierend auf Auto-Bild (nur Akzentfarben)
    const { theme: dynamicTheme, extractedColors } = useSimpleDynamicTheme({
        imageUrl: selectedCar?.image,
        baseTheme: fallbackTheme
    });

    // Swipe handlers für Auto-Navigation
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            if (cars.length > 1 && !isTransitioning) {
                goToNextCar();
            }
        },
        onSwipedRight: () => {
            if (cars.length > 1 && !isTransitioning) {
                goToPreviousCar();
            }
        },
        preventScrollOnSwipe: true,
        trackMouse: true, // Ermöglicht auch Mouse-Drag auf Desktop
        delta: 30, // Reduzierte Mindest-Swipe-Distanz für bessere Responsivität
        swipeDuration: 500, // Maximale Swipe-Dauer
        touchEventOptions: { passive: false } // Bessere Touch-Kontrolle
    });

    // Funktionen zum Auto-Wechseln mit JWT Token Update und Animation
    const goToPreviousCar = async () => {
        if (cars.length > 0 && !isTransitioning) {
            setIsTransitioning(true);
            const newIndex = currentCarIndex > 0 ? currentCarIndex - 1 : cars.length - 1;
            const newCar = cars[newIndex];
            
            setCurrentCarIndex(newIndex);
            setSelectedCar(newCar);
            
            // JWT Token mit neuer Auto-ID aktualisieren
            try {
                await setSelectedCarInAuth(newCar.id);
            } catch (error) {
                console.error('Fehler beim Aktualisieren der Auto-Auswahl:', error);
            }
            
            // Animation beenden
            setTimeout(() => setIsTransitioning(false), 300);
        }
    };

    const goToNextCar = async () => {
        if (cars.length > 0 && !isTransitioning) {
            setIsTransitioning(true);
            const newIndex = currentCarIndex < cars.length - 1 ? currentCarIndex + 1 : 0;
            const newCar = cars[newIndex];
            
            setCurrentCarIndex(newIndex);
            setSelectedCar(newCar);
            
            // JWT Token mit neuer Auto-ID aktualisieren
            try {
                await setSelectedCarInAuth(newCar.id);
            } catch (error) {
                console.error('Fehler beim Aktualisieren der Auto-Auswahl:', error);
            }
            
            // Animation beenden
            setTimeout(() => setIsTransitioning(false), 300);
        }
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
            
            // Erstes Auto als ausgewählt setzen und im JWT Token speichern
            if (data.length > 0) {
                setSelectedCar(data[0]);
                setCurrentCarIndex(0);
                
                // JWT Token mit der Auto-ID aktualisieren
                try {
                    await setSelectedCarInAuth(data[0].id);
                } catch (error) {
                    console.error('Fehler beim Initialisieren der Auto-Auswahl:', error);
                }
            }
            
            console.log('Geladene Autos:', data);
        } catch (error) {
            console.error('Error fetching cars:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Laden der Fahrzeuge');
        }
    };

    const handleAddRefueling = async (newRefueling: Omit<Refueling, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${API_BASE_URL}/refuelings`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newRefueling),
            });
            if (!response.ok) throw new Error('Fehler beim Speichern');
            
            setIsAddRefuelingDialogOpen(false);
            setRefuelingUpdateTrigger(prev => prev + 1); // Triggert Update der RecentRefuelings
            // Optional: Refresh data or show success message
        } catch (error) {
            console.error('Error adding refueling:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Speichern der Tankung');
        }
    };

    const handleAddEvent = () => {
        setRefuelingUpdateTrigger(prev => prev + 1); // Triggert Update der Charts (Events werden in Charts angezeigt)
    };

    useEffect(() => {
        fetchCars();
    }, []);

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Container>
        );
    }

    if (cars.length === 0) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <DirectionsCarIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Noch keine Fahrzeuge vorhanden
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Fügen Sie Ihr erstes Fahrzeug hinzu, um mit der Kraftstoffverfolgung zu beginnen.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<DirectionsCarIcon />}
                        onClick={() => {
                            // Navigate to add car functionality
                            console.log('Add car functionality needed');
                        }}
                    >
                        Erstes Fahrzeug hinzufügen
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <ThemeProvider theme={dynamicTheme || fallbackTheme}>
            <Container 
                maxWidth={false}
                sx={{ 
                    mt: isMobile ? 2 : 3, 
                    mb: isMobile ? 2 : 4,
                    px: { xs: 0.5, sm: 1, md: 2 }, // Minimal padding for maximum width usage
                    width: '100%',
                    maxWidth: '100vw' // Use full viewport width
                }}
            >
                {/* Begrüßung mit Auto-Name und Navigation */}
                <Paper sx={{ 
                    p: isMobile ? 2 : 3, 
                    mb: isMobile ? 2 : 4, 
                    textAlign: 'center',
                    mx: { xs: 0.5, sm: 0 } // Minimal margin on mobile
                }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Willkommen zurück!
                </Typography>
                {selectedCar && cars.length > 0 && (
                    <Box sx={{ 
                        textAlign: 'center',
                        mt: 2 
                    }}>
                        <Typography variant="h5" color="primary" sx={{ fontWeight: 'medium' }}>
                            {selectedCar.manufacturer} {selectedCar.model}
                        </Typography>
                        {cars.length > 1 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {currentCarIndex + 1} von {cars.length}
                            </Typography>
                        )}
                    </Box>
                )}
            </Paper>

            {/* Car Carousel mit Swipe-Funktionalität */}
            {cars.length > 0 && (
                <Box sx={{ position: 'relative', mb: 4 }}>
                    {/* Swipe-Indikator für mehrere Autos */}
                    {cars.length > 1 && (
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: 1, 
                            mb: 2 
                        }}>
                            {cars.map((_, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: index === currentCarIndex ? 'primary.main' : 'grey.300',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        if (!isTransitioning && index !== currentCarIndex) {
                                            setIsTransitioning(true);
                                            setCurrentCarIndex(index);
                                            setSelectedCar(cars[index]);
                                            setSelectedCarInAuth(cars[index].id);
                                            setTimeout(() => setIsTransitioning(false), 300);
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                    
                    {/* Carousel Container */}
                    <Box 
                        sx={{ 
                            overflow: 'hidden',
                            borderRadius: 2,
                            position: 'relative',
                            width: '100%'
                        }}
                    >
                        <Box
                            {...swipeHandlers}
                            sx={{
                                display: 'flex',
                                width: `${cars.length * 100}%`,
                                transform: `translateX(-${(currentCarIndex * 100) / cars.length}%)`,
                                transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                                cursor: cars.length > 1 ? 'grab' : 'default',
                                '&:active': {
                                    cursor: cars.length > 1 ? 'grabbing' : 'default',
                                },
                                touchAction: 'pan-y pinch-zoom' // Erlaubt vertikales Scrollen, aber horizontales Swipen
                            }}
                        >
                            {cars.map((car, index) => (
                                <Box
                                    key={car.id}
                                    sx={{
                                        width: `${100 / cars.length}%`,
                                        flexShrink: 0,
                                        px: 1 // Padding statt Margin für bessere Kontrolle
                                    }}
                                >
                                    <Card sx={{ 
                                        boxShadow: 3,
                                        userSelect: 'none',
                                        height: '100%'
                                    }}>
                                        {car.image ? (
                                            <CardMedia
                                                component="img"
                                                height={isMobile ? "200" : "300"}
                                                image={car.image}
                                                alt={`${car.manufacturer} ${car.model}`}
                                                sx={{ 
                                                    objectFit: 'cover',
                                                    userSelect: 'none'
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    height: isMobile ? 200 : 300,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'grey.100',
                                                    userSelect: 'none'
                                                }}
                                            >
                                                <DirectionsCarIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                                            </Box>
                                        )}
                                        <CardContent sx={{ p: 2 }}>
                                            <Typography variant="h6" component="h2" gutterBottom>
                                                {car.manufacturer} {car.model}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                    <strong>Kennzeichen:</strong> {car.licensePlate}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                    <strong>Jahr:</strong> {car.year}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                    <strong>Leistung:</strong> {formatPowerValue(car.power, 'PS')}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                    <strong>Kraftstoff:</strong> {car.fuel}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    
                    {/* Swipe-Hinweis für Mobile */}
                    {cars.length > 1 && isMobile && (
                        <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                                display: 'block', 
                                textAlign: 'center', 
                                mt: 2, 
                                opacity: 0.7 
                            }}
                        >
                            ← Wischen um Auto zu wechseln →
                        </Typography>
                    )}
                </Box>
            )}

            {/* Dashboard Widgets Grid */}
            <Grid 
                container 
                spacing={isMobile ? 2 : 3} 
                sx={{ 
                    mb: 4,
                    width: '100%',
                    margin: 0, // Remove negative margins
                    '& > .MuiGrid-item': {
                        paddingLeft: isMobile ? '8px' : '12px',
                        paddingTop: isMobile ? '8px' : '12px'
                    }
                }}
            >
                {/* Wartungsstatus Widget */}
                <Grid item xs={12} sx={{ width: '100%' }}>
                    <MaintenanceStatusWidget />
                </Grid>

                {/* Gesamtkosten Widget */}
                <Grid item xs={12} sx={{ width: '100%' }}>
                    <TotalCostsWidget />
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12} sx={{ width: '100%' }}>
                    <Paper sx={{ 
                        p: isMobile ? 2 : 3,
                        textAlign: 'center',
                        width: '100%'
                    }}>
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 2, 
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'center'
                        }}>
                            <Button
                                variant="contained"
                                size={isMobile ? "medium" : "large"}
                                startIcon={<LocalGasStationIcon />}
                                onClick={() => setIsAddRefuelingDialogOpen(true)}
                                sx={{ 
                                    py: isMobile ? 1.5 : 2,
                                    px: isMobile ? 2 : 3,
                                    fontSize: isMobile ? '1rem' : '1.1rem',
                                    flex: isMobile ? 1 : 'none',
                                    minHeight: 44 // Touch-friendly minimum
                                }}
                            >
                                Neue Tankung
                            </Button>
                            <Button
                                variant="outlined"
                                size={isMobile ? "medium" : "large"}
                                startIcon={<EventIcon />}
                                onClick={() => setIsAddEventDialogOpen(true)}
                                sx={{ 
                                    py: isMobile ? 1.5 : 2,
                                    px: isMobile ? 2 : 3,
                                    fontSize: isMobile ? '1rem' : '1.1rem',
                                    flex: isMobile ? 1 : 'none',
                                    minHeight: 44 // Touch-friendly minimum
                                }}
                            >
                                Ereignis hinzufügen
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Tankstatistiken Chart */}
                <Grid item xs={12} sx={{ width: '100%' }}>
                    <RefuelingChart 
                        refreshTrigger={refuelingUpdateTrigger}
                    />
                </Grid>

                {/* Letzte Tankungen */}
                <Grid item xs={12} sx={{ width: '100%' }}>
                    <RecentRefuelings refreshTrigger={refuelingUpdateTrigger} />
                </Grid>
            </Grid>

            {/* Dialogs */}
            <AddRefuelingDialog 
                open={isAddRefuelingDialogOpen}
                onClose={() => setIsAddRefuelingDialogOpen(false)}
                onAdd={handleAddRefueling}
                currentCar={selectedCar}
            />
            
            <AddEventDialog 
                open={isAddEventDialogOpen}
                onClose={() => setIsAddEventDialogOpen(false)}
                onAdd={handleAddEvent}
            />
            </Container>
            
            {/* Debug-Info für extrahierte Farben in Development */}
            {extractedColors && process.env.NODE_ENV === 'development' && (
                <Box sx={{ 
                    position: 'fixed', 
                    bottom: 16, 
                    right: 16, 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1, 
                    boxShadow: 2,
                    fontSize: '0.75rem',
                    maxWidth: 200,
                    zIndex: 1000
                }}>
                    <Typography variant="caption" display="block">
                        Auto-Farben:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Box sx={{ 
                            width: 20, 
                            height: 20, 
                            bgcolor: extractedColors.primary, 
                            borderRadius: 0.5,
                            border: '1px solid #ccc'
                        }} />
                        <Box sx={{ 
                            width: 20, 
                            height: 20, 
                            bgcolor: extractedColors.secondary, 
                            borderRadius: 0.5,
                            border: '1px solid #ccc'
                        }} />
                        <Box sx={{ 
                            width: 20, 
                            height: 20, 
                            bgcolor: extractedColors.accent, 
                            borderRadius: 0.5,
                            border: '1px solid #ccc'
                        }} />
                    </Box>
                </Box>
            )}
        </ThemeProvider>
    );
}
