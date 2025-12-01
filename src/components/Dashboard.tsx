import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Button, Alert, useTheme, useMediaQuery, Card, CardContent, CardMedia, IconButton, Grid } from '@mui/material';
import { useSwipeable } from 'react-swipeable';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AddRefuelingDialog from './AddRefuelingDialog';
import AddMaintenanceDialog from './AddMaintenanceDialog';
import AddCarDialog from './AddCarDialog';
import RecentRefuelings from './RecentRefuelings';
import RefuelingChart from './RefuelingChart';
import MaintenanceStatusWidget from './MaintenanceStatusWidget';
import TotalCostsWidget from './TotalCostsWidget';
import { useAuth } from '../contexts/AuthContext';
import type { Car } from '../database/entities/Car';
import type { Refueling } from '../database/entities/Refueling';
import { API_BASE_URL } from '../config/api';
import { formatPowerValue } from '../utils/powerConversion';


export default function Dashboard() {
    const [cars, setCars] = useState<Car[]>([]);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [currentCarIndex, setCurrentCarIndex] = useState(0);
    const [isAddRefuelingDialogOpen, setIsAddRefuelingDialogOpen] = useState(false);
    const [isAddMaintenanceDialogOpen, setIsAddMaintenanceDialogOpen] = useState(false);
    const [isAddCarDialogOpen, setIsAddCarDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refuelingUpdateTrigger, setRefuelingUpdateTrigger] = useState(0);

    const [isTransitioning, setIsTransitioning] = useState(false);
    
    const { setSelectedCar: setSelectedCarInAuth } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Swipe handlers für Auto-Navigation (nur auf Mobile aktiv)
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            if (cars.length > 1 && !isTransitioning && isMobile) {
                goToNextCar();
            }
        },
        onSwipedRight: () => {
            if (cars.length > 1 && !isTransitioning && isMobile) {
                goToPreviousCar();
            }
        },
        preventScrollOnSwipe: true,
        trackMouse: false, // Deaktiviert auf Desktop
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

    const handleAddMaintenance = () => {
        setRefuelingUpdateTrigger(prev => prev + 1); // Triggert Update der Widgets
    };

    const handleAddCar = async (newCar: Omit<Car, 'id' | 'created_at' | 'updated_at' | 'refuelings'>) => {
        try {
            console.log('Versuche Auto zu speichern:', newCar);
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            console.log('API URL:', `${API_BASE_URL}/cars`);
            const response = await fetch(`${API_BASE_URL}/cars`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newCar),
            });
            
            console.log('Response Status:', response.status);
            const responseData = await response.json();
            console.log('Response Data:', responseData);
            
            if (!response.ok) {
                throw new Error(`Fehler beim Speichern: ${response.status} - ${JSON.stringify(responseData)}`);
            }
            
            setIsAddCarDialogOpen(false);
            await fetchCars(); // Reload cars to include the new one
        } catch (error) {
            console.error('Error adding car:', error);
            setError(error instanceof Error ? error.message : 'Fehler beim Speichern des Fahrzeugs');
        }
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
            <>
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
                            onClick={() => setIsAddCarDialogOpen(true)}
                        >
                            Erstes Fahrzeug hinzufügen
                        </Button>
                    </Paper>
                </Container>
                
                <AddCarDialog 
                    open={isAddCarDialogOpen}
                    onClose={() => setIsAddCarDialogOpen(false)}
                    onAdd={handleAddCar}
                />
            </>
        );
    }

    return (
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
                    
                    {/* Carousel Container mit Navigation Buttons */}
                    <Box 
                        sx={{ 
                            overflow: 'hidden',
                            borderRadius: 2,
                            position: 'relative',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? 0 : 2
                        }}
                    >
                        {/* Left Arrow Button - nur auf Desktop */}
                        {!isMobile && cars.length > 1 && (
                            <IconButton
                                onClick={goToPreviousCar}
                                disabled={isTransitioning}
                                sx={{
                                    flexShrink: 0,
                                    bgcolor: 'background.paper',
                                    boxShadow: 2,
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                        boxShadow: 3
                                    },
                                    '&:disabled': {
                                        opacity: 0.5
                                    }
                                }}
                            >
                                <ArrowBackIosIcon />
                            </IconButton>
                        )}

                        <Box
                            {...(isMobile ? swipeHandlers : {})}
                            sx={{
                                width: '100%',
                                position: 'relative',
                                cursor: cars.length > 1 && isMobile ? 'grab' : 'default',
                                '&:active': {
                                    cursor: cars.length > 1 && isMobile ? 'grabbing' : 'default',
                                },
                                touchAction: 'pan-y pinch-zoom', // Erlaubt vertikales Scrollen, aber horizontales Swipen
                                overflow: 'hidden'
                            }}
                        >
                            {/* Nur die aktuelle Karte anzeigen mit Slide-Animation */}
                            {selectedCar && (
                                <Card 
                                    key={selectedCar.id}
                                    sx={{ 
                                        boxShadow: 3,
                                        userSelect: 'none',
                                        animation: isTransitioning ? 'slideIn 0.3s ease-out' : 'none',
                                        '@keyframes slideIn': {
                                            '0%': {
                                                opacity: 0,
                                                transform: 'translateX(30px)'
                                            },
                                            '100%': {
                                                opacity: 1,
                                                transform: 'translateX(0)'
                                            }
                                        }
                                    }}
                                >
                                    {selectedCar.image ? (
                                        <CardMedia
                                            component="img"
                                            height={isMobile ? "200" : "300"}
                                            image={selectedCar.image}
                                            alt={`${selectedCar.manufacturer} ${selectedCar.model}`}
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
                                            {selectedCar.manufacturer} {selectedCar.model}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                <strong>Kennzeichen:</strong> {selectedCar.licensePlate}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                <strong>Jahr:</strong> {selectedCar.year}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                <strong>Leistung:</strong> {formatPowerValue(selectedCar.power, 'PS')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                <strong>Kraftstoff:</strong> {selectedCar.fuel}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            )}
                        </Box>

                        {/* Right Arrow Button - nur auf Desktop */}
                        {!isMobile && cars.length > 1 && (
                            <IconButton
                                onClick={goToNextCar}
                                disabled={isTransitioning}
                                sx={{
                                    flexShrink: 0,
                                    bgcolor: 'background.paper',
                                    boxShadow: 2,
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                        boxShadow: 3
                                    },
                                    '&:disabled': {
                                        opacity: 0.5
                                    }
                                }}
                            >
                                <ArrowForwardIosIcon />
                            </IconButton>
                        )}
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
                                startIcon={<BuildIcon />}
                                onClick={() => setIsAddMaintenanceDialogOpen(true)}
                                sx={{ 
                                    py: isMobile ? 1.5 : 2,
                                    px: isMobile ? 2 : 3,
                                    fontSize: isMobile ? '1rem' : '1.1rem',
                                    flex: isMobile ? 1 : 'none',
                                    minHeight: 44 // Touch-friendly minimum
                                }}
                            >
                                Wartung hinzufügen
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
            
            <AddMaintenanceDialog 
                open={isAddMaintenanceDialogOpen}
                onClose={() => setIsAddMaintenanceDialogOpen(false)}
                onSaved={handleAddMaintenance}
                carId={selectedCar?.id}
            />
            
            <AddCarDialog 
                open={isAddCarDialogOpen}
                onClose={() => setIsAddCarDialogOpen(false)}
                onAdd={handleAddCar}
            />
        </Container>
    );
}
